# Plane Geometry

This tutorial builds a **subdivided plane** and renders it with lighting and optional wireframe. It is the simplest grid‑based surface and a great base for terrains and heightmaps.

**Key learning points:**

- How to generate a grid of vertices in the XY plane.
- How to build indices for a tiled quad mesh.
- How normals stay constant for a flat plane.
- How wireframe overlays reveal grid density.

## 1. Grid generation

We create a `(widthSegments + 1) x (heightSegments + 1)` grid:

```typescript
for (let iy = 0; iy < gridY1; iy++) {
  const y = iy * segmentHeight - heightHalf;
  for (let ix = 0; ix < gridX1; ix++) {
    const x = ix * segmentWidth - widthHalf;
    positions.push(x, -y, 0);
    normals.push(0, 0, 1);
  }
}
```

All normals are `(0, 0, 1)` because the plane is flat.

## 2. Indices

Each grid cell becomes two triangles:

```typescript
indices.push(a, b, d);
indices.push(b, c, d);
```

## 3. Wireframe overlay

The line‑list mode shows each grid edge explicitly, while the barycentric mode shows anti‑aliased lines without depth bias artifacts.

## 4. GUI controls

You can adjust plane width, height, and segment counts, plus all wireframe settings.

## Common pitfalls

- **Too many segments** creating extremely large index buffers.
- **Forgetting to update bind groups** after regenerating geometry.
