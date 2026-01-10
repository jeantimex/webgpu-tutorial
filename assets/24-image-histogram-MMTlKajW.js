import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as B}from"./webgpu-util-BApOR-AX.js";import{G as P}from"./lil-gui.esm-CNIGZg2U.js";const w=`
struct Params {
  channel : u32, // 0: Luminance, 1: Red, 2: Green, 3: Blue
}

@group(0) @binding(0) var inputTex : texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> histogram : array<atomic<u32>, 256>;
@group(0) @binding(2) var<uniform> params : Params;

@compute @workgroup_size(16, 16)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let dims = textureDimensions(inputTex);
  let coords = vec2i(id.xy);

  if (coords.x >= i32(dims.x) || coords.y >= i32(dims.y)) {
    return;
  }

  let color = textureLoad(inputTex, coords, 0);
  var value : f32;

  if (params.channel == 1u) {
    value = color.r;
  } else if (params.channel == 2u) {
    value = color.g;
  } else if (params.channel == 3u) {
    value = color.b;
  } else {
    // Luminance
    value = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  }

  // Map 0..1 to 0..255 bucket index
  let bucket = u32(clamp(value * 255.0, 0.0, 255.0));

  // ATOMIC OPERATION: Safely increment the bucket even if
  // thousands of threads are hitting it at once.
  atomicAdd(&histogram[bucket], 1u);
}
`,p=`
@group(0) @binding(0) var mySampler : sampler;
@group(0) @binding(1) var myTexture : texture_2d<f32>;
@group(0) @binding(2) var<storage, read> histogram : array<u32, 256>;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
  @location(1) @interpolate(flat) isBar : u32,
}

@vertex
fn vs_main(
  @builtin(vertex_index) vIdx : u32,
  @builtin(instance_index) iIdx : u32
) -> VertexOutput {
  var out : VertexOutput;

  // Instance 0 is the background image
  if (iIdx == 0u) {
    var pos = array<vec2f, 6>(
      vec2f(-1.0, -1.0), vec2f( 1.0, -1.0), vec2f(-1.0,  1.0),
      vec2f(-1.0,  1.0), vec2f( 1.0, -1.0), vec2f( 1.0,  1.0)
    );
    var uv = array<vec2f, 6>(
      vec2f(0.0, 1.0), vec2f(1.0, 1.0), vec2f(0.0, 0.0),
      vec2f(0.0, 0.0), vec2f(1.0, 1.0), vec2f(1.0, 0.0)
    );
    out.position = vec4f(pos[vIdx], 0.0, 1.0);
    out.uv = uv[vIdx];
    out.isBar = 0u;
  } 
  // Instances 1-256 are the histogram bars
  else {
    let bucketIdx = iIdx - 1u;
    let count = histogram[bucketIdx];
    
    // Normalize height
    let height = f32(count) / 10000.0; 
    
    let xStart = -0.9 + (f32(bucketIdx) / 256.0) * 1.8;
    let xEnd = xStart + (1.8 / 256.0);
    
    var barPos = array<vec2f, 6>(
      vec2f(xStart, -0.9), vec2f(xEnd, -0.9), vec2f(xStart, -0.9 + height),
      vec2f(xStart, -0.9 + height), vec2f(xEnd, -0.9), vec2f(xEnd, -0.9 + height)
    );
    
    out.position = vec4f(barPos[vIdx], 0.0, 1.0);
    out.uv = vec2f(0.0);
    out.isBar = 1u;
  }

  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let texColor = textureSample(myTexture, mySampler, in.uv);
  let barColor = vec4f(1.0, 1.0, 0.0, 0.8); // Yellow bars
  
  // Choose between texture and bar color
  // Note: textureSample MUST be outside the IF block for uniform control flow
  return select(texColor, barColor, in.isBar == 1u);
}
`;async function T(){const n=document.querySelector("#webgpu-canvas"),v="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/405px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",r=new Image;r.crossOrigin="anonymous",r.src=v,await r.decode();const t=await createImageBitmap(r);n.width=t.width,n.height=t.height;const{device:e,context:h,canvasFormat:x}=await B(n),u=e.createTexture({size:[t.width,t.height],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});e.queue.copyExternalImageToTexture({source:t},{texture:u},[t.width,t.height]);const c=e.createBuffer({label:"Histogram Buffer",size:256*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),s=e.createBuffer({size:4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),d=e.createComputePipeline({layout:"auto",compute:{module:e.createShaderModule({code:w}),entryPoint:"cs_main"}}),l=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:p}),entryPoint:"vs_main"},fragment:{module:e.createShaderModule({code:p}),entryPoint:"fs_main",targets:[{format:x}]},primitive:{topology:"triangle-list"}}),b=e.createSampler(),_=e.createBindGroup({layout:d.getBindGroupLayout(0),entries:[{binding:0,resource:u.createView()},{binding:1,resource:{buffer:c}},{binding:2,resource:{buffer:s}}]}),y=e.createBindGroup({layout:l.getBindGroupLayout(0),entries:[{binding:0,resource:b},{binding:1,resource:u.createView()},{binding:2,resource:{buffer:c}}]}),m={channel:"Luminance"},f={Luminance:0,Red:1,Green:2,Blue:3};new P({container:document.getElementById("gui-container"),title:"Histogram Settings"}).add(m,"channel",Object.keys(f)).onChange(()=>{e.queue.writeBuffer(s,0,new Uint32Array([f[m.channel]]))}),e.queue.writeBuffer(s,0,new Uint32Array([0]));function g(){const a=e.createCommandEncoder();a.clearBuffer(c);const o=a.beginComputePass();o.setPipeline(d),o.setBindGroup(0,_),o.dispatchWorkgroups(Math.ceil(t.width/16),Math.ceil(t.height/16)),o.end();const i=a.beginRenderPass({colorAttachments:[{view:h.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",clearValue:{r:.1,g:.1,b:.1,a:1}}]});i.setPipeline(l),i.setBindGroup(0,y),i.draw(6,257),i.end(),e.queue.submit([a.finish()]),requestAnimationFrame(g)}requestAnimationFrame(g)}T().catch(console.error);
