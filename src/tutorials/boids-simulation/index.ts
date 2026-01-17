import { initWebGPU } from "../../utils/webgpu-util";
import GUI from "lil-gui";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";
import computeWGSL from "./compute.wgsl?raw";
import renderWGSL from "./render.wgsl?raw";

// ==========================================
// 1. Compute Shader (The Brains of the Boids)
// ==========================================
const computeShaderCode = computeWGSL;

// ==========================================
// 2. Render Shader (Draw them as Triangles)
// ==========================================
const renderShaderCode = renderWGSL;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  const numBoids = 1500;
  
  // --- 1. Create Double Buffers ---
  const boidData = new Float32Array(numBoids * 4); // pos(2), vel(2)
  for (let i = 0; i < numBoids; i++) {
    boidData[i * 4 + 0] = Math.random() * 2 - 1; // pos x
    boidData[i * 4 + 1] = Math.random() * 2 - 1; // pos y
    boidData[i * 4 + 2] = (Math.random() - 0.5) * 0.01; // vel x
    boidData[i * 4 + 3] = (Math.random() - 0.5) * 0.01; // vel y
  }

  const createBuffer = () => device.createBuffer({
    size: boidData.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const bufferA = createBuffer();
  const bufferB = createBuffer();
  device.queue.writeBuffer(bufferA, 0, boidData);

  const paramsBuffer = device.createBuffer({
    size: 32, // 5 floats (needs to be multiple of 16 for safety/alignment)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

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
    primitive: { topology: 'triangle-list' }
  });

  const renderUniformBuffer = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    renderUniformBuffer,
    0,
    new Float32Array([canvas.width / canvas.height, 0, 0, 0])
  );

  // --- 3. BindGroups (Ping-Pong) ---
  const bindGroupA = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: bufferA } },
      { binding: 1, resource: { buffer: bufferB } },
      { binding: 2, resource: { buffer: paramsBuffer } }
    ]
  });

  const bindGroupB = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: bufferB } },
      { binding: 1, resource: { buffer: bufferA } },
      { binding: 2, resource: { buffer: paramsBuffer } }
    ]
  });

  const renderBindGroupA = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: bufferA } },
      { binding: 1, resource: { buffer: renderUniformBuffer } },
    ]
  });
  const renderBindGroupB = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: bufferB } },
      { binding: 1, resource: { buffer: renderUniformBuffer } },
    ]
  });

  // --- 4. GUI ---
  const settings = { 
    cohesion: 0.02, 
    alignment: 0.05, 
    separation: 0.05, 
    visualRange: 0.15,
    speed: 1.0 
  };
  const gui = new GUI({ container: document.getElementById('gui-container') as HTMLElement, title: 'Boid Logic' });
  gui.add(settings, 'cohesion', 0, 0.1);
  gui.add(settings, 'alignment', 0, 0.1);
  gui.add(settings, 'separation', 0, 0.1);
  gui.add(settings, 'visualRange', 0, 0.5);
  gui.add(settings, 'speed', 0, 2.0).name('Animation Speed');

  let step = 0;

  // --- 5. Frame Loop ---
  function frame() {
    const resized = resizeCanvasToDisplaySize(canvas);
    if (resized) {
      device.queue.writeBuffer(
        renderUniformBuffer,
        0,
        new Float32Array([canvas.width / canvas.height, 0, 0, 0])
      );
    }
    // Update Uniforms
    device.queue.writeBuffer(paramsBuffer, 0, new Float32Array([
      settings.cohesion, 
      settings.alignment, 
      settings.separation, 
      settings.visualRange,
      settings.speed
    ]));

    const commandEncoder = device.createCommandEncoder();

    // A. Compute
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, step % 2 === 0 ? bindGroupA : bindGroupB);
    computePass.dispatchWorkgroups(Math.ceil(numBoids / 64));
    computePass.end();

    // B. Render
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{ 
        view: context!.getCurrentTexture().createView(), 
        loadOp: 'clear', storeOp: 'store', 
        clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 } 
      }]
    });
    renderPass.setPipeline(renderPipeline);
    // Draw the buffer we just WROTE to
    renderPass.setBindGroup(0, step % 2 === 0 ? renderBindGroupB : renderBindGroupA);
    renderPass.draw(3, numBoids); 
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    step++;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

init().catch(console.error);
