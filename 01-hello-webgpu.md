# 01. Hello WebGPU

In this first tutorial, we will walk through the process of setting up a WebGPU context and drawing a simple red triangle. This is the "Hello World" of graphics programming.

## Why WebGPU? (vs WebGL)

If you are coming from WebGL, you might wonder why we need a new API.

- **Modern Architecture**: WebGL is based on OpenGL ES, which was designed in the 90s. WebGPU is designed to map to modern native GPU APIs like Vulkan, Metal, and DirectX 12. This means less overhead and better performance.
- **Compute Shaders**: WebGPU brings first-class support for General Purpose GPU (GPGPU) compute shaders, allowing you to perform massive parallel calculations efficiently, something that was hacky or impossible in WebGL.
- **Statelessness**: WebGL relies on a global state machine (e.g., `gl.useProgram`, `gl.bindBuffer`). This makes it easy to introduce bugs where one part of your code accidentally affects another. WebGPU uses "Pipeline Objects" and "Command Encoders" which bundle state together, making the rendering process more predictable and easier to multi-thread.

## Core Concepts: Adapter & Device

Before we dive into the code, it's crucial to understand two fundamental objects in WebGPU:

### 1. GPUAdapter

The **Adapter** represents a physical GPU implementation on your system. It describes the capabilities of the hardware (e.g., "NVIDIA RTX 3080", "Integrated Intel Graphics").

- You request an adapter from the browser (`navigator.gpu.requestAdapter()`).
- On systems with multiple GPUs (like a laptop with discrete and integrated graphics), you can request a "high-performance" or "low-power" adapter.
- The adapter is read-only; it tells you what the hardware _can_ do.

### 2. GPUDevice

The **Device** is a logical connection to the Adapter. It is the object you use to actually create resources (buffers, textures, pipelines) and execute commands.

- You request a device from the adapter (`adapter.requestDevice()`).
- It functions as a sandbox. If something goes wrong (e.g., a GPU crash), the device is "lost," but the adapter remains. You can request a new device to recover.
- Most of your WebGPU code will involve methods on the `device` object.

---

## 1. Initialization

First, we need to initialize WebGPU. We've extracted the boilerplate initialization code into a utility function `initWebGPU`.

```typescript
export async function initWebGPU(canvas: HTMLCanvasElement) {
  if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
  }

  const adapter: GPUAdapter | null = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
  }

  const device: GPUDevice = await adapter.requestDevice();

  const context: GPUCanvasContext | null = canvas.getContext("webgpu");

  if (!context) {
    throw new Error("WebGPU context not found.");
  }

  const canvasFormat: GPUTextureFormat =
    navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: canvasFormat,
  });

  return { device, context, canvasFormat, adapter };
}
```

This function handles:

1. Checking if `navigator.gpu` exists.
2. Requesting a `GPUAdapter` (the physical GPU).
3. Requesting a `GPUDevice` (the logical connection to the GPU).
4. Configuring the canvas context with the device and preferred format.

In our main script, we simply call this function:

```typescript
import { initWebGPU } from "./utils/webgpu-util";

async function init(): Promise<void> {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);
  // ... rest of the code
```

## 2. Defining Shaders

WebGPU uses **WGSL** (WebGPU Shading Language). We need two shaders:

### Vertex Shader (`vs_main`)

The vertex shader is responsible for computing the position of each vertex.

```typescript
@vertex
fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4f {
  var pos = array<vec2f, 3>(
    vec2f(0.0, 0.5),
    vec2f(-0.5, -0.5),
    vec2f(0.5, -0.5)
  );
  return vec4f(pos[VertexIndex], 0.0, 1.0);
}
```

Let's break down the function signature: `fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4f`

- `@vertex`: This attribute tells WebGPU that this function is an entry point for the vertex stage.
- **Built-in Variables**: The syntax `@builtin(...)` binds a variable to a specific system value.
  - `@builtin(vertex_index)`: This gives us the index of the current vertex being processed (0, 1, or 2).
  - `@builtin(position)`: This indicates that the return value of this function is the final clip-space position of the vertex.
- **The Analogy**: You can think of the vertex shader as a callback function in an `Array.map()` operation. The GPU runs this function _in parallel_ for every vertex you draw. If you call `draw(3)`, the GPU effectively runs:

  ```javascript
  // Conceptual JavaScript equivalent
  [0, 1, 2].map((VertexIndex) => vs_main(VertexIndex));
  ```

In this simple example, we don't pass any vertex buffers. Instead, we define the positions directly in an array inside the shader and use the `VertexIndex` to pick the correct position.

### Deep Dive: What happens to `@builtin(position)`?

When your vertex shader returns a `vec4f` marked with `@builtin(position)`, the GPU doesn't just put a dot on the screen. It kicks off a series of fixed steps known as **Primitive Assembly** and **Rasterization**:

1. **Clip Space**: The value you return `(x, y, z, w)` is in **Clip Space**.
   - `x` and `y` range from `-1.0` to `1.0`. `(-1, -1)` is the bottom-left, and `(1, 1)` is the top-right.
   - `z` ranges from `0.0` to `1.0` (for depth testing).
2. **Primitive Assembly**: The GPU takes the 3 positions returned by `vs_main` (because we said `topology: "triangle-list"`) and assembles them into a triangle.
3. **Rasterization**:
   - **Viewport Transformation**: The GPU maps the `-1..1` coordinates to your actual canvas pixels (e.g., `0..800` and `0..600`).
   - **Interpolation**: The GPU figures out every single pixel (fragment) that lies _inside_ the triangle.
   - For each of these pixels, it calls your **Fragment Shader**.

So, `vs_main` runs 3 times (once per corner), but `fs_main` runs thousands of times (once per pixel inside the triangle).

### Fragment Shader (`fs_main`)

The fragment shader determines the color of each pixel drawn.

```typescript
@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0);
}
```

Let's break down the signature: `fn fs_main() -> @location(0) vec4f`

- `@fragment`: Marks this function as the entry point for the fragment stage.
- **Return Value**: It returns a `vec4f` (Red, Green, Blue, Alpha).
- `@location(0)`: This is the critical link to the screen.
  - It tells WebGPU to write this color output to the **first color attachment** (index 0) of the current render pass.
  - In our `render` function later, you'll see we define `colorAttachments` array. The 0th element of that array corresponds to `@location(0)`.
  - If you had multiple render targets (e.g., for deferred rendering), you could have `@location(1)`, `@location(2)`, etc.

In our case, `@location(0)` maps directly to the texture view of the canvas, so returning red here makes the pixel on the screen red.

## 3. Creating the Render Pipeline

In WebGL, you would typically set various states (blend modes, depth testing, active shaders) individually before each draw call. This "state machine" approach is flexible but has a high CPU overhead because the driver has to validate the entire state combination every time you draw.

WebGPU solves this with the **Render Pipeline**.

### What is a Pipeline?

A `GPURenderPipeline` is a pre-compiled, immutable object that bakes in _almost all_ of the render state:

- **Shaders**: Which vertex and fragment shaders to use.
- **Vertex Layout**: How vertex data is laid out in memory.
- **Primitive Topology**: Whether you are drawing triangles, lines, or points.
- **Rasterization State**: Culling modes, depth biasing, etc.
- **Color & Depth States**: Blending equations, depth comparison functions, and pixel formats.

Because all of this is known upfront, the GPU driver can optimize everything _once_ when you create the pipeline. During the render loop, switching pipelines is very fast.

```typescript
const pipeline: GPURenderPipeline = device.createRenderPipeline({
  label: "Red Triangle Pipeline",
  layout: "auto",
  vertex: {
    module: shaderModule,
    entryPoint: "vs_main",
  },
  fragment: {
    module: shaderModule,
    entryPoint: "fs_main",
    targets: [
      {
        format: canvasFormat,
      },
    ],
  },
  primitive: {
    topology: "triangle-list",
  },
});
```

## 4. The Render Loop

WebGPU works differently from WebGL's immediate mode. You don't execute commands directly; instead, you record them into a buffer and submit them all at once. This reduces the communication overhead between the CPU and GPU.

### Key Concepts

1. **Command Encoder (`GPUCommandEncoder`)**: Think of this as a "recorder." You use it to record a series of GPU commands (like "copy buffer," "start render pass"). It doesn't execute anything yet; it just builds a list of instructions.

2. **Render Pass (`GPURenderPassEncoder`)**: This is a specific phase of recording dedicated to drawing. You must start a render pass to issue draw calls. It defines the "framebuffer" configuration:
   - **Attachments**: Which textures (images) we are drawing into.
   - **Load Operations**: What to do with the existing data in the texture (e.g., `clear` it to a color, or `load` the existing content).
   - **Store Operations**: Whether to save (`store`) the results after drawing.

3. **Command Buffer**: When you finish encoding (`encoder.finish()`), you get a `GPUCommandBuffer`. This is a sealed packet of work ready for the GPU.

4. **Queue (`device.queue`)**: This is the scheduler for the GPU. You `submit` your command buffers to the queue, and the GPU executes them asynchronously.

```typescript
function render(): void {
  // 1. Create a command encoder to record our commands
  const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();

  // 2. Get the current texture from the canvas to draw into
  const textureView: GPUTextureView = context!.getCurrentTexture().createView();

  // 3. Define the render pass: Clear the screen to dark gray, then store the result
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

  // 4. Start the render pass
  const passEncoder: GPURenderPassEncoder =
    commandEncoder.beginRenderPass(renderPassDescriptor);

  // 5. Set the state (pipeline) and issue draw commands
  passEncoder.setPipeline(pipeline);
  passEncoder.draw(3); // Draw 3 vertices

  // 6. End the render pass
  passEncoder.end();

  // 7. Finish recording and submit the work to the GPU
    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}
```

## Summary & Next Steps

In this tutorial, we successfully:

- Initialized WebGPU and obtained a `GPUDevice`.
- Learned about the differences between WebGL and WebGPU.
- Wrote basic WGSL shaders for vertices and fragments.
- Created an immutable `GPURenderPipeline`.
- Recorded and submitted commands via a `GPUCommandEncoder` and `GPUQueue`.

Currently, our triangle's vertices are **hardcoded** inside the WGSL shader code. While this works for simple demos, real-world applications need to pass dynamic data from JavaScript to the GPU.

In the next tutorial, we will learn how to use **Vertex Buffers** to send geometry data from our TypeScript code directly to the shader!

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";

async function init(): Promise<void> {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  const shaderModule: GPUShaderModule = device.createShaderModule({
    label: "Red Triangle Shader",
    code: `
      @vertex
      fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4f {
        var pos = array<vec2f, 3>(
          vec2f(0.0, 0.5),
          vec2f(-0.5, -0.5),
          vec2f(0.5, -0.5)
        );
        return vec4f(pos[VertexIndex], 0.0, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0);
      }
    `,
  });

  const pipeline: GPURenderPipeline = device.createRenderPipeline({
    label: "Red Triangle Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [
        {
          format: canvasFormat,
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  function render(): void {
    const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();
    const textureView: GPUTextureView = context!
      .getCurrentTexture()
      .createView();

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

    const passEncoder: GPURenderPassEncoder =
      commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.draw(3);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch((err: Error) => {
  console.error(err);
});
```
