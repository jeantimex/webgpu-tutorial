# 05. Interleaved Vertex Buffers

In the last tutorial, we used two separate buffers for position and color data. While flexible, this isn't always the most efficient way to store data in memory.

In this tutorial, we will learn how to use **Interleaved Vertex Buffers**. This involves packing all attributes for a single vertex (position, color, etc.) into a single continuous block of memory. This is the standard approach for most 3D engines due to better cache performance.

**Key Learning Points:**

- Understanding the concept of "Interleaving" data.
- Calculating `arrayStride` for complex vertex structures.
- Using `offset` to map attributes within a single buffer stride.
- Why interleaving improves GPU cache locality.

## 1. The Data Structure

Instead of two arrays, we have one huge array. For each vertex, we store `x, y` followed immediately by `r, g, b`.

```typescript
// x, y, r, g, b
// prettier-ignore
const vertices = new Float32Array([
  0.0,  0.5,  1.0, 0.0, 0.0, // Vertex 1
  -0.5, -0.5, 0.0, 1.0, 0.0, // Vertex 2
  0.5,  -0.5, 0.0, 0.0, 1.0  // Vertex 3
]);
```

## 2. One Buffer to Rule Them All

We create just **one** `GPUBuffer` containing all this data.

```typescript
const vertexBuffer = device.createBuffer({
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, vertices);
```

## 3. The Layout (The Tricky Part)

We need to tell the pipeline how to read this mixed data. We use a single `GPUVertexBufferLayout`, but with **multiple attributes**.

- **stride**: The size of _one complete vertex_.
  - 2 floats (pos) + 3 floats (color) = 5 floats.
  - 5 floats \* 4 bytes = **20 bytes**.
- **offset**: Where each attribute starts _relative to the start of the vertex_.
  - Position starts at **0**.
  - Color starts after position (2 floats \* 4 bytes) = **8**.

```typescript
const vertexBufferLayout: GPUVertexBufferLayout = {
  arrayStride: 20, // 5 floats * 4 bytes
  attributes: [
    {
      shaderLocation: 0, // Position
      offset: 0,
      format: "float32x2",
    },
    {
      shaderLocation: 1, // Color
      offset: 8, // Skip the first 2 floats (position)
      format: "float32x3",
    },
  ],
};
```

## 4. Why Interleaved?

**Cache Locality**.

When the GPU processes a vertex, it typically needs _all_ attributes for that vertex at once. If your data is interleaved, the GPU fetches a single chunk of memory and gets everything it needs (position, color, texture coords).

If you use separate buffers, the GPU has to jump around to different memory addresses to gather the data for a single vertex. Interleaving is generally more efficient for standard 3D meshes.

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Interleaved Data
  // Each vertex has 5 values: x, y (position) + r, g, b (color)
  // prettier-ignore
  const vertices = new Float32Array([
    // x,   y,    r,   g,   b
    0.0,  0.5,  1.0, 0.0, 0.0, // Top (Red)
    -0.5, -0.5, 0.0, 1.0, 0.0, // Bottom Left (Green)
    0.5,  -0.5, 0.0, 0.0, 1.0  // Bottom Right (Blue)
  ]);

  // 2. Create ONE Buffer
  const vertexBuffer = device.createBuffer({
    label: "Interleaved Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  // 3. Write data to the buffer
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 4. Define Shaders (Same as before)
  const shaderModule = device.createShaderModule({
    label: "Interleaved Buffer Shader",
    code: `
      struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) color : vec3f,
      };

      @vertex
      fn vs_main(
        @location(0) pos : vec2f,
        @location(1) color : vec3f
      ) -> VertexOutput {
        var output : VertexOutput;
        output.position = vec4f(pos, 0.0, 1.0);
        output.color = color;
        return output;
      }

      @fragment
      fn fs_main(@location(0) color : vec3f) -> @location(0) vec4f {
        return vec4f(color, 1.0);
      }
    `,
  });

  // 5. Define Vertex Buffer Layout
  // We describe how the ONE buffer contains BOTH attributes
  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 5 * 4, // 5 floats * 4 bytes = 20 bytes per vertex
    attributes: [
      {
        shaderLocation: 0, // Position
        offset: 0, // Starts at the beginning
        format: "float32x2",
      },
      {
        shaderLocation: 1, // Color
        offset: 2 * 4, // Starts after the 2 position floats (8 bytes)
        format: "float32x3",
      },
    ],
  };

  // 6. Create Render Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Interleaved Buffer Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [vertexBufferLayout], // Just one buffer layout
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

    // We only have one buffer to bind to Slot 0
    passEncoder.setVertexBuffer(0, vertexBuffer);

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
