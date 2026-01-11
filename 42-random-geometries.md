# 42. Random Geometries (Instancing) (Instancing)

In this tutorial, we push WebGPU to its limits by rendering up to **1,000,000** distinct objects at 60 FPS.

## The Problem

A naive approach would be to loop through 1 million objects and call `draw()` for each one.
*   **CPU Overhead**: Issuing 1 million commands to the GPU driver takes way too long.
*   **Result**: The CPU chokes, and you get 1 frame per second (if you're lucky).

## The Solution: Instancing

**Instancing** allows us to draw the *same* geometry (mesh) thousands of times with a *single* draw call.

We pass an extra buffer (the **Instance Buffer**) containing unique data for each copy (Position, Rotation, Scale, Color).

In this demo, we have 6 types of meshes (Cube, Sphere, Cylinder, Cone, Torus, Torus Knot).
1.  We pre-calculate 1,000,000 random matrices and colors.
2.  We group them by mesh type in the buffer.
3.  In the render loop, we make just **6 draw calls**—one for each mesh type—telling the GPU how many instances to draw for that batch.

## Key Code

```typescript
// Vertex Shader
struct InstanceInput {
  @location(2) modelMatrix0 : vec4f, // ... 4 vectors for mat4
  @location(6) color : vec4f,
}

// Draw Call
renderPass.setVertexBuffer(2, instanceBuffer, offset, size);
renderPass.drawIndexed(indexCount, instanceCount);
```
