# 37. Procedural Cylinder Geometry

The **Cylinder** is another versatile 3D primitive. By adjusting its parameters, you can create tubes, pipes, cones (radiusTop=0), and even flat discs (height=0).

## 1. Structure

A cylinder is made of three parts:
1.  **The Torso (Side Wall)**: A grid of quads wrapped around a central axis.
2.  **Top Cap**: A disc of triangles (fan) closing the top.
3.  **Bottom Cap**: A disc of triangles closing the bottom.

## 2. Parameters

*   **`radiusTop` & `radiusBottom`**: Control the taper. Set `radiusTop` to 0 to make a **Cone**.
*   **`radialSegments`**: How round the cylinder is.
*   **`heightSegments`**: Vertical subdivisions.
*   **`openEnded`**: If true, skips generating the top and bottom caps (making a tube).
*   **`thetaStart` & `thetaLength`**: Create a partial cylinder slice (like a cake slice).

## 3. Implementation

We generate vertices in loops similar to the Sphere, but the math is simpler:
`x = radius * sin(theta)`
`z = radius * cos(theta)`
`y` moves linearly from `-height/2` to `+height/2`.
