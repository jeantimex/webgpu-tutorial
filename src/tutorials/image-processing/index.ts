import { initWebGPU } from "../../utils/webgpu-util";
import GUI from "lil-gui";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";
import computeWGSL from "./compute.wgsl?raw";
import renderWGSL from "./render.wgsl?raw";

// ==========================================
// 1. Compute Shader (The Filter Engine)
// ==========================================
const computeShaderCode = computeWGSL;

// ==========================================
// 2. Render Shader (Draw Result to Screen)
// ==========================================
const renderShaderCode = renderWGSL;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  
  // --- 1. Load Image ---
  const imgUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/405px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg";
  
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imgUrl;
  await img.decode();
  const source = await createImageBitmap(img);

  const imageAspect = source.width / source.height;

  // Resize canvas to match image
  canvas.width = source.width;
  canvas.height = source.height;
  resizeCanvasToDisplaySize(canvas);

  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // --- 2. Create Textures ---
  const inputTexture = device.createTexture({
    label: "Input Texture",
    size: [source.width, source.height],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
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

  const renderUniformBuffer = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    renderUniformBuffer,
    0,
    new Float32Array([imageAspect, canvas.width / canvas.height, 0, 0])
  );

  // --- 4. Pipelines ---
  const computeModule = device.createShaderModule({ code: computeShaderCode });
  const computePipeline = device.createComputePipeline({
    label: "Filter Compute Pipeline",
    layout: 'auto',
    compute: { module: computeModule, entryPoint: "cs_main" }
  });

  const renderModule = device.createShaderModule({ code: renderShaderCode });
  const renderPipeline = device.createRenderPipeline({
    label: "Texture Render Pipeline",
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
      { binding: 1, resource: outputTexture.createView() },
      { binding: 2, resource: { buffer: renderUniformBuffer } }
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
    const resized = resizeCanvasToDisplaySize(canvas);
    if (resized) {
      device.queue.writeBuffer(
        renderUniformBuffer,
        0,
        new Float32Array([imageAspect, canvas.width / canvas.height, 0, 0])
      );
    }
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
        clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 } 
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
