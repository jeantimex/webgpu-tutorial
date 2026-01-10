import { initWebGPU } from "./utils/webgpu-util";
import GUI from "lil-gui";

// ==========================================
// 1. Compute Shader (Shared Memory Blur)
// ==========================================
const computeShaderCode = `
struct Params {
  filterType : u32, // 0: Global, 1: Shared
}

@group(0) @binding(0) var inputTex : texture_2d<f32>;
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> params : Params;

var<workgroup> tile : array<array<vec3f, 10>, 10>;

@compute @workgroup_size(8, 8)
fn cs_main(
  @builtin(global_invocation_id) g_id : vec3u,
  @builtin(local_invocation_id) l_id : vec3u,
  @builtin(workgroup_id) w_id : vec3u
) {
  let dims = textureDimensions(inputTex);
  
  if (params.filterType == 1u) {
    // --- SHARED MEMORY PATH ---
    let lx = l_id.x;
    let ly = l_id.y;
    let tileTopLeft = vec2i(i32(w_id.x * 8u), i32(w_id.y * 8u)) - vec2i(1);

    // Cooperative load (100 cells for 64 threads)
    for (var i = u32(ly * 8 + lx); i < 100u; i += 64u) {
      let tx = i % 10u;
      let ty = i / 10u;
      let loadCoords = clamp(tileTopLeft + vec2i(i32(tx), i32(ty)), vec2i(0), vec2i(dims) - 1);
      tile[ty][tx] = textureLoad(inputTex, loadCoords, 0).rgb;
    }

    workgroupBarrier();

    if (g_id.x < dims.x && g_id.y < dims.y) {
      var acc = vec3f(0.0);
      for (var i = 0u; i < 3u; i++) {
        for (var j = 0u; j < 3u; j++) {
          acc += tile[ly + i][lx + j];
        }
      }
      textureStore(outputTex, vec2i(g_id.xy), vec4f(acc / 9.0, 1.0));
    }
  } else {
    // --- GLOBAL MEMORY PATH ---
    let coords = vec2i(g_id.xy);
    if (coords.x >= i32(dims.x) || coords.y >= i32(dims.y)) { return; }

    var acc = vec3f(0.0);
    for (var i = -1; i <= 1; i++) {
      for (var j = -1; j <= 1; j++) {
        let loadCoords = clamp(coords + vec2i(i, j), vec2i(0), vec2i(dims) - 1);
        acc += textureLoad(inputTex, loadCoords, 0).rgb;
      }
    }
    textureStore(outputTex, coords, vec4f(acc / 9.0, 1.0));
  }
}
`;

// ==========================================
// 2. Render Shader
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
  // Corrected CCW winding order for 2 triangles
  var pos = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f( 1.0, -1.0), vec2f(-1.0,  1.0), // Triangle 1
    vec2f(-1.0,  1.0), vec2f( 1.0, -1.0), vec2f( 1.0,  1.0)  // Triangle 2
  );
  var uv = array<vec2f, 6>(
    vec2f(0.0, 1.0), vec2f(1.0, 1.0), vec2f(0.0, 0.0),
    vec2f(0.0, 0.0), vec2f(1.0, 1.0), vec2f(1.0, 0.0)
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
  
  const imgUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/405px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg";
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imgUrl;
  await img.decode();
  const source = await createImageBitmap(img);

  canvas.width = source.width;
  canvas.height = source.height;

  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // Textures
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

  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });

  const paramsBuffer = device.createBuffer({
    label: "Params Buffer",
    size: 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Pipelines
  const computePipeline = device.createComputePipeline({
    label: "Blur Compute Pipeline",
    layout: 'auto',
    compute: { module: device.createShaderModule({ code: computeShaderCode }), entryPoint: "cs_main" }
  });

  const renderPipeline = device.createRenderPipeline({
    label: "Fullscreen Render Pipeline",
    layout: 'auto',
    vertex: { module: device.createShaderModule({ code: renderShaderCode }), entryPoint: "vs_main" },
    fragment: { module: device.createShaderModule({ code: renderShaderCode }), entryPoint: "fs_main", targets: [{ format: canvasFormat }] },
    primitive: { topology: 'triangle-list', cullMode: 'none' }
  });

  // BindGroups
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

  // GUI
  const settings = { method: 'Global Memory' };
  const methodMap: Record<string, number> = { 'Global Memory': 0, 'Shared Memory': 1 };
  const gui = new GUI({ container: document.getElementById('gui-container') as HTMLElement, title: 'Blur Optimization' });
  gui.add(settings, 'method', Object.keys(methodMap)).onChange(() => {
    device.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([methodMap[settings.method]]));
  });

  // Start with Global for verification
  device.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([0]));

  function frame() {
    const commandEncoder = device.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(Math.ceil(source.width / 8), Math.ceil(source.height / 8));
    computePass.end();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{ 
        view: context!.getCurrentTexture().createView(), 
        loadOp: 'clear', storeOp: 'store', 
        clearValue: { r: 0, g: 0, b: 0, a: 1 } 
      }]
    });
    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, renderBindGroup);
    renderPass.draw(6); 
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

init().catch(console.error);
