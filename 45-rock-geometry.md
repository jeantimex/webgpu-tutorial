# 45. Rock Geometry

In this tutorial, we create a **Rock** geometry. This builds upon the procedural geometry techniques and specifically extends the concepts from [42. Jewel Geometry](42-jewel-geometry.md).

A "Rock" in this context is an irregular, lumpy sphere that uses randomness to create an organic appearance.

## Concept

The fundamental approach is similar to generating a sphere, but with two key modifications:

1.  **Vertex Jitter**: Instead of a constant radius, we randomize the radius of each vertex based on its position (using a seeded random function for consistency). This creates the lumpy, uneven surface characteristic of a rock.
2.  **Earthy Colors**: Instead of a single color or the vibrant gem colors from the Jewel tutorial, we assign randomized earthy tones (greys, browns) to each face.

## Implementation Details

### Random Radius (Jitter)

When calculating the position of each vertex, we modify the radius:

```typescript
// Use seeded random for consistency
const random = () => { ... };

// Add randomness to radius
// We reduce randomness at the poles to avoid extreme distortion where vertices converge
const poleFactor = Math.sin(phi); 
const r = radius * (1 + (random() - 0.5) * 2 * randomness * poleFactor);

const x = -r * Math.cos(theta) * Math.sin(phi);
const y = r * Math.cos(phi);
const z = r * Math.sin(theta) * Math.sin(phi);
```

### Per-Face Colors

Just like the Jewel geometry, we ensure each triangle has unique vertices (non-indexed) so we can assign a solid color to each face.

```typescript
// Earthy/Rock colors (Gray/Brown)
const val = 0.3 + Math.random() * 0.4;
// Slight brown tint
const red = val + Math.random() * 0.1;
const green = val;
const blue = val - Math.random() * 0.05;
```

This tutorial demonstrates how simple variations on basic geometric algorithms (like a sphere) can produce significantly different visual results suitable for different types of objects in a 3D scene.
