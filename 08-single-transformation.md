# 08. Single Transformation

In this tutorial, we will learn how to move, rotate, and scale our geometry using **Transformation Matrices**.

We will use the **[wgpu-matrix](https://github.com/greggman/wgpu-matrix)** library, which is the standard math library for WebGPU in JavaScript.

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

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";
import { mat4 } from "wgpu-matrix";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Vertices (Triangle)
  // prettier-ignore
  const vertices = new Float32Array([
     0.0,  0.5, 0.5, // Top
    -0.5, -0.5, 0.5, // Bottom Left
     0.5, -0.5, 0.5  // Bottom Right
  ]);

  const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 2. Define Uniform Data (Matrix)
  // Create a translation matrix directly
  const modelMatrix = mat4.translation([0.5, 0.0, 0.0]);

  // Create Uniform Buffer for the matrix
  // 4x4 float matrix = 16 floats * 4 bytes = 64 bytes
  const uniformBuffer = device.createBuffer({
    label: "Uniform Matrix Buffer",
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  // Upload the matrix data
  device.queue.writeBuffer(uniformBuffer, 0, modelMatrix as Float32Array);

  // 3. Define Shaders
  const shaderModule = device.createShaderModule({
    label: "Transformation Shader",
    code: `
      struct Uniforms {
        modelMatrix : mat4x4f,
      };

      @group(0) @binding(0) var<uniform> global : Uniforms;

      @vertex
      fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
        // Multiply the position by the matrix
        // Note: W component is 1.0 for points
        return global.modelMatrix * vec4f(pos, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0); // Red
      }
    `,
  });

  // 4. Create Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Transformation Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 3 * 4, // 3 floats (x, y, z)
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  // 5. Create Bind Group
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
    ],
  });

  // 6. Render
  function render() {
    const commandEncoder = device.createCommandEncoder();
    const textureView = context!.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.draw(3);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch((err) => {
  console.error(err);
});
```
