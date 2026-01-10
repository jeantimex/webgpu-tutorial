import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as P}from"./webgpu-util-BApOR-AX.js";import{G as B}from"./lil-gui.esm-CNIGZg2U.js";const G=`
struct Params {
  filterType : u32,
}

@group(0) @binding(0) var inputTex : texture_2d<f32>;
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> params : Params;

@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let dims = textureDimensions(inputTex);
  let coords = vec2i(id.xy);

  if (coords.x >= i32(dims.x) || coords.y >= i32(dims.y)) {
    return;
  }

  var color = textureLoad(inputTex, coords, 0);

  if (params.filterType == 1u) {
    // Grayscale
    let lum = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
    color = vec4f(lum, lum, lum, 1.0);
  } else if (params.filterType == 2u) {
    // Invert
    color = vec4f(1.0 - color.rgb, 1.0);
  } else if (params.filterType == 3u) {
    // Simple 3x3 Box Blur
    var acc = vec3f(0.0);
    for (var i = -1; i <= 1; i++) {
      for (var j = -1; j <= 1; j++) {
        let offsetCoords = clamp(coords + vec2i(i, j), vec2i(0), vec2i(dims) - 1);
        acc += textureLoad(inputTex, offsetCoords, 0).rgb;
      }
    }
    color = vec4f(acc / 9.0, 1.0);
  }

  textureStore(outputTex, coords, color);
}
`,U=`
@group(0) @binding(0) var mySampler : sampler;
@group(0) @binding(1) var myTexture : texture_2d<f32>;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
}

@vertex
fn vs_main(@builtin(vertex_index) vIdx : u32) -> VertexOutput {
  // Standard full-screen quad positions for triangle-strip
  var pos = array<vec2f, 4>(
    vec2f(-1.0, -1.0), // Bottom-Left
    vec2f( 1.0, -1.0), // Bottom-Right
    vec2f(-1.0,  1.0), // Top-Left
    vec2f( 1.0,  1.0)  // Top-Right
  );
  
  var uv = array<vec2f, 4>(
    vec2f(0.0, 1.0), // Bottom-Left
    vec2f(1.0, 1.0), // Bottom-Right
    vec2f(0.0, 0.0), // Top-Left
    vec2f(1.0, 0.0)  // Top-Right
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
`;async function C(){const n=document.querySelector("#webgpu-canvas"),v="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/405px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",r=new Image;r.crossOrigin="anonymous",r.src=v,await r.decode();const t=await createImageBitmap(r);n.width=t.width,n.height=t.height;const{device:e,context:x,canvasFormat:T}=await P(n),c=e.createTexture({label:"Input Texture",size:[t.width,t.height],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});e.queue.copyExternalImageToTexture({source:t},{texture:c},[t.width,t.height]);const s=e.createTexture({label:"Output (Storage) Texture",size:[t.width,t.height],format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),h=e.createSampler({magFilter:"linear",minFilter:"linear"}),a=e.createBuffer({size:4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),_=e.createShaderModule({code:G}),d=e.createComputePipeline({label:"Filter Compute Pipeline",layout:"auto",compute:{module:_,entryPoint:"cs_main"}}),l=e.createShaderModule({code:U}),m=e.createRenderPipeline({label:"Texture Render Pipeline",layout:"auto",vertex:{module:l,entryPoint:"vs_main"},fragment:{module:l,entryPoint:"fs_main",targets:[{format:T}]},primitive:{topology:"triangle-strip"}}),b=e.createBindGroup({layout:d.getBindGroupLayout(0),entries:[{binding:0,resource:c.createView()},{binding:1,resource:s.createView()},{binding:2,resource:{buffer:a}}]}),y=e.createBindGroup({layout:m.getBindGroupLayout(0),entries:[{binding:0,resource:h},{binding:1,resource:s.createView()}]}),p={filter:"None"},f={None:0,Grayscale:1,Invert:2,Blur:3};new B({container:document.getElementById("gui-container"),title:"Filter Settings"}).add(p,"filter",Object.keys(f)).onChange(()=>{e.queue.writeBuffer(a,0,new Uint32Array([f[p.filter]]))}),e.queue.writeBuffer(a,0,new Uint32Array([0]));function g(){const u=e.createCommandEncoder(),o=u.beginComputePass();o.setPipeline(d),o.setBindGroup(0,b),o.dispatchWorkgroups(Math.ceil(t.width/8),Math.ceil(t.height/8)),o.end();const w=x.getCurrentTexture().createView(),i=u.beginRenderPass({colorAttachments:[{view:w,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});i.setPipeline(m),i.setBindGroup(0,y),i.draw(4),i.end(),e.queue.submit([u.finish()]),requestAnimationFrame(g)}requestAnimationFrame(g)}C().catch(console.error);
