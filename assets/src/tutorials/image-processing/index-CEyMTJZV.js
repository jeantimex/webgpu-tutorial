import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as h}from"../../../canvas-util-BGxJIWTK.js";import{i as G}from"../../../webgpu-util-BApOR-AX.js";import{G as C}from"../../../lil-gui.esm-CNIGZg2U.js";const A=`
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
`,I=`
struct RenderUniforms {
  imageAspect : f32,
  canvasAspect : f32,
  padding : vec2f,
}

@group(0) @binding(0) var mySampler : sampler;
@group(0) @binding(1) var myTexture : texture_2d<f32>;
@group(0) @binding(2) var<uniform> renderUniforms : RenderUniforms;

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
  var scale = vec2f(1.0, 1.0);
  if (renderUniforms.canvasAspect > renderUniforms.imageAspect) {
    scale.x = renderUniforms.imageAspect / renderUniforms.canvasAspect;
  } else {
    scale.y = renderUniforms.canvasAspect / renderUniforms.imageAspect;
  }

  out.position = vec4f(pos[vIdx] * scale, 0.0, 1.0);
  out.uv = uv[vIdx];
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  return textureSample(myTexture, mySampler, in.uv);
}
`;async function S(){const t=document.querySelector("#webgpu-canvas"),T="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/405px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",i=new Image;i.crossOrigin="anonymous",i.src=T,await i.decode();const r=await createImageBitmap(i),c=r.width/r.height;t.width=r.width,t.height=r.height,h(t);const{device:e,context:y,canvasFormat:b}=await G(t),d=e.createTexture({label:"Input Texture",size:[r.width,r.height],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});e.queue.copyExternalImageToTexture({source:r},{texture:d},[r.width,r.height]);const m=e.createTexture({label:"Output (Storage) Texture",size:[r.width,r.height],format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),U=e.createSampler({magFilter:"linear",minFilter:"linear"}),a=e.createBuffer({size:4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),u=e.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(u,0,new Float32Array([c,t.width/t.height,0,0]));const _=e.createShaderModule({code:A}),f=e.createComputePipeline({label:"Filter Compute Pipeline",layout:"auto",compute:{module:_,entryPoint:"cs_main"}}),p=e.createShaderModule({code:I}),l=e.createRenderPipeline({label:"Texture Render Pipeline",layout:"auto",vertex:{module:p,entryPoint:"vs_main"},fragment:{module:p,entryPoint:"fs_main",targets:[{format:b}]},primitive:{topology:"triangle-strip"}}),w=e.createBindGroup({layout:f.getBindGroupLayout(0),entries:[{binding:0,resource:d.createView()},{binding:1,resource:m.createView()},{binding:2,resource:{buffer:a}}]}),B=e.createBindGroup({layout:l.getBindGroupLayout(0),entries:[{binding:0,resource:U},{binding:1,resource:m.createView()},{binding:2,resource:{buffer:u}}]}),g={filter:"None"},v={None:0,Grayscale:1,Invert:2,Blur:3};new C({container:document.getElementById("gui-container"),title:"Filter Settings"}).add(g,"filter",Object.keys(v)).onChange(()=>{e.queue.writeBuffer(a,0,new Uint32Array([v[g.filter]]))}),e.queue.writeBuffer(a,0,new Uint32Array([0]));function x(){h(t)&&e.queue.writeBuffer(u,0,new Float32Array([c,t.width/t.height,0,0]));const s=e.createCommandEncoder(),o=s.beginComputePass();o.setPipeline(f),o.setBindGroup(0,w),o.dispatchWorkgroups(Math.ceil(r.width/8),Math.ceil(r.height/8)),o.end();const P=y.getCurrentTexture().createView(),n=s.beginRenderPass({colorAttachments:[{view:P,loadOp:"clear",storeOp:"store",clearValue:{r:.3,g:.3,b:.3,a:1}}]});n.setPipeline(l),n.setBindGroup(0,B),n.draw(4),n.end(),e.queue.submit([s.finish()]),requestAnimationFrame(x)}requestAnimationFrame(x)}S().catch(console.error);
