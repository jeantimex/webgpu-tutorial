# 22. Optimized Blur (Shared Memory)

In Tutorial 20, we built a simple blur filter. While it worked, it was "bandwidth heavy." Every thread had to fetch 9 pixels from the GPU's main memory. In this tutorial, we will optimize this using **Workgroup Shared Memory**.

**Key Learning Points:**
- The GPU memory hierarchy: Global Memory vs. Workgroup Shared Memory.
- Using `var<workgroup>` to declare local caches.
- **Cooperative Loading**: How threads work together to load a data "tile."
- **Synchronization**: Using `workgroupBarrier()` to prevent race conditions.

## 1. The Bottleneck: Global Memory

Global Memory (VRAM) is large but slow. When you perform a 3x3 blur:
- 256 threads in a 16x16 workgroup execute.
- Each thread fetches 9 pixels.
- **Total: 2,304 slow memory fetches.**

Notice that many threads are fetching the *exact same pixels*! This is redundant.

## 2. The Solution: Shared Memory (`var<workgroup>`)

Shared memory is a tiny (usually 16-48 KB) cache that lives inside the GPU Compute Unit. It is significantly faster than VRAM.

### Step 1: Declare the Tile
We create an 18x18 array. Why 18? Because our 16x16 workgroup needs a 1-pixel "apron" (border) around it to calculate the blur for the edge pixels.

```wgsl
var<workgroup> tile : array<array<vec3f, 18>, 18>;
```

### Step 2: Cooperative Loading
Instead of every thread fetching 9 pixels, each thread works to fill the `tile` once. 
- Total pixels needed for the tile: 18 * 18 = 324.
- Total threads available: 16 * 16 = 256.
- Some threads will load 1 pixel, and some will load 2.

### Step 3: The Barrier
We cannot start the blur calculation until the *entire* tile is loaded. We use `workgroupBarrier()` to tell the GPU: "Stop here and wait until every thread in this group has finished its loading work."

```wgsl
workgroupBarrier();
```

## 3. Performance Result

With this optimization:
- We only perform **324 slow fetches** from Global Memory.
- All subsequent neighbor lookups happen in the ultra-fast Shared Memory.
- **Result**: Massive reduction in memory bandwidth usage.

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";
import GUI from "lil-gui";

// ==========================================
// 1. Compute Shader (Shared Memory Blur)
// ==========================================
const computeShaderCode = `
struct Params {
  filterType : u32, // 0: Simple Blur (Global), 1: Optimized Blur (Shared)
}

@group(0) @binding(0) var inputTex : texture_2d<f32>;
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> params : Params;

// Define a shared memory tile (16x16 workgroup + 1 pixel apron on all sides = 18x18)
var<workgroup> tile : array<array<vec3f, 18>, 18>;

@compute @workgroup_size(16, 16)
fn cs_main(
  @builtin(global_invocation_id) g_id : vec3u,
  @builtin(local_invocation_id) l_id : vec3u,
  @builtin(workgroup_id) w_id : vec3u
) {
  let dims = textureDimensions(inputTex);
  
  // --- OPTIMIZED PATH: Shared Memory ---
  if (params.filterType == 1u) {
    // 1. Cooperative Loading
    // Every thread loads its "base" pixel into shared memory at [lx+1, ly+1]
    let lx = l_id.x;
    let ly = l_id.y;
    
    // Calculate global coordinates for this tile's top-left corner (including apron)
    // We subtract 1 to get the border
    let tileTopLeft = vec2i(w_id.xy * 16u) - vec2i(1);

    // Each thread is responsible for loading a portion of the 18x18 tile.
    // Total cells: 324. Total threads: 256.
    // We'll use a simple loop so some threads load twice to fill the 324 cells.
    for (var i = u32(ly * 16 + lx); i < 324u; i += 256u) {
      let tx = i % 18u;
      let ty = i / 18u;
      let loadCoords = clamp(tileTopLeft + vec2i(u32(tx), u32(ty)), vec2i(0), vec2i(dims) - 1);
      tile[ty][tx] = textureLoad(inputTex, loadCoords, 0).rgb;
    }

    // 2. Synchronization
    // Wait for ALL threads in the workgroup to finish loading into 'tile'
    workgroupBarrier();

    // 3. Compute Blur using Shared Memory
    if (g_id.x < dims.x && g_id.y < dims.y) {
      var acc = vec3f(0.0);
      // We look at our neighbors in the 'tile' array (offset by 1 because of apron)
      for (var i = 0u; i <= 2u; i++) {
        for (var j = 0u; j <= 2u; j++) {
          acc += tile[ly + i][lx + j];
        }
      }
      textureStore(outputTex, vec2i(g_id.xy), vec4f(acc / 9.0, 1.0));
    }
  } 
  
  // --- SIMPLE PATH: Global Memory (Tutorial 20 style) ---
  else {
    let coords = vec2i(g_id.xy);
    if (coords.x >= i32(dims.x) || coords.y >= i32(dims.y)) { return; }

    var acc = vec3f(0.0);
    for (var i = -1; i <= 1; i++) {
      for (var j = -1; j <= 1; j++) {
        let offsetCoords = clamp(coords + vec2i(i, j), vec2i(0), vec2i(dims) - 1);
        acc += textureLoad(inputTex, offsetCoords, 0).rgb;
      }
    }
    textureStore(outputTex, coords, vec4f(acc / 9.0, 1.0));
  }
}

`;

// ==========================================
// 2. Render Shader (Standard Quad)
// ==========================================
const renderShaderCode = `
@group(0) @binding(0) var mySampler : sampler;
@group(0) @binding(1) var myTexture : texture_2d<f32>;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
}

@vertex
fn vs_main(@builtin(vertex_index) vIdx : u32) -> VertexOutput {
  var pos = array<vec2f, 4>(
    vec2f(-1.0, -1.0), vec2f( 1.0, -1.0),
    vec2f(-1.0,  1.0), vec2f( 1.0,  1.0)
  );
  var uv = array<vec2f, 4>(
    vec2f(0.0, 1.0), vec2f(1.0, 1.0),
    vec2f(0.0, 0.0), vec2f(1.0, 0.0)
  );
  var out : VertexOutput;
  out.position = vec4f(pos[vIdx], 0.0, 1.0);
  out.uv = uv[vIdx];
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  return textureSample(myTexture, mySampler, in.uv);
}

`;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  
  // Load Mona Lisa
  const imgUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/405px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg";
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imgUrl;
  await img.decode();
  const source = await createImageBitmap(img);

  canvas.width = source.width;
  canvas.height = source.height;

  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // --- Textures ---
  const inputTexture = device.createTexture({
    size: [source.width, source.height],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });
  device.queue.copyExternalImageToTexture({ source }, { texture: inputTexture }, [source.width, source.height]);

  const outputTexture = device.createTexture({
    size: [source.width, source.height],
    format: "rgba8unorm",
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
  });

  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });

  // --- Buffers ---
  const paramsBuffer = device.createBuffer({
    size: 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // --- Pipelines ---
  const computePipeline = device.createComputePipeline({
    layout: 'auto',
    compute: { module: device.createShaderModule({ code: computeShaderCode }), entryPoint: "cs_main" }
  });

  const renderPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: device.createShaderModule({ code: renderShaderCode }), entryPoint: "vs_main" },
    fragment: { module: renderModule, entryPoint: "fs_main", targets: [{ format: canvasFormat }] },
    primitive: { topology: 'triangle-strip' }
  });

  // --- BindGroups ---
  const computeBindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: inputTexture.createView() },
      { binding: 1, resource: outputTexture.createView() },
      { binding: 2, resource: { buffer: paramsBuffer } }
    ]
  });

  const renderBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: sampler }, { binding: 1, resource: outputTexture.createView() }]
  });

  // --- Controls ---
  const settings = { method: 'Shared Memory' };
  const methodMap: Record<string, number> = { 'Global Memory': 0, 'Shared Memory': 1 };
  
  const gui = new GUI({ container: document.getElementById('gui-container') as HTMLElement, title: 'Blur Optimization' });
  gui.add(settings, 'method', Object.keys(methodMap)).onChange(() => {
    device.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([methodMap[settings.method]]));
  });

  // Default to Shared
  device.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([1]));

  function frame() {
    const commandEncoder = device.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(Math.ceil(source.width / 16), Math.ceil(source.height / 16));
    computePass.end();

    const textureView = context!.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{ view: textureView, loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }]
    });
    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, renderBindGroup);
    renderPass.draw(4);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

init().catch(console.error);
```