# Jewel Geometry

This tutorial generates a **faceted jewel** by sampling a sphere grid and then duplicating vertices per triangle to produce hard edges. The result is a low‑poly gemstone with sharp reflections and crisp wireframe edges.

**Key learning points:**

- How to build a sphere‑like grid and triangulate it.
- How to create faceted shading by duplicating vertices per face.
- How to compute face normals for a low‑poly look.
- How wireframe overlays emphasize facet structure.

## 1. Sphere‑style sampling

We start with latitude/longitude sampling of a sphere:

```typescript
const x = -radius * Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI);
const y = radius * Math.cos(v * Math.PI);
const z = radius * Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI);
```

This produces a grid of positions and indices.

## 2. Faceting: duplicate vertices per triangle

Instead of sharing vertices, we rebuild the mesh so every triangle has its own vertices and a single normal:

```typescript
const faceNormal = vec3.normalize(
  vec3.cross(vec3.subtract(pb, pa), vec3.subtract(pc, pa))
);

verticesArray.set(pa, baseIndex);
verticesArray.set(pb, baseIndex + 3);
verticesArray.set(pc, baseIndex + 6);

normalsArray.set(faceNormal, baseIndex);
normalsArray.set(faceNormal, baseIndex + 3);
normalsArray.set(faceNormal, baseIndex + 6);
```

This produces flat shading and sharp edges, which is ideal for a jewel look.

## 3. Indices

After duplication, indices become sequential:

```typescript
indicesArray[i] = i;
indicesArray[i + 1] = i + 1;
indicesArray[i + 2] = i + 2;
```

## 4. Wireframe overlay

Wireframe modes (line‑list and barycentric) are especially useful here to show the facets and their boundaries.

## 5. GUI controls

The GUI exposes radius and segment counts so you can control how coarse or smooth the gemstone appears.

## Common pitfalls

- **Too many segments** losing the faceted aesthetic.
- **Forgetting vertex duplication** leading to smooth shading.
