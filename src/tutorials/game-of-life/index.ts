import { initWebGPU } from "../../utils/webgpu-util";
import GUI from "lil-gui";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";
import computeWGSL from "./compute.wgsl?raw";
import renderWGSL from "./render.wgsl?raw";

// ==========================================
// 1. Compute Shader (The Rules of Life)
// ==========================================
const computeShaderCode = computeWGSL;

// ==========================================
// 2. Render Shader (Draw Grid to Screen)
// ==========================================
const renderShaderCode = renderWGSL;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  const width = 512;
  const height = 512;

  // --- 1. Create Double Buffers (Textures) ---
  const createTexture = () => device.createTexture({
    size: [width, height],
    format: "rgba8unorm",
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });

  const textureA = createTexture();
  const textureB = createTexture();

  // Initialize with random noise
  const initialData = new Uint8Array(width * height * 4);
  for (let i = 0; i < initialData.length; i += 4) {
    const val = Math.random() > 0.8 ? 255 : 0;
    initialData[i] = val;     // R
    initialData[i+1] = val;   // G
    initialData[i+2] = val;   // B
    initialData[i+3] = 255;   // A
  }
  device.queue.writeTexture({ texture: textureA }, initialData, { bytesPerRow: width * 4 }, [width, height]);

  // --- 2. Pipelines ---
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
    primitive: { topology: 'triangle-strip' }
  });

  const sampler = device.createSampler();

  // --- 3. BindGroups (The Ping-Pong Setup) ---
  
  // Set 1: Read A, Write B
  const computeBindGroup1 = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: textureA.createView() },
      { binding: 1, resource: textureB.createView() }
    ]
  });

  // Set 2: Read B, Write A
  const computeBindGroup2 = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: textureB.createView() },
      { binding: 1, resource: textureA.createView() }
    ]
  });

  // Render BindGroups
  const renderUniformBuffer = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    renderUniformBuffer,
    0,
    new Float32Array([1, canvas.width / canvas.height, 0, 0])
  );

  const renderBindGroup1 = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: sampler },
      { binding: 1, resource: textureA.createView() },
      { binding: 2, resource: { buffer: renderUniformBuffer } },
    ]
  });
  const renderBindGroup2 = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: sampler },
      { binding: 1, resource: textureB.createView() },
      { binding: 2, resource: { buffer: renderUniformBuffer } },
    ]
  });

  // --- 4. Controls ---
  const settings = { running: true };
  const gui = new GUI({ container: document.getElementById('gui-container') as HTMLElement, title: 'Life Controls' });
  gui.add(settings, 'running').name('Running');
  gui.add({ reset: () => {
    device.queue.writeTexture({ texture: textureA }, initialData, { bytesPerRow: width * 4 }, [width, height]);
  }}, 'reset').name('Reset Simulation');

  let step = 0;

  // --- 5. Frame Loop ---
  function frame() {
    const resized = resizeCanvasToDisplaySize(canvas);
    if (resized) {
      device.queue.writeBuffer(
        renderUniformBuffer,
        0,
        new Float32Array([1, canvas.width / canvas.height, 0, 0])
      );
    }
    if (settings.running) {
      const commandEncoder = device.createCommandEncoder();
      const computePass = commandEncoder.beginComputePass();
      computePass.setPipeline(computePipeline);
      
      // Ping-pong!
      if (step % 2 === 0) {
        computePass.setBindGroup(0, computeBindGroup1);
      } else {
        computePass.setBindGroup(0, computeBindGroup2);
      }
      
      computePass.dispatchWorkgroups(width / 8, height / 8);
      computePass.end();
      device.queue.submit([commandEncoder.finish()]);
      step++;
    }

    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{ view: context!.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 } }]
    });
    renderPass.setPipeline(renderPipeline);
    
    // Always render the "latest" texture
    renderPass.setBindGroup(0, step % 2 === 0 ? renderBindGroup1 : renderBindGroup2);
    renderPass.draw(4);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

init().catch(console.error);
