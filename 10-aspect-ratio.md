# 10. Aspect Ratio

If you noticed in previous tutorials, our "square" looked like a rectangle, and our rotation made the triangle distort. This is because our canvas is rectangular ($800 \times 600$), but WebGPU clip space is a square $[-1, 1] \times [-1, 1]$.

In this tutorial, we will fix this distortion by applying **Aspect Ratio Correction**.

## 1. The Problem

- **Canvas**: 800 pixels wide, 600 pixels tall.
- **Aspect Ratio**: $800 / 600 \approx 1.33$.
- **Clip Space**: Width = 2.0, Height = 2.0.

Because the physical width is larger than the height, 1 unit of X covers more pixels than 1 unit of Y. This stretches everything horizontally.

## 2. The Solution: Projection

To fix this, we need to **squash** the X-axis by dividing it by the aspect ratio. This effectively makes "1 visual unit" in X equal to "1 visual unit" in Y.

In 3D graphics, this is usually handled by a **Projection Matrix**. For 2D, we can simply apply a scale transformation at the end of our chain.

```typescript
const aspect = canvas.width / canvas.height; // ~1.33

// Scale X by (1 / aspect)
mat4.scale(modelMatrix, [1 / aspect, 1, 1], modelMatrix);
```

## 3. Order Matters (Again)

This correction essentially maps our "World Space" to "Clip Space". It should be the **last** thing that happens to a vertex before it hits the screen coordinates.

In our matrix multiplication chain (`P * T * R * S`), it comes first (applied last).

```typescript
function updateTransformation() {
  mat4.identity(modelMatrix);

  // 0. Projection (Aspect Ratio)
  // Applied LAST to the vertex, so it's the FIRST operation on the matrix
  const aspect = canvas.width / canvas.height;
  mat4.scale(modelMatrix, [1 / aspect, 1, 1], modelMatrix);

  // 1. Translate
  mat4.translate(modelMatrix, [0.2, 0.0, 0.0], modelMatrix);

  // 2. Rotate
  mat4.rotateZ(modelMatrix, Math.PI / 2, modelMatrix);

  // 3. Scale
  mat4.scale(modelMatrix, [0.5, 0.5, 1.0], modelMatrix);
}
```

Now, even when rotated, our triangle maintains its correct shape!

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
    mat4.identity(modelMatrix);

    // 0. Aspect Ratio Correction
    const aspect = canvas.width / canvas.height;
    mat4.scale(modelMatrix, [1 / aspect, 1, 1], modelMatrix);

    // 1. Translate
    mat4.translate(modelMatrix, [0.2, 0.0, 0.0], modelMatrix);

    // 2. Rotate (90 degrees around Z axis)
    const angle = Math.PI / 2;
    mat4.rotateZ(modelMatrix, angle, modelMatrix);

    // 3. Scale (half size)
    mat4.scale(modelMatrix, [0.5, 0.5, 1.0], modelMatrix);

    // Upload
    device.queue.writeBuffer(uniformBuffer, 0, modelMatrix as Float32Array);
  }

  updateTransformation();

  // 4. Define Shaders (Same as 08/09)
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
    label: "Aspect Ratio Pipeline",
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
