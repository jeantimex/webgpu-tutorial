# 19. Image Particles (Mona Lisa)

In this tutorial, we will push our particle system further by using an image to drive the colors and target positions of our particles. We'll recreate the famous **Mona Lisa** using 90,000+ particles and add a "scattering" effect.

**Key Learning Points:**
- Loading an image and extracting pixel data via an offscreen canvas.
- Mapping pixel coordinates to Normalized Device Coordinates (NDC).
- Implementing a "Magnet" effect where particles attract to a specific target position.
- Controlling simulation parameters (Scatter vs. Assemble) via Uniforms and GUI.

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

Each particle corresponds to one pixel in our 250x375 grid.
- **Color**: Derived directly from the pixel's RGB values.
- **Target Position**: We map the pixel's (x, y) grid coordinates to the [-1, 1] NDC range, accounting for the image's aspect ratio.

```typescript
const imageAspectRatio = width / height;

for (let i = 0; i < numParticles; i++) {
  const px = i % width;
  const py = Math.floor(i / width);

  // Target Position: Map grid index to screen space
  // We multiply X by imageAspectRatio to maintain portrait proportions
  particle.targetX = (px / width - 0.5) * (1.2 * imageAspectRatio);
  particle.targetY = (0.5 - py / height) * 1.2; // Flip Y
  
  // Color: Normalize 0..255 to 0..1
  particle.r = imgData[i * 4 + 0] / 255;
  // ...
}
```

## 3. The "Liquid" Compute Shader

The Compute Shader calculates two possible positions for every particle:
1.  **Mona Lisa Position**: The original pixel coordinate (`p.targetPos`).
2.  **Scattered Position**: A random coordinate based on the particle's index.

We use a `scatter` uniform (0 to 1) to transition between these two states using the `mix()` function.

```wgsl
// Determine where the particle WANTS to go
let destination = mix(p.targetPos, scatteredPos, params.scatter);

// Smoothly move the particle towards that destination
p.pos = mix(p.pos, destination, params.speed);
```

## 4. Performance

Even with nearly **100,000 particles**, WebGPU handles the simulation and rendering with ease. Each frame, the GPU:
1.  Calculates 100,000 position updates (Compute Pass).
2.  Draws 600,000 vertices (Render Pass).

This is the power of offloading heavy calculations to the graphics hardware!

## Full Code

```typescript
import { initWebGPU } from "./utils/webgpu-util";
import GUI from "lil-gui";

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
  scatter : f32, // 0.0 = Assemble, 1.0 = Scatter
  time : f32,
}

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(0) @binding(1) var<uniform> params : Params;

// Simple random function
fn rand(co: vec2f) -> f32 {
    return fract(sin(dot(co, vec2f(12.9898, 78.233))) * 43758.5453);
}

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let index = id.x;
  if (index >= arrayLength(&particles)) { return; }

  var p = particles[index];
  
  // Create a scattered destination based on index
  let seed = f32(index);
  let scatteredPos = vec2f(
    rand(vec2f(seed, 1.0)) * 2.0 - 1.0,
    rand(vec2f(seed, 2.0)) * 2.0 - 1.0
  );

  // Determine current destination based on the "scatter" parameter
  let destination = mix(p.targetPos, scatteredPos, params.scatter);

  // Move towards destination (Lerp)
  p.pos = mix(p.pos, destination, params.speed);

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
  const ctx = offscreen.getContext("2d")!;
  
  const w = 250;
  const h = 375;
  offscreen.width = w;
  offscreen.height = h;
  ctx.drawImage(img, 0, 0, w, h);
  
  const imgData = ctx.getImageData(0, 0, w, h).data;
  const numParticles = w * h;

  // --- 2. Init Particle Data ---
  const floatPerParticle = 8; 
  const particleData = new Float32Array(numParticles * floatPerParticle);

  for (let i = 0; i < numParticles; i++) {
    const offset = i * floatPerParticle;
    const px = i % w;
    const py = Math.floor(i / w);

    particleData[offset + 0] = Math.random() * 2 - 1;
    particleData[offset + 1] = Math.random() * 2 - 1;
    particleData[offset + 2] = (px / w - 0.5) * 1.2;
    particleData[offset + 3] = (0.5 - py / h) * 1.2;
    particleData[offset + 4] = imgData[i * 4 + 0] / 255;
    particleData[offset + 5] = imgData[i * 4 + 1] / 255;
    particleData[offset + 6] = imgData[i * 4 + 2] / 255;
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
    size: 12, 
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

  // --- 6. Interaction ---
  const settings = { speed: 0.02, scatter: 0.0 };
  const gui = new GUI({
    container: document.getElementById('gui-container') as HTMLElement,
    title: 'Mona Lisa Controls'
  });
  gui.add(settings, 'speed', 0.005, 0.1).name('Assembly Speed');
  gui.add(settings, 'scatter', 0, 1).name('Scatter Amount');

  loadingOverlay.style.display = "none";

  // --- 7. Frame Loop ---
  function frame(time: number) {
    device.queue.writeBuffer(computeParamsBuffer, 0, new Float32Array([
      settings.speed, settings.scatter, time / 1000
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
        loadOp: 'clear', storeOp: 'store'
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
