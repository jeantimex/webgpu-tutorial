import { initWebGPU } from "../../utils/webgpu-util";
import GUI from "lil-gui";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";
import vertexWGSL from "./vertex.wgsl?raw";
import fragmentWGSL from "./fragment.wgsl?raw";

async function init(): Promise<void> {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  const vertexModule: GPUShaderModule = device.createShaderModule({
    label: "Primitives Vertex Shader",
    code: vertexWGSL,
  });
  const fragmentModule: GPUShaderModule = device.createShaderModule({
    label: "Primitives Fragment Shader",
    code: fragmentWGSL,
  });

  const topologies: GPUPrimitiveTopology[] = [
    "point-list",
    "line-list",
    "line-strip",
    "triangle-list",
    "triangle-strip",
  ];

  const settings = {
    topology: "triangle-list" as GPUPrimitiveTopology,
  };

  const createPipeline = (
    topology: GPUPrimitiveTopology
  ): GPURenderPipeline => {
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
      module: vertexModule,
      entryPoint: "vs_main",
    },
    fragment: {
      module: fragmentModule,
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
      primitive,
    });
  };

  let pipeline = createPipeline(settings.topology);

  const gui = new GUI({
    title: "Primitives",
    container: document.getElementById("gui-container") as HTMLElement,
  });
  gui
    .add(settings, "topology", topologies)
    .name("Topology")
    .onChange(() => {
      pipeline = createPipeline(settings.topology);
      render();
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
          clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };

    const passEncoder: GPURenderPassEncoder =
      commandEncoder.beginRenderPass(renderPassDescriptor);

    passEncoder.setPipeline(pipeline);
    passEncoder.draw(6);

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
  window.addEventListener("resize", render);
}

init().catch((err: Error) => {
  console.error(err);
});
