# 03. Multiple Vertex Buffers

In this tutorial, we will learn how to feed data to the vertex shader using **multiple vertex buffers**. We will separate our position data and color data into two different buffers and combine them in the render pipeline.

## 1. Separate Data Arrays

We create two separate arrays: one for positions (2 floats per vertex) and one for colors (3 floats per vertex - RGB).

```typescript
// Positions (x, y)
const positions = new Float32Array([
  0.0,
  0.5, // Top
  -0.5,
  -0.5, // Bottom Left
  0.5,
  -0.5, // Bottom Right
]);

// Colors (r, g, b)
const colors = new Float32Array([
  1.0,
  0.0,
  0.0, // Red
  0.0,
  1.0,
  0.0, // Green
  0.0,
  0.0,
  1.0, // Blue
]);
```

We then create two `GPUBuffer` objects and write the respective data to them, just like in the previous tutorial.

## 2. Shader Updates

We update our vertex shader to accept two inputs.

```typescript
@vertex
fn vs_main(
  @location(0) pos : vec2f,
  @location(1) color : vec3f
) -> VertexOutput { ... }
```

- `@location(0)` receives the position.
- `@location(1)` receives the color.

We also define a `VertexOutput` struct to pass the color from the vertex shader to the fragment shader, so the fragment shader can display the interpolated colors.

## 3. Pipeline Layout: Array of Buffers

This is the key change. When defining the `vertex` state in the pipeline, we pass an **array** of layouts to `buffers`.

```typescript
const positionBufferLayout = {
  arrayStride: 2 * 4,
  attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
};

const colorBufferLayout = {
  arrayStride: 3 * 4,
  attributes: [{ shaderLocation: 1, offset: 0, format: "float32x3" }],
};

const pipeline = device.createRenderPipeline({
  // ...
  vertex: {
    // ...
    // Index 0 -> positionBufferLayout
    // Index 1 -> colorBufferLayout
    buffers: [positionBufferLayout, colorBufferLayout],
  },
});
```

The order in this array is critical! It defines which **Buffer Slot** corresponds to which layout.

## 4. Binding Buffers

In the render loop, we call `setVertexBuffer` twice, matching the order defined in the pipeline's `buffers` array.

```typescript
// Slot 0 uses positionBufferLayout -> feeds @location(0)
passEncoder.setVertexBuffer(0, positionBuffer);

// Slot 1 uses colorBufferLayout -> feeds @location(1)
passEncoder.setVertexBuffer(1, colorBuffer);
```

## Why use multiple buffers?

Why not just put everything in one big array (Interleaved)?

- **Flexibility**: You might have static data (mesh positions) that never changes, and dynamic data (colors or instance transforms) that changes every frame. Keeping them separate makes updates easier.
- **Reuse**: You can use the same position buffer with different color buffers for different objects.

However, interleaved buffers (putting position and color side-by-side: `x, y, r, g, b`) are often more cache-efficient for the GPU. We will cover that in a future tutorial!
