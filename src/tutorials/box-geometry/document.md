# Box Geometry

This tutorial generates a **procedural box** with configurable dimensions and segment counts, then renders it with a lit surface and optional wireframe overlay. It uses the same two wireframe techniques as the wireframe demo: a line‑list pass and a barycentric pass.

**Key learning points:**

- How to procedurally build a box from six subdivided planes.
- How to pack positions and normals into a single vertex buffer.
- How to draw the box as indexed triangles.
- How to overlay wireframe using line‑list or barycentric methods.
- How depth bias helps prevent z‑fighting in line‑list wireframes.

## 1. Building the box from planes

A box is made of six planes. Each plane is generated as a grid of quads (subdivisions), then triangulated. The `buildPlane` helper does this for one face:

```typescript
function buildPlane(
  u: number,
  v: number,
  w: number,
  uDir: number,
  vDir: number,
  planeWidth: number,
  planeHeight: number,
  planeDepth: number,
  gridX: number,
  gridY: number,
  normal: [number, number, number]
) {
  const segmentWidth = planeWidth / gridX;
  const segmentHeight = planeHeight / gridY;
  const widthHalf = planeWidth / 2;
  const heightHalf = planeHeight / 2;
  const depthHalf = planeDepth / 2;

  const gridX1 = gridX + 1;
  const gridY1 = gridY + 1;
  const startIndex = positions.length / 3;

  for (let iy = 0; iy < gridY1; iy++) {
    const y = iy * segmentHeight - heightHalf;
    for (let ix = 0; ix < gridX1; ix++) {
      const x = ix * segmentWidth - widthHalf;
      const pos = [0, 0, 0];
      pos[u] = x * uDir;
      pos[v] = y * vDir;
      pos[w] = depthHalf;
      positions.push(pos[0], pos[1], pos[2]);
      normals.push(normal[0], normal[1], normal[2]);
    }
  }

  for (let iy = 0; iy < gridY; iy++) {
    for (let ix = 0; ix < gridX; ix++) {
      const a = startIndex + ix + gridX1 * iy;
      const b = startIndex + ix + gridX1 * (iy + 1);
      const c = startIndex + (ix + 1) + gridX1 * (iy + 1);
      const d = startIndex + (ix + 1) + gridX1 * iy;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }
}
```

We call this function six times with different axes and normals to form the full box.

## 2. Packing vertex data

After building all faces, we interleave `position.xyz` and `normal.xyz` into a single vertex buffer:

```typescript
const vertexCount = positions.length / 3;
const vertices = new Float32Array(vertexCount * 6);
for (let i = 0; i < vertexCount; i++) {
  const pOffset = i * 3;
  const vOffset = i * 6;
  vertices[vOffset] = positions[pOffset];
  vertices[vOffset + 1] = positions[pOffset + 1];
  vertices[vOffset + 2] = positions[pOffset + 2];
  vertices[vOffset + 3] = normals[pOffset];
  vertices[vOffset + 4] = normals[pOffset + 1];
  vertices[vOffset + 5] = normals[pOffset + 2];
}
```

## 3. Lit rendering

The lit pass uses the standard Lambert shader from the geometry demos. We set up a pipeline with a `float32x3` position attribute and a `float32x3` normal attribute.

## 4. Wireframe overlay

There are two wireframe options:

### A) Line‑list wireframe

The line‑list pipeline uses a separate vertex shader that reads positions and indices from storage buffers and converts each triangle into three line segments. This produces crisp edges but can z‑fight with the lit surface, so we expose depth bias controls.

### B) Barycentric wireframe

The barycentric pipeline renders triangles and uses barycentric coordinates to draw edges in the fragment shader. This produces smooth anti‑aliased lines and avoids z‑fighting, but costs more per fragment.

## 5. GUI controls

The GUI lets you change box dimensions and subdivisions, toggle wireframe mode, animate rotation, and switch between wireframe techniques. When the geometry changes, we rebuild the vertex and index buffers and update bind groups.

## Common pitfalls

- **Forgetting to rebuild bind groups** after regenerating geometry buffers.
- **Depth bias too small** causing flickering lines in the line‑list mode.
- **Too many segments** creating a very large index buffer.
