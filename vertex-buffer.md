# Vertex Buffer

In the last tutorial, we explored how to change the shape of our geometry using primitive topologies. However, our vertex positions were hardcoded directly inside the shader code. This works for a simple triangle but is impossible for complex 3D models.

In this tutorial, we will learn how to pass data from JavaScript to the GPU using **Vertex Buffers**, allowing us to render dynamic geometry.

**Key Learning Points:**

- Creating and mapping a `GPUBuffer`.
- Understanding `Float32Array` and byte alignment.
- Configuring `GPUVertexBufferLayout` (attributes, stride).
- Updating shaders to accept inputs via `@location`.
- Binding buffers with `setVertexBuffer`.

## 1. Defining Data in JavaScript

First, we define our geometry in standard JavaScript arrays. Since WebGPU interacts with low-level memory, we use a `Float32Array`.

```typescript
// Each vertex has 2 floats (x, y)
// prettier-ignore
const vertices = new Float32Array([
  0.0,  0.5, // Vertex 1 (Top)
  -0.5, -0.5, // Vertex 2 (Bottom Left)
  0.5, -0.5, // Vertex 3 (Bottom Right)
]);
```

### Understanding Byte Sizes

GPU memory allocation requires us to think in bytes.

- **`Float32`**: A 32-bit floating-point number.
- **32 bits = 4 bytes**.
- Our array has **6 elements** (3 vertices \* 2 coordinates each).
- Total size = **6 \* 4 bytes = 24 bytes**.

Using `vertices.byteLength` in JavaScript is the safest way to get this value automatically.

## 2. Creating a Buffer

We need to allocate memory on the GPU to hold this data. We use `device.createBuffer()`.

- **size**: The size in bytes. `vertices.byteLength` handles this (3 vertices x 2 floats x 4 bytes = 24 bytes).
- **usage**: We must explicitly declare how we intend to use this buffer.
  - `GPUBufferUsage.VERTEX`: We will use it as a vertex buffer.
  - `GPUBufferUsage.COPY_DST`: We will copy data _to_ it (destination).

```typescript
const vertexBuffer = device.createBuffer({
  label: "Triangle Vertex Buffer",
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
```

## 3. Writing Data to GPU

Created buffers start empty (or zeroed). We push our data to the GPU using `device.queue.writeBuffer`.

```typescript
device.queue.writeBuffer(vertexBuffer, 0, vertices);
```

## 4. Updating the Shader

We no longer use `vertex_index` to look up an array. Instead, we receive input attributes directly.

```typescript
@vertex
fn vs_main(@location(0) position : vec2f) -> @builtin(position) vec4f {
  return vec4f(position, 0.0, 1.0);
}
```

- **`@location(0)`**: This matches the attribute location we will define in the pipeline layout. It tells the GPU "get the data for this input from slot 0".

## 5. Describing the Buffer Layout

We need to tell the Render Pipeline _how_ to read our buffer. This is done via `GPUVertexBufferLayout`.

```typescript
const vertexBufferLayout: GPUVertexBufferLayout = {
  arrayStride: 2 * 4, // 2 floats x 4 bytes/float = 8 bytes per vertex
  attributes: [
    {
      shaderLocation: 0, // Matches @location(0) in shader
      offset: 0, // Start reading from the beginning of the stride
      format: "float32x2", // Corresponds to vec2f
    },
  ],
};
```

Then we pass this layout to the pipeline creation:

```typescript
const pipeline = device.createRenderPipeline({
  // ...
  vertex: {
    module: shaderModule,
    entryPoint: "vs_main",
    buffers: [vertexBufferLayout], // Add this line
  },
  // ...
});
```

## 6. Rendering

Finally, in the render loop, we must **bind** the buffer before drawing.

```typescript
passEncoder.setPipeline(pipeline);
passEncoder.setVertexBuffer(0, vertexBuffer); // Bind vertexBuffer to slot 0
passEncoder.draw(3);
```

### Deep Dive: Slots vs. Locations

This part is crucial for understanding how data flows from JavaScript to your shaders. We have three pieces that must be "wired" together correctly:

1. **The Shader Expectation**: The vertex shader declares a variable with `@location(0)`. It's basically saying: "I am waiting for data to arrive at **Shader Location 0**."

2. **The JavaScript Delivery**: During the render pass, we call `passEncoder.setVertexBuffer(0, vertexBuffer)`. This plugs our `vertexBuffer` into **Buffer Slot 0**. Think of this like plugging a cable into Port 0 on a hardware device.

3. **The Pipeline Connection (The Bridge)**: This is where the `vertexBufferLayout` comes in. When we create the pipeline, we define the "wiring" in the `buffers` array:
   - We tell the pipeline: "Look at the buffer plugged into **Slot 0**."
   - We then define an attribute within that layout: "Take the data from this buffer and send it to **Shader Location 0**."

**The data flow looks like this:** `JavaScript Buffer` → `Slot 0` → `Pipeline Bridge` → `Shader Location 0` → `vs_main(@location(0))`

If you wanted to use **Slot 5** in JavaScript (`setVertexBuffer(5, ...)`), you would simply update your pipeline layout to look for the buffer in the 5th index of the `buffers` array. Your shader's `@location(0)` would stay exactly the same!

Now, the GPU reads vertex data from our buffer, passes it to the shader via `@location(0)`, and draws the triangle!

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Vertex Data (Triangle)
  // Each vertex has 2 floats (x, y)
  // prettier-ignore
  const vertices = new Float32Array([
    0.0,  0.5, // Vertex 1 (Top)
    -0.5, -0.5, // Vertex 2 (Bottom Left)
    0.5, -0.5, // Vertex 3 (Bottom Right)
  ]);

  // 2. Create Vertex Buffer
  const vertexBuffer = device.createBuffer({
    label: "Triangle Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  // 3. Write data to the buffer
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 4. Define Shaders
  const shaderModule = device.createShaderModule({
    label: "Vertex Buffer Shader",
    code: `
      @vertex
      fn vs_main(@location(0) position : vec2f) -> @builtin(position) vec4f {
        return vec4f(position, 0.0, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0);
      }
    `,
  });

  // 5. Define Vertex Buffer Layout
  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 2 * 4, // 2 floats, 4 bytes each
    attributes: [
      {
        shaderLocation: 0, // Matches @location(0) in shader
        offset: 0,
        format: "float32x2", // vec2f
      },
    ],
  };

  // 6. Create Render Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Vertex Buffer Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [vertexBufferLayout], // Tell pipeline how to read buffer
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
    passEncoder.setVertexBuffer(0, vertexBuffer); // Bind the buffer to slot 0
    passEncoder.draw(3); // Draw 3 vertices
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch((err) => {
  console.error(err);
});
```
