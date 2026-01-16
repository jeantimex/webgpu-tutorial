# Image Processing (Storage Textures)

In this tutorial, we will learn how to use Compute Shaders to manipulate image data directly. We'll implement a real-time filter system (Grayscale, Invert, and Blur) that processes every pixel of an image on the GPU.

**Key Learning Points:**
- Using `texture_storage_2d` to write to textures from a compute shader.
- Understanding `textureLoad` vs `textureSample`.
- Implementing simple image kernels (Box Blur).
- Coordinating a two-pass pipeline: Compute -> Render.

## 1. Storage Textures

Normally, textures in shaders are read-only (using `textureSample`). To allow a Compute Shader to write data into a texture, we must create it with the `STORAGE_BINDING` usage.

```typescript
const outputTexture = device.createTexture({
  size: [width, height],
  format: "rgba8unorm",
  usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
});
```

In WGSL, we declare it like this:
```wgsl
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;
```

## 2. Working with Pixels

In a Compute Shader, we work with integer coordinates (pixels) rather than normalized UVs (0 to 1).

### Reading (`textureLoad`)
We fetch the color of a specific pixel at `(x, y)`:
```wgsl
let coords = vec2i(id.xy);
let color = textureLoad(inputTex, coords, 0); // 0 is the mip-level
```

### Writing (`textureStore`)
We save the modified color back to the storage texture:
```wgsl
textureStore(outputTex, coords, modifiedColor);
```

## 3. Implementing Filters

### Grayscale
We calculate luminance by weighting the Red, Green, and Blue channels based on human eye sensitivity.
```wgsl
let lum = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
color = vec4f(lum, lum, lum, 1.0);
```

### Box Blur (3x3)
A blur effect is created by averaging the color of a pixel with its neighbors. A 3x3 kernel looks at the 8 surrounding pixels and the center pixel (9 total).
```wgsl
var acc = vec3f(0.0);
for (var i = -1; i <= 1; i++) {
  for (var j = -1; j <= 1; j++) {
    let offsetCoords = clamp(coords + vec2i(i, j), vec2i(0), vec2i(dims) - 1);
    acc += textureLoad(inputTex, offsetCoords, 0).rgb;
  }
}
let blurredColor = vec4f(acc / 9.0, 1.0);
```

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";
import GUI from "lil-gui";

// ==========================================
// 1. Compute Shader (The Filter Engine)
// ==========================================
const computeShaderCode = `
struct Params {
  filterType : u32,
}

@group(0) @binding(0) var inputTex : texture_2d<f32>;
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> params : Params;

@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let dims = textureDimensions(inputTex);
  let coords = vec2i(id.xy);

  if (coords.x >= i32(dims.x) || coords.y >= i32(dims.y)) {
    return;
  }

  var color = textureLoad(inputTex, coords, 0);

  if (params.filterType == 1u) {
    // Grayscale
    let lum = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
    color = vec4f(lum, lum, lum, 1.0);
  } else if (params.filterType == 2u) {
    // Invert
    color = vec4f(1.0 - color.rgb, 1.0);
  } else if (params.filterType == 3u) {
    // Simple 3x3 Box Blur
    var acc = vec3f(0.0);
    for (var i = -1; i <= 1; i++) {
      for (var j = -1; j <= 1; j++) {
        let offsetCoords = clamp(coords + vec2i(i, j), vec2i(0), vec2i(dims) - 1);
        acc += textureLoad(inputTex, offsetCoords, 0).rgb;
      }
    }
    color = vec4f(acc / 9.0, 1.0);
  }

  textureStore(outputTex, coords, color);
}
`;

// ==========================================
// 2. Render Shader (Draw Result to Screen)
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
  // Standard full-screen quad positions for triangle-strip
  var pos = array<vec2f, 4>(
    vec2f(-1.0, -1.0), // Bottom-Left
    vec2f( 1.0, -1.0), // Bottom-Right
    vec2f(-1.0,  1.0), // Top-Left
    vec2f( 1.0,  1.0)  // Top-Right
  );
  
  var uv = array<vec2f, 4>(
    vec2f(0.0, 1.0), // Bottom-Left
    vec2f(1.0, 1.0), // Bottom-Right
    vec2f(0.0, 0.0), // Top-Left
    vec2f(1.0, 0.0)  // Top-Right
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
  
  // --- 1. Load Image ---
  const imgUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/405px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg";
  
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imgUrl;
  await img.decode();
  const source = await createImageBitmap(img);

  // Resize canvas to match image
  canvas.width = source.width;
  canvas.height = source.height;

  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // --- 2. Create Textures ---
  const inputTexture = device.createTexture({
    label: "Input Texture",
    size: [source.width, source.height],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUBufferUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });
  device.queue.copyExternalImageToTexture({ source }, { texture: inputTexture }, [source.width, source.height]);

  const outputTexture = device.createTexture({
    label: "Output (Storage) Texture",
    size: [source.width, source.height],
    format: "rgba8unorm",
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
  });

  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear'
  });

  // --- 3. Buffers ---
  const paramsBuffer = device.createBuffer({
    size: 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // --- 4. Pipelines ---
  const computeModule = device.createShaderModule({ code: computeShaderCode });
  const computePipeline = device.createComputePipeline({
    label: "Filter Compute Pipeline",
    layout: 'auto',
    compute: { module: computeModule, entryPoint: "cs_main" }
  });

  const renderModule = device.createShaderModule({ code: renderShaderCode });
  const renderPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: renderModule, entryPoint: "vs_main" },
    fragment: { module: renderModule, entryPoint: "fs_main", targets: [{ format: canvasFormat }] },
    primitive: { topology: 'triangle-strip' }
  });

  // --- 5. BindGroups ---
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
    entries: [
      { binding: 0, resource: sampler },
      { binding: 1, resource: outputTexture.createView() }
    ]
  });

  // --- 6. Interaction ---
  const settings = { filter: 'None' };
  const filterMap: Record<string, number> = { 'None': 0, 'Grayscale': 1, 'Invert': 2, 'Blur': 3 };
  
  const gui = new GUI({ container: document.getElementById('gui-container') as HTMLElement, title: 'Filter Settings' });
  gui.add(settings, 'filter', Object.keys(filterMap)).onChange(() => {
    device.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([filterMap[settings.filter]]));
  });

  // Default to None
  device.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([0]));

  // --- 7. Frame Loop ---
  function frame() {
    const commandEncoder = device.createCommandEncoder();

    // A. Compute Pass (Process the image)
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(Math.ceil(source.width / 8), Math.ceil(source.height / 8));
    computePass.end();

    // B. Render Pass (Draw the storage texture to screen)
    const textureView = context!.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{ 
        view: textureView, 
        loadOp: 'clear', 
        storeOp: 'store', 
        clearValue: { r: 0, g: 0, b: 0, a: 1 } 
      }]
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