# 35. Sphere Wireframe

In this tutorial, instead of loading a model from a file, we will generate one using math! We'll build a configurable **Sphere Generator** similar to the one found in engines like Three.js.

## 1. Spherical Coordinates

To generate a sphere, we don't pick random points. We iterate over two angles:
1.  **Phi**: The angle around the equator (longitude). 0 to 2*PI (360°).
2.  **Theta**: The angle from the north pole to the south pole (latitude). 0 to PI (180°).

The conversion from Spherical `(radius, phi, theta)` to Cartesian `(x, y, z)` is:

```typescript
x = -radius * cos(phi) * sin(theta);
y =  radius * cos(theta);
z =  radius * sin(phi) * sin(theta);
```

## 2. Segments and Loops

We divide the sphere into a grid of `widthSegments` (slices) and `heightSegments` (stacks).
*   **Indices**: To draw the wireframe, we connect each point to its neighbor:
    *   **Horizontal Line**: Connect `current` to `right`.
    *   **Vertical Line**: Connect `current` to `down`.

## 3. Partial Spheres

By restricting the start and length of the Phi and Theta angles, we can create interesting shapes:
*   **Hemisphere**: `thetaLength = Math.PI / 2`
*   **Pacman Shape**: `phiLength < Math.PI * 2`
*   **Slice**: Adjusting `phiStart` and `thetaStart`.

Use the GUI controls to explore these variations in real-time.

```