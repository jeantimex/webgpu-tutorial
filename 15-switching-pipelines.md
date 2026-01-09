# 15. Switching Pipelines

In previous tutorials, we focused on drawing objects that all share the same shader logic (e.g., all solid colors). But in a real application, you often need to render different types of objects: some solid, some textured, some glowing, some wireframe.

In this tutorial, we will learn how to **Switch Pipelines** within a single render pass to change _how_ objects are drawn.

**Key Learning Points:**

- Creating multiple `GPURenderPipeline` objects.
- Using different Entry Points in the same shader module.
- Switching state efficiently with `setPipeline`.
- Understanding when to switch pipelines vs. updating uniforms.

## 1. Defining Multiple Pipelines

We can create multiple `GPURenderPipeline` objects from the same shader module, just pointing to different entry points!

```typescript
// Pipeline 1: Uses 'fs_solid' function
const solidPipeline = device.createRenderPipeline({
  // ... vertex setup ...
  fragment: {
    module: shaderModule,
    entryPoint: "fs_solid",
    targets: [{ format: canvasFormat }],
  },
});

// Pipeline 2: Uses 'fs_gradient' function
const gradientPipeline = device.createRenderPipeline({
  // ... vertex setup ...
  fragment: {
    module: shaderModule,
    entryPoint: "fs_gradient",
    targets: [{ format: canvasFormat }],
  },
});
```

## 2. Multiple Fragment Entry Points

In our WGSL code, we define two different fragment functions within the same shader module.

```wgsl
// Fragment Shader 1: Always returns Solid Orange
@fragment
fn fs_solid() -> @location(0) vec4f {
  return vec4f(1.0, 0.5, 0.0, 1.0);
}

// Fragment Shader 2: Returns a gradient based on Y position
@fragment
fn fs_gradient(in : VertexOutput) -> @location(0) vec4f {
  let t = in.localPos.y + 0.5;
  return vec4f(0.0, t, 1.0 - t, 1.0);
}
```

By creating two pipelines that point to these different functions, we can effectively give objects different "materials".

**Why is this powerful?** While our example just swaps colors, in a real engine you would use this to swap entirely different rendering logic:

- **PBR vs. Unlit**: One pipeline for realistic lighting, one for UI elements.
- **Shadow Mapping**: One pipeline to render the scene normally, another to render just the depth from the light's perspective (often using a different **Vertex Shader** entry point too!).
- **Wireframe**: Switching topology in the pipeline state.

## 3. The Render Loop

Switching pipelines is as simple as calling `setPipeline` again inside the same render pass.

```typescript
// 1. Draw Left Triangle (Solid)
passEncoder.setPipeline(solidPipeline);
passEncoder.draw(3, 1, 0, 0);

// 2. Draw Right Triangle (Gradient)
passEncoder.setPipeline(gradientPipeline);
passEncoder.draw(3, 1, 3, 0); // Start at vertex 3
```

This is extremely efficient. The GPU keeps the shared state (like the bound vertex buffer) active, and only updates the pipeline state.

## 4. Design Decisions: Pipelines vs. Uniforms vs. Instancing

We have now learned three ways to change how objects look. When should you use which?

| Technique | Example Use Case | Best For... |
| :-- | :-- | :-- |
| **Switching Pipelines** | Drawing a solid character, then a glowing ghost. | **Completely different math**. If you need different shaders (e.g., one calculates light, one is just solid color), you _must_ switch pipelines. |
| **Switching Uniforms** | Drawing a red car, then a blue car. | **Same math, different data**. If the shader code is identical (e.g., both use `fs_solid`), but only the color value changes, just update/switch the uniform buffer. |
| **Instancing** | Drawing 100 trees. | **Identical mesh & shader, many copies**. If you are drawing the exact same geometry many times with only small variations (position, color), use instancing. |

**In Summary:**

- Change the **Logic** -> Switch Pipeline.

* Change the **Parameters** -> Update Uniforms.
* Draw **Many Copies** -> Use Instancing.

### For WebGL Developers

In WebGL, you use `gl.useProgram(program)` to switch shaders. However, WebGL has a "global state machine" where blending, depth testing, and topology are set separately (`gl.enable(gl.BLEND)`, `gl.depthFunc(...)`).

In **WebGPU**, the `GPURenderPipeline` bundles **all** of this together:

- Shaders (Vertex + Fragment)
- Blend Mode
- Depth/Stencil State
- Primitive Topology (Triangle List, Line Strip, etc.)
- Vertex Layouts

This means `setPipeline` is heavier than `useProgram` conceptually, but usually faster for the driver because it doesn't have to validate a mix-and-match of random states on every draw call.

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Geometry (2 Triangles side-by-side)
  // prettier-ignore
  const vertices = new Float32Array([
    // Triangle 1 (Left)
    -0.5,  0.5, 0.0, // Top
    -0.9, -0.5, 0.0, // Bottom Left
    -0.1, -0.5, 0.0, // Bottom Right

    // Triangle 2 (Right)
     0.5,  0.5, 0.0, // Top
     0.1, -0.5, 0.0, // Bottom Left
     0.9, -0.5, 0.0, // Bottom Right
  ]);

  const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 2. Define Shader Module with Multiple Entry Points
  const shaderModule = device.createShaderModule({
    label: "Multi-Material Shader",
    code: `
      struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) localPos : vec3f,
      };

      @vertex
      fn vs_main(@location(0) pos : vec3f) -> VertexOutput {
        var output : VertexOutput;
        output.position = vec4f(pos, 1.0);
        output.localPos = pos; // Pass local position to fragment for gradient
        return output;
      }

      // --- Fragment Shader 1: Solid Color ---
      @fragment
      fn fs_solid() -> @location(0) vec4f {
        return vec4f(1.0, 0.5, 0.0, 1.0); // Solid Orange
      }

      // --- Fragment Shader 2: Gradient ---
      @fragment
      fn fs_gradient(in : VertexOutput) -> @location(0) vec4f {
        // Calculate color based on Y position
        // Map Y from [-0.5, 0.5] to [0.0, 1.0]
        let t = in.localPos.y + 0.5;
        return vec4f(0.0, t, 1.0 - t, 1.0); // Blue to Green gradient
      }
    `,
  });

  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 3 * 4,
    attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
  };

  // 3. Create Pipeline 1 (Solid)
  const solidPipeline = device.createRenderPipeline({
    label: "Solid Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_solid", // <--- Different Entry Point
      targets: [{ format: canvasFormat }],
    },
    primitive: { topology: "triangle-list" },
  });

  // 4. Create Pipeline 2 (Gradient)
  const gradientPipeline = device.createRenderPipeline({
    label: "Gradient Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_gradient", // <--- Different Entry Point
      targets: [{ format: canvasFormat }],
    },
    primitive: { topology: "triangle-list" },
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

    // Bind shared vertex buffer once
    passEncoder.setVertexBuffer(0, vertexBuffer);

    // --- Draw Object 1 (Left) using Solid Pipeline ---
    passEncoder.setPipeline(solidPipeline);
    // Draw vertices 0-3 (3 count, starting at 0)
    passEncoder.draw(3, 1, 0, 0);

    // --- Draw Object 2 (Right) using Gradient Pipeline ---
    passEncoder.setPipeline(gradientPipeline);
    // Draw vertices 3-6 (3 count, starting at 3)
    passEncoder.draw(3, 1, 3, 0);

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch((err) => {
  console.error(err);
});
```
