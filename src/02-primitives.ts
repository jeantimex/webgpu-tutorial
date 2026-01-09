import { initWebGPU } from "./utils/webgpu-util";

async function init(): Promise<void> {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  const shaderModule: GPUShaderModule = device.createShaderModule({
    label: "Primitives Shader",
    code: `
      @vertex
      fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4f {
        var pos = array<vec2f, 6>(
          vec2f( 0.0,  0.5),
          vec2f(-0.5,  0.0),
          vec2f(-0.5, -0.5),
          vec2f( 0.0, -0.5),
          vec2f( 0.5, -0.5),
          vec2f( 0.5,  0.0)
        );
        return vec4f(pos[VertexIndex], 0.0, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(0.0, 1.0, 0.0, 1.0); // Green
      }
    `,
  });

  const topologies: GPUPrimitiveTopology[] = [
    "point-list",
    "line-list",
    "line-strip",
    "triangle-list",
    "triangle-strip",
  ];

  const pipelines: GPURenderPipeline[] = topologies.map((topology) => {
    const primitive: GPUPrimitiveState = {
      topology,
    };
    // stripIndexFormat is required for strip topologies
    if (topology === "line-strip" || topology === "triangle-strip") {
      primitive.stripIndexFormat = "uint32";
    }

    return device.createRenderPipeline({
      label: `${topology} Pipeline`,
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs_main",
        targets: [{ format: canvasFormat }],
      },
      primitive,
    });
  });

  function render(): void {
    const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();
    const textureView: GPUTextureView = context!
      .getCurrentTexture()
      .createView();

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

    const passEncoder: GPURenderPassEncoder =
      commandEncoder.beginRenderPass(renderPassDescriptor);

    // Grid layout: 3 columns, 2 rows
    const cols = 3;
    const width = canvas.width / cols;
    const height = canvas.height / 2;

    pipelines.forEach((pipeline, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = col * width;
      const y = row * height;

      passEncoder.setViewport(x, y, width, height, 0, 1);
      passEncoder.setScissorRect(
        Math.floor(x),
        Math.floor(y),
        Math.floor(width),
        Math.floor(height)
      );
      passEncoder.setPipeline(pipeline);
      passEncoder.draw(6);
    });

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch((err: Error) => {
  console.error(err);
});
