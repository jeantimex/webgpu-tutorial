import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as b}from"./webgpu-util-BApOR-AX.js";import{G as w}from"./lil-gui.esm-CNIGZg2U.js";const P=`
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
`,f=`
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
`;async function G(){const a=document.querySelector("#webgpu-canvas"),v="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/405px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",r=new Image;r.crossOrigin="anonymous",r.src=v,await r.decode();const t=await createImageBitmap(r);a.width=t.width,a.height=t.height;const{device:e,context:x,canvasFormat:_}=await b(a),c=e.createTexture({label:"Input Texture",size:[t.width,t.height],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});e.queue.copyExternalImageToTexture({source:t},{texture:c},[t.width,t.height]);const s=e.createTexture({label:"Output (Storage) Texture",size:[t.width,t.height],format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),y=e.createSampler({magFilter:"linear",minFilter:"linear"}),n=e.createBuffer({label:"Params Buffer",size:4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),d=e.createComputePipeline({label:"Blur Compute Pipeline",layout:"auto",compute:{module:e.createShaderModule({code:P}),entryPoint:"cs_main"}}),l=e.createRenderPipeline({label:"Fullscreen Render Pipeline",layout:"auto",vertex:{module:e.createShaderModule({code:f}),entryPoint:"vs_main"},fragment:{module:e.createShaderModule({code:f}),entryPoint:"fs_main",targets:[{format:_}]},primitive:{topology:"triangle-list",cullMode:"none"}}),h=e.createBindGroup({layout:d.getBindGroupLayout(0),entries:[{binding:0,resource:c.createView()},{binding:1,resource:s.createView()},{binding:2,resource:{buffer:n}}]}),T=e.createBindGroup({layout:l.getBindGroupLayout(0),entries:[{binding:0,resource:y},{binding:1,resource:s.createView()}]}),m={method:"Global Memory"},p={"Global Memory":0,"Shared Memory":1};new w({container:document.getElementById("gui-container"),title:"Blur Optimization"}).add(m,"method",Object.keys(p)).onChange(()=>{e.queue.writeBuffer(n,0,new Uint32Array([p[m.method]]))}),e.queue.writeBuffer(n,0,new Uint32Array([0]));function g(){const u=e.createCommandEncoder(),i=u.beginComputePass();i.setPipeline(d),i.setBindGroup(0,h),i.dispatchWorkgroups(Math.ceil(t.width/8),Math.ceil(t.height/8)),i.end();const o=u.beginRenderPass({colorAttachments:[{view:x.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});o.setPipeline(l),o.setBindGroup(0,T),o.draw(6),o.end(),e.queue.submit([u.finish()]),requestAnimationFrame(g)}requestAnimationFrame(g)}G().catch(console.error);
