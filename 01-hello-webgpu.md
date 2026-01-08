# Hello WebGPU

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

First, we need to initialize WebGPU. We've extracted the boilerplate initialization code into a utility function `initWebGPU`. This function handles:

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

- **Vertex Shader (`vs_main`)**: Computes the position of each vertex. In this simple example, we define the vertex positions directly in the shader using an array, using the `vertex_index` to pick one.
- **Fragment Shader (`fs_main`)**: Determines the color of each pixel drawn. We simply return red `(1.0, 0.0, 0.0, 1.0)`.

```typescript
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
```

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
  const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

  // 5. Set the state (pipeline) and issue draw commands
  passEncoder.setPipeline(pipeline);
  passEncoder.draw(3); // Draw 3 vertices

  // 6. End the render pass
  passEncoder.end();

  // 7. Finish recording and submit the work to the GPU
  device.queue.submit([commandEncoder.finish()]);
}
```
