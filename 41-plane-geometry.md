# 41. Procedural Plane Geometry

A **Plane** is the simplest 3D primitive: a flat, 2D surface positioned in 3D space. It is essential for creating floors, walls, and as a base for terrain generation.

## 1. Structure

A plane is simply a grid of vertices.
*   **Width & Height**: The physical size of the plane.
*   **Segments**: The number of subdivisions. A plane with 1x1 segments is just two triangles forming a quad. Increasing segments adds more vertices internally.

## 2. Why use segments?

Even though a plane is flat, we often need multiple segments for:
1.  **Vertex Displacement**: Creating terrain (heightmaps).
2.  **Per-Vertex Effects**: Detailed lighting or animations (waves).
3.  **Physics**: More points for cloth simulation or collision detection.

## 3. Implementation

We iterate through two loops (X and Y) to create a grid of positions. The indices then connect these points into a series of quads, each split into two triangles.
