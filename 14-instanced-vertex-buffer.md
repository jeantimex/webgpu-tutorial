# 14. Instanced Vertex Buffer

In the previous tutorial, we used a **Uniform Buffer Array** to store instance data. In this tutorial, we will use **Instanced Vertex Buffers**, which is a more standard and scalable way to pass per-instance data.

By setting `stepMode: "instance"` on a vertex buffer, we tell the GPU to advance the data pointer only once per instance, rather than per vertex.

## 1. Concepts

- **Instance**: One copy of the object.
- **`stepMode: "instance"`**: Tells the pipeline that this buffer's data should be read once per instance.
- **Attributes**: Per-instance data (like offset and color) is received as standard attributes in the vertex shader.

## 2. Preparing the Data

In JavaScript, we prepare a single `Float32Array` that contains the data for all 10 instances. We interleave the **Offset** and **Color** for each instance.

- **Offset**: 2 floats (x, y).
- **Color**: 4 floats (r, g, b, a).
- **Total per instance**: 6 floats (24 bytes).

```typescript
const numInstances = 10;
const floatsPerInstance = 6;
const instanceData = new Float32Array(numInstances * floatsPerInstance);

for (let i = 0; i < numInstances; i++) {
  const base = i * floatsPerInstance;

  // Set Offset (Indices 0, 1)
  instanceData[base + 0] = x;
  instanceData[base + 1] = y;

  // Set Color (Indices 2, 3, 4, 5)
  instanceData[base + 2] = r;
  instanceData[base + 3] = g;
  instanceData[base + 4] = b;
  instanceData[base + 5] = a;
}
```

The resulting memory layout is: `[ Off0, Col0, Off1, Col1, ... ]`

## 3. Pipeline Configuration

We define two buffers in our `vertex` state: one for the shared geometry and one for the unique instance data.

```typescript
buffers: [
  // Buffer 0: Geometry (Shared)
  {
    arrayStride: 3 * 4,
    stepMode: "vertex", // Read for every vertex
    attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
  },
  // Buffer 1: Instance Data (Unique per copy)
  {
    arrayStride: 6 * 4, // 6 floats * 4 bytes = 24 bytes
    stepMode: "instance", // Read ONCE per instance
    attributes: [
      { shaderLocation: 1, offset: 0, format: "float32x2" }, // Offset
      { shaderLocation: 2, offset: 8, format: "float32x4" }, // Color
    ],
  },
],
```

## 4. The Shader

The shader receives both the vertex position and the instance data as attributes.

```wgsl
@vertex
fn vs_main(
  @location(0) pos : vec3f,    // Vertex Position
  @location(1) offset : vec2f, // Instance Offset
  @location(2) color : vec4f   // Instance Color
) -> VertexOutput {
  var output : VertexOutput;
  // Apply the instance offset directly to the vertex position
  output.position = vec4f(pos.xy + offset, pos.z, 1.0);
  output.color = color;
  return output;
}
```

## 5. Drawing

In the render loop, we bind both buffers and specify the number of instances.

```typescript
passEncoder.setVertexBuffer(0, geometryBuffer);
passEncoder.setVertexBuffer(1, instanceBuffer);

// Draw 3 vertices, 10 times!
passEncoder.draw(3, 10);
```

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Geometry (Triangle)
  // prettier-ignore
  const vertices = new Float32Array([
     0.0,  0.1, 0.5, // Top
    -0.1, -0.1, 0.5, // Bottom Left
     0.1, -0.1, 0.5  // Bottom Right
  ]);

  const geometryBuffer = device.createBuffer({
    label: "Geometry Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(geometryBuffer, 0, vertices);

  // 2. Define Instance Data (Offset + Color)
  const numInstances = 10;
  // Offset (2 floats) + Color (4 floats) = 6 floats = 24 bytes
  const floatsPerInstance = 6;
  const instanceData = new Float32Array(numInstances * floatsPerInstance);

  for (let i = 0; i < numInstances; i++) {
    const base = i * floatsPerInstance;

    // Offset (XY) - random position in clip space
    instanceData[base + 0] = Math.random() * 1.6 - 0.8;
    instanceData[base + 1] = Math.random() * 1.6 - 0.8;

    // Color (RGBA)
    instanceData[base + 2] = Math.random();
    instanceData[base + 3] = Math.random();
    instanceData[base + 4] = Math.random();
    instanceData[base + 5] = 1.0;
  }

  const instanceBuffer = device.createBuffer({
    label: "Instance Buffer",
    size: instanceData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(instanceBuffer, 0, instanceData);

  // 3. Define Shaders
  const shaderModule = device.createShaderModule({
    label: "Simplified Instancing Shader",
    code: `
      struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) color : vec4f,
      };

      @vertex
      fn vs_main(
        @location(0) pos : vec3f,         // From Geometry Buffer
        @location(1) offset : vec2f,      // From Instance Buffer
        @location(2) color : vec4f        // From Instance Buffer
      ) -> VertexOutput {
        var output : VertexOutput;
        output.position = vec4f(pos.xy + offset, pos.z, 1.0);
        output.color = color;
        return output;
      }

      @fragment
      fn fs_main(@location(0) color : vec4f) -> @location(0) vec4f {
        return color;
      }
    `,
  });

  // 4. Create Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Simplified Instancing Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        // Buffer 0: Geometry (step per vertex)
        {
          arrayStride: 3 * 4,
          stepMode: "vertex",
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
        },
        // Buffer 1: Instance Data (step per instance)
        {
          arrayStride: 6 * 4, // 2 (offset) + 4 (color)
          stepMode: "instance",
          attributes: [
            { shaderLocation: 1, offset: 0, format: "float32x2" }, // Offset
            { shaderLocation: 2, offset: 8, format: "float32x4" }, // Color
          ],
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

    // Bind both buffers
    passEncoder.setVertexBuffer(0, geometryBuffer);
    passEncoder.setVertexBuffer(1, instanceBuffer);

    // Draw 3 vertices, 10 instances
    passEncoder.draw(3, numInstances);

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch((err) => {
  console.error(err);
});
```
