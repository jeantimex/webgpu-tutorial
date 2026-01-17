# Primitives

This tutorial introduces **primitive topology** in WebGPU: the rule that turns a list of vertices into points, lines, or triangles. We purposely keep the input simple (no vertex buffer yet) so you can focus on how topology changes connectivity.

By the end, you will understand how the same six vertices can render as points, line segments, or triangles, and why changing topology requires rebuilding the render pipeline.

## What you should know after this tutorial

- What **primitive topology** means in WebGPU.
- How `point-list`, `line-list`, `line-strip`, `triangle-list`, and `triangle-strip` interpret the same vertex stream.
- Why the pipeline must be recreated when `primitive.topology` changes.
- Why strip topologies reference `stripIndexFormat` even without index buffers.

## 1. Why topology matters

WebGPU does not infer how you want to connect vertices. You tell the pipeline how to interpret the vertex stream by setting:

- `primitive.topology` on the render pipeline.

That single setting decides whether your vertices become points, line segments, or triangles. With the same six vertices, you can get very different results.

## 2. The vertex data (no buffers yet)

To isolate topology, we hard-code a small hexagon-like shape in the **vertex shader** and index it using `@builtin(vertex_index)`. This lets us draw without a vertex buffer, which keeps the example small and focused.

```typescript
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

Why this approach?

- `vertex_index` gives you a small, deterministic vertex stream.
- It avoids buffer setup so you can focus on topology.
- It is a great learning tool, but real scenes will use vertex buffers.

The fragment shader is intentionally simple and just outputs a solid color.

## 3. The five topologies

You can switch between these modes and see the same vertices connect differently:

- **`point-list`**: every vertex is a point.
- **`line-list`**: every pair of vertices is a line segment.
- **`line-strip`**: every new vertex extends the line.
- **`triangle-list`**: every three vertices form a triangle.
- **`triangle-strip`**: every new vertex after the first two makes a new triangle.

Here is how six vertices are grouped:

- **Point list**: v0, v1, v2, v3, v4, v5
- **Line list**: (v0,v1), (v2,v3), (v4,v5)
- **Line strip**: (v0,v1), (v1,v2), (v2,v3), (v3,v4), (v4,v5)
- **Triangle list**: (v0,v1,v2), (v3,v4,v5)
- **Triangle strip**: (v0,v1,v2), (v1,v2,v3), (v2,v3,v4), (v3,v4,v5)

## 4. Pipeline creation and why it must be rebuilt

In WebGPU, **render pipelines are immutable**. You cannot change `primitive.topology` on the fly. If the user selects a new topology, you must create a new pipeline.

We keep a small helper that creates a pipeline for a given topology:

```typescript
const topologies: GPUPrimitiveTopology[] = [
  "point-list",
  "line-list",
  "line-strip",
  "triangle-list",
  "triangle-strip",
];

const createPipeline = (topology: GPUPrimitiveTopology) => {
  const primitive: GPUPrimitiveState = { topology };
  if (topology === "line-strip" || topology === "triangle-strip") {
    primitive.stripIndexFormat = "uint32";
  }

  return device.createRenderPipeline({
    label: `${topology} Pipeline`,
    layout: "auto",
    vertex: { module: shaderModule, entryPoint: "vs_main" },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive,
  });
};
```

### Why `stripIndexFormat` is required

Strip topologies support **primitive restart** when using an index buffer. Even though we are not using an index buffer here, WebGPU requires the pipeline to declare which index format it would accept for a strip. This is a validation rule, so we set `stripIndexFormat` for line and triangle strips.

## 5. UI: switching topology with lil-gui

A small GUI lets you change topology live. When it changes, we recreate the pipeline and render again:

```typescript
const settings = { topology: "triangle-list" as GPUPrimitiveTopology };
let pipeline = createPipeline(settings.topology);

const gui = new GUI({ title: "Primitives" });
gui.add(settings, "topology", topologies).name("Topology").onChange(() => {
  pipeline = createPipeline(settings.topology);
  render();
});
```

This pattern is common in WebGPU: immutable pipeline state means dynamic toggles usually rebuild pipelines.

## 6. Rendering the selected topology

Rendering is the same no matter which topology is active. Only the pipeline changes:

```typescript
passEncoder.setPipeline(pipeline);
passEncoder.draw(6);
```

We issue one draw call with 6 vertices; the GPU connects them according to the pipeline's topology.

## Common pitfalls

- **Changing topology without rebuilding the pipeline**: the old pipeline stays active.
- **Forgetting `stripIndexFormat` for strip modes**: WebGPU validation will fail.
- **Assuming `vertex_index` replaces vertex buffers**: it is only for simple demos and procedural geometry.
