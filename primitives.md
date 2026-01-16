# Primitives

In the last tutorial, we successfully set up a WebGPU environment and rendered a basic triangle. However, we simply used the default settings for how vertices are assembled.

In this tutorial, we will explore **Primitive Topologies**, which define whether our vertices form triangles, lines, or individual points.

**Key Learning Points:**

- Understanding different topology types: `point-list`, `line-list`, `line-strip`, `triangle-list`, `triangle-strip`.
- How to configure the `primitive` property in a `GPURenderPipeline`.
- Using `stripIndexFormat` for strip topologies.
- Rendering multiple pipelines in a single frame using `setViewport`.

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

Here are the supported topologies and their typical use cases:

### `point-list`

- **Description**: Draws a single point for each vertex.
- **Use Case**: Particle systems, point clouds, or visual debugging (marking vertex positions).

### `line-list`

- **Description**: Draws a line segment for every pair of vertices. Vertices (v0, v1) form the first line, (v2, v3) form the second, and so on. If you have an odd number of vertices, the last one is ignored.
- **Use Case**: Wireframe rendering, drawing unconnected edges, or simple vector graphics (like loose hairs or grass blades).

### `line-strip`

- **Description**: Draws a connected series of line segments. Vertices (v0, v1) form the first line, (v1, v2) form the second, etc.
- **Requirement**: When using `line-strip`, you generally need to specify a `stripIndexFormat` in the pipeline configuration if you plan to use an index buffer (though it's good practice to be aware of it).
- **Use Case**: Drawing paths, trails, function graphs, or continuous outlines.

### `triangle-list` (Default)

- **Description**: Draws a distinct triangle for every three vertices. (v0, v1, v2) is the first triangle, (v3, v4, v5) is the second.
- **Use Case**: Most 3D geometry (meshes, terrain, characters) is built from independent triangles.

### `triangle-strip`

- **Description**: Draws a connected series of triangles. (v0, v1, v2) is the first triangle, (v1, v2, v3) is the second, and so on.
- **Requirement**: Like `line-strip`, this topology requires `stripIndexFormat` to be set in the pipeline descriptor.
- **Use Case**: Optimizing memory bandwidth for continuous surfaces like terrain or spheres, as it reuses vertices implicitly.

## 2. Rendering Multiple Topologies

In this example, we define 6 vertices arranged in a hexagon shape. We then create 5 different render pipelines—one for each topology—and render them side-by-side using `setViewport`.

- **Top-Left**: `point-list` (6 individual points)
- **Top-Center**: `line-list` (3 separate lines)
- **Top-Right**: `line-strip` (a continuous line path)
- **Bottom-Left**: `triangle-list` (2 separate triangles)
- **Bottom-Center**: `triangle-strip` (4 connected triangles filling the shape)

## Full Code

```typescript
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
```
