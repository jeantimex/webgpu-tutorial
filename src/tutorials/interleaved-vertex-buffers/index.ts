import { initWebGPU } from "../../utils/webgpu-util";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";
import vertexWGSL from "./vertex.wgsl?raw";
import fragmentWGSL from "./fragment.wgsl?raw";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Interleaved Data
  // Each vertex has 5 values: x, y (position) + r, g, b (color)
  // prettier-ignore
  const vertices = new Float32Array([
    // x,   y,    r,   g,   b
    0.0,  0.5,  1.0, 0.0, 0.0, // Top (Red)
    -0.5, -0.5, 0.0, 1.0, 0.0, // Bottom Left (Green)
    0.5,  -0.5, 0.0, 0.0, 1.0  // Bottom Right (Blue)
  ]);

  // 2. Create ONE Buffer
  const vertexBuffer = device.createBuffer({
    label: "Interleaved Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  // 3. Write data to the buffer
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 4. Define Shaders (Same as before)
  const vertexModule = device.createShaderModule({
    label: "Interleaved Buffer Vertex Shader",
    code: vertexWGSL,
  });
  const fragmentModule = device.createShaderModule({
    label: "Interleaved Buffer Fragment Shader",
    code: fragmentWGSL,
  });

  // 5. Define Vertex Buffer Layout
  // We describe how the ONE buffer contains BOTH attributes
  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 5 * 4, // 5 floats * 4 bytes = 20 bytes per vertex
    attributes: [
      {
        shaderLocation: 0, // Position
        offset: 0, // Starts at the beginning
        format: "float32x2",
      },
      {
        shaderLocation: 1, // Color
        offset: 2 * 4, // Starts after the 2 position floats (8 bytes)
        format: "float32x3",
      },
    ],
  };

  // 6. Create Render Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Interleaved Buffer Pipeline",
    layout: "auto",
    vertex: {
      module: vertexModule,
      entryPoint: "vs_main",
      buffers: [vertexBufferLayout], // Just one buffer layout
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

  // 7. Render
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

    // We only have one buffer to bind to Slot 0
    passEncoder.setVertexBuffer(0, vertexBuffer);

    passEncoder.draw(3);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
  window.addEventListener("resize", render);
}

init().catch((err) => {
  console.error(err);
});
