
async function init() {
  // Although we don't strictly need a canvas for compute, we might reuse helper functions
  // or just grab the device directly if we didn't use initWebGPU.
  // Here we'll just manually get the device to keep it simple and independent 
  // since we don't need a swap chain or context.
  if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
  }
  const device = await adapter.requestDevice();

  const outputDiv = document.getElementById("output") as HTMLDivElement;

  // 1. Setup Data
  const dataSize = 64;
  const inputData = new Float32Array(dataSize);
  for (let i = 0; i < dataSize; i++) {
    inputData[i] = i;
  }

  outputDiv.innerText = `Input: ${inputData.join(", ")}\n\nComputing...`;

  // 2. Create GPU Buffers
  
  // A. Storage Buffer (The one the GPU works on)
  const storageBuffer = device.createBuffer({
    label: "Work Buffer",
    size: inputData.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });
  // Upload initial data
  device.queue.writeBuffer(storageBuffer, 0, inputData);

  // B. Staging Buffer (For reading back to CPU)
  const stagingBuffer = device.createBuffer({
    label: "Staging Buffer",
    size: inputData.byteLength,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  // 3. Create Compute Shader
  const shaderModule = device.createShaderModule({
    label: "Doubling Shader",
    code: `
      @group(0) @binding(0)
      var<storage, read_write> data : array<f32>;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) global_id : vec3u) {
        // Ensure we don't go out of bounds
        if (global_id.x >= arrayLength(&data)) {
          return;
        }
        
        // The Operation: Double the value
        data[global_id.x] = data[global_id.x] * 2.0;
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
    storageBuffer, 0, // Source
    stagingBuffer, 0, // Dest
    inputData.byteLength // Size
  );

  // 7. Submit
  device.queue.submit([commandEncoder.finish()]);

  // 8. Read Back
  await stagingBuffer.mapAsync(GPUMapMode.READ);
  const resultBuffer = stagingBuffer.getMappedRange();
  // Create a copy because resultBuffer is just a view into GPU memory
  // that will disappear when we unmap.
  const resultData = new Float32Array(resultBuffer.slice(0));
  stagingBuffer.unmap();

  console.log("Input:", inputData);
  console.log("Output:", resultData);

  outputDiv.innerText += `\n\nOutput: ${resultData.join(", ")}`;
}

init().catch((err) => {
  console.error(err);
  document.getElementById("output")!.innerText = "Error: " + err.message;
});
