# Hello Cube (3D & MVP)

Welcome to the 3D world! In this tutorial, we will transition from drawing 2D shapes to rendering a 3D **Cube**. To do this, we need to learn about the **MVP Matrix** and **Depth Testing**.

To keep things as simple as possible, we will define every vertex of the cube explicitly (36 vertices total) and render it in solid red. This allows us to focus entirely on the transformation math.

**Key Learning Points:**
- Using the `wgpu-matrix` library for 3D math.
- Understanding the **Model-View-Projection (MVP)** pipeline.
- Setting up a **Depth Texture** to handle overlapping geometry.
- Transitioning from 2D coordinates to 3D `vec3f` positions.

## 1. The MVP Matrix

To convert 3D coordinates into 2D screen pixels, we multiply every vertex position by three distinct matrices:

1.  **Model Matrix**: Moves, rotates, and scales the object in the world.
2.  **View Matrix**: Defines the "Camera." It describes where you are looking from and which way is "up."
3.  **Projection Matrix**: Simulates perspective. It makes objects that are further away (larger Z distance) appear smaller.

```typescript
import { mat4 } from "wgpu-matrix";

const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);
const viewMatrix = mat4.lookAt([2, 2, 2], [0, 0, 0], [0, 1, 0]);
const modelMatrix = mat4.identity();

const mvpMatrix = mat4.multiply(projectionMatrix, mat4.multiply(viewMatrix, modelMatrix));
```

## 2. Depth Testing (The Z-Buffer)

In 3D, multiple objects might overlap. WebGPU draws triangles in the order you tell it to. Without **Depth Testing**, a triangle that is far away could be drawn *over* a triangle that is close, simply because it was processed later.

To fix this, we create a **Depth Texture**. For every pixel, the GPU stores the "depth" (distance from camera).
- If a new pixel is closer than the existing one, the GPU draws it.
- If it's further away, the GPU discards it.

```typescript
depthStencil: {
  depthWriteEnabled: true,
  depthCompare: "less",
  format: "depth24plus",
}
```

## 3. Explicit Geometry

For this tutorial, we define each of the 6 faces of the cube using 2 triangles (6 vertices per face). This totals **36 vertices**. While this is not the most efficient method (using an Index Buffer is better), it is the easiest way to visualize how 3D triangles are constructed.

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";
import { mat4 } from "wgpu-matrix";

// ==========================================
// 1. Shaders
// ==========================================
const shaderCode = `
struct Uniforms {
  mvpMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
}

@vertex
fn vs_main(@location(0) pos : vec3f) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  return out;
}

@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0); // Red
}
`;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Cube Vertices (36 positions for 12 triangles)
  // prettier-ignore
  const vertexData = new Float32Array([
    // Front Face (z = 0.5)
    -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5, -0.5,  0.5,

    // Back Face (z = -0.5)
    -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
     0.5,  0.5, -0.5,   0.5, -0.5, -0.5,  -0.5, -0.5, -0.5,

    // Top Face (y = 0.5)
    -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,   0.5,  0.5, -0.5,  -0.5,  0.5, -0.5,

    // Bottom Face (y = -0.5)
    -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
     0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,  -0.5, -0.5, -0.5,

    // Right Face (x = 0.5)
     0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,   0.5, -0.5,  0.5,   0.5, -0.5, -0.5,

    // Left Face (x = -0.5)
    -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,  -0.5, -0.5, -0.5,
  ]);

  const vertexBuffer = device.createBuffer({
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertexData);

  // 2. MVP Uniforms
  const uniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const aspect = canvas.width / canvas.height;
  const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);
  const viewMatrix = mat4.lookAt([2, 2, 2], [0, 0, 0], [0, 1, 0]);
  const modelMatrix = mat4.identity();
  const mvpMatrix = mat4.multiply(projectionMatrix, mat4.multiply(viewMatrix, modelMatrix));
  device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as Float32Array);

  // 3. Depth Texture
  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // 4. Pipeline
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 12,
        attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
      }],
    },
    fragment: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive: { topology: "triangle-list" },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  function render() {
    const commandEncoder = device.createCommandEncoder();
    const textureView = context!.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
        loadOp: "clear",
        storeOp: "store",
      }],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });

    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.draw(36);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch(console.error);
```