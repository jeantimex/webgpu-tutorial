# 07. Uniform Buffer

In the last tutorial, we organized our shader code using structs. Up until now, we've only passed data that changes _per vertex_ (via Vertex Buffers). But what if we want to pass data that remains **constant** for the entire object, like a global color, a transformation matrix, or light settings?

In this tutorial, we will learn how to use **Uniform Buffers** and **Bind Groups** to pass global data to our shaders.

**Key Learning Points:**

- Difference between Attributes (`@vertex`) and Uniforms (`@group`).
- Creating a buffer with `GPUBufferUsage.UNIFORM`.
- Understanding **Bind Groups** and **Bind Group Layouts**.
- Writing shaders with `@group(0) @binding(0)`.
- Using `layout: "auto"` for automatic pipeline configuration.

## 1. Attributes vs. Uniforms

- **Attributes (`@vertex`)**: Change per vertex (e.g., position, UV). Data comes from `VertexBuffer`.
- **Uniforms (`@group`)**: Constant for all vertices in a draw call. Data comes from `UniformBuffer`.

## 2. Creating the Uniform Buffer

Creating a uniform buffer is similar to a vertex buffer, but we use the `UNIFORM` usage flag.

```typescript
// Teal color: R=0, G=0.5, B=0.5, A=1.0
const color = new Float32Array([0.0, 0.5, 0.5, 1.0]);

const uniformBuffer = device.createBuffer({
  size: color.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(uniformBuffer, 0, color);
```

**Note on Alignment**: WebGPU memory layout rules (std140) often require specific byte alignment. `vec3` can be tricky because it requires 16-byte padding in many cases. Using `vec4` (16 bytes) is usually safer and easier to manage.

## 3. Shader with Bind Groups

In WGSL, we declare uniforms using the `var<uniform>` keyword, and we must assign them to a **Group** and a **Binding**.

```typescript
struct Uniforms {
  color : vec4f,
};

@group(0) @binding(0) var<uniform> global : Uniforms;
```

- **`@group(0)`**: Corresponds to the index in `setBindGroup(0, ...)`.
- **`@binding(0)`**: Corresponds to the specific resource slot within that group.

## 4. Pipeline Configuration

The pipeline needs to know two things: how to read our **Vertex Buffers** and how to access our **Uniforms**.

In the `vertex` property, we describe the geometry layout (as we did in previous tutorials). For the uniforms, we use `layout: "auto"` to let WebGPU infer the binding points from our shader.

```typescript
const pipeline = device.createRenderPipeline({
  label: "Uniform Pipeline",
  layout: "auto", // Automatically generate the Bind Group layout from shader
  vertex: {
    module: shaderModule,
    entryPoint: "vs_main",
    buffers: [
      {
        arrayStride: 2 * 4, // 2 floats * 4 bytes
        attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
      },
    ],
  },
  // ... fragment and primitive stages
});
```

When we set `layout` to `"auto"`, WebGPU analyzes our shader's `@group` and `@binding` declarations and creates the appropriate `GPUPipelineLayout` for us. Crucially, this allows us to "ask" the pipeline for its generated layout later when we create the bind group.

## 5. The Bind Group

This is a new concept. A **Bind Group** is a collection of resources (buffers, textures, samplers) that are bound together to the pipeline. It acts as the bridge between your JavaScript resources and the Shader's `@group` definitions.

```typescript
const bindGroup = device.createBindGroup({
  label: "Uniform Bind Group",
  layout: pipeline.getBindGroupLayout(0), // Get the layout inferred from shader
  entries: [
    {
      binding: 0, // Matches @binding(0) in shader
      resource: { buffer: uniformBuffer },
    },
  ],
});
```

### Deep Dive: When to use Groups vs. Bindings?

You might wonder: "Why do we have both `@group(x)` and `@binding(y)`? Why not just a single flat list of bindings?"

The reason is **performance** and **frequency of updates**.

- **@binding**: Think of these as individual slots within a container.
- **@group**: Think of this as the container itself. You swap the _entire_ container at once.

**Real-world Example:** Imagine a game rendering a 3D scene.

1.  **Group 0 (Global)**: Camera View & Projection Matrix.
    - _Updates:_ Once per frame.
    - _Shared by:_ EVERYTHING drawn in that frame.
2.  **Group 1 (Material)**: Textures and Material properties (shiny/dull).
    - _Updates:_ Changes only when you switch from drawing "wood" objects to "metal" objects.
    - _Shared by:_ All wooden chairs, tables, and crates.
3.  **Group 2 (Object)**: World Transform Matrix (where is _this_ specific chair?).
    - _Updates:_ Changes for every single object drawn.

By organizing resources this way, you minimize the number of expensive CPU-to-GPU commands. You set Group 0 once, set Group 1 a few times, and set Group 2 frequently.

## 6. Rendering

In the render loop, alongside setting the vertex buffer, we now also set the bind group.

```typescript
// Attributes (Slot 0)
passEncoder.setVertexBuffer(0, vertexBuffer);

// Uniforms (Group 0)
passEncoder.setBindGroup(0, bindGroup);

passEncoder.draw(3);
```

Now, every pixel of the triangle will use the same color value fetched from our uniform buffer!

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Vertex Data (Positions Only)
  const vertices = new Float32Array([
    0.0,
    0.5, // Top
    -0.5,
    -0.5, // Bottom Left
    0.5,
    -0.5, // Bottom Right
  ]);

  const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 2. Define Uniform Data (Color)
  // We want a solid Teal color: R=0, G=0.5, B=0.5
  // Note: Uniforms usually need to be 16-byte aligned.
  // vec3f is 12 bytes, but in a uniform block it often takes up 16 bytes (padding).
  // For safety, let's just use vec4f (R, G, B, A) which is naturally 16 bytes.
  const color = new Float32Array([0.0, 0.5, 0.5, 1.0]);

  const uniformBuffer = device.createBuffer({
    label: "Uniform Color Buffer",
    size: color.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(uniformBuffer, 0, color);

  // 3. Define Shaders
  const shaderModule = device.createShaderModule({
    label: "Uniform Shader",
    code: `
      // Define the structure of our uniform
      struct Uniforms {
        color : vec4f,
      };

      // Declare the uniform variable
      // Group 0, Binding 0
      @group(0) @binding(0) var<uniform> global : Uniforms;

      @vertex
      fn vs_main(@location(0) pos : vec2f) -> @builtin(position) vec4f {
        return vec4f(pos, 0.0, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        // Return the color from the uniform buffer
        return global.color;
      }
    `,
  });

  // 4. Create Render Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Uniform Pipeline",
    layout: "auto", // Let WebGPU infer the bind group layout
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 2 * 4,
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
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
  // This connects the specific buffer (uniformBuffer) to the binding point (0)
  // in the pipeline's layout.
  const bindGroup = device.createBindGroup({
    label: "Uniform Bind Group",
    layout: pipeline.getBindGroupLayout(0), // Get the layout inferred from shader
    entries: [
      {
        binding: 0, // Matches @binding(0) in shader
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

    // Bind the Vertex Buffer (Slot 0)
    passEncoder.setVertexBuffer(0, vertexBuffer);

    // Bind the Bind Group (Group 0)
    // This makes the uniform data available to the shaders
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
