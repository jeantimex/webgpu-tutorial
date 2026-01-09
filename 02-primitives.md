# 02. Primitives

In WebGPU, **Primitive Topology** defines how the GPU assembles vertices into shapes. In our first tutorial, we used the default `triangle-list`. In this tutorial, we will briefly look at how to change this setting to draw points instead.

## 1. The Primitive Property

When creating a `GPURenderPipeline`, the `primitive` object allows you to specify the `topology`.

```typescript
const pipeline = device.createRenderPipeline({
  // ...
  primitive: {
    topology: "point-list", // <--- Changing the shape type
  },
});
```

Common topologies include:

- `point-list`: Each vertex is a single point.
- `line-list`: Every two vertices form a line.
- `triangle-list`: Every three vertices form a triangle (the default).

## 2. Drawing Points

In this simple example, we use the same 3 vertices from Tutorial 01, but by changing the topology to `point-list`, the GPU will render them as three individual green pixels instead of a filled triangle.

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  const shaderModule = device.createShaderModule({
    label: "Primitives Shader",
    code: `
      @vertex
      fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4f {
        var pos = array<vec2f, 3>(
          vec2f(0.0, 0.5),
          vec2f(-0.5, -0.5),
          vec2f(0.5, -0.5)
        );
        return vec4f(pos[VertexIndex], 0.0, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(0.0, 1.0, 0.0, 1.0); // Green
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "Point List Pipeline",
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
    primitive: {
      topology: "point-list",
    },
  });

  function render() {
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
    passEncoder.draw(3);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch((err) => {
  console.error(err);
});
```
