# Interleaved Vertex Buffers

In the last tutorial, we used two separate buffers for position and color data. While flexible, this isn't always the most efficient way to store data in memory.

In this tutorial, we will learn how to use **Interleaved Vertex Buffers**. This involves packing all attributes for a single vertex (position, color, etc.) into a single continuous block of memory. This is the standard approach for most 3D engines due to better cache performance.

**Key Learning Points:**

- Understanding the concept of "Interleaving" data.
- Calculating `arrayStride` for complex vertex structures.
- Using `offset` to map attributes within a single buffer stride.
- Why interleaving improves GPU cache locality.

## 1. The Data Structure

Instead of two arrays, we have one huge array. For each vertex, we store `x, y` followed immediately by `r, g, b`.

```typescript
// x, y, r, g, b
// prettier-ignore
const vertices = new Float32Array([
  0.0,  0.5,  1.0, 0.0, 0.0, // Vertex 1
  -0.5, -0.5, 0.0, 1.0, 0.0, // Vertex 2
  0.5,  -0.5, 0.0, 0.0, 1.0  // Vertex 3
]);
```

## 2. One Buffer to Rule Them All

We create just **one** `GPUBuffer` containing all this data.

```typescript
const vertexBuffer = device.createBuffer({
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, vertices);
```

## 3. The Layout (The Tricky Part)

We need to tell the pipeline how to read this mixed data. We use a single `GPUVertexBufferLayout`, but with **multiple attributes**.

- **stride**: The size of _one complete vertex_.
  - 2 floats (pos) + 3 floats (color) = 5 floats.
  - 5 floats \* 4 bytes = **20 bytes**.
- **offset**: Where each attribute starts _relative to the start of the vertex_.
  - Position starts at **0**.
  - Color starts after position (2 floats \* 4 bytes) = **8**.

```typescript
const vertexBufferLayout: GPUVertexBufferLayout = {
  arrayStride: 20, // 5 floats * 4 bytes
  attributes: [
    {
      shaderLocation: 0, // Position
      offset: 0,
      format: "float32x2",
    },
    {
      shaderLocation: 1, // Color
      offset: 8, // Skip the first 2 floats (position)
      format: "float32x3",
    },
  ],
};
```

## 4. Why Interleaved?

**Cache Locality**.

When the GPU processes a vertex, it typically needs _all_ attributes for that vertex at once. If your data is interleaved, the GPU fetches a single chunk of memory and gets everything it needs (position, color, texture coords).

If you use separate buffers, the GPU has to jump around to different memory addresses to gather the data for a single vertex. Interleaving is generally more efficient for standard 3D meshes.
