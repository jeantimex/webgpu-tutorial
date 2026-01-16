import { initWebGPU } from "../../utils/webgpu-util";
import GUI from "lil-gui";

// ==========================================
// 1. Compute Shader (The Rules of Life)
// ==========================================
const computeShaderCode = `
@group(0) @binding(0) var inputTex : texture_2d<f32>;
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let dims = textureDimensions(inputTex);
  let coords = vec2i(id.xy);

  if (coords.x >= i32(dims.x) || coords.y >= i32(dims.y)) {
    return;
  }

  // Count 8 neighbors
  var activeNeighbors = 0;
  for (var i = -1; i <= 1; i++) {
    for (var j = -1; j <= 1; j++) {
      if (i == 0 && j == 0) { continue; }
      
      // Use modulo for wrapping around edges (Toroidal grid)
      let neighborCoords = (coords + vec2i(i, j) + vec2i(dims)) % vec2i(dims);
      let value = textureLoad(inputTex, neighborCoords, 0).r;
      if (value > 0.5) {
        activeNeighbors++;
      }
    }
  }

  let currentState = textureLoad(inputTex, coords, 0).r > 0.5;
  var nextState = 0.0;

  if (currentState) {
    // Rule: Any live cell with two or three live neighbors lives
    if (activeNeighbors == 2 || activeNeighbors == 3) {
      nextState = 1.0;
    }
  } else {
    // Rule: Any dead cell with exactly three live neighbors becomes a live cell
    if (activeNeighbors == 3) {
      nextState = 1.0;
    }
  }

  textureStore(outputTex, coords, vec4f(nextState, nextState, nextState, 1.0));
}
`;

// ==========================================
// 2. Render Shader (Draw Grid to Screen)
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
  let color = textureSample(myTexture, mySampler, in.uv).r;
  // Make it look green/matrix style
  return vec4f(0.0, color, 0.0, 1.0);
}
`;

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
  const renderBindGroup1 = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: sampler }, { binding: 1, resource: textureA.createView() }]
  });
  const renderBindGroup2 = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: sampler }, { binding: 1, resource: textureB.createView() }]
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
      colorAttachments: [{ view: context!.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }]
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
