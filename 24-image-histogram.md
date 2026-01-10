# 24. Image Histogram (Atomic Operations)

In this tutorial, we will learn how to use **Atomic Operations** in a Compute Shader. Atomics are critical for data analysis tasks where multiple GPU threads need to safely update a shared value without overwriting each other.

**Key Learning Points:**
- The race condition problem in parallel computing.
- Declaring and using `atomic<u32>` in storage buffers.
- Using `atomicAdd` to build a real-time image histogram.
- Visualizing buffer data using instanced rendering.

## 1. The Race Condition

Imagine two threads processing different pixels. Both pixels happen to have the same brightness (e.g., 128).
1. Thread A reads the current count for bucket 128 (current value: 10).
2. Thread B reads the same count (current value: 10).
3. Thread A adds 1 and writes back 11.
4. Thread B adds 1 and writes back 11.
5. **Result**: The count is 11, but it should have been 12. One update was lost.

## 2. Atomics to the Rescue

Atomic operations are special hardware-level commands that guarantee a "Read-Modify-Write" sequence happens as a single, uninterrupted step.

In WGSL, we declare an atomic variable like this:
```wgsl
@group(0) @binding(1) 
var<storage, read_write> histogram : array<atomic<u32>, 256>;
```

And we update it using built-in functions:
```wgsl
atomicAdd(&histogram[bucket], 1u);
```

## 3. Implementation Flow

1.  **Clear**: Every frame, we must reset the histogram to zero using `commandEncoder.clearBuffer()`.
2.  **Compute**: The shader iterates through all pixels and increments the corresponding brightness bucket.
3.  **Render**: We use **Instancing** to draw 256 bars. The height of each bar is pulled directly from the `histogram` buffer.

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";
import GUI from "lil-gui";

// ==========================================
// 1. Compute Shader (Histogram Generation)
// ==========================================
const computeShaderCode = `
struct Params {
  channel : u32, // 0: Luminance, 1: Red, 2: Green, 3: Blue
}

@group(0) @binding(0) var inputTex : texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> histogram : array<atomic<u32>, 256>;
@group(0) @binding(2) var<uniform> params : Params;

@compute @workgroup_size(16, 16)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let dims = textureDimensions(inputTex);
  let coords = vec2i(id.xy);

  if (coords.x >= i32(dims.x) || coords.y >= i32(dims.y)) {
    return;
  }

  let color = textureLoad(inputTex, coords, 0);
  var value : f32;

  if (params.channel == 1u) {
    value = color.r;
  } else if (params.channel == 2u) {
    value = color.g;
  } else if (params.channel == 3u) {
    value = color.b;
  } else {
    // Luminance
    value = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  }

  // Map 0..1 to 0..255 bucket index
  let bucket = u32(clamp(value * 255.0, 0.0, 255.0));

  // ATOMIC OPERATION: Safely increment the bucket even if
  // thousands of threads are hitting it at once.
  atomicAdd(&histogram[bucket], 1u);
}
`;

// ==========================================
// 2. Render Shader (Image + Histogram Overlay)
// ==========================================
const renderShaderCode = `
@group(0) @binding(0) var mySampler : sampler;
@group(0) @binding(1) var myTexture : texture_2d<f32>;
@group(0) @binding(2) var<storage, read> histogram : array<u32, 256>;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
  @location(1) @interpolate(flat) isBar : u32,
}

@vertex
fn vs_main(
  @builtin(vertex_index) vIdx : u32,
  @builtin(instance_index) iIdx : u32
) -> VertexOutput {
  var out : VertexOutput;

  // Instance 0 is the background image
  if (iIdx == 0u) {
    var pos = array<vec2f, 6>(
      vec2f(-1.0, -1.0), vec2f( 1.0, -1.0), vec2f(-1.0,  1.0),
      vec2f(-1.0,  1.0), vec2f( 1.0, -1.0), vec2f( 1.0,  1.0)
    );
    var uv = array<vec2f, 6>(
      vec2f(0.0, 1.0), vec2f(1.0, 1.0), vec2f(0.0, 0.0),
      vec2f(0.0, 0.0), vec2f(1.0, 1.0), vec2f(1.0, 0.0)
    );
    out.position = vec4f(pos[vIdx], 0.0, 1.0);
    out.uv = uv[vIdx];
    out.isBar = 0u;
  } 
  // Instances 1-256 are the histogram bars
  else {
    let bucketIdx = iIdx - 1u;
    let count = histogram[bucketIdx];
    
    // Normalize height
    let height = f32(count) / 10000.0; 
    
    let xStart = -0.9 + (f32(bucketIdx) / 256.0) * 1.8;
    let xEnd = xStart + (1.8 / 256.0);
    
    var barPos = array<vec2f, 6>(
      vec2f(xStart, -0.9), vec2f(xEnd, -0.9), vec2f(xStart, -0.9 + height),
      vec2f(xStart, -0.9 + height), vec2f(xEnd, -0.9), vec2f(xEnd, -0.9 + height)
    );
    
    out.position = vec4f(barPos[vIdx], 0.0, 1.0);
    out.isBar = 1u;
  }

  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let texColor = textureSample(myTexture, mySampler, in.uv);
  let barColor = vec4f(1.0, 1.0, 0.0, 0.8); // Yellow bars
  
  return select(texColor, barColor, in.isBar == 1u);
}
`;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  
  // 1. Load Mona Lisa
  const imgUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/405px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg";
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imgUrl;
  await img.decode();
  const source = await createImageBitmap(img);

  canvas.width = source.width;
  canvas.height = source.height;

  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 2. Create Resources
  const inputTexture = device.createTexture({
    size: [source.width, source.height],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });
  device.queue.copyExternalImageToTexture({ source }, { texture: inputTexture }, [source.width, source.height]);

  const histogramBuffer = device.createBuffer({
    label: "Histogram Buffer",
    size: 256 * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const paramsBuffer = device.createBuffer({
    size: 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // 3. Pipelines
  const computePipeline = device.createComputePipeline({
    layout: 'auto',
    compute: { module: device.createShaderModule({ code: computeShaderCode }), entryPoint: "cs_main" }
  });

  const renderPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: device.createShaderModule({ code: renderShaderCode }), entryPoint: "vs_main" },
    fragment: { module: device.createShaderModule({ code: renderShaderCode }), entryPoint: "fs_main", targets: [{ format: canvasFormat }] },
    primitive: { topology: 'triangle-list' }
  });

  const sampler = device.createSampler();

  // 4. BindGroups
  const computeBindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: inputTexture.createView() },
      { binding: 1, resource: { buffer: histogramBuffer } },
      { binding: 2, resource: { buffer: paramsBuffer } }
    ]
  });

  const renderBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: sampler },
      { binding: 1, resource: inputTexture.createView() },
      { binding: 2, resource: { buffer: histogramBuffer } }
    ]
  });

  // 5. Interaction
  const settings = { channel: 'Luminance' };
  const channelMap: Record<string, number> = { 'Luminance': 0, 'Red': 1, 'Green': 2, 'Blue': 3 };
  const gui = new GUI({ container: document.getElementById('gui-container') as HTMLElement, title: 'Histogram Settings' });
  gui.add(settings, 'channel', Object.keys(channelMap)).onChange(() => {
    device.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([channelMap[settings.channel]]));
  });

  device.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([0]));

  function frame() {
    const commandEncoder = device.createCommandEncoder();

    // A. Clear Histogram (Crucial: start from zero every frame)
    commandEncoder.clearBuffer(histogramBuffer);

    // B. Compute Histogram
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(Math.ceil(source.width / 16), Math.ceil(source.height / 16));
    computePass.end();

    // C. Render Image and Histogram
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{ view: context!.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1 } }]
    });
    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, renderBindGroup);
    // Draw 1 instance for image + 256 instances for bars
    renderPass.draw(6, 257); 
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

init().catch(console.error);