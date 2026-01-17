import { initWebGPU } from "../../utils/webgpu-util";
import GUI from "lil-gui";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";
import computeWGSL from "./compute.wgsl?raw";
import renderWGSL from "./render.wgsl?raw";

// ==========================================
// 1. Compute Shader
// ==========================================
const computeShaderCode = computeWGSL;

// ==========================================
// 2. Render Shader
// ==========================================
const renderShaderCode = renderWGSL;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // --- Pipelines & Constant Resources (created once) ---

  // 1. Aspect Ratio Uniform
  resizeCanvasToDisplaySize(canvas);
  const aspectRatio = canvas.width / canvas.height;
  const uniformBuffer = device.createBuffer({
    label: "Uniform Buffer",
    size: 4, // 1 float
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([aspectRatio]));

  // 2. Compute Pipeline
  const computeModule = device.createShaderModule({
    label: "Compute Shader",
    code: computeShaderCode,
  });
  const computePipeline = device.createComputePipeline({
    label: "Particle Compute Pipeline",
    layout: "auto",
    compute: { module: computeModule, entryPoint: "cs_main" },
  });

  // 3. Render Pipeline
  const renderModule = device.createShaderModule({
    label: "Render Shader",
    code: renderShaderCode,
  });
  const renderPipeline = device.createRenderPipeline({
    label: "Particle Render Pipeline",
    layout: "auto",
    vertex: {
      module: renderModule,
      entryPoint: "vs_main",
      buffers: [],
    },
    fragment: {
      module: renderModule,
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive: { topology: "triangle-list" },
  });

  // --- Dynamic State ---
  let particleBuffer: GPUBuffer;
  let computeBindGroup: GPUBindGroup;
  let renderBindGroup: GPUBindGroup;
  let currentNumParticles = 100;

  // Function to (re)initialize particles
  function initParticles(count: number) {
    if (particleBuffer) particleBuffer.destroy();

    currentNumParticles = count;

    // Each particle: pos(2) + vel(2) + color(3) + size(1) = 8 floats (32 bytes)
    // No padding needed as 8 floats align perfectly to 32 bytes (which is > 16 byte alignment)
    const floatPerParticle = 8;
    const particleData = new Float32Array(count * floatPerParticle);

    for (let i = 0; i < count; i++) {
      const offset = i * floatPerParticle;
      // Position (x, y)
      particleData[offset + 0] = (Math.random() - 0.5) * 1.5;
      particleData[offset + 1] = (Math.random() - 0.5) * 1.5;
      // Velocity (vx, vy)
      particleData[offset + 2] = (Math.random() - 0.5) * 0.02;
      particleData[offset + 3] = (Math.random() - 0.5) * 0.02;
      // Color (r, g, b)
      particleData[offset + 4] = Math.random();
      particleData[offset + 5] = Math.random();
      particleData[offset + 6] = Math.random();
      // Size
      particleData[offset + 7] = 0.005 + Math.random() * 0.01;
    }

    particleBuffer = device.createBuffer({
      label: "Particle System Buffer",
      size: particleData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(particleBuffer.getMappedRange()).set(particleData);
    particleBuffer.unmap();

    // Recreate BindGroups
    computeBindGroup = device.createBindGroup({
      label: "Compute BindGroup",
      layout: computePipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: particleBuffer } }],
    });

    renderBindGroup = device.createBindGroup({
      label: "Render BindGroup",
      layout: renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: particleBuffer } },
        { binding: 1, resource: { buffer: uniformBuffer } },
      ],
    });
  }

  // Init with default
  initParticles(100);

  // --- GUI ---
  const settings = {
    particleCount: 100,
  };
  const gui = new GUI({
    container: document.getElementById("gui-container") as HTMLElement,
    title: "Particle Settings",
  });
  gui
    .add(settings, "particleCount", [1, 10, 100, 1000, 10000, 100000, 1000000])
    .name("Particle Count")
    .onChange((value: number) => {
      initParticles(value);
    });

  // --- Frame Loop ---
  function frame() {
    const resized = resizeCanvasToDisplaySize(canvas);
    if (resized) {
      device.queue.writeBuffer(
        uniformBuffer,
        0,
        new Float32Array([canvas.width / canvas.height])
      );
    }
    const commandEncoder = device.createCommandEncoder();

    // A. Compute Pass
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(Math.ceil(currentNumParticles / 64));
    computePass.end();

    // B. Render Pass
    const textureView = context!.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, renderBindGroup);
    renderPass.draw(6, currentNumParticles);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

init().catch((err) => {
  console.error(err);
});
