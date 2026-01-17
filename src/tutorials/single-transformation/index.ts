import { initWebGPU } from "../../utils/webgpu-util";
import { mat4 } from "wgpu-matrix";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";
import vertexWGSL from "./vertex.wgsl?raw";
import fragmentWGSL from "./fragment.wgsl?raw";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Vertices (Triangle)
  // prettier-ignore
  const vertices = new Float32Array([
     0.0,  0.5, 0.5, // Top
    -0.5, -0.5, 0.5, // Bottom Left
     0.5, -0.5, 0.5  // Bottom Right
  ]);

  const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 2. Define Uniform Data (Matrix)
  // Create a translation matrix directly
  const modelMatrix = mat4.translation([0.5, 0.0, 0.0]); // Create Uniform Buffer for the matrix
  // 4x4 float matrix = 16 floats * 4 bytes = 64 bytes
  const uniformBuffer = device.createBuffer({
    label: "Uniform Matrix Buffer",
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  // Upload the matrix data
  device.queue.writeBuffer(uniformBuffer, 0, modelMatrix as Float32Array);

  // 3. Define Shaders
  const vertexModule = device.createShaderModule({
    label: "Transformation Vertex Shader",
    code: vertexWGSL,
  });
  const fragmentModule = device.createShaderModule({
    label: "Transformation Fragment Shader",
    code: fragmentWGSL,
  });

  // 4. Create Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Transformation Pipeline",
    layout: "auto",
    vertex: {
      module: vertexModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 3 * 4, // 3 floats (x, y, z)
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

  // 5. Create Bind Group
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
    ],
  });

  // 6. Render
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
    passEncoder.setBindGroup(0, bindGroup);
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
