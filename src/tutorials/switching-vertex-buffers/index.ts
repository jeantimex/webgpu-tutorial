import { initWebGPU } from "../../utils/webgpu-util";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";
import vertexWGSL from "./vertex.wgsl?raw";
import fragmentWGSL from "./fragment.wgsl?raw";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Geometry 1: Triangle (Left)
  // prettier-ignore
  const triangleData = new Float32Array([
    -0.5,  0.5, 0.0, // Top
    -0.9, -0.5, 0.0, // Bottom Left
    -0.1, -0.5, 0.0, // Bottom Right
  ]);

  const triangleBuffer = device.createBuffer({
    label: "Triangle Buffer",
    size: triangleData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(triangleBuffer, 0, triangleData);

  // 2. Define Geometry 2: Square (Right)
  // Made of 2 triangles
  // prettier-ignore
  const squareData = new Float32Array([
     // Triangle 1
     0.1,  0.5, 0.0, // Top Left
     0.1, -0.5, 0.0, // Bottom Left
     0.9, -0.5, 0.0, // Bottom Right
     // Triangle 2
     0.1,  0.5, 0.0, // Top Left
     0.9, -0.5, 0.0, // Bottom Right
     0.9,  0.5, 0.0, // Top Right
  ]);

  const squareBuffer = device.createBuffer({
    label: "Square Buffer",
    size: squareData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(squareBuffer, 0, squareData);

  // 3. Define Shader
  // Simple pass-through shader
  const vertexModule = device.createShaderModule({
    label: "Switching Vertex Buffers Vertex Shader",
    code: vertexWGSL,
  });
  const fragmentModule = device.createShaderModule({
    label: "Switching Vertex Buffers Fragment Shader",
    code: fragmentWGSL,
  });

  // 4. Create Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Basic Pipeline",
    layout: "auto",
    vertex: {
      module: vertexModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 3 * 4, // 3 floats (pos)
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
        },
      ],
    },
    fragment: {
      module: fragmentModule,
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  // 5. Render
  function render() {
    resizeCanvasToDisplaySize(canvas);
    const commandEncoder = device.createCommandEncoder();
    const textureView = context!.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    passEncoder.setPipeline(pipeline);

    // --- Draw Object 1: Triangle ---
    passEncoder.setVertexBuffer(0, triangleBuffer);
    passEncoder.draw(3);

    // --- Draw Object 2: Square ---
    passEncoder.setVertexBuffer(0, squareBuffer);
    passEncoder.draw(6);

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
  window.addEventListener("resize", render);
}

init().catch((err) => {
  console.error(err);
});
