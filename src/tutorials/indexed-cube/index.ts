import { initWebGPU } from "../../utils/webgpu-util";
import { mat4 } from "wgpu-matrix";

const shaderCode = `
struct Uniforms {
  mvpMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
}

@vertex
fn vs_main(@location(0) pos : vec3f) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  return out;
}

@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0); // Solid Red
}
`;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Cube Data (8 unique vertices only!)
  // prettier-ignore
  const vertexData = new Float32Array([
    // Position (x, y, z)
    -0.5, -0.5,  0.5, // 0: Front-Bottom-Left
     0.5, -0.5,  0.5, // 1: Front-Bottom-Right
     0.5,  0.5,  0.5, // 2: Front-Top-Right
    -0.5,  0.5,  0.5, // 3: Front-Top-Left
    -0.5, -0.5, -0.5, // 4: Back-Bottom-Left
     0.5, -0.5, -0.5, // 5: Back-Bottom-Right
     0.5,  0.5, -0.5, // 6: Back-Top-Right
    -0.5,  0.5, -0.5, // 7: Back-Top-Left
  ]);

  // 2. Define Index Data (Connecting the 8 vertices into 12 triangles)
  // prettier-ignore
  const indexData = new Uint16Array([
    0, 1, 2,  2, 3, 0, // Front
    1, 5, 6,  6, 2, 1, // Right
    5, 4, 7,  7, 6, 5, // Back
    4, 0, 3,  3, 7, 4, // Left
    3, 2, 6,  6, 7, 3, // Top
    4, 5, 1,  1, 0, 4, // Bottom
  ]);

  const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertexData);

  const indexBuffer = device.createBuffer({
    label: "Index Buffer",
    size: indexData.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, 0, indexData);

  // 3. MVP Setup
  const uniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const aspect = canvas.width / canvas.height;
  const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);
  const viewMatrix = mat4.lookAt([2, 2, 2], [0, 0, 0], [0, 1, 0]);
  const modelMatrix = mat4.identity();
  const mvpMatrix = mat4.multiply(projectionMatrix, mat4.multiply(viewMatrix, modelMatrix));
  device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as Float32Array);

  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // 4. Pipeline
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 12, // 3 floats * 4 bytes
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" }, // pos
        ],
      }],
    },
    fragment: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive: { topology: "triangle-list" },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  function render() {
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
    renderPass.setIndexBuffer(indexBuffer, "uint16");
    // Draw 36 indices mapping to 8 vertices
    renderPass.drawIndexed(indexData.length);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch(console.error);