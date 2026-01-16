# Primitives

This tutorial explains **primitive topology**, the rule WebGPU uses to turn a list of vertices into points, lines, or triangles. We use a small GUI so you can switch topology live and see how the same vertices connect differently.

## What you should know after this tutorial

- What a **primitive topology** is.
- How `point-list`, `line-list`, `line-strip`, `triangle-list`, and `triangle-strip` differ.
- How to rebuild a pipeline when a topology changes.

## 1) The idea of a topology

WebGPU needs a rule to decide how vertices form shapes. That rule is `primitive.topology` on the render pipeline.

If you draw 6 vertices:

- Are they **6 points**?
- Are they **3 separate lines**?
- Are they **2 triangles**?

The topology answers that question.

## 2) The vertices we use

We define a small hexagon-like shape in the vertex shader using an array of 6 positions. We do this with `@builtin(vertex_index)` so we do **not** need a vertex buffer yet.

```wgsl
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
```

Each invocation of the vertex shader gets a different `VertexIndex`, so we pick a different position each time.

## 3) The five topologies

### `point-list`
Each vertex becomes a **single point**.

### `line-list`
Every pair of vertices is one line:
`(v0,v1)`, `(v2,v3)`, `(v4,v5)`.

### `line-strip`
Every vertex (after the first) extends the line:
`(v0,v1)`, `(v1,v2)`, `(v2,v3)` ...

### `triangle-list`
Every 3 vertices form an independent triangle:
`(v0,v1,v2)`, `(v3,v4,v5)`.

### `triangle-strip`
Every new vertex after the first two creates a new triangle:
`(v0,v1,v2)`, `(v1,v2,v3)`, `(v2,v3,v4)` ...

## 4) Switching topology with a GUI

We reuse the same shader, but create a pipeline based on the selected topology. When the user changes the dropdown, we rebuild the pipeline and render again.

```typescript
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

const createPipeline = (topology: GPUPrimitiveTopology) => {
  const primitive: GPUPrimitiveState = { topology };
  if (topology === "line-strip" || topology === "triangle-strip") {
    primitive.stripIndexFormat = "uint32";
  }

  return device.createRenderPipeline({
    label: `${topology} Pipeline`,
    layout: "auto",
    vertex: { module: shaderModule, entryPoint: "vs_main" },
    fragment: { module: shaderModule, entryPoint: "fs_main", targets: [{ format: canvasFormat }] },
    primitive,
  });
};

let pipeline = createPipeline(settings.topology);

const gui = new GUI({ title: "Primitives" });
gui.add(settings, "topology", topologies).name("Topology").onChange(() => {
  pipeline = createPipeline(settings.topology);
  render();
});
```

**Why `stripIndexFormat`?**  
Strip topologies can use index buffers to “restart” strips. We are not using index buffers yet, but WebGPU requires that the pipeline says which index format it would expect if we did.

## 5) Rendering the selected topology

We now render a single view, using the currently selected pipeline:

```typescript
passEncoder.setPipeline(pipeline);
passEncoder.draw(6);
```

## Full Code

```typescript
import { initWebGPU } from "../../utils/webgpu-util";
import GUI from "lil-gui";

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

  const createPipeline = (topology: GPUPrimitiveTopology) => {
    const primitive: GPUPrimitiveState = { topology };
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

  const gui = new GUI({ title: "Primitives" });
  gui
    .add(settings, "topology", topologies)
    .name("Topology")
    .onChange(() => {
      pipeline = createPipeline(settings.topology);
      render();
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

    passEncoder.setPipeline(pipeline);
    passEncoder.draw(6);

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch((err: Error) => {
  console.error(err);
});
```

## Common beginner mistakes

- **Forgetting to change topology**: If nothing changes, verify `primitive.topology`.
- **Using strip topology without `stripIndexFormat`**: The pipeline will fail validation.

In the next tutorial we will move beyond `vertex_index` and start using **vertex buffers**, which is how real meshes are provided to the GPU.
