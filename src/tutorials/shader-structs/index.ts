import { initWebGPU } from "../../utils/webgpu-util";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Interleaved Data (Same as 04)
  // x, y, r, g, b
  // prettier-ignore
  const vertices = new Float32Array([
    0.0,  0.5,  1.0, 0.0, 0.0, // Top (Red)
    -0.5, -0.5, 0.0, 1.0, 0.0, // Bottom Left (Green)
    0.5,  -0.5, 0.0, 0.0, 1.0  // Bottom Right (Blue)
  ]);

  const vertexBuffer = device.createBuffer({
    label: "Interleaved Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 2. Define Shaders with Structs
  const shaderModule = device.createShaderModule({
    label: "Shader Structs",
    code: `
      // Define the structure of the input data coming from the Vertex Buffer
      struct VertexInput {
        @location(0) position : vec2f,
        @location(1) color : vec3f,
      };

      // Define the structure of the output data going to the Fragment Shader
      struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) color : vec3f,
      };

      @vertex
      fn vs_main(input : VertexInput) -> VertexOutput {
        var output : VertexOutput;
        // We can access input fields using dot notation
        output.position = vec4f(input.position, 0.0, 1.0);
        output.color = input.color;
        return output;
      }

      @fragment
      fn fs_main(input : VertexOutput) -> @location(0) vec4f {
        // We receive the interpolated VertexOutput here
        return vec4f(input.color, 1.0);
      }
    `,
  });

  // 3. Define Layout (Same as 04)
  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 5 * 4,
    attributes: [
      { shaderLocation: 0, offset: 0, format: "float32x2" }, // position
      { shaderLocation: 1, offset: 2 * 4, format: "float32x3" }, // color
    ],
  };

  const pipeline = device.createRenderPipeline({
    label: "Shader Structs Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [vertexBufferLayout],
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
