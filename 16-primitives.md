# 16. Primitives

WebGPU supports several **Primitive Topologies**, which define how vertices are assembled into shapes.

Since the topology is "baked" into the `GPURenderPipeline`, if you want to draw lines and triangles in the same scene, you need separate pipelines.

## 1. Topologies

We will demonstrate 5 common topologies:

1.  **`point-list`**: Draws a single pixel (or larger point) for each vertex.
2.  **`line-list`**: Draws disjoint lines. Vertices (0,1), (2,3), etc.
3.  **`line-strip`**: Draws a connected path. Vertices (0,1), (1,2), (2,3)...
4.  **`triangle-list`**: Draws disjoint triangles. Vertices (0,1,2), (3,4,5)...
5.  **`triangle-strip`**: Draws connected triangles. Vertices (0,1,2), (1,2,3), (2,3,4)...

## 2. Managing Multiple Pipelines

Since we need a different pipeline for each topology, we create 5 pipelines sharing the same shader code and vertex layout.

To efficiently share the **Bind Group** (uniforms) across these pipelines, we must create an **Explicit Bind Group Layout**.

```typescript
const bindGroupLayout = device.createBindGroupLayout({ ... });
const pipelineLayout = device.createPipelineLayout({
  bindGroupLayouts: [bindGroupLayout]
});

// Create 5 pipelines using this SAME pipelineLayout
const pipe1 = device.createRenderPipeline({ layout: pipelineLayout, ... });
const pipe2 = device.createRenderPipeline({ layout: pipelineLayout, ... });
```

If we used `layout: "auto"`, WebGPU might generate incompatible internal layouts for each pipeline, forcing us to create 5 separate bind groups!

## 3. Render Loop

We iterate through our list of shapes, setting the pipeline, binding the geometry, and updating the dynamic uniform offset for each one.

```typescript
pipelines.forEach((p, i) => {
  passEncoder.setPipeline(p.pipe);
  passEncoder.setVertexBuffer(0, p.buffer);
  passEncoder.setBindGroup(0, bindGroup, [i * 256]); // Dynamic Offset
  passEncoder.draw(p.count);
});
```

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // --- 1. Define Geometry Buffers ---
  const createBuffer = (arr: Float32Array) => {
    const buffer = device.createBuffer({
      size: arr.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(buffer, 0, arr);
    return { buffer, count: arr.length / 3 };
  };

  const pointData = new Float32Array([
    /* ... */
  ]);
  const points = createBuffer(pointData);
  // ... (Lines, Strips, Triangles defined similarly)

  // --- 2. Dynamic Uniforms (Offsets & Colors) ---
  const minAlignment = device.limits.minUniformBufferOffsetAlignment; // 256
  const uniformBuffer = device.createBuffer({
    size: 5 * minAlignment,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Fill buffer with 5 colors/offsets...

  // --- 3. Shared Shader ---
  const shaderModule = device.createShaderModule({
    code: `
      struct Uniforms { offset : vec2f, color : vec4f };
      @group(0) @binding(0) var<uniform> global : Uniforms;
      
      @vertex
      fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
        let scaled = pos * 0.15; 
        return vec4f(scaled.x + global.offset.x, scaled.y + global.offset.y, 0.0, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f { return global.color; }
    `,
  });

  // --- 4. Explicit Layout & Pipelines ---
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform", hasDynamicOffset: true },
      },
    ],
  });

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });

  const createPipeline = (topology: GPUPrimitiveTopology) => {
    return device.createRenderPipeline({
      layout: pipelineLayout, // Share layout!
      vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
        buffers: [
          {
            arrayStride: 12,
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs_main",
        targets: [{ format: canvasFormat }],
      },
      primitive: { topology },
    });
  };

  const pipelines = [
    { pipe: createPipeline("point-list"), buffer: points },
    { pipe: createPipeline("line-list"), buffer: lines },
    { pipe: createPipeline("line-strip"), buffer: strip },
    { pipe: createPipeline("triangle-list"), buffer: tris },
    { pipe: createPipeline("triangle-strip"), buffer: tristrip },
  ];

  // --- 5. Render Loop ---
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer, offset: 0, size: 32 },
      },
    ],
  });

  function render() {
    const commandEncoder = device.createCommandEncoder();
    const textureView = context!.getCurrentTexture().createView();

    const pass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    pipelines.forEach((p, i) => {
      pass.setPipeline(p.pipe);
      pass.setVertexBuffer(0, p.buffer.buffer);
      pass.setBindGroup(0, bindGroup, [i * minAlignment]);
      pass.draw(p.buffer.count);
    });

    pass.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch(console.error);
```
