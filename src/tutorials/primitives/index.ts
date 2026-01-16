import { initWebGPU } from "../../utils/webgpu-util";
import GUI from "lil-gui";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";

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
