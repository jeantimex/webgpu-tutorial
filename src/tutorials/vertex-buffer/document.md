# Vertex Buffer

In the primitives tutorial we defined vertices directly inside the shader. That is useful for learning, but real geometry comes from the CPU. This tutorial shows the **standard WebGPU data path**: create a typed array in JavaScript, upload it to a GPU buffer, describe the buffer layout to the pipeline, and bind it for drawing.

By the end you will understand how CPU memory becomes GPU vertex attributes, and how `@location` in WGSL connects to buffer layouts in JavaScript.

**Key learning points:**

- Why WebGPU uses **typed arrays** for vertex data.
- How to allocate and fill a `GPUBuffer`.
- How `GPUVertexBufferLayout` maps bytes to shader attributes.
- How `@location` connects shader inputs to buffer attributes.
- How the render pass binds a buffer with `setVertexBuffer`.

## 1. Define vertex data on the CPU

We store our triangle in a `Float32Array`. Typed arrays are important because GPU memory is raw bytes; typed arrays give us a predictable byte layout.

```typescript
// Each vertex has 2 floats (x, y)
// prettier-ignore
const vertices = new Float32Array([
  0.0,  0.5,  // Vertex 1 (Top)
 -0.5, -0.5,  // Vertex 2 (Bottom Left)
  0.5, -0.5,  // Vertex 3 (Bottom Right)
]);
```

### Byte size and alignment

- A `Float32` is 4 bytes.
- Each vertex has 2 floats = 8 bytes.
- 3 vertices x 8 bytes = **24 bytes** total.

Using `vertices.byteLength` avoids manual mistakes and stays correct if you change the data.

## 2. Create a GPU buffer

GPU buffers must declare their **size** and **usage** up front. We mark this as a vertex buffer and as a copy destination because we will upload data into it.

```typescript
const vertexBuffer = device.createBuffer({
  label: "Triangle Vertex Buffer",
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
```

Why `COPY_DST`? Because we will use `queue.writeBuffer`, which copies data from CPU memory into the GPU buffer.

## 3. Upload data into the buffer

```typescript
device.queue.writeBuffer(vertexBuffer, 0, vertices);
```

This copies our typed array into GPU memory at byte offset 0.

## 4. Update the vertex shader to take attributes

Instead of `@builtin(vertex_index)`, the vertex shader now receives inputs from a buffer via `@location`.

```typescript
@vertex
fn vs_main(@location(0) position : vec2f) -> @builtin(position) vec4f {
  return vec4f(position, 0.0, 1.0);
}
```

- `@location(0)` declares the first attribute input.
- The GPU will supply this from the vertex buffer we describe in the pipeline.

## 5. Describe the buffer layout

The pipeline must know how to interpret the buffer bytes. That is the role of `GPUVertexBufferLayout`.

```typescript
const vertexBufferLayout: GPUVertexBufferLayout = {
  arrayStride: 2 * 4, // 2 floats, 4 bytes each
  attributes: [
    {
      shaderLocation: 0, // Matches @location(0)
      offset: 0,         // Start of the vertex
      format: "float32x2",
    },
  ],
};
```

Key concepts:

- **arrayStride**: how many bytes to step to get the next vertex (8 bytes here).
- **shaderLocation**: connects to WGSL `@location(0)`.
- **format**: tells WebGPU how to interpret bytes (here, two floats).

Then we attach this layout when creating the pipeline:

```typescript
const pipeline = device.createRenderPipeline({
  label: "Vertex Buffer Pipeline",
  layout: "auto",
  vertex: {
    module: vertexModule,
    entryPoint: "vs_main",
    buffers: [vertexBufferLayout],
  },
  fragment: {
    module: fragmentModule,
    entryPoint: "fs_main",
    targets: [{ format: canvasFormat }],
  },
  primitive: { topology: "triangle-list" },
});
```

## 6. Bind the buffer and draw

Finally, we bind the buffer to slot 0 and issue a draw call.

```typescript
passEncoder.setPipeline(pipeline);
passEncoder.setVertexBuffer(0, vertexBuffer); // Slot 0
passEncoder.draw(3);
```

### How the data wiring works

There are three places to keep consistent:

1. **Shader input**: `@location(0) position : vec2f`
2. **Pipeline layout**: `shaderLocation: 0` in the buffer attributes
3. **Binding point**: `setVertexBuffer(0, ...)` binds the buffer to slot 0

If any of these mismatch, the shader reads garbage or validation fails.

## 7. Resizing and re-rendering

We resize the canvas to match its CSS size and device pixel ratio before rendering, then redraw on window resize. This keeps the output crisp on high DPI screens.

```typescript
resizeCanvasToDisplaySize(canvas);
```

## Common pitfalls

- **Wrong stride or format**: your triangle will look distorted or disappear.
- **Missing `COPY_DST` usage**: `writeBuffer` will fail validation.
- **Forgetting to bind the vertex buffer**: the shader reads zeroes.
