# Index Buffer

When meshes become more complex, many triangles share the same vertices. If we duplicate vertex data for every triangle, memory grows quickly. **Index buffers** solve this by storing unique vertices once and referencing them by index.

This tutorial draws a square using **4 vertices** and **6 indices**, demonstrating how indexed drawing reduces duplication and improves cache locality.

**Key learning points:**

- Why indexed drawing reduces vertex duplication.
- How to create and fill a `GPUBuffer` with `GPUBufferUsage.INDEX`.
- How `drawIndexed` differs from `draw`.
- When to use `Uint16Array` vs `Uint32Array` for indices.
- How winding order interacts with culling.

## 1. Define unique vertices

A square made of two triangles normally needs 6 vertices (3 per triangle). With indices, we only store the 4 unique corners once:

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

## 2. Define the index list

The index buffer tells the GPU how to assemble triangles from the vertex array.

```typescript
// Triangle 1: 0 -> 1 -> 2
// Triangle 2: 0 -> 2 -> 3
const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
```

### Uint16 vs Uint32

- **`Uint16Array`** supports up to 65,535 vertices.
- **`Uint32Array`** is required for larger meshes.

Using `Uint16Array` saves memory and bandwidth when you can.

## 3. Create the index buffer

```typescript
const indexBuffer = device.createBuffer({
  label: "Index Buffer",
  size: indices.byteLength,
  usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(indexBuffer, 0, indices);
```

Note the `INDEX` usage flag. Without it, `setIndexBuffer` will fail validation.

## 4. Bind the index buffer and draw

Indexed drawing uses `setIndexBuffer` and `drawIndexed`:

```typescript
passEncoder.setPipeline(pipeline);
passEncoder.setVertexBuffer(0, vertexBuffer);

passEncoder.setIndexBuffer(indexBuffer, "uint16");
passEncoder.drawIndexed(6); // 6 indices = 2 triangles
```

`drawIndexed` uses indices to look up vertices in the vertex buffer, then assembles primitives based on the pipeline topology (here, triangle-list).

## 5. Winding order and culling

The order of indices defines the triangle's winding (clockwise or counter‑clockwise). If your pipeline has back-face culling enabled and the winding is wrong, the triangle disappears.

In this example, the indices are ordered to match the default front-face winding.

## Common pitfalls

- **Wrong index format**: `setIndexBuffer` must match the array type (`uint16` or `uint32`).
- **Mismatched indices**: indices outside the vertex range cause undefined behavior.
- **Unexpected culling**: if triangles vanish, check winding order or disable culling.
