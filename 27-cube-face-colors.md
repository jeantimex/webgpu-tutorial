# Cube Face Colors

In [Tutorial 26](26-indexed-cube.html), we used an **Index Buffer** to optimize a cube by sharing vertices. We reused the 8 corner vertices to draw all 12 triangles.

However, sharing vertices has a limitation: a shared vertex can only have **one** color (or normal, or texture coordinate).

If we want each face of the cube to have a solid, distinct color, we encounter a problem at the corners. For example, the top-front-right corner needs to be:
*   **Red** for the Front face.
*   **Green** for the Top face.
*   **Blue** for the Right face.

We cannot assign three different colors to a single vertex index.

## The Solution: Split Vertices

To achieve "hard edges" or distinct face attributes, we must duplicate the vertices. Instead of 8 unique vertices, we define **24 vertices** (4 per face × 6 faces).

*   Vertices 0-3: Front Face (Red)
*   Vertices 4-7: Back Face (Cyan)
*   Vertices 8-11: Top Face (Green)
*   ...and so on.

We still use an **Index Buffer** to form the two triangles for each face using these new indices.

### Vertex Data Structure

We now have 24 entries in our vertex buffer.

```typescript
const vertexData = new Float32Array([
  // Front Face (Red)
  -0.5, -0.5,  0.5,   1, 0, 0,
   0.5, -0.5,  0.5,   1, 0, 0,
   ...
   
  // Top Face (Green)
  -0.5,  0.5, -0.5,   0, 1, 0,
  -0.5,  0.5,  0.5,   0, 1, 0,
   ...
]);
```

### Index Buffer

Our indices now reference these 24 vertices.

```typescript
const indexData = new Uint16Array([
  0, 1, 2,  2, 3, 0,      // Front Face (uses vertices 0-3)
  8, 9, 10, 10, 11, 8,    // Top Face (uses vertices 8-11)
  ...
]);
```

## Why use an Index Buffer then?

You might ask: "If we are just listing vertices for every face, why not just use `draw()` without indices?"

You *could* do that (requiring 36 vertices total), but using indices (24 vertices) still saves memory and processing power, especially as meshes get more complex. In a textured cube, you often share vertices within a face (the 4 corners of a face share the same normal/tangent plane), so keeping them as 4 verts per face is cleaner than 6 verts per face.

This technique is essential for **flat shading**, where normals are perpendicular to the face rather than smoothed across corners.
