# Simple Compute Shader

In the previous tutorials, we focused entirely on the **Render Pipeline**—drawing shapes to the screen using Vertex and Fragment shaders.

In this tutorial, we will explore the **Compute Pipeline**. This allows us to use the GPU for general-purpose calculations (GPGPU), typically involving large arrays of data (physics simulations, image processing, matrix math).

## Why WebGPU Compute? (vs WebGL)

In **WebGL**, doing general calculations on the GPU was possible but "hacky." You had to:

1.  Encode your data into the pixels of a Texture.
2.  Write a Fragment Shader that performs the math.
3.  Render a quad to "draw" the results into another Texture.
4.  Read the pixels back.

In **WebGPU**, Compute Shaders are **first-class citizens**.

- **No Textures Required**: You work directly with **Storage Buffers** (arrays of data).
- **Random Access Writes**: Unlike fragment shaders (which can only write to their specific pixel), compute threads can write to _any_ location in a storage buffer.
- **Shared Memory**: Threads within a "workgroup" can share data quickly.

**Key Learning Points:**

- Understanding the Compute Space: `@builtin(GlobalInvocationID)`, `@builtin(WorkgroupID)`, `@builtin(LocalInvocationID)`.
- Understanding `workgroup_size` and dispatching.
- Using `var<storage, read_write>` buffers.
- Reading data back to the CPU using a staging buffer and `mapAsync`.

## 1. The Task

We will create a simple array of numbers: `[0, 1, 2, ...]` We will ask the GPU to multiply every number by **2**. We will read the result back: `[0, 2, 4, ...]`

## 2. Understanding the Compute Space

Compute shaders don't iterate in a simple loop like a CPU. Instead, you launch a massive grid of independent threads.

### Workgroups and Invocations

The grid is divided into **Workgroups**.

- **Workgroup**: A block of threads that execute together and can share memory.
- **Invocation**: A single thread execution.

When you dispatch a compute job, you specify:

1.  **Workgroup Size (`@workgroup_size`)**: How many threads are in one workgroup (defined in Shader).
2.  **Dispatch Size (`dispatchWorkgroups`)**: How many workgroups to launch (defined in JavaScript).

**Example:** If `@workgroup_size(64)` and we call `dispatchWorkgroups(2)`:

- Total threads = 64 \* 2 = 128 threads.
- Threads 0-63 are in Workgroup 0.
- Threads 64-127 are in Workgroup 1.

### Built-in Variables

The GPU provides several built-in variables to tell each thread "who it is":

- **`@builtin(global_invocation_id)`**: The unique 3D coordinate of the thread in the entire grid. (Most common).
- **`@builtin(local_invocation_id)`**: The coordinate of the thread _inside_ its workgroup.
- **`@builtin(workgroup_id)`**: The coordinate of the workgroup itself.

For a 1D array processing task, we mostly care about `global_invocation_id.x`, which acts like the `i` in a `for` loop.

## 3. Storage Buffers

For compute shaders, we typically use `storage` buffers instead of `uniform` buffers because:

- **Size**: Uniform buffers are limited (usually 64KB). Storage buffers can be hundreds of megabytes.
- **Read/Write**: Uniform buffers are read-only for the GPU. Storage buffers can be declared as `read`, `read_write`, or `write`.

```typescript
const storageBuffer = device.createBuffer({
  size: data.byteLength,
  // STORAGE: Used in compute shader
  // COPY_SRC: We will copy from here to read back to CPU
  // COPY_DST: We will upload initial data here
  usage:
    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
});
```

## 4. The Shader

```wgsl
@group(0) @binding(0)
var<storage, read_write> data : array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
  // Guard against out-of-bounds if array size isn't a multiple of 64
  if (global_id.x >= arrayLength(&data)) {
    return;
  }

  // Multiply by 2
  data[global_id.x] = data[global_id.x] * 2.0;
}
```

## 6. The Dispatch (Running the Shader)

Unlike rendering, where we use `beginRenderPass` and `draw`, compute shaders use `beginComputePass` and `dispatchWorkgroups`.

### The Compute Pass

```typescript
const commandEncoder = device.createCommandEncoder();
const computePass = commandEncoder.beginComputePass();
computePass.setPipeline(pipeline);
computePass.setBindGroup(0, bindGroup);
```

### Dispatching Workgroups

This is where we tell the GPU how many threads to launch. The argument to `dispatchWorkgroups(x, y, z)` is the **Number of Workgroups**, NOT the number of threads.

**The Math:**

1.  **Total Items to Process**: `dataSize` (e.g., 64).
2.  **Workgroup Size**: Defined in WGSL as `@workgroup_size(64)`.
3.  **Workgroups Needed**: `Math.ceil(Total Items / Workgroup Size)`.

```typescript
// If we have 64 items and a workgroup size of 64:
// We need 1 Workgroup.
computePass.dispatchWorkgroups(1);
computePass.end();
```

If we had **100 items**:

- `Math.ceil(100 / 64) = 2` Workgroups.
- The GPU launches 2 groups of 64 threads = 128 total threads.
- Threads 0-99 processes valid data.
- Threads 100-127 are "out of bounds".
- This is why the `if (global_id.x >= arrayLength(&data)) { return; }` check in the shader is crucial!

## 7. Copying and Reading Back

GPU memory is highly optimized for the GPU, not the CPU. We generally cannot read a STORAGE buffer directly from JavaScript. We need a two-step process:

1.  **Copy**: On the GPU, copy data from the `STORAGE` buffer to a `MAP_READ` buffer (Staging Buffer).
2.  **Map**: On the CPU, request access to read the Staging Buffer.

### The Staging Buffer

A staging buffer is a plain buffer created with `GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST`.

### Step 1: Copy Command

We use `copyBufferToBuffer` to transfer data internally on the GPU. This is very fast.

```typescript
commandEncoder.copyBufferToBuffer(
  storageBuffer,
  0, // Source (GPU work memory)
  stagingBuffer,
  0, // Destination (CPU readable memory)
  byteSize // Amount to copy
);
```

### Step 2: Mapping Async

After submitting the work, we ask the GPU to let us read the buffer. This is asynchronous because the GPU might still be busy writing to it.

```typescript
await stagingBuffer.mapAsync(GPUMapMode.READ);
```

### Step 3: Reading

Once mapped, we get a view of the memory (`getMappedRange`). We **must** copy this data to a regular JavaScript array (like `Float32Array`) immediately, because it will vanish when we unmap.

```typescript
const arrayBuffer = stagingBuffer.getMappedRange();
const result = new Float32Array(arrayBuffer.slice(0)); // Make a copy
stagingBuffer.unmap(); // Release the memory back to the GPU
```

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";

async function init() {
  // We don't strictly need a canvas context for compute, just the device.
  if (!navigator.gpu) {
    throw new Error("WebGPU not supported");
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No adapter");
  }
  const device = await adapter.requestDevice();

  const outputDiv = document.getElementById("output") as HTMLDivElement;

  // 1. Setup Data
  const dataSize = 64;
  const inputData = new Float32Array(dataSize);
  for (let i = 0; i < dataSize; i++) {
    inputData[i] = i;
  }

  outputDiv.innerHTML = `<strong>Input:</strong><br/>${inputData.join(" ")}<br/><br/>Computing...`;

  // 2. Create GPU Buffers

  // A. Storage Buffer (GPU working memory)
  const storageBuffer = device.createBuffer({
    label: "Work Buffer",
    size: inputData.byteLength,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST,
  });
  // Upload initial data
  device.queue.writeBuffer(storageBuffer, 0, inputData);

  // B. Staging Buffer (CPU reading memory)
  const stagingBuffer = device.createBuffer({
    label: "Staging Buffer",
    size: inputData.byteLength,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  // 3. Create Compute Shader
  const shaderModule = device.createShaderModule({
    label: "Doubling Shader",
    code: `
      // Declare a storage buffer that is readable and writable
      @group(0) @binding(0)
      var<storage, read_write> data : array<f32>;

      // workgroup_size(64, 1, 1) means each workgroup has 64 threads in X dimension
      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) global_id : vec3u) {
        
        // global_id.x corresponds to the unique index of this thread across ALL workgroups
        let index = global_id.x;

        // Safety check: ensure we don't write past the end of the array
        if (index >= arrayLength(&data)) {
          return;
        }
        
        // The actual work
        data[index] = data[index] * 2.0;
      }
    `,
  });

  // 4. Create Pipeline and BindGroup
  const pipeline = device.createComputePipeline({
    label: "Compute Pipeline",
    layout: "auto",
    compute: {
      module: shaderModule,
      entryPoint: "main",
    },
  });

  const bindGroup = device.createBindGroup({
    label: "Compute Bind Group",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: storageBuffer },
      },
    ],
  });

  // 5. Run Compute Pass
  const commandEncoder = device.createCommandEncoder();

  // Unlike the Render Pass used in previous tutorials, we start a Compute Pass here.
  // A Compute Pass is specifically for dispatching compute jobs.
  const computePass = commandEncoder.beginComputePass();

  computePass.setPipeline(pipeline);
  computePass.setBindGroup(0, bindGroup);

  // Dispatch:
  // We need to tell the GPU how many "Workgroups" to launch.
  // - Our data size is 64 elements.
  // - Our shader defines @workgroup_size(64), meaning 1 workgroup handles 64 threads.
  // - Therefore, we need Math.ceil(64 / 64) = 1 Workgroup.
  //
  // If we had 128 elements: Math.ceil(128 / 64) = 2 Workgroups.
  // Workgroup 0 would handle indices 0-63.
  // Workgroup 1 would handle indices 64-127.
  const workgroupCount = Math.ceil(dataSize / 64);
  computePass.dispatchWorkgroups(workgroupCount);

  computePass.end();

  // 6. Copy result to Staging Buffer
  commandEncoder.copyBufferToBuffer(
    storageBuffer,
    0, // Source
    stagingBuffer,
    0, // Dest
    inputData.byteLength // Size
  );

  // 7. Submit
  device.queue.submit([commandEncoder.finish()]);

  // 8. Read Back
  await stagingBuffer.mapAsync(GPUMapMode.READ);
  const resultBuffer = stagingBuffer.getMappedRange();

  // Important: Copy the data out before unmapping!
  // The mapped range becomes invalid after unmap().
  const resultData = new Float32Array(resultBuffer.slice(0));
  stagingBuffer.unmap();

  console.log("Input:", inputData);
  console.log("Output:", resultData);

  outputDiv.innerHTML = `<strong>Input:</strong><br/>${inputData.join(" ")}<br/><br/><strong>Output:</strong><br/>${resultData.join(" ")}`;
}

init().catch((err) => {
  console.error(err);
  document.getElementById("output")!.innerHTML =
    "<strong>Error:</strong> " + err.message;
});
```
