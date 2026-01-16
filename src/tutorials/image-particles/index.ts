import { initWebGPU } from "../../utils/webgpu-util";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";

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

    // Color from image
    particleData[offset + 4] = imgData[i * 4 + 0] / 255;
    particleData[offset + 5] = imgData[i * 4 + 1] / 255;
    particleData[offset + 6] = imgData[i * 4 + 2] / 255;

    // Size
    particleData[offset + 7] = 0.004;
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
  resizeCanvasToDisplaySize(canvas);
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
    // Upload updated positions to GPU
    device.queue.writeBuffer(particleBuffer, 0, particleData);
  });

  // --- 8. Frame Loop ---
  function frame(time: number) {
    const resized = resizeCanvasToDisplaySize(canvas);
    if (resized) {
      device.queue.writeBuffer(
        renderUniformBuffer,
        0,
        new Float32Array([canvas.width / canvas.height])
      );
    }
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
        clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 },
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
