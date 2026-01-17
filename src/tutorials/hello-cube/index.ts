import { initWebGPU } from "../../utils/webgpu-util";
import { mat4 } from "wgpu-matrix";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";
import vertexWGSL from "./vertex.wgsl?raw";
import fragmentWGSL from "./fragment.wgsl?raw";

const vertexShaderCode = vertexWGSL;
const fragmentShaderCode = fragmentWGSL;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Cube Data (Explicit 36 vertices for 12 triangles)
  // No index buffer is used in this tutorial to keep it simple.
  // prettier-ignore
  const vertexData = new Float32Array([
    // Front Face (z = 0.5)
    -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5, -0.5,  0.5,

    // Back Face (z = -0.5)
    -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
     0.5,  0.5, -0.5,   0.5, -0.5, -0.5,  -0.5, -0.5, -0.5,

    // Top Face (y = 0.5)
    -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,   0.5,  0.5, -0.5,  -0.5,  0.5, -0.5,

    // Bottom Face (y = -0.5)
    -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
     0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,  -0.5, -0.5, -0.5,

    // Right Face (x = 0.5)
     0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,   0.5, -0.5,  0.5,   0.5, -0.5, -0.5,

    // Left Face (x = -0.5)
    -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,  -0.5, -0.5, -0.5,
  ]);

  const vertexBuffer = device.createBuffer({
    label: "Cube Vertex Buffer",
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertexData);

  // 2. Setup MVP Matrix
  const uniformBuffer = device.createBuffer({
    label: "Uniform Buffer",
    size: 64, 
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  function updateProjection() {
    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective(
      (2 * Math.PI) / 5,
      aspect,
      0.1,
      100.0
    );
    const viewMatrix = mat4.lookAt([2, 2, 2], [0, 0, 0], [0, 1, 0]);
    const modelMatrix = mat4.identity();
    const mvpMatrix = mat4.multiply(
      projectionMatrix,
      mat4.multiply(viewMatrix, modelMatrix)
    );
    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as Float32Array);
  }

  // 3. Create Depth Texture
  resizeCanvasToDisplaySize(canvas);
  updateProjection();
  let depthTexture = device.createTexture({
    label: "Depth Texture",
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // 4. Pipeline
  const vertexModule = device.createShaderModule({
    label: "Hello Cube Vertex Shader",
    code: vertexShaderCode,
  });
  const fragmentModule = device.createShaderModule({
    label: "Hello Cube Fragment Shader",
    code: fragmentShaderCode,
  });

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: vertexModule,
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 12, // 3 floats
        attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
      }],
    },
    fragment: {
      module: fragmentModule,
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
    const resized = resizeCanvasToDisplaySize(canvas);
    if (resized) {
      updateProjection();
      depthTexture.destroy();
      depthTexture = device.createTexture({
        label: "Depth Texture",
        size: [canvas.width, canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }
    const commandEncoder = device.createCommandEncoder();
    const textureView = context!.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 },
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
    // Draw 36 vertices (12 triangles) directly
    renderPass.draw(36);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
  window.addEventListener("resize", render);
}

init().catch(console.error);
