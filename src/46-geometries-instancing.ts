import { initWebGPU } from "./utils/webgpu-util";
import { mat4, vec3 } from "wgpu-matrix";
import GUI from "lil-gui";

const shaderCode = `
struct Uniforms {
  viewProjectionMatrix : mat4x4f,
  lineWidth : f32,
  fillOpacity : f32,
  showWireframe : f32,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var<storage, read> modelMatrices : array<mat4x4f>;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) barycentric : vec3f,
  @location(1) color : vec3f,
}

@vertex
fn vs_main(
  @builtin(instance_index) instanceIndex : u32,
  @location(0) pos : vec3f,
  @location(1) barycentric : vec3f,
  @location(2) color : vec3f,
) -> VertexOutput {
  var out : VertexOutput;
  let modelMatrix = modelMatrices[instanceIndex];
  let mvpMatrix = uniforms.viewProjectionMatrix * modelMatrix;
  out.position = mvpMatrix * vec4f(pos, 1.0);
  out.barycentric = barycentric;
  out.color = color;
  return out;
}

fn edgeFactor(bary : vec3f, width : f32) -> f32 {
  let d = fwidth(bary);
  let a3 = smoothstep(vec3f(0.0), d * width, bary);
  return min(min(a3.x, a3.y), a3.z);
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let edge = 1.0 - edgeFactor(in.barycentric, uniforms.lineWidth);

  let wireColor = vec3f(1.0, 1.0, 1.0);
  let fillColor = in.color;

  let wireAlpha = edge * uniforms.showWireframe;
  let fillAlpha = uniforms.fillOpacity * (1.0 - wireAlpha);
  let totalAlpha = wireAlpha + fillAlpha;

  if (totalAlpha < 0.01) {
    discard;
  }

  let color = (wireColor * wireAlpha + fillColor * fillAlpha) / totalAlpha;
  return vec4f(color, totalAlpha);
}
`;

// Create a cube geometry with barycentric coordinates and per-face colors
function createCubeGeometry(size: number = 1.0) {
  const vertices: number[] = [];
  const s = size / 2;

  // Define the 8 corners of the cube
  const corners = [
    [-s, -s, -s], // 0: back-bottom-left
    [s, -s, -s],  // 1: back-bottom-right
    [s, s, -s],   // 2: back-top-right
    [-s, s, -s],  // 3: back-top-left
    [-s, -s, s],  // 4: front-bottom-left
    [s, -s, s],   // 5: front-bottom-right
    [s, s, s],    // 6: front-top-right
    [-s, s, s],   // 7: front-top-left
  ];

  // Define 6 faces (2 triangles each) with their colors
  const faces = [
    // Front face (z+)
    { indices: [[4, 5, 6], [4, 6, 7]], color: [1.0, 0.4, 0.4] },
    // Back face (z-)
    { indices: [[1, 0, 3], [1, 3, 2]], color: [0.4, 1.0, 0.4] },
    // Top face (y+)
    { indices: [[7, 6, 2], [7, 2, 3]], color: [0.4, 0.4, 1.0] },
    // Bottom face (y-)
    { indices: [[0, 1, 5], [0, 5, 4]], color: [1.0, 1.0, 0.4] },
    // Right face (x+)
    { indices: [[5, 1, 2], [5, 2, 6]], color: [1.0, 0.4, 1.0] },
    // Left face (x-)
    { indices: [[0, 4, 7], [0, 7, 3]], color: [0.4, 1.0, 1.0] },
  ];

  function addTriangle(a: number[], b: number[], c: number[], color: number[]) {
    // Each vertex: position(3) + barycentric(3) + color(3) = 9 floats
    vertices.push(...a, 1, 0, 0, ...color);
    vertices.push(...b, 0, 1, 0, ...color);
    vertices.push(...c, 0, 0, 1, ...color);
  }

  for (const face of faces) {
    for (const tri of face.indices) {
      addTriangle(
        corners[tri[0]],
        corners[tri[1]],
        corners[tri[2]],
        face.color
      );
    }
  }

  return {
    vertices: new Float32Array(vertices),
    vertexCount: vertices.length / 9,
  };
}

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  const shaderModule = device.createShaderModule({ code: shaderCode });

  // Number of instances in X and Y directions
  const xCount = 4;
  const yCount = 4;
  const numInstances = xCount * yCount;

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "read-only-storage" },
      },
    ],
  });

  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 36, // 9 floats * 4 bytes
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" },  // position
          { shaderLocation: 1, offset: 12, format: "float32x3" }, // barycentric
          { shaderLocation: 2, offset: 24, format: "float32x3" }, // color
        ],
      }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [{
        format: canvasFormat,
        blend: {
          color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
          alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
        },
      }],
    },
    primitive: {
      topology: "triangle-list",
      cullMode: "back",
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  const cubeData = createCubeGeometry(1.0);
  const vertexBuffer = device.createBuffer({
    size: cubeData.vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, cubeData.vertices);

  // Uniform buffer: viewProjectionMatrix(64) + lineWidth(4) + fillOpacity(4) + showWireframe(4) + padding(4) = 80 bytes
  const uniformBuffer = device.createBuffer({
    size: 80,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Storage buffer for model matrices (64 bytes per mat4x4f)
  const modelMatrixBuffer = device.createBuffer({
    size: numInstances * 64,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: { buffer: modelMatrixBuffer } },
    ],
  });

  const params = {
    cubeSize: 1.0,
    spacing: 2.5,
    showWireframe: true,
    lineWidth: 1.5,
    fillOpacity: 0.8,
    rotationSpeed: 1.0,
  };

  const gui = new GUI({ container: document.getElementById("gui-container") as HTMLElement, title: "Instancing Settings" });
  gui.add(params, "cubeSize", 0.5, 2.0).name("Cube Size");
  gui.add(params, "spacing", 1.5, 5.0).name("Spacing");
  gui.add(params, "rotationSpeed", 0.0, 3.0).name("Rotation Speed");
  gui.add(params, "showWireframe").name("Show Wireframe");
  gui.add(params, "lineWidth", 0.5, 5.0).name("Line Width");
  gui.add(params, "fillOpacity", 0.0, 1.0).name("Fill Opacity");

  const aspect = canvas.width / canvas.height;
  const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);

  // Pre-allocate model matrices array
  const modelMatricesData = new Float32Array(numInstances * 16);

  let time = 0;

  function updateModelMatrices() {
    const step = params.spacing;
    const offsetX = ((xCount - 1) * step) / 2;
    const offsetY = ((yCount - 1) * step) / 2;

    for (let y = 0; y < yCount; y++) {
      for (let x = 0; x < xCount; x++) {
        const index = y * xCount + x;

        // Calculate position for this instance
        const posX = x * step - offsetX;
        const posY = y * step - offsetY;

        // Each cube rotates at a slightly different rate
        const rotationOffset = (index * 0.2);
        const angle = (time + rotationOffset) * params.rotationSpeed;

        // Create model matrix: translate then rotate
        const translation = mat4.translation(vec3.create(posX, posY, 0));
        const rotationY = mat4.rotationY(angle);
        const rotationX = mat4.rotationX(angle * 0.5);
        const scale = mat4.scaling(vec3.create(params.cubeSize, params.cubeSize, params.cubeSize));

        let modelMatrix = mat4.multiply(translation, rotationY);
        modelMatrix = mat4.multiply(modelMatrix, rotationX);
        modelMatrix = mat4.multiply(modelMatrix, scale);

        // Copy to the array
        modelMatricesData.set(modelMatrix as Float32Array, index * 16);
      }
    }

    device.queue.writeBuffer(modelMatrixBuffer, 0, modelMatricesData);
  }

  function render() {
    time += 0.01;

    // Update model matrices for all instances
    updateModelMatrices();

    // Camera positioned to see all cubes
    const cameraDistance = Math.max(xCount, yCount) * params.spacing * 0.8 + 5;
    const viewMatrix = mat4.lookAt(
      [0, 0, cameraDistance],
      [0, 0, 0],
      [0, 1, 0]
    );
    const viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix);

    // Update uniforms
    device.queue.writeBuffer(uniformBuffer, 0, viewProjectionMatrix as Float32Array);
    device.queue.writeBuffer(uniformBuffer, 64, new Float32Array([
      params.lineWidth,
      params.fillOpacity,
      params.showWireframe ? 1.0 : 0.0,
    ]));

    const commandEncoder = device.createCommandEncoder();
    const textureView = context!.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
        loadOp: "clear",
        storeOp: "store",
      }],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });

    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.setVertexBuffer(0, vertexBuffer);
    // Draw all instances with a single draw call
    renderPass.draw(cubeData.vertexCount, numInstances);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

init().catch(console.error);
