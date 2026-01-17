# Torus Knot Geometry

This tutorial constructs a **torus knot** by sweeping a tube along a parametric knot curve. The result is a complex, looping mesh with controllable winding parameters.

**Key learning points:**

- How to build a tube along a parametric curve.
- How `p` and `q` control the knot’s winding.
- How to compute tangent, normal, and binormal vectors.
- How to render wireframes on complex topology.

## 1. Parametric knot curve

The centerline of the knot is defined by a parametric function of `u`:

```typescript
const x = radius * (2 + cos(q/p * u)) * 0.5 * cos(u);
const y = radius * (2 + cos(q/p * u)) * 0.5 * sin(u);
const z = radius * sin(q/p * u) * 0.5;
```

The parameters `p` and `q` determine how many times the curve winds around each axis.

## 2. Frenet‑like frame

To build the tube, we need a local coordinate frame at each point:

- **T**: tangent direction
- **N**: normal direction
- **B**: binormal direction

We estimate these from nearby points:

```typescript
const T = vec3.normalize(vec3.sub(p2, p1));
const N = vec3.normalize(vec3.add(p1, p2));
const B = vec3.normalize(vec3.cross(T, N));
const N2 = vec3.cross(B, T);
```

## 3. Sweeping the tube

For each `u` along the knot, we generate a ring of vertices around the tube:

```typescript
const x = p1[0] + (cx * N2[0] + cy * B[0]);
const y = p1[1] + (cx * N2[1] + cy * B[1]);
const z = p1[2] + (cx * N2[2] + cy * B[2]);
```

Normals are computed from the same ring offset.

## 4. Indices and rendering

The tube surface is a grid over `u` and `v`. We build indices exactly like a torus and render either as a lit surface or wireframe overlay.

## 5. GUI controls

You can change radius, tube size, segment counts, and the `p`/`q` winding parameters to explore different knot shapes.

## Common pitfalls

- **Low segment counts** causing visible twisting artifacts.
- **Large tube radius** causing self‑intersection.
