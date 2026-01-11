# 19. Image Particles

In this tutorial, we will push our particle system further by using an image to drive the colors and target positions of our particles. We'll recreate the famous **Mona Lisa** using 90,000+ particles and add an interactive "explosion" effect.

**Key Learning Points:**
- Loading an image and extracting pixel data via an offscreen canvas.
- Mapping pixel coordinates to Normalized Device Coordinates (NDC).
- Implementing a "Magnet" effect where particles attract to a specific target position.
- Handling interactive updates by writing new data to existing GPU buffers.

## 1. Extracting Image Data

WebGPU doesn't have a direct way to "read" a JPEG file into a buffer. Instead, we use the standard web approach:
1.  Load an `<img>` element.
2.  Draw it onto a hidden 2D `canvas`.
3.  Use `getImageData()` to get an array of RGBA bytes.

```typescript
const img = new Image();
img.src = "monalisa.jpg";
await img.decode();

const offscreen = document.createElement("canvas");
const ctx = offscreen.getContext("2d")!;
offscreen.width = 250;
offscreen.height = 375;
ctx.drawImage(img, 0, 0, 250, 375);

const imgData = ctx.getImageData(0, 0, 250, 375).data;
```

## 2. Particle Data Mapping

Each particle corresponds to one pixel in our grid. To represent this on the GPU, we use a `Particle` struct with the following key fields:

- **`targetPos` (`targetX`, `targetY`)**: These are the "destination" coordinates. We map the 2D grid index `(px, py)` to the `[-1, 1]` range. We multiply `targetX` by the image's aspect ratio to maintain portrait proportions and flip `targetY` because screen coordinates are top-down while WebGPU is bottom-up.
- **`color` (`r`, `g`, `b`)**: We extract the Red, Green, and Blue channels from the image data and normalize them from `0..255` to the `0..1` range required by the shader.

```typescript
const imageAspectRatio = width / height;

for (let i = 0; i < numParticles; i++) {
  const offset = i * floatPerParticle;
  const px = i % width;
  const py = Math.floor(i / width);

  // currentPos (x, y) - Start at random positions
  particleData[offset + 0] = Math.random() * 4 - 2;
  particleData[offset + 1] = Math.random() * 4 - 2;

  // targetPos (targetX, targetY) - Where the pixel belongs in the image
  // We use 1.2 as a scaling factor to control the image size on screen
  particleData[offset + 2] = (px / width - 0.5) * (1.2 * imageAspectRatio);
  particleData[offset + 3] = (0.5 - py / height) * 1.2;
  
  // color (r, g, b) - Normalized pixel colors
  particleData[offset + 4] = imgData[i * 4 + 0] / 255;
  particleData[offset + 5] = imgData[i * 4 + 1] / 255;
  particleData[offset + 6] = imgData[i * 4 + 2] / 255;

  // size - Small squares for a "pixel" look
  particleData[offset + 7] = 0.003;
}
```

## 3. The "Fly-in" Compute Shader

The Compute Shader is very simple. It calculates the interpolated position between the particle's current position and its `targetPos` using the `mix()` function.

Since each particle starts at a random position, they will appear to "fly in" from all directions to form the image.

```wgsl
@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let index = id.x;
  if (index >= arrayLength(&particles)) { return; }

  var p = particles[index];
  
  // Smoothly move the particle towards its target destination
  p.pos = mix(p.pos, p.targetPos, params.speed);

  particles[index] = p;
}
```

## 4. Performance

Even with nearly **100,000 particles**, WebGPU handles the simulation and rendering with ease. Each frame, the GPU:
1.  Calculates 100,000 position updates (Compute Pass).
2.  Draws 600,000 vertices (Render Pass).

This is the power of offloading heavy calculations to the graphics hardware!

## 5. Interactive Explosion

To make the demo more interactive, we added a click event listener to the canvas. When you click:
1.  We iterate through the particle data on the CPU and assign new random `pos` values to every particle.
2.  We use `device.queue.writeBuffer()` to upload these new positions to the GPU.
3.  Since the Compute Shader is constantly pulling particles towards their `targetPos`, they will automatically fly back to reform the Mona Lisa.

```typescript
canvas.addEventListener("click", () => {
  for (let i = 0; i < numParticles; i++) {
    const offset = i * floatPerParticle;
    // Randomize current position only
    particleData[offset + 0] = Math.random() * 4 - 2; 
    particleData[offset + 1] = Math.random() * 4 - 2;
  }
  device.queue.writeBuffer(particleBuffer, 0, particleData);
});
```

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";

// ==========================================
// 1. Compute Shader
// ==========================================
const computeShaderCode = `
struct Particle {
  pos : vec2f,
  targetPos : vec2f,
  color : vec3f,
  size : f32,
}

struct Params {
  speed : f32,
  time : f32,
}

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(0) @binding(1) var<uniform> params : Params;

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let index = id.x;
  if (index >= arrayLength(&particles)) { return; }

  var p = particles[index];
  
  // Move towards target position (Lerp)
  p.pos = mix(p.pos, p.targetPos, params.speed);

  particles[index] = p;
}
`;

// ==========================================
// 2. Render Shader
// ==========================================
const renderShaderCode = `
struct Particle {
  pos : vec2f,
  targetPos : vec2f,
  color : vec3f,
  size : f32,
}

struct Uniforms {
  aspectRatio : f32,
}

@group(0) @binding(0) var<storage, read> particles : array<Particle>;
@group(0) @binding(1) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
}

@vertex
fn vs_main(
  @builtin(vertex_index) vIdx : u32,
  @builtin(instance_index) iIdx : u32
) -> VertexOutput {
  let p = particles[iIdx];

  var corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f( 1.0, -1.0), vec2f(-1.0,  1.0),
    vec2f(-1.0,  1.0), vec2f( 1.0, -1.0), vec2f( 1.0,  1.0)
  );
  
  let cornerPos = corners[vIdx] * p.size; 
  
  // Apply Aspect Ratio Correction to the entire X coordinate
  // This keeps both the particles and the overall image from stretching
  let finalPos = vec2f((p.pos.x + cornerPos.x) / uniforms.aspectRatio, p.pos.y + cornerPos.y);

  var out : VertexOutput;
  out.position = vec4f(finalPos, 0.0, 1.0);
  out.color = vec4f(p.color, 1.0);
  
  return out;
}

@fragment
fn fs_main(@location(0) color : vec4f) -> @location(0) vec4f {
  return color;
}
`;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const loadingOverlay = document.getElementById("loading-overlay") as HTMLDivElement;
  
  loadingOverlay.style.display = "block";

  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // --- 1. Load and Process Image ---
  const imgUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/405px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg";
  
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imgUrl;
  await img.decode();

  const offscreen = document.createElement("canvas");
  const ctx = offscreen.getContext("2d", { willReadFrequently: true })!;
  
  const w = 250;
  const h = 375;
  offscreen.width = w;
  offscreen.height = h;
  ctx.drawImage(img, 0, 0, w, h);
  
  const imgData = ctx.getImageData(0, 0, w, h).data;
  const numParticles = w * h;
  const imageAspectRatio = w / h;

  const countDiv = document.getElementById("particle-count");
  if (countDiv) {
    countDiv.innerText = `${numParticles.toLocaleString()} particles`;
  }

  // --- 2. Init Particle Data ---
  const floatPerParticle = 8; // pos(2), targetPos(2), color(3), size(1)
  const particleData = new Float32Array(numParticles * floatPerParticle);

  for (let i = 0; i < numParticles; i++) {
    const offset = i * floatPerParticle;
    const px = i % w;
    const py = Math.floor(i / w);

    // Initial random position (Scattered)
    particleData[offset + 0] = Math.random() * 4 - 2; 
    particleData[offset + 1] = Math.random() * 4 - 2;

    // Target position (Apply image aspect ratio to X)
    particleData[offset + 2] = (px / w - 0.5) * (1.2 * imageAspectRatio);
    particleData[offset + 3] = (0.5 - py / h) * 1.2;

    // Color from image (Normalized 0..1)
    particleData[offset + 4] = imgData[i * 4 + 0] / 255;
    particleData[offset + 5] = imgData[i * 4 + 1] / 255;
    particleData[offset + 6] = imgData[i * 4 + 2] / 255;

    // Size
    particleData[offset + 7] = 0.003;
  }

  const particleBuffer = device.createBuffer({
    label: "Mona Lisa Particles",
    size: particleData.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });
  new Float32Array(particleBuffer.getMappedRange()).set(particleData);
  particleBuffer.unmap();

  // --- 3. Uniforms ---
  const aspectRatio = canvas.width / canvas.height;
  const renderUniformBuffer = device.createBuffer({
    size: 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(renderUniformBuffer, 0, new Float32Array([aspectRatio]));

  const computeParamsBuffer = device.createBuffer({
    size: 8, // 2 floats: speed, time
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // --- 4. Pipelines ---
  const computeModule = device.createShaderModule({ code: computeShaderCode });
  const computePipeline = device.createComputePipeline({
    layout: 'auto',
    compute: { module: computeModule, entryPoint: "cs_main" }
  });

  const renderModule = device.createShaderModule({ code: renderShaderCode });
  const renderPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: renderModule, entryPoint: "vs_main" },
    fragment: { module: renderModule, entryPoint: "fs_main", targets: [{ format: canvasFormat }] },
    primitive: { topology: "triangle-list" }
  });

  // --- 5. BindGroups ---
  const computeBindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: particleBuffer } },
      { binding: 1, resource: { buffer: computeParamsBuffer } }
    ]
  });

  const renderBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: particleBuffer } },
      { binding: 1, resource: { buffer: renderUniformBuffer } }
    ]
  });

  loadingOverlay.style.display = "none";

  const assemblySpeed = 0.02;

  // --- 7. Interaction: Click to Explode ---
  canvas.addEventListener("click", () => {
    for (let i = 0; i < numParticles; i++) {
      const offset = i * floatPerParticle;
      // Randomize current position only
      particleData[offset + 0] = Math.random() * 4 - 2; 
      particleData[offset + 1] = Math.random() * 4 - 2;
    }
    device.queue.writeBuffer(particleBuffer, 0, particleData);
  });

  // --- 8. Frame Loop ---
  function frame(time: number) {
    // Update compute params
    device.queue.writeBuffer(computeParamsBuffer, 0, new Float32Array([
      assemblySpeed, 
      time / 1000
    ]));

    const commandEncoder = device.createCommandEncoder();

    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(Math.ceil(numParticles / 64));
    computePass.end();

    const textureView = context!.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
        loadOp: 'clear', 
        storeOp: 'store'
      }]
    });
    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, renderBindGroup);
    renderPass.draw(6, numParticles); 
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

init().catch((err) => {
  console.error(err);
});
```