import { mat3, mat4 } from "wgpu-matrix";
import GUI from "lil-gui";

const solidColorLitWGSL = `
struct Uniforms {
  worldViewProjectionMatrix: mat4x4f,
  worldMatrix: mat4x4f,
  color: vec4f,
};

struct Vertex {
  @location(0) position: vec4f,
  @location(1) normal: vec3f,
};

struct VSOut {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
};

@group(0) @binding(0) var<uniform> uni: Uniforms;

@vertex fn vs(vin: Vertex) -> VSOut {
  var vOut: VSOut;
  vOut.position = uni.worldViewProjectionMatrix * vin.position;
  vOut.normal = (uni.worldMatrix * vec4f(vin.normal, 0)).xyz;
  return vOut;
}

@fragment fn fs(vin: VSOut) -> @location(0) vec4f {
  let lightDirection = normalize(vec3f(4, 10, 6));
  let light = dot(normalize(vin.normal), lightDirection) * 0.5 + 0.5;
  return vec4f(uni.color.rgb * light, uni.color.a);
}
`;

const wireframeWGSL = `
struct Uniforms {
  worldViewProjectionMatrix: mat4x4f,
  worldMatrix: mat4x4f,
  color: vec4f,
};

struct LineUniforms {
  stride: u32,
  thickness: f32,
  alphaThreshold: f32,
};

struct VSOut {
  @builtin(position) position: vec4f,
};

@group(0) @binding(0) var<uniform> uni: Uniforms;
@group(0) @binding(1) var<storage, read> positions: array<f32>;
@group(0) @binding(2) var<storage, read> indices: array<u32>;
@group(0) @binding(3) var<uniform> line: LineUniforms;

@vertex fn vsIndexedU32(@builtin(vertex_index) vNdx: u32) -> VSOut {
  let triNdx = vNdx / 6;
  let vertNdx = (vNdx % 2 + vNdx / 2) % 3;
  let index = indices[triNdx * 3 + vertNdx];

  let pNdx = index * line.stride;
  let position = vec4f(positions[pNdx], positions[pNdx + 1], positions[pNdx + 2], 1);

  var vOut: VSOut;
  vOut.position = uni.worldViewProjectionMatrix * position;
  return vOut;
}

@fragment fn fs() -> @location(0) vec4f {
  return uni.color + vec4f(0.5);
}

struct BarycentricCoordinateBasedVSOutput {
  @builtin(position) position: vec4f,
  @location(0) barycenticCoord: vec3f,
};

@vertex fn vsIndexedU32BarycentricCoordinateBasedLines(
  @builtin(vertex_index) vNdx: u32
) -> BarycentricCoordinateBasedVSOutput {
  let vertNdx = vNdx % 3;
  let index = indices[vNdx];

  let pNdx = index * line.stride;
  let position = vec4f(positions[pNdx], positions[pNdx + 1], positions[pNdx + 2], 1);

  var vsOut: BarycentricCoordinateBasedVSOutput;
  vsOut.position = uni.worldViewProjectionMatrix * position;

  vsOut.barycenticCoord = vec3f(0);
  vsOut.barycenticCoord[vertNdx] = 1.0;
  return vsOut;
}

fn edgeFactor(bary: vec3f) -> f32 {
  let d = fwidth(bary);
  let a3 = smoothstep(vec3f(0.0), d * line.thickness, bary);
  return min(min(a3.x, a3.y), a3.z);
}

@fragment fn fsBarycentricCoordinateBasedLines(
  v: BarycentricCoordinateBasedVSOutput
) -> @location(0) vec4f {
  let a = 1.0 - edgeFactor(v.barycenticCoord);
  if (a < line.alphaThreshold) {
    discard;
  }

  return vec4((uni.color.rgb + 0.5) * a, a);
}
`;

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

const boxSettings = {
  width: 40,
  height: 40,
  depth: 40,
  widthSegments: 2,
  heightSegments: 2,
  depthSegments: 2,
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

function createBoxTypedArrays(
  width: number,
  height: number,
  depth: number,
  widthSegments: number,
  heightSegments: number,
  depthSegments: number
) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  function buildPlane(
    u: number,
    v: number,
    w: number,
    uDir: number,
    vDir: number,
    planeWidth: number,
    planeHeight: number,
    planeDepth: number,
    gridX: number,
    gridY: number,
    normal: [number, number, number]
  ) {
    const segmentWidth = planeWidth / gridX;
    const segmentHeight = planeHeight / gridY;

    const widthHalf = planeWidth / 2;
    const heightHalf = planeHeight / 2;
    const depthHalf = planeDepth / 2;

    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;

    const startIndex = positions.length / 3;

    for (let iy = 0; iy < gridY1; iy++) {
      const y = iy * segmentHeight - heightHalf;
      for (let ix = 0; ix < gridX1; ix++) {
        const x = ix * segmentWidth - widthHalf;
        const pos = [0, 0, 0];
        pos[u] = x * uDir;
        pos[v] = y * vDir;
        pos[w] = depthHalf;
        positions.push(pos[0], pos[1], pos[2]);
        normals.push(normal[0], normal[1], normal[2]);
      }
    }

    for (let iy = 0; iy < gridY; iy++) {
      for (let ix = 0; ix < gridX; ix++) {
        const a = startIndex + ix + gridX1 * iy;
        const b = startIndex + ix + gridX1 * (iy + 1);
        const c = startIndex + (ix + 1) + gridX1 * (iy + 1);
        const d = startIndex + (ix + 1) + gridX1 * iy;

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
  }

  buildPlane(2, 1, 0, -1, -1, depth, height, width, depthSegments, heightSegments, [1, 0, 0]);
  buildPlane(2, 1, 0, 1, -1, depth, height, -width, depthSegments, heightSegments, [-1, 0, 0]);
  buildPlane(0, 2, 1, 1, 1, width, depth, height, widthSegments, depthSegments, [0, 1, 0]);
  buildPlane(0, 2, 1, 1, -1, width, depth, -height, widthSegments, depthSegments, [0, -1, 0]);
  buildPlane(0, 1, 2, 1, -1, width, height, depth, widthSegments, heightSegments, [0, 0, 1]);
  buildPlane(0, 1, 2, -1, -1, width, height, -depth, widthSegments, heightSegments, [0, 0, -1]);

  const vertexCount = positions.length / 3;
  const vertices = new Float32Array(vertexCount * 6);
  for (let i = 0; i < vertexCount; i++) {
    const pOffset = i * 3;
    const vOffset = i * 6;
    vertices[vOffset] = positions[pOffset];
    vertices[vOffset + 1] = positions[pOffset + 1];
    vertices[vOffset + 2] = positions[pOffset + 2];
    vertices[vOffset + 3] = normals[pOffset];
    vertices[vOffset + 4] = normals[pOffset + 1];
    vertices[vOffset + 5] = normals[pOffset + 2];
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
    createBoxTypedArrays(
      boxSettings.width,
      boxSettings.height,
      boxSettings.depth,
      boxSettings.widthSegments,
      boxSettings.heightSegments,
      boxSettings.depthSegments
    )
  );

  const litModule = device.createShaderModule({
    code: solidColorLitWGSL,
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
    label: "box wireframe render pass",
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
  gui.add(boxSettings, "width", 5, 60).onChange(rebuildBox);
  gui.add(boxSettings, "height", 5, 60).onChange(rebuildBox);
  gui.add(boxSettings, "depth", 5, 60).onChange(rebuildBox);
  gui.add(boxSettings, "widthSegments", 1, 20, 1).onChange(rebuildBox);
  gui.add(boxSettings, "heightSegments", 1, 20, 1).onChange(rebuildBox);
  gui.add(boxSettings, "depthSegments", 1, 20, 1).onChange(rebuildBox);
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

  function rebuildBox() {
    const nextModel = createVertexAndIndexBuffer(
      device,
      createBoxTypedArrays(
        boxSettings.width,
        boxSettings.height,
        boxSettings.depth,
        boxSettings.widthSegments,
        boxSettings.heightSegments,
        boxSettings.depthSegments
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
