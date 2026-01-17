import { initWebGPU } from "../../utils/webgpu-util";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";
import vertexWGSL from "./vertex.wgsl?raw";
import fragmentWGSL from "./fragment.wgsl?raw";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Geometry (2 Triangles side-by-side)
  // prettier-ignore
  const vertices = new Float32Array([
    // Triangle 1 (Left)
    -0.5,  0.5, 0.0, // Top
    -0.9, -0.5, 0.0, // Bottom Left
    -0.1, -0.5, 0.0, // Bottom Right

    // Triangle 2 (Right)
     0.5,  0.5, 0.0, // Top
     0.1, -0.5, 0.0, // Bottom Left
     0.9, -0.5, 0.0, // Bottom Right
  ]);

  const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 2. Define Shader Module with Multiple Entry Points
  const vertexModule = device.createShaderModule({
    label: "Multi-Material Vertex Shader",
    code: vertexWGSL,
  });
  const fragmentModule = device.createShaderModule({
    label: "Multi-Material Fragment Shader",
    code: fragmentWGSL,
  });

  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 3 * 4,
    attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
  };

  // 3. Create Pipeline 1 (Solid)
  const solidPipeline = device.createRenderPipeline({
    label: "Solid Pipeline",
    layout: "auto",
    vertex: {
      module: vertexModule,
      entryPoint: "vs_main",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: fragmentModule,
      entryPoint: "fs_solid", // <--- Different Entry Point
      targets: [{ format: canvasFormat }],
    },
    primitive: { topology: "triangle-list" },
  });

  // 4. Create Pipeline 2 (Gradient)
  const gradientPipeline = device.createRenderPipeline({
    label: "Gradient Pipeline",
    layout: "auto",
    vertex: {
      module: vertexModule,
      entryPoint: "vs_main",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: fragmentModule,
      entryPoint: "fs_gradient", // <--- Different Entry Point
      targets: [{ format: canvasFormat }],
    },
    primitive: { topology: "triangle-list" },
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

    // Bind shared vertex buffer once
    passEncoder.setVertexBuffer(0, vertexBuffer);

    // --- Draw Object 1 (Left) using Solid Pipeline ---
    passEncoder.setPipeline(solidPipeline);
    // Draw vertices 0-3 (3 count, starting at 0)
    passEncoder.draw(3, 1, 0, 0);

    // --- Draw Object 2 (Right) using Gradient Pipeline ---
    passEncoder.setPipeline(gradientPipeline);
    // Draw vertices 3-6 (3 count, starting at 3)
    passEncoder.draw(3, 1, 3, 0);

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
  window.addEventListener("resize", render);
}

init().catch((err) => {
  console.error(err);
});
