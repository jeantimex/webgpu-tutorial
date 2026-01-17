# Rock Geometry

This tutorial generates a **procedural rock** by perturbing a sphere with deterministic noise. It then faceted‑shades the result by duplicating vertices per triangle, producing a rugged, low‑poly look.

**Key learning points:**

- How to apply radial noise to a sphere grid.
- How to control noise strength with a randomness factor.
- How to compute face normals for faceted shading.
- How wireframe overlays reveal surface irregularity.

## 1. Base sphere grid

We start with the same latitude/longitude grid used for a sphere, but each vertex radius is perturbed:

```typescript
const poleFactor = Math.sin(phi);
const r = radius * (1 + (random() - 0.5) * 2 * randomness * poleFactor);
```

The `poleFactor` reduces noise near the poles to avoid extreme spikes.

## 2. Deterministic randomness

A small deterministic RNG is used so the rock shape is stable between runs unless parameters change:

```typescript
let seed = 12345;
const random = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
```

## 3. Faceted normals

Like the jewel, we rebuild the mesh so every triangle has its own normal:

```typescript
const faceNormal = vec3.normalize(
  vec3.cross(vec3.subtract(pb, pa), vec3.subtract(pc, pa))
);
```

This produces a sharp, rocky appearance instead of smooth shading.

## 4. Wireframe overlay

Wireframe modes make the irregular topology obvious and are useful for debugging the noise shape.

## 5. GUI controls

You can adjust radius, segment counts, and randomness. Higher randomness exaggerates the rocky silhouette.

## Common pitfalls

- **Too much randomness** causing self‑intersections.
- **Too few segments** producing a coarse, blocky rock.
