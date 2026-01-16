import { initWebGPU } from "../../utils/webgpu-util";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";
import vertexWGSL from "./vertex.wgsl?raw";
import fragmentWGSL from "./fragment.wgsl?raw";

async function init(): Promise<void> {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  const vertexModule: GPUShaderModule = device.createShaderModule({
    label: "Red Triangle Vertex Shader",
    code: vertexWGSL,
  });

  const fragmentModule: GPUShaderModule = device.createShaderModule({
    label: "Red Triangle Fragment Shader",
    code: fragmentWGSL,
  });

  const pipeline: GPURenderPipeline = device.createRenderPipeline({
    label: "Red Triangle Pipeline",
    layout: "auto",
    vertex: {
      module: vertexModule,
      entryPoint: "vs_main",
    },
    fragment: {
      module: fragmentModule,
      entryPoint: "fs_main",
      targets: [
        {
          format: canvasFormat,
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  function render(): void {
    resizeCanvasToDisplaySize(canvas);
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
    passEncoder.setPipeline(pipeline);
    passEncoder.draw(3);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
  window.addEventListener("resize", render);
}

init().catch((err: Error) => {
  console.error(err);
});
