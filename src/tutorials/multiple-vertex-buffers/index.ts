import { initWebGPU } from "../../utils/webgpu-util";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Geometry Data (Positions)
  // prettier-ignore
  const positions = new Float32Array([
    0.0,  0.5, // Top
    -0.5, -0.5, // Bottom Left
    0.5, -0.5  // Bottom Right
  ]);

  // 2. Define Color Data (RGB per vertex)
  // prettier-ignore
  const colors = new Float32Array([
    1.0, 0.0, 0.0, // Top: Red
    0.0, 1.0, 0.0, // Bottom Left: Green
    0.0, 0.0, 1.0  // Bottom Right: Blue
  ]);

  // 3. Create Buffers
  const positionBuffer = device.createBuffer({
    label: "Position Buffer",
    size: positions.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(positionBuffer, 0, positions);

  const colorBuffer = device.createBuffer({
    label: "Color Buffer",
    size: colors.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(colorBuffer, 0, colors);

  // 4. Define Shaders
  // Note: We output the color from vertex shader to fragment shader
  const shaderModule = device.createShaderModule({
    label: "Multiple Buffers Shader",
    code: `
      struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) color : vec3f,
      };

      @vertex
      fn vs_main(
        @location(0) pos : vec2f,
        @location(1) color : vec3f
      ) -> VertexOutput {
        var output : VertexOutput;
        output.position = vec4f(pos, 0.0, 1.0);
        output.color = color;
        return output;
      }

      @fragment
      fn fs_main(@location(0) color : vec3f) -> @location(0) vec4f {
        return vec4f(color, 1.0);
      }
    `,
  });

  // 5. Define Layouts for TWO buffers
  const positionBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 2 * 4, // 2 floats * 4 bytes
    attributes: [
      {
        shaderLocation: 0, // Matches @location(0) pos in vs_main
        offset: 0,
        format: "float32x2",
      },
    ],
  };

  const colorBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 3 * 4, // 3 floats * 4 bytes
    attributes: [
      {
        shaderLocation: 1, // Matches @location(1) color in vs_main
        offset: 0,
        format: "float32x3",
      },
    ],
  };

  // 6. Create Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Multiple Buffers Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      // The order in this array determines the slot index (0 and 1)
      buffers: [positionBufferLayout, colorBufferLayout],
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
          clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);

    // Bind the buffers to their respective slots defined in the pipeline 'buffers' array
    passEncoder.setVertexBuffer(0, positionBuffer);
    passEncoder.setVertexBuffer(1, colorBuffer);

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
