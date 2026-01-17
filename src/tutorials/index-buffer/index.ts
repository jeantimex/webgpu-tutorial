import { initWebGPU } from "../../utils/webgpu-util";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";
import vertexWGSL from "./vertex.wgsl?raw";
import fragmentWGSL from "./fragment.wgsl?raw";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Vertices (4 corners of a square)
  // Each vertex has Position (x, y) and Color (r, g, b)
  // Note: We only have 4 vertices here, not 6!
  // prettier-ignore
  const vertices = new Float32Array([
    // x,    y,      r,   g,   b
    -0.5,  0.5,    1.0, 0.0, 0.0, // Vertex 0: Top-Left (Red)
    -0.5, -0.5,    0.0, 1.0, 0.0, // Vertex 1: Bottom-Left (Green)
     0.5, -0.5,    0.0, 0.0, 1.0, // Vertex 2: Bottom-Right (Blue)
     0.5,  0.5,    1.0, 1.0, 0.0  // Vertex 3: Top-Right (Yellow)
  ]);

  // 2. Define Indices (The order to draw vertices)
  // We draw 2 triangles to make a square.
  // Triangle 1: 0 -> 1 -> 2
  // Triangle 2: 0 -> 2 -> 3
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

  // 3. Create Vertex Buffer
  const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 4. Create Index Buffer
  const indexBuffer = device.createBuffer({
    label: "Index Buffer",
    size: indices.byteLength,
    // Note usage includes INDEX
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, 0, indices);

  // 5. Define Shaders (Same as before)
  const vertexModule = device.createShaderModule({
    label: "Index Buffer Vertex Shader",
    code: vertexWGSL,
  });
  const fragmentModule = device.createShaderModule({
    label: "Index Buffer Fragment Shader",
    code: fragmentWGSL,
  });

  // 6. Define Layout
  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 5 * 4, // 5 floats (2 pos + 3 color)
    attributes: [
      { shaderLocation: 0, offset: 0, format: "float32x2" }, // position
      { shaderLocation: 1, offset: 2 * 4, format: "float32x3" }, // color
    ],
  };

  const pipeline = device.createRenderPipeline({
    label: "Index Buffer Pipeline",
    layout: "auto",
    vertex: {
      module: vertexModule,
      entryPoint: "vs_main",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: fragmentModule,
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive: {
      topology: "triangle-list",
      // Important: culling mode can affect visibility if winding order is wrong!
      cullMode: "back",
    },
  });

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

    passEncoder.setVertexBuffer(0, vertexBuffer);

    // Set the Index Buffer
    // We must specify the format of the indices (uint16 or uint32)
    passEncoder.setIndexBuffer(indexBuffer, "uint16");

    // Draw Indexed!
    // 6 indices to draw (2 triangles * 3 vertices)
    passEncoder.drawIndexed(6);

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
  window.addEventListener("resize", render);
}

init().catch((err) => {
  console.error(err);
});
