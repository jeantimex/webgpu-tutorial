# 39. Procedural Torus Knot Geometry

A **Torus Knot** is a fascinating mathematical shape that winds around a torus multiple times, creating a complex, interlinked curve.

## 1. Parameters (P and Q)

The shape is defined by two integers:
*   **P**: The number of times the curve winds around the axis of rotational symmetry.
*   **Q**: The number of times the curve winds around a circle in the interior of the torus.

By adjusting **P** and **Q**, you can create a wide variety of knots.
*   **P=2, Q=3**: The classic **Trefoil Knot**.
*   **P=3, Q=4**: A more complex interwoven structure.

## 2. Generating the Curve

The position of the "spine" of the tube is calculated using:

```typescript
// u varies from 0 to p * 2*PI
r = radius * (2 + cos(q/p * u)) * 0.5
x = r * cos(u)
y = r * sin(u)
z = radius * sin(q/p * u) * 0.5
```

## 3. Extruding the Tube

Unlike a simple torus where the "up" vector is constant, a knot twists and turns in 3D space. To generate the tube vertices, we need to calculate a coordinate frame (Tangent, Normal, Binormal) at every point along the curve so we know how to orient the ring cross-section properly.
