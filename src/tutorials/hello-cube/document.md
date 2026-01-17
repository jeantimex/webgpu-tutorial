# Hello Cube (3D & MVP)

Welcome to the 3D world! In this tutorial, we will transition from drawing 2D shapes to rendering a 3D **Cube**. To do this, we need to learn about the **MVP Matrix** and **Depth Testing**.

To keep things as simple as possible, we will define every vertex of the cube explicitly (36 vertices total) and render it in solid red. This allows us to focus entirely on the transformation math.

**Key Learning Points:**
- Using the `wgpu-matrix` library for 3D math.
- Understanding the **Model-View-Projection (MVP)** pipeline.
- Setting up a **Depth Texture** to handle overlapping geometry.
- Transitioning from 2D coordinates to 3D `vec3f` positions.

## 1. The MVP Matrix

To convert 3D coordinates into 2D screen pixels, we multiply every vertex position by three distinct matrices:

1.  **Model Matrix**: Moves, rotates, and scales the object in the world.
2.  **View Matrix**: Defines the "Camera." It describes where you are looking from and which way is "up."
3.  **Projection Matrix**: Simulates perspective. It makes objects that are further away (larger Z distance) appear smaller.

```typescript
import { mat4 } from "wgpu-matrix";

const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);
const viewMatrix = mat4.lookAt([2, 2, 2], [0, 0, 0], [0, 1, 0]);
const modelMatrix = mat4.identity();

const mvpMatrix = mat4.multiply(projectionMatrix, mat4.multiply(viewMatrix, modelMatrix));
```

## 2. Depth Testing (The Z-Buffer)

In 3D, multiple objects might overlap. WebGPU draws triangles in the order you tell it to. Without **Depth Testing**, a triangle that is far away could be drawn *over* a triangle that is close, simply because it was processed later.

To fix this, we create a **Depth Texture**. For every pixel, the GPU stores the "depth" (distance from camera).
- If a new pixel is closer than the existing one, the GPU draws it.
- If it's further away, the GPU discards it.

```typescript
depthStencil: {
  depthWriteEnabled: true,
  depthCompare: "less",
  format: "depth24plus",
}
```

## 3. Explicit Geometry

For this tutorial, we define each of the 6 faces of the cube using 2 triangles (6 vertices per face). This totals **36 vertices**. While this is not the most efficient method (using an Index Buffer is better), it is the easiest way to visualize how 3D triangles are constructed.
