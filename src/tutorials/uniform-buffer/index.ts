import { initWebGPU } from "../../utils/webgpu-util";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Vertex Data (Positions Only)
  const vertices = new Float32Array([
    0.0,
    0.5, // Top
    -0.5,
    -0.5, // Bottom Left
    0.5,
    -0.5, // Bottom Right
  ]);

  const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 2. Define Uniform Data (Color)
  // We want a solid Teal color: R=0, G=0.5, B=0.5
  // Note: Uniforms usually need to be 16-byte aligned.
  // vec3f is 12 bytes, but in a uniform block it often takes up 16 bytes (padding).
  // For safety, let's just use vec4f (R, G, B, A) which is naturally 16 bytes.
  const color = new Float32Array([0.0, 0.5, 0.5, 1.0]);

  const uniformBuffer = device.createBuffer({
    label: "Uniform Color Buffer",
    size: color.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(uniformBuffer, 0, color);

  // 3. Define Shaders
  const shaderModule = device.createShaderModule({
    label: "Uniform Shader",
    code: `
      // Define the structure of our uniform
      struct Uniforms {
        color : vec4f,
      };

      // Declare the uniform variable
      // Group 0, Binding 0
      @group(0) @binding(0) var<uniform> global : Uniforms;

      @vertex
      fn vs_main(@location(0) pos : vec2f) -> @builtin(position) vec4f {
        return vec4f(pos, 0.0, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        // Return the color from the uniform buffer
        return global.color;
      }
    `,
  });

  // 4. Create Render Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Uniform Pipeline",
    layout: "auto", // Let WebGPU infer the bind group layout
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 2 * 4,
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
        },
      ],
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

  // 5. Create Bind Group
  // This connects the specific buffer (uniformBuffer) to the binding point (0)
  // in the pipeline's layout.
  const bindGroup = device.createBindGroup({
    label: "Uniform Bind Group",
    layout: pipeline.getBindGroupLayout(0), // Get the layout inferred from shader
    entries: [
      {
        binding: 0, // Matches @binding(0) in shader
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

    // Bind the Vertex Buffer (Slot 0)
    passEncoder.setVertexBuffer(0, vertexBuffer);

    // Bind the Bind Group (Group 0)
    // This makes the uniform data available to the shaders
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
