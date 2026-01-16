async function init() {
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

  outputDiv.innerHTML = `<strong>Input:</strong><br/>${inputData.join(" ")}<br/><br/>Computing...`;

  // 2. Create GPU Buffers
  const storageBuffer = device.createBuffer({
    label: "Work Buffer",
    size: inputData.byteLength,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(storageBuffer, 0, inputData);

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
        if (global_id.x >= arrayLength(&data)) {
          return;
        }
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
  const computePass = commandEncoder.beginComputePass();
  computePass.setPipeline(pipeline);
  computePass.setBindGroup(0, bindGroup);
  const workgroupCount = Math.ceil(dataSize / 64);
  computePass.dispatchWorkgroups(workgroupCount);
  computePass.end();

  // 6. Copy result to Staging Buffer
  commandEncoder.copyBufferToBuffer(
    storageBuffer,
    0,
    stagingBuffer,
    0,
    inputData.byteLength
  );

  // 7. Submit
  device.queue.submit([commandEncoder.finish()]);

  // 8. Read Back
  await stagingBuffer.mapAsync(GPUMapMode.READ);
  const resultBuffer = stagingBuffer.getMappedRange();
  const resultData = new Float32Array(resultBuffer.slice(0));
  stagingBuffer.unmap();

  outputDiv.innerHTML = `<strong>Input:</strong><br/>${inputData.join(" ")}<br/><br/><strong>Output:</strong><br/>${resultData.join(" ")}`;
}

init().catch((err) => {
  console.error(err);
  document.getElementById("output")!.innerHTML =
    "<strong>Error:</strong> " + err.message;
});
