import { mat3, mat4 } from "wgpu-matrix";
import GUI from "lil-gui";
import { createSphereMesh } from "../../../meshes/sphere";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";
import solidColorLitVertexWGSL from "./lit-vertex.wgsl?raw";
import solidColorLitFragmentWGSL from "./lit-fragment.wgsl?raw";
import wireframeWGSL from "./wireframe.wgsl?raw";


const settings = {
  barycentricCoordinatesBased: false,
  thickness: 2,
  alphaThreshold: 0.5,
  animate: true,
  lines: true,
  depthBias: 1,
  depthBiasSlopeScale: 0.5,
  models: true,
};

const sphereSettings = {
  radius: 20,
  widthSegments: 32,
  heightSegments: 16,
};

type TypedArrayView = Float32Array | Uint32Array;

type Model = {
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  indexFormat: GPUIndexFormat;
  vertexCount: number;
};

function createBufferWithData(
  device: GPUDevice,
  data: TypedArrayView,
  usage: GPUBufferUsageFlags
) {
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage,
  });
  device.queue.writeBuffer(buffer, 0, data);
  return buffer;
}

function createSphereTypedArrays(
  radius: number,
  widthSegments = 32,
  heightSegments = 16
) {
  const { vertices: verticesWithUVs, indices } = createSphereMesh(
    radius,
    widthSegments,
    heightSegments
  );
  const numVertices = verticesWithUVs.length / 8;
  const vertices = new Float32Array(numVertices * 6);
  for (let i = 0; i < numVertices; ++i) {
    const srcNdx = i * 8;
    const dstNdx = i * 6;
    vertices.set(verticesWithUVs.subarray(srcNdx, srcNdx + 6), dstNdx);
  }
  return {
    vertices,
    indices: new Uint32Array(indices),
  };
}

function createVertexAndIndexBuffer(
  device: GPUDevice,
  { vertices, indices }: { vertices: Float32Array; indices: Uint32Array }
): Model {
  const vertexBuffer = createBufferWithData(
    device,
    vertices,
    GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  );
  const indexBuffer = createBufferWithData(
    device,
    indices,
    GPUBufferUsage.INDEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  );
  return {
    vertexBuffer,
    indexBuffer,
    indexFormat: "uint32",
    vertexCount: indices.length,
  };
}

function rand(min?: number, max?: number) {
  if (min === undefined) {
    max = 1;
    min = 0;
  } else if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
}

function randColor() {
  return [rand(), rand(), rand(), 1];
}

async function init() {
  if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
  }

  const adapter = await navigator.gpu.requestAdapter({
    featureLevel: "compatibility",
  });
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
  }
  if (adapter.limits.maxStorageBuffersInVertexStage < 2) {
    throw new Error("maxStorageBuffersInVertexStage limit is too low.");
  }
  const device = await adapter.requestDevice({
    requiredLimits: {
      maxStorageBuffersInVertexStage: 2,
    },
  });

  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const context = canvas.getContext("webgpu");
  if (!context) {
    throw new Error("WebGPU context not found.");
  }

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
  });
  const depthFormat = "depth24plus";

  let model = createVertexAndIndexBuffer(
    device,
    createSphereTypedArrays(
      sphereSettings.radius,
      sphereSettings.widthSegments,
      sphereSettings.heightSegments
    )
  );

  const litModule = device.createShaderModule({
    code: `${solidColorLitVertexWGSL}\n${solidColorLitFragmentWGSL}`,
  });

  const wireframeModule = device.createShaderModule({
    code: wireframeWGSL,
  });

  const litBindGroupLayout = device.createBindGroupLayout({
    label: "lit bind group layout",
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: {},
      },
    ],
  });

  let litPipeline: GPURenderPipeline;
  function rebuildLitPipeline() {
    litPipeline = device.createRenderPipeline({
      label: "lit pipeline",
      layout: device.createPipelineLayout({
        bindGroupLayouts: [litBindGroupLayout],
      }),
      vertex: {
        module: litModule,
        buffers: [
          {
            arrayStride: 6 * 4,
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x3",
              },
              {
                shaderLocation: 1,
                offset: 3 * 4,
                format: "float32x3",
              },
            ],
          },
        ],
      },
      fragment: {
        module: litModule,
        targets: [{ format: presentationFormat }],
      },
      primitive: {
        cullMode: "back",
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        depthBias: settings.depthBias,
        depthBiasSlopeScale: settings.depthBiasSlopeScale,
        format: depthFormat,
      },
    });
  }
  rebuildLitPipeline();

  const wireframePipeline = device.createRenderPipeline({
    label: "wireframe pipeline",
    layout: "auto",
    vertex: {
      module: wireframeModule,
      entryPoint: "vsIndexedU32",
    },
    fragment: {
      module: wireframeModule,
      entryPoint: "fs",
      targets: [{ format: presentationFormat }],
    },
    primitive: {
      topology: "line-list",
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less-equal",
      format: depthFormat,
    },
  });

  const barycentricCoordinatesBasedWireframePipeline =
    device.createRenderPipeline({
      label: "barycentric coordinates based wireframe pipeline",
      layout: "auto",
      vertex: {
        module: wireframeModule,
        entryPoint: "vsIndexedU32BarycentricCoordinateBasedLines",
      },
      fragment: {
        module: wireframeModule,
        entryPoint: "fsBarycentricCoordinateBasedLines",
        targets: [
          {
            format: presentationFormat,
            blend: {
              color: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
              },
            },
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less-equal",
        format: depthFormat,
      },
    });

  const uniformValues = new Float32Array(16 + 16 + 4);
  const uniformBuffer = device.createBuffer({
    size: uniformValues.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const kWorldViewProjectionMatrixOffset = 0;
  const kWorldMatrixOffset = 16;
  const kColorOffset = 32;
  const worldViewProjectionMatrixValue = uniformValues.subarray(
    kWorldViewProjectionMatrixOffset,
    kWorldViewProjectionMatrixOffset + 16
  );
  const worldMatrixValue = uniformValues.subarray(
    kWorldMatrixOffset,
    kWorldMatrixOffset + 16
  );
  const colorValue = uniformValues.subarray(kColorOffset, kColorOffset + 4);
  colorValue.set(randColor());

  const litBindGroup = device.createBindGroup({
    layout: litBindGroupLayout,
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  const lineUniformValues = new Float32Array(3 + 1);
  const lineUniformValuesAsU32 = new Uint32Array(lineUniformValues.buffer);
  const lineUniformBuffer = device.createBuffer({
    size: lineUniformValues.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  lineUniformValuesAsU32[0] = 6;

  let wireframeBindGroup = device.createBindGroup({
    layout: wireframePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: { buffer: model.vertexBuffer } },
      { binding: 2, resource: { buffer: model.indexBuffer } },
      { binding: 3, resource: { buffer: lineUniformBuffer } },
    ],
  });

  let barycentricCoordinatesBasedWireframeBindGroup = device.createBindGroup({
    layout: barycentricCoordinatesBasedWireframePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: { buffer: model.vertexBuffer } },
      { binding: 2, resource: { buffer: model.indexBuffer } },
      { binding: 3, resource: { buffer: lineUniformBuffer } },
    ],
  });

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "sphere wireframe render pass",
    colorAttachments: [
      {
        view: undefined,
        clearValue: [0.3, 0.3, 0.3, 1],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
    depthStencilAttachment: {
      view: undefined,
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  };

  const gui = new GUI({
    container: document.getElementById("gui-container") as HTMLElement,
    title: "Wireframe Settings",
  });
  gui.add(sphereSettings, "radius", 5, 40).onChange(rebuildSphere);
  gui.add(sphereSettings, "widthSegments", 3, 64, 1).onChange(rebuildSphere);
  gui.add(sphereSettings, "heightSegments", 2, 64, 1).onChange(rebuildSphere);
  gui.add(settings, "barycentricCoordinatesBased").onChange(addRemoveGUI);
  gui.add(settings, "lines");
  gui.add(settings, "models");
  gui.add(settings, "animate");

  const guis: Array<{ destroy: () => void }> = [];
  function addRemoveGUI() {
    guis.forEach((g) => g.destroy());
    guis.length = 0;
    if (settings.barycentricCoordinatesBased) {
      guis.push(
        gui.add(settings, "thickness", 0.0, 10).onChange(updateThickness),
        gui.add(settings, "alphaThreshold", 0, 1).onChange(updateThickness)
      );
    } else {
      guis.push(
        gui.add(settings, "depthBias", -3, 3, 1).onChange(rebuildLitPipeline),
        gui
          .add(settings, "depthBiasSlopeScale", -1, 1, 0.05)
          .onChange(rebuildLitPipeline)
      );
    }
  }
  addRemoveGUI();

  function updateThickness() {
    lineUniformValues[1] = settings.thickness;
    lineUniformValues[2] = settings.alphaThreshold;
    device.queue.writeBuffer(lineUniformBuffer, 0, lineUniformValues);
  }
  updateThickness();

  function rebuildSphere() {
    const nextModel = createVertexAndIndexBuffer(
      device,
      createSphereTypedArrays(
        sphereSettings.radius,
        sphereSettings.widthSegments,
        sphereSettings.heightSegments
      )
    );
    model.vertexBuffer.destroy();
    model.indexBuffer.destroy();
    model = nextModel;

    wireframeBindGroup = device.createBindGroup({
      layout: wireframePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: model.vertexBuffer } },
        { binding: 2, resource: { buffer: model.indexBuffer } },
        { binding: 3, resource: { buffer: lineUniformBuffer } },
      ],
    });

    barycentricCoordinatesBasedWireframeBindGroup = device.createBindGroup({
      layout: barycentricCoordinatesBasedWireframePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: model.vertexBuffer } },
        { binding: 2, resource: { buffer: model.indexBuffer } },
        { binding: 3, resource: { buffer: lineUniformBuffer } },
      ],
    });
  }

  let depthTexture: GPUTexture | undefined;
  let time = 0.0;

  function render(ts: number) {
    if (settings.animate) {
      time = ts * 0.001;
    }

    resizeCanvasToDisplaySize(canvas);
    const canvasTexture = context.getCurrentTexture();
    renderPassDescriptor.colorAttachments![0].view = canvasTexture.createView();

    if (
      !depthTexture ||
      depthTexture.width !== canvasTexture.width ||
      depthTexture.height !== canvasTexture.height
    ) {
      if (depthTexture) {
        depthTexture.destroy();
      }
      depthTexture = device.createTexture({
        size: [canvasTexture.width, canvasTexture.height],
        format: depthFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }
    renderPassDescriptor.depthStencilAttachment!.view =
      depthTexture.createView();

    const fov = (60 * Math.PI) / 180;
    const aspect = canvas.width / canvas.height;
    const projection = mat4.perspective(fov, aspect, 0.1, 1000);

    const view = mat4.lookAt([0, 0, 80], [0, 0, 0], [0, 1, 0]);
    const viewProjection = mat4.multiply(projection, view);

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(litPipeline);

    const world = mat4.identity();
    mat4.rotateY(world, time * 0.7, world);
    mat4.rotateX(world, time * 0.35, world);

    mat4.multiply(viewProjection, world, worldViewProjectionMatrixValue);
    mat3.fromMat4(world, worldMatrixValue);

    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

    if (settings.models) {
      pass.setVertexBuffer(0, model.vertexBuffer);
      pass.setIndexBuffer(model.indexBuffer, model.indexFormat);
      pass.setBindGroup(0, litBindGroup);
      pass.drawIndexed(model.vertexCount);
    }

    if (settings.lines) {
      const [bindGroupNdx, countMult, pipeline] =
        settings.barycentricCoordinatesBased
          ? [1, 1, barycentricCoordinatesBasedWireframePipeline]
          : [0, 2, wireframePipeline];
      pass.setPipeline(pipeline);
      pass.setBindGroup(
        0,
        bindGroupNdx === 0
          ? wireframeBindGroup
          : barycentricCoordinatesBasedWireframeBindGroup
      );
      pass.draw(model.vertexCount * countMult);
    }

    pass.end();
    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

init().catch(console.error);
