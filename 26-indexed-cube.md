# Indexed Cube

In the previous [Hello Cube](25-hello-cube.html) tutorial, we drew a cube using `draw(36)`. Since a cube has 6 faces and each face is made of 2 triangles (6 vertices), we needed $6 \times 6 = 36$ vertices.

However, a cube only has **8 unique corners** (vertices). If we simply list all triangles, we are repeating the same vertex positions multiple times (e.g., a corner is shared by 3 faces).

## The Problem with Duplicate Vertices

Duplicating vertices is inefficient for two reasons:
1.  **Memory**: We store redundant data (position, color, normal, UVs) for the same point in space.
2.  **Performance**: The vertex shader runs once for every vertex in the vertex buffer. If we have 36 vertices, the shader runs 36 times, even though there are only 8 unique positions.

## The Solution: Index Buffer

An **Index Buffer** is a list of integers that point to indices in the Vertex Buffer. Instead of ordering our vertex data to form triangles directly, we:
1.  Create a **Vertex Buffer** with only the unique vertices (8 for a simple colored cube).
2.  Create an **Index Buffer** that lists which vertices form each triangle.

For a cube, we need:
*   **8 Vertices** (Position + Color)
*   **36 Indices** (Uint16 or Uint32)

### 1. Unique Vertices

We define the 8 corners of the cube. Each corner can have a unique color.

```typescript
const vertexData = new Float32Array([
  // Position (x, y, z)    // Color (r, g, b)
  -0.5, -0.5,  0.5,       1, 0, 0, // 0: Front-Bottom-Left
   0.5, -0.5,  0.5,       0, 1, 0, // 1: Front-Bottom-Right
   0.5,  0.5,  0.5,       0, 0, 1, // 2: Front-Top-Right
  -0.5,  0.5,  0.5,       1, 1, 0, // 3: Front-Top-Left
  -0.5, -0.5, -0.5,       1, 0, 1, // 4: Back-Bottom-Left
   0.5, -0.5, -0.5,       0, 1, 1, // 5: Back-Bottom-Right
   0.5,  0.5, -0.5,       1, 1, 1, // 6: Back-Top-Right
  -0.5,  0.5, -0.5,       0, 0, 0, // 7: Back-Top-Left
]);
```

### 2. The Index Buffer

We define the triangles using indices that refer to the array above (0-7).

```typescript
const indexData = new Uint16Array([
  0, 1, 2,  2, 3, 0, // Front Face
  1, 5, 6,  6, 2, 1, // Right Face
  5, 4, 7,  7, 6, 5, // Back Face
  4, 0, 3,  3, 7, 4, // Left Face
  3, 2, 6,  6, 7, 3, // Top Face
  4, 5, 1,  1, 0, 4, // Bottom Face
]);

const indexBuffer = device.createBuffer({
  label: "Index Buffer",
  size: indexData.byteLength,
  usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(indexBuffer, 0, indexData);
```

### 3. Drawing with Indices

In the render pass, we bind the index buffer and use `drawIndexed` instead of `draw`.

```typescript
renderPass.setIndexBuffer(indexBuffer, "uint16");
renderPass.drawIndexed(indexData.length); // Draw 36 indices
```

## Summary

By using an index buffer:
*   We reduced vertex data size.
*   The GPU can optimize shading by caching processed vertices (Post-Transform Cache). If the same index appears again, the GPU can reuse the result of the vertex shader.

This is the standard way to render complex 3D meshes in WebGPU.

