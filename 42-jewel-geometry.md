# 42. Jewel Geometry

In this tutorial, we create a **Jewel** geometry. This builds upon the techniques used in tutorials 35-41 (Procedural Geometries).

A "Jewel" in this context is essentially a **Low-Poly Sphere** where each face has a unique, randomized color to simulate facets or "sparkle" without complex lighting calculations.

## Concept

Similar to [Tutorial 35: Sphere Geometry](35-sphere-geometry.md), we generate vertices based on spherical coordinates. However, there are two key differences to achieve the "Jewel" look:

1.  **Low Resolution**: We use low default segment counts (`widthSegments=7`, `heightSegments=5`) to make the individual triangular faces visible and large.
2.  **Face Attributes**: Instead of a smooth surface or a single solid color, we assign a unique random color to each triangle (face).

## Per-Face Attributes

To achieve the "faceted" look, we must ensure that each triangle has its own independent vertices (no sharing). This allows us to assign a specific color to every triangle.

We interleave 3 attributes in the vertex buffer:
1.  **Position** (`vec3f`): The 3D coordinate of the vertex.
2.  **Barycentric** (`vec3f`): Used for drawing the wireframe (same technique as Tutorials 35-41).
3.  **Color** (`vec3f`): A randomized color assigned to the entire triangle.

```typescript
// Add a triangle with unique color
function addTriangle(a, b, c) {
  // Random red/pink-ish color
  const hue = 0.9 + Math.random() * 0.1;
  const val = 0.4 + Math.random() * 0.6; 
  // ... convert to RGB ...

  // Push vertices with SAME color for all 3 corners
  vertices.push(...pA, 1, 0, 0, r, g, b);
  vertices.push(...pB, 0, 1, 0, r, g, b);
  vertices.push(...pC, 0, 0, 1, r, g, b);
}
```

## The Shader

The shader receives this per-vertex color and passes it to the fragment shader. The fragment shader then blends the white wireframe (calculated via barycentric coordinates) on top of this face color.

```wgsl
@vertex
fn vs_main(...) -> VertexOutput {
  // Pass color through
  out.color = color; 
  // ...
}

@fragment
fn fs_main(in : VertexOutput) -> ... {
  // Use passed color as the "fill"
  let fillColor = in.color;
  // ... blend with wireframe ...
}
```

This technique creates a vibrant, gem-like appearance that is computationally cheap (no lighting) but visually distinct.

## References

This tutorial extends the procedural geometry series:
- [35. Sphere Geometry](35-sphere-geometry.md)
- [36. Box Geometry](36-box-geometry.md)
- [37. Cylinder Geometry](37-cylinder-geometry.md)
- [38. Torus Geometry](38-torus-geometry.md)
- [39. Torus Knot Geometry](39-torus-knot-geometry.md)
- [40. Cone Geometry](40-cone-geometry.md)
- [41. Plane Geometry](41-plane-geometry.md)
