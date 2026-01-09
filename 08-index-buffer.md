# 08. Index Buffer

Complex 3D models often share vertices. For example, in a cube, each corner connects 3 faces. If we used standard `draw()`, we would need to duplicate that corner vertex 3 times (once for each face).

**Index Buffers** allow us to list each unique vertex **once** and then define the shape by referencing those vertices by their index.

## 1. Defining Unique Vertices

We want to draw a square. A square is made of 2 triangles. If we drew 2 separate triangles, we would need **6 vertices** (3+3). Two of them would be duplicates (the diagonal).

With an Index Buffer, we only define the **4 unique corners**:

```typescript
// x,    y,      r,   g,   b
// prettier-ignore
const vertices = new Float32Array([
  -0.5,  0.5,    1.0, 0.0, 0.0, // 0: Top-Left
  -0.5, -0.5,    0.0, 1.0, 0.0, // 1: Bottom-Left
   0.5, -0.5,    0.0, 0.0, 1.0, // 2: Bottom-Right
   0.5,  0.5,    1.0, 1.0, 0.0  // 3: Top-Right
]);
```

## 2. Defining Indices

We define the drawing order using integers. Since we have fewer than 65,536 vertices, we can use `Uint16Array` (2 bytes per index) to save memory.

```typescript
// Triangle 1: Top-Left -> Bottom-Left -> Bottom-Right
// Triangle 2: Top-Left -> Bottom-Right -> Top-Right
const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
```

## 3. Creating the Index Buffer

This is similar to a vertex buffer, but we add `GPUBufferUsage.INDEX`.

```typescript
const indexBuffer = device.createBuffer({
  size: indices.byteLength,
  usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(indexBuffer, 0, indices);
```

## 4. Rendering

In the render loop, we use `setIndexBuffer` and `drawIndexed`.

```typescript
passEncoder.setVertexBuffer(0, vertexBuffer);

// 1. Bind the Index Buffer and specify the format
passEncoder.setIndexBuffer(indexBuffer, "uint16");

// 2. Draw Indexed
// drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance)
passEncoder.drawIndexed(6);
```

We tell the GPU to process **6 indices**. It will look up the vertex data for each index and assemble the triangles.

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Vertices (4 corners of a square)
  // Each vertex has Position (x, y) and Color (r, g, b)
  // Note: We only have 4 vertices here, not 6!
  // prettier-ignore
  const vertices = new Float32Array([
    // x,    y,      r,   g,   b
    -0.5,  0.5,    1.0, 0.0, 0.0, // Vertex 0: Top-Left (Red)
    -0.5, -0.5,    0.0, 1.0, 0.0, // Vertex 1: Bottom-Left (Green)
     0.5, -0.5,    0.0, 0.0, 1.0, // Vertex 2: Bottom-Right (Blue)
     0.5,  0.5,    1.0, 1.0, 0.0  // Vertex 3: Top-Right (Yellow)
  ]);

  // 2. Define Indices (The order to draw vertices)
  // We draw 2 triangles to make a square.
  // Triangle 1: 0 -> 1 -> 2
  // Triangle 2: 0 -> 2 -> 3
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

  // 3. Create Vertex Buffer
  const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 4. Create Index Buffer
  const indexBuffer = device.createBuffer({
    label: "Index Buffer",
    size: indices.byteLength,
    // Note usage includes INDEX
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, 0, indices);

  // 5. Define Shaders (Same as before)
  const shaderModule = device.createShaderModule({
    label: "Index Buffer Shader",
    code: `
      struct VertexInput {
        @location(0) position : vec2f,
        @location(1) color : vec3f,
      };

      struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) color : vec3f,
      };

      @vertex
      fn vs_main(input : VertexInput) -> VertexOutput {
        var output : VertexOutput;
        output.position = vec4f(input.position, 0.0, 1.0);
        output.color = input.color;
        return output;
      }

      @fragment
      fn fs_main(input : VertexOutput) -> @location(0) vec4f {
        return vec4f(input.color, 1.0);
      }
    `,
  });

  // 6. Define Layout
  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 5 * 4, // 5 floats (2 pos + 3 color)
    attributes: [
      { shaderLocation: 0, offset: 0, format: "float32x2" }, // position
      { shaderLocation: 1, offset: 2 * 4, format: "float32x3" }, // color
    ],
  };

  const pipeline = device.createRenderPipeline({
    label: "Index Buffer Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive: {
      topology: "triangle-list",
      // Important: culling mode can affect visibility if winding order is wrong!
      cullMode: "back",
    },
  });

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

    // Set the Index Buffer
    // We must specify the format of the indices (uint16 or uint32)
    passEncoder.setIndexBuffer(indexBuffer, "uint16");

    // Draw Indexed!
    // 6 indices to draw (2 triangles * 3 vertices)
    passEncoder.drawIndexed(6);

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch((err) => {
  console.error(err);
});
```
