# Index Buffer

In the last tutorial, we optimized our draw calls using Dynamic Uniform Buffers. However, for complex 3D models (like a cube or a sphere), vertices are often shared between multiple triangles. Duplicating these vertices is wasteful.

In this tutorial, we will learn how to use **Index Buffers**. This allows us to store each unique vertex only once and define the shape's topology by referencing those vertices by index.

**Key Learning Points:**

- Reducing vertex data redundancy.
- Creating a buffer with `GPUBufferUsage.INDEX`.
- Using `setIndexBuffer` and `drawIndexed`.
- Understanding `Uint16Array` vs `Uint32Array` for indices.

## 1. Defining Unique Vertices

We want to draw a square. A square is made of 2 triangles. If we drew 2 separate triangles, we would need **6 vertices** (3+3). Two of them would be duplicates (the diagonal).

With an Index Buffer, we only define the **4 unique corners**:

```typescript
// x,    y,      r,   g,   b
// prettier-ignore
const vertices = new Float32Array([
  -0.5,  0.5,    1.0, 0.0, 0.0, // 0: Top-Left
  -0.5, -0.5,    0.0, 1.0, 0.0, // 1: Bottom-Left
   0.5, -0.5,    0.0, 0.0, 1.0, // 2: Bottom-Right
   0.5,  0.5,    1.0, 1.0, 0.0  // 3: Top-Right
]);
```

## 2. Defining Indices

We define the drawing order using integers. Since we have fewer than 65,536 vertices, we can use `Uint16Array` (2 bytes per index) to save memory.

```typescript
// Triangle 1: Top-Left -> Bottom-Left -> Bottom-Right
// Triangle 2: Top-Left -> Bottom-Right -> Top-Right
const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
```

## 3. Creating the Index Buffer

This is similar to a vertex buffer, but we add `GPUBufferUsage.INDEX`.

```typescript
const indexBuffer = device.createBuffer({
  size: indices.byteLength,
  usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(indexBuffer, 0, indices);
```

## 4. Rendering

In the render loop, we use `setIndexBuffer` and `drawIndexed`.

```typescript
passEncoder.setVertexBuffer(0, vertexBuffer);

// 1. Bind the Index Buffer and specify the format
passEncoder.setIndexBuffer(indexBuffer, "uint16");

// 2. Draw Indexed
// drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance)
passEncoder.drawIndexed(6);
```

We tell the GPU to process **6 indices**. It will look up the vertex data for each index and assemble the triangles.
