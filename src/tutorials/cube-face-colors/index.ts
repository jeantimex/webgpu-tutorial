import { initWebGPU } from "../../utils/webgpu-util";
import { mat4 } from "wgpu-matrix";

const shaderCode = `
struct Uniforms {
  mvpMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) color : vec3f
) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  out.color = vec4f(color, 1.0);
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  return in.color;
}
`;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Geometry Data
  // To have different colors for each face, we cannot share vertices between faces.
  // We need 4 vertices per face * 6 faces = 24 vertices.
  
  // prettier-ignore
  const vertexData = new Float32Array([
    // Format: X, Y, Z,   R, G, B
    
    // Front Face (Red) z = 0.5
    -0.5, -0.5,  0.5,   1, 0, 0, // 0
     0.5, -0.5,  0.5,   1, 0, 0, // 1
     0.5,  0.5,  0.5,   1, 0, 0, // 2
    -0.5,  0.5,  0.5,   1, 0, 0, // 3

    // Back Face (Cyan) z = -0.5
    -0.5, -0.5, -0.5,   0, 1, 1, // 4
     0.5, -0.5, -0.5,   0, 1, 1, // 5
     0.5,  0.5, -0.5,   0, 1, 1, // 6
    -0.5,  0.5, -0.5,   0, 1, 1, // 7

    // Top Face (Green) y = 0.5
    -0.5,  0.5, -0.5,   0, 1, 0, // 8
    -0.5,  0.5,  0.5,   0, 1, 0, // 9
     0.5,  0.5,  0.5,   0, 1, 0, // 10
     0.5,  0.5, -0.5,   0, 1, 0, // 11

    // Bottom Face (Magenta) y = -0.5
    -0.5, -0.5, -0.5,   1, 0, 1, // 12
     0.5, -0.5, -0.5,   1, 0, 1, // 13
     0.5, -0.5,  0.5,   1, 0, 1, // 14
    -0.5, -0.5,  0.5,   1, 0, 1, // 15

    // Right Face (Blue) x = 0.5
     0.5, -0.5, -0.5,   0, 0, 1, // 16
     0.5,  0.5, -0.5,   0, 0, 1, // 17
     0.5,  0.5,  0.5,   0, 0, 1, // 18
     0.5, -0.5,  0.5,   0, 0, 1, // 19

    // Left Face (Yellow) x = -0.5
    -0.5, -0.5, -0.5,   1, 1, 0, // 20
    -0.5, -0.5,  0.5,   1, 1, 0, // 21
    -0.5,  0.5,  0.5,   1, 1, 0, // 22
    -0.5,  0.5, -0.5,   1, 1, 0, // 23
  ]);

  // Indices (2 triangles per face)
  // prettier-ignore
  const indexData = new Uint16Array([
    // Front
    0, 1, 2,  2, 3, 0,
    // Back (Note: Order reversed for culling if needed, or consistent winding)
    // Looking from back: 5, 4, 7, 7, 6, 5
    5, 4, 7,  7, 6, 5,
    // Top
    8, 9, 10, 10, 11, 8,
    // Bottom
    12, 13, 14, 14, 15, 12,
    // Right
    16, 17, 18, 18, 19, 16,
    // Left
    20, 21, 22, 22, 23, 20,
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

  // 2. Uniforms
  const uniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const aspect = canvas.width / canvas.height;
  const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);
  
  // Rotating camera view
  let angle = 0;
  function updateMatrix() {
    const viewMatrix = mat4.lookAt(
      [Math.sin(angle) * 3, 2, Math.cos(angle) * 3], 
      [0, 0, 0], 
      [0, 1, 0]
    );
    const modelMatrix = mat4.identity();
    const mvpMatrix = mat4.multiply(projectionMatrix, mat4.multiply(viewMatrix, modelMatrix));
    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as Float32Array);
  }

  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // 3. Pipeline
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 24, // 6 floats
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" }, // pos
          { shaderLocation: 1, offset: 12, format: "float32x3" }, // color
        ],
      }],
    },
    fragment: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive: { 
      topology: "triangle-list",
      cullMode: "back", // Enable backface culling to ensure correct winding
    },
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
    angle += 0.01;
    updateMatrix();

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
    renderPass.drawIndexed(indexData.length);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

init().catch(console.error);
