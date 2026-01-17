# Single Transformation

In the last tutorial, we learned how to use Index Buffers to efficiently define geometry. But so far, all our objects have been static and centered at the origin.

In this tutorial, we will learn how to move, rotate, and scale our geometry using **Transformation Matrices**. We will be using the `wgpu-matrix` library to handle the mathematics.

**Key Learning Points:**

- Understanding the role of 4x4 Matrices in 3D graphics.
- Using `wgpu-matrix` to create translation matrices.
- Passing matrices to the shader via Uniform Buffers.
- Performing Matrix-Vector multiplication in the Vertex Shader.
- Why we need to handle Z-clipping carefully.

## 1. The Math: 4x4 Matrices

In 3D graphics, we use 4x4 matrices (`mat4`) to represent transformations. By multiplying a vertex position (`vec4`) by a transformation matrix, we get a new, transformed position.

## 2. Using `wgpu-matrix`

We create a translation matrix that moves the triangle `0.5` units to the right.

```typescript
import { mat4 } from "wgpu-matrix";

const modelMatrix = mat4.translation([0.5, 0.0, 0.0]);
```

## 3. Uploading to Uniform Buffer

A 4x4 matrix of floats takes up **64 bytes** (16 floats \* 4 bytes). We upload this to a Uniform Buffer just like we did with color.

```typescript
const uniformBuffer = device.createBuffer({
  size: 64, // 16 floats * 4 bytes
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(uniformBuffer, 0, modelMatrix as Float32Array);
```

## 4. The Shader

In WGSL, we define the uniform as `mat4x4f`.

```typescript
struct Uniforms {
  modelMatrix : mat4x4f,
};

@group(0) @binding(0) var<uniform> global : Uniforms;

@vertex
fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
  // Multiply the matrix by the vector
  return global.modelMatrix * vec4f(pos, 1.0);
}
```

**Important**: Order matters! `Matrix * Vector` applies the transformation to the vector.

### Deep Dive: Z-Clipping and Matrix Math

You might notice that we changed our vertex Z coordinates from `0.0` to `0.5`. Why?

In WebGPU, the visible Z-range is `[0.0, 1.0]`. When we returned `0.0` directly in previous tutorials, it worked because the value was exact.

However, when we introduce **matrix multiplication**, the GPU performs floating-point math. Even with an identity matrix, the calculation for Z could result in a tiny negative number (e.g., `-0.0000001`) due to precision errors. If Z is even slightly less than `0.0`, the GPU **clips** (discards) the vertex because it's technically "behind" the camera.

By setting Z to `0.5`, we place the geometry safely in the middle of the visible range, ensuring it remains visible even with minor math inaccuracies.

Now, instead of a static triangle in the center, we see a red triangle shifted to the right!
