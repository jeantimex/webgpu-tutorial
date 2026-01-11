# 40. Procedural Cone Geometry

A **Cone** is essentially a special case of a Cylinder where the `radiusTop` is zero.

## 1. Parameters

*   **`radius`**: The radius of the cone base.
*   **`height`**: Height of the cone.
*   **`radialSegments`**: Number of segmented faces around the circumference.
*   **`heightSegments`**: Number of rows of faces along the height.
*   **`openEnded`**: If true, the base of the cone is left open.
*   **`thetaStart` & `thetaLength`**: Create a partial cone.

## 2. Implementation

We reuse the core logic from the Cylinder generator. The only difference is that we hardcode the top radius to `0` and only generate a bottom cap (since the top is a single point).

Ideally, in a full library like Three.js, both `ConeGeometry` and `CylinderGeometry` would inherit from a shared class to avoid code duplication.
