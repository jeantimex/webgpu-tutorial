# 16. Switching Vertex Buffers

In the last tutorial, we learned how to switch pipelines to change _how_ objects are drawn. But often, we want to keep the same visual style (same pipeline) but draw different _shapes_ (e.g., a triangle and a square).

In this tutorial, we will learn how to **Switch Vertex Buffers**. This allows us to reuse a single pipeline for completely different geometries.

**Key Learning Points:**

- Creating separate `GPUBuffer` objects for different meshes.
- Ensuring different buffers match the same Pipeline Layout.
- Binding different buffers using `setVertexBuffer` before drawing.
- Comparison: Switching Buffers vs. Instancing.

## 1. Multiple Buffers

We create two separate Vertex Buffers: one for a Triangle and one for a Square.

```typescript
const triangleBuffer = device.createBuffer({ ... });
// ... write triangle data ...

const squareBuffer = device.createBuffer({ ... });
// ... write square data ...
```

## 2. Shared Pipeline

We create a single pipeline. The key is that **both buffers must match the pipeline's layout**.

- Our pipeline expects `float32x3` positions.
- Both our triangle data and square data provide exactly that.

## 3. The Render Loop

In the render loop, we simply bind the buffer we want to use before issuing the draw call.

```typescript
// 1. Draw Triangle
passEncoder.setVertexBuffer(0, triangleBuffer);
passEncoder.draw(3);

// 2. Draw Square
passEncoder.setVertexBuffer(0, squareBuffer);
passEncoder.draw(6);
```

This is much more efficient than recreating pipelines or even switching pipelines, as binding a buffer is a very lightweight operation for the GPU.

## 4. Trade-offs: Switching Buffers vs. Instancing

While switching vertex buffers is simple and flexible, it has one major drawback compared to **Instancing** (Tutorial 12/13):

- **Switching Buffers**: Requires a **separate draw call** for every object (`draw(3)`, `draw(6)`). If you have 10,000 different objects, that's 10,000 commands the CPU has to send to the GPU. This can become a "CPU bottleneck."
- **Instancing**: Draws many copies in **one single draw call** (`draw(3, 10000)`). This is significantly faster for the CPU.

**When to switch buffers?** Use this technique when your objects have **different geometry** (e.g., a car and a tree) but share the same material properties. If you are drawing 100 identical trees, use Instancing!

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Geometry 1: Triangle (Left)
  // prettier-ignore
  const triangleData = new Float32Array([
    -0.5,  0.5, 0.0, // Top
    -0.9, -0.5, 0.0, // Bottom Left
    -0.1, -0.5, 0.0, // Bottom Right
  ]);

  const triangleBuffer = device.createBuffer({
    label: "Triangle Buffer",
    size: triangleData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(triangleBuffer, 0, triangleData);

  // 2. Define Geometry 2: Square (Right)
  // Made of 2 triangles
  // prettier-ignore
  const squareData = new Float32Array([
     // Triangle 1
     0.1,  0.5, 0.0, // Top Left
     0.1, -0.5, 0.0, // Bottom Left
     0.9, -0.5, 0.0, // Bottom Right
     // Triangle 2
     0.1,  0.5, 0.0, // Top Left
     0.9, -0.5, 0.0, // Bottom Right
     0.9,  0.5, 0.0, // Top Right
  ]);

  const squareBuffer = device.createBuffer({
    label: "Square Buffer",
    size: squareData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(squareBuffer, 0, squareData);

  // 3. Define Shader
  // Simple pass-through shader
  const shaderModule = device.createShaderModule({
    label: "Basic Shader",
    code: `
      @vertex
      fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
        return vec4f(pos, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(0.0, 1.0, 0.5, 1.0); // Teal color
      }
    `,
  });

  // 4. Create Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Basic Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 3 * 4, // 3 floats (pos)
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

  // 5. Render
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

    // --- Draw Object 1: Triangle ---
    passEncoder.setVertexBuffer(0, triangleBuffer);
    passEncoder.draw(3);

    // --- Draw Object 2: Square ---
    passEncoder.setVertexBuffer(0, squareBuffer);
    passEncoder.draw(6);

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch((err) => {
  console.error(err);
});
```
