# 36. Procedural Box Geometry

Just like the sphere, a **Box** (or Cube) is a fundamental 3D primitive. While a simple cube has 8 vertices, a "Box Geometry" usually implies that it can be **segmented**.

## 1. Structure

A box is constructed from **6 Planes** (Front, Back, Top, Bottom, Left, Right).
Each plane is a 2D grid of vertices.

## 2. Segmentation

Why do we need segments?
*   **Lighting:** More vertices allow for per-vertex lighting calculations to be more detailed (though less relevant for flat faces).
*   **Deformation:** If you want to bend, twist, or explode the box later, you need internal vertices.
*   **Texture Mapping:** Sometimes you want to tile a texture across a face.

## 3. Implementation

We write a helper function `buildPlane()` that takes axes (`u, v, w`) and directions to orient the plane correctly in 3D space. We call this function 6 times to build the full box.

In this demo, we use **Wireframe** rendering (including diagonal lines) to clearly visualize the triangle structure of the generated mesh.
