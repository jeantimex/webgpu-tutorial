# Torus Geometry

This tutorial builds a **torus** (donut shape) using two angular loops and renders it with a lit surface and optional wireframe overlays.

**Key learning points:**

- How to generate a torus from two angles (major and minor).
- How to compute normals from the torus centerline.
- How to build indices for the tube surface.
- How to compare line‑list vs. barycentric wireframes.

## 1. Parameterization

A torus is defined by:

- **radius**: distance from center to the tube center
- **tube**: tube radius
- **arc**: sweep angle around the main ring

We iterate two angles:

```typescript
const u = (i / tubularSegments) * arc;      // around the main ring
const v = (j / radialSegments) * Math.PI*2; // around the tube
```

Positions are computed as:

```typescript
const x = (radius + tube * Math.cos(v)) * Math.cos(u);
const y = (radius + tube * Math.cos(v)) * Math.sin(u);
const z = tube * Math.sin(v);
```

## 2. Normals

The normal points from the ring centerline to the surface:

```typescript
const cx = radius * Math.cos(u);
const cy = radius * Math.sin(u);
const nx = x - cx;
const ny = y - cy;
const nz = z;
```

After normalization, this gives smooth lighting across the tube.

## 3. Indices

The torus surface is a grid in `u` and `v`. Each quad becomes two triangles:

```typescript
indices.push(a, b, d);
indices.push(b, c, d);
```

## 4. Wireframe overlay

Wireframe can be drawn either as line‑list edges or barycentric edges. The barycentric option produces smoother lines without depth bias issues.

## 5. GUI controls

The GUI lets you adjust radius, tube size, segment counts, and arc length, and toggle wireframe modes.

## Common pitfalls

- **Large arc values** creating self‑intersecting geometry.
- **Mismatched segment counts** leading to visible seams.
