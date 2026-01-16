import { initWebGPU } from "../../utils/webgpu-util";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Vertex Data (Triangle)
  // Each vertex has 2 floats (x, y)
  // prettier-ignore
  const vertices = new Float32Array([
    0.0,  0.5, // Vertex 1 (Top)
    -0.5, -0.5, // Vertex 2 (Bottom Left)
    0.5, -0.5, // Vertex 3 (Bottom Right)
  ]);

  // 2. Create Vertex Buffer
  const vertexBuffer = device.createBuffer({
    label: "Triangle Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  // 3. Write data to the buffer
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 4. Define Shaders
  const shaderModule = device.createShaderModule({
    label: "Vertex Buffer Shader",
    code: `
      @vertex
      fn vs_main(@location(0) position : vec2f) -> @builtin(position) vec4f {
        return vec4f(position, 0.0, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0);
      }
    `,
  });

  // 5. Define Vertex Buffer Layout
  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 2 * 4, // 2 floats, 4 bytes each
    attributes: [
      {
        shaderLocation: 0, // Matches @location(0) in shader
        offset: 0,
        format: "float32x2", // vec2f
      },
    ],
  };

  // 6. Create Render Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Vertex Buffer Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [vertexBufferLayout], // Tell pipeline how to read buffer
    },
    fragment: {
      module: shaderModule,
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
          clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.setVertexBuffer(0, vertexBuffer); // Bind the buffer to slot 0
    passEncoder.draw(3); // Draw 3 vertices
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
  window.addEventListener("resize", render);
}

init().catch((err) => {
  console.error(err);
});
