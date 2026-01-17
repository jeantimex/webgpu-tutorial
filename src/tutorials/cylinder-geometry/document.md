# Cylinder Geometry

This tutorial builds a **procedural cylinder** (or truncated cone) and renders it with a lit surface plus optional wireframe overlays. The geometry supports different top/bottom radii, height segments, partial arcs, and optional end caps.

**Key learning points:**

- How to generate a cylinder by sweeping a circle along height segments.
- How to compute normals for the curved surface.
- How to generate optional top/bottom caps.
- How to render wireframes using line‑list or barycentric techniques.

## 1. Generating the side surface

We sample the cylinder along two axes:

- **radialSegments** around the circle
- **heightSegments** along the height

For each ring we compute a radius interpolated between `radiusTop` and `radiusBottom`:

```typescript
const v = y / heightSegments;
const radius = v * (radiusBottom - radiusTop) + radiusTop;
```

Each vertex position is computed by rotating around the Y axis:

```typescript
const theta = u * thetaLength + thetaStart;
positions.push(
  radius * Math.sin(theta),
  -v * height + halfHeight,
  radius * Math.cos(theta)
);
```

## 2. Side normals

For the side surface, normals must tilt based on the slope of the cylinder. We compute a slope vector and normalize it:

```typescript
const slope = (radiusBottom - radiusTop) / height;
const nx = sinTheta;
const nz = cosTheta;
const ny = slope;
const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

normals.push(nx / len, ny / len, nz / len);
```

This makes the lighting smooth across the curved surface, even when the top and bottom radii differ.

## 3. Building indices

The side surface is a grid. Each quad becomes two triangles:

```typescript
indices.push(a, b, d);
indices.push(b, c, d);
```

Where `a/b/c/d` refer to the four corners of each grid cell.

## 4. End caps (optional)

If `openEnded` is false, we add caps. Each cap is a fan of triangles around a center vertex:

```typescript
positions.push(0, halfHeight * sign, 0);

for (let x = 0; x <= radialSegments; x++) {
  positions.push(radius * sinTheta, halfHeight * sign, radius * cosTheta);
  normals.push(0, sign, 0);
}
```

The index order flips for the top vs. bottom cap so the winding stays consistent.

## 5. Vertex packing

Positions and normals are interleaved into a single buffer:

```typescript
const vertices = new Float32Array(vertexCount * 6);
vertices[vOffset + 0] = positions[pOffset + 0];
vertices[vOffset + 3] = normals[pOffset + 0];
```

Each vertex uses 6 floats: `position.xyz + normal.xyz`.

## 6. Wireframe overlay

This demo supports two wireframe techniques:

- **Line‑list wireframe**: converts triangles into explicit line segments (crisp edges, may z‑fight).
- **Barycentric wireframe**: renders triangles and draws edges in the fragment shader (smooth edges, slightly heavier).

Depth bias controls help reduce z‑fighting in line‑list mode.

## 7. GUI controls

The GUI lets you tweak:

- radii, height, and segment counts
- open/closed caps
- arc start and length
- wireframe mode and line thickness
- animation and depth bias

## Common pitfalls

- **Incorrect normals** when using a tapered cylinder.
- **Missing caps** when `openEnded` is false.
- **No depth bias** in line‑list mode (flickering edges).
