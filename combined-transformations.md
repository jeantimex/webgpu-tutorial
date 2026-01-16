# Combined Transformations

In the last tutorial, we learned how to apply a single transformation (translation) using a matrix. But real-world objects often need to be moved, rotated, and scaled all at the same time.

In this tutorial, we will learn how to **combine multiple transformations** into a single model matrix. We will also explore the critical importance of operation order.

**Key Learning Points:**

- Chaining matrix operations: `Translate * Rotate * Scale`.
- Understanding why order matters (Local vs. Global space).
- Using `mat4.rotateZ` and `mat4.scale`.
- Resetting the matrix to identity before each frame.

## 1. The Transformation Chain

When we want to move, rotate, and scale an object, we usually want it to happen in a specific local order:

1.  **Scale**: Resize the object locally.
2.  **Rotate**: Rotate it around its local origin.
3.  **Translate**: Move it to its final position in the world.

In matrix math, this is often represented as: `FinalPosition = TranslationMatrix * RotationMatrix * ScaleMatrix * OriginalPosition`

Using `wgpu-matrix`, we chain these operations on our model matrix.

```typescript
// 1. Reset to identity
mat4.identity(modelMatrix);

// 2. Translate (Move)
mat4.translate(modelMatrix, [0.2, 0.0, 0.0], modelMatrix);

// 3. Rotate (Spin)
mat4.rotateZ(modelMatrix, Math.PI / 4, modelMatrix); // 45 degrees

// 4. Scale (Resize)
mat4.scale(modelMatrix, [0.5, 0.5, 1.0], modelMatrix);
```

### Why this order?

If you **Rotate** before you **Translate**, the object spins around its own center. If you **Translate** before you **Rotate**, the object orbits around the world origin (0,0) like a planet!

By applying operations to the matrix in the order `Translate -> Rotate -> Scale`, we effectively build the transformation from the "outside in" (or "left to right" in code execution), resulting in an object that is scaled, then rotated, then moved.

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";
import { mat4, vec3 } from "wgpu-matrix";

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
  const uniformBuffer = device.createBuffer({
    label: "Uniform Matrix Buffer",
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // 3. Transformation Logic
  const modelMatrix = mat4.create();

  function updateTransformation() {
    // Reset matrix to identity
    mat4.identity(modelMatrix);

    // Order matters: Translate -> Rotate -> Scale
    // This order applies Scale first, then Rotation, then Translation relative to the object.
    // In code (right-to-left multiplication), we usually apply them in reverse order of operation
    // if we think about it as: FinalPos = Translate * Rotate * Scale * VertexPos

    // 1. Translate
    mat4.translate(modelMatrix, [0.2, 0.0, 0.0], modelMatrix);

    // 2. Rotate (90 degrees around Z axis)
    const angle = Math.PI / 2; // 90 degrees
    mat4.rotateZ(modelMatrix, angle, modelMatrix);

    // 3. Scale (half size)
    mat4.scale(modelMatrix, [0.5, 0.5, 1.0], modelMatrix);

    // Upload
    device.queue.writeBuffer(uniformBuffer, 0, modelMatrix as Float32Array);
  }

  updateTransformation();

  // 4. Define Shaders (Same as 08)
  const shaderModule = device.createShaderModule({
    label: "Transformation Shader",
    code: `
      struct Uniforms {
        modelMatrix : mat4x4f,
      };

      @group(0) @binding(0) var<uniform> global : Uniforms;

      @vertex
      fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
        return global.modelMatrix * vec4f(pos, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0); // Red
      }
    `,
  });

  // 5. Create Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Combined Transformation Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 3 * 4,
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

  // 6. Create Bind Group
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
    ],
  });

  // 7. Render
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
