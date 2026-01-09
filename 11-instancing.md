# 11. Instancing

Drawing the same object many times (e.g., a forest of trees, a crowd of characters) can be slow if you issue a separate `draw()` call for each one.

**Instancing** allows you to draw the same geometry multiple times in a single `draw()` call.

## 1. Concepts

- **Instance**: One copy of the object.
- **`@builtin(instance_index)`**: A variable in the vertex shader that tells you which copy you are currently processing (0, 1, 2...).

### The Draw Call

Standard drawing uses `draw(vertexCount)`. This runs the vertex shader once for each vertex.

Instanced drawing uses **`draw(vertexCount, instanceCount)`**.

- This command tells the GPU to draw the entire set of vertices (`vertexCount`) multiple times (`instanceCount`).
- **Vertex Shader Execution**: The shader runs `vertexCount * instanceCount` times total.
- **Indexing**:
  - `vertex_index` loops from `0` to `vertexCount - 1`.
  - `instance_index` stays constant for one whole shape, then increments for the next copy.

For example, `draw(3, 10)` means:

1.  Draw vertices 0, 1, 2 with `instance_index = 0`.
2.  Draw vertices 0, 1, 2 with `instance_index = 1`.
3.  ...
4.  Draw vertices 0, 1, 2 with `instance_index = 9`.

## 2. Array of Structs (Uniform Buffer)

We can pack all per-instance data (Matrix + Color) into a single struct, and store an array of these structs in a **Uniform Buffer**.

```wgsl
struct Instance {
  matrix : mat4x4f, // 64 bytes
  color : vec4f,    // 16 bytes
}; // Total stride: 80 bytes

struct Uniforms {
  instances : array<Instance, 10>,
};
```

### Data Preparation in JavaScript

This is an important step. Because the GPU expects a single contiguous block of memory, we must interleave our matrices and colors in a single `Float32Array`.

For each instance, we need **20 floats**:

- **16 floats** for the 4x4 matrix.
- **4 floats** for the RGBA color.

```typescript
const numInstances = 10;
const structSizeFloat = 20; // 16 (matrix) + 4 (color)
const instanceData = new Float32Array(numInstances * structSizeFloat);

for (let i = 0; i < numInstances; i++) {
  const base = i * structSizeFloat;

  // 1. Calculate and set Matrix (starts at float index 0 within the struct)
  const mvp = calculateMVPMatrix(); // returns Float32Array(16)
  instanceData.set(mvp, base + 0);

  // 2. Set Color (starts at float index 16 within the struct)
  instanceData[base + 16] = r;
  instanceData[base + 17] = g;
  instanceData[base + 18] = b;
  instanceData[base + 19] = a;
}
```

The resulting memory layout looks like this: `[ Mat0 (16), Color0 (4), Mat1 (16), Color1 (4), ... ]`

This layout perfectly matches our WGSL `Instance` struct definition!

## 3. Pipeline Configuration

Because we are passing instance data via a **Uniform Buffer** instead of a Vertex Buffer, our pipeline configuration remains simple.

We **do not** need to set `stepMode: "instance"` or define multiple vertex buffer layouts. We just have a single standard vertex buffer for the triangle geometry.

```typescript
vertex: {
  buffers: [
    {
      arrayStride: 3 * 4,
      attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
    },
  ],
},
```

This keeps our pipeline definition clean and lets us handle complex instance data entirely in the shader.

## 4. The Shader

In the shader, we access the global array using `instance_index`.

```wgsl
@vertex
fn vs_main(@builtin(instance_index) instanceIdx : u32, @location(0) pos : vec3f) -> VertexOutput {
  // 1. Pick the instance data struct
  let inst = global.instances[instanceIdx];

  // 2. Use matrix and color
  var output : VertexOutput;
  output.position = inst.matrix * vec4f(pos, 1.0);
  output.color = inst.color;

  return output;
}
```

## 5. Drawing

In the render loop, we simply tell the GPU how many instances to draw.

```typescript
// Draw 3 vertices, 10 times!
passEncoder.draw(3, 10);
```

## Summary & Next Steps

In this tutorial, we learned how to use **Instancing** to draw multiple copies of a shape with a single draw call. We used a **Uniform Buffer Array** to store unique transformation matrices and colors for each instance.

This approach is great for small to medium numbers of instances. however, WebGPU also provides another way to handle instanced data called **Instanced Vertex Buffers**. By setting the `stepMode` of a vertex buffer to `"instance"`, you can tell the GPU to automatically advance to the next data entry for each new instance drawn.

In the next tutorial, we will explore `stepMode: "instance"` and see how it compares to our current approach!

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";
import { mat4 } from "wgpu-matrix";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Vertices (Triangle Geometry)
  // Standard Vertex Buffer (Mesh)
  // prettier-ignore
  const vertices = new Float32Array([
     0.0,  0.1, 0.5, // Top
    -0.1, -0.1, 0.5, // Bottom Left
     0.1, -0.1, 0.5  // Bottom Right
  ]);

  const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 2. Define Uniform Data (Array of Structs)
  // Struct: { matrix: mat4x4f (64 bytes), color: vec4f (16 bytes) }
  // Total size per instance: 80 bytes.
  const numInstances = 10;
  const structSizeFloat = 16 + 4; // 20 floats
  const structSizeBytes = structSizeFloat * 4; // 80 bytes
  const uniformBufferSize = numInstances * structSizeBytes;

  const uniformBuffer = device.createBuffer({
    label: "Instance Data Buffer",
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // 3. Compute Data for each instance
  const aspect = canvas.width / canvas.height;
  const instanceData = new Float32Array(numInstances * structSizeFloat);

  for (let i = 0; i < numInstances; i++) {
    // A. Matrix (Offset 0)
    // Start with Identity (using translation 0,0,0) to avoid mat4.create() issues
    const mvp = mat4.translation([0, 0, 0]);
    mat4.scale(mvp, [1 / aspect, 1, 1], mvp);
    const x = Math.random() * 1.6 - 0.8;
    const y = Math.random() * 1.6 - 0.8;
    mat4.translate(mvp, [x, y, 0], mvp);

    const base = i * structSizeFloat;
    instanceData.set(mvp, base + 0);

    // B. Color (Offset 16)
    instanceData[base + 16] = Math.random(); // R
    instanceData[base + 17] = Math.random(); // G
    instanceData[base + 18] = Math.random(); // B
    instanceData[base + 19] = 1.0; // A
  }

  // Upload
  device.queue.writeBuffer(uniformBuffer, 0, instanceData);

  // 4. Define Shaders
  const shaderModule = device.createShaderModule({
    label: "Instancing Shader",
    code: `
      struct Instance {
        matrix : mat4x4f,
        color : vec4f,
      };

      struct Uniforms {
        instances : array<Instance, ${numInstances}>,
      };

      @group(0) @binding(0) var<uniform> global : Uniforms;

      struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) color : vec4f,
      };

      @vertex
      fn vs_main(
        @builtin(instance_index) instanceIdx : u32,
        @location(0) pos : vec3f
      ) -> VertexOutput {
        // Pick the instance data
        let inst = global.instances[instanceIdx];

        var output : VertexOutput;
        output.position = inst.matrix * vec4f(pos, 1.0);
        output.color = inst.color;

        return output;
      }

      @fragment
      fn fs_main(@location(0) color : vec4f) -> @location(0) vec4f {
        return color;
      }
    `,
  });

  // 5. Create Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Instancing Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        // Buffer 0: Geometry only
        {
          arrayStride: 3 * 4,
          stepMode: "vertex",
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

  // 6. Create Bind Group
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
    ],
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

    // Bind Vertex Buffer (Geometry)
    passEncoder.setVertexBuffer(0, vertexBuffer);

    // Bind Uniforms (Matrix + Color Array)
    passEncoder.setBindGroup(0, bindGroup);

    // Draw 3 vertices, 10 instances!
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
