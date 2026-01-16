import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{r as _}from"../../../canvas-util-6cCf-wah.js";import{i as C}from"../../../webgpu-util-BApOR-AX.js";import{G as R}from"../../../lil-gui.esm-CNIGZg2U.js";const V=`
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
`,I=`
struct RenderUniforms {
  simAspect : f32,
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
  var pos = array<vec2f, 4>(
    vec2f(-1.0, -1.0), vec2f( 1.0, -1.0),
    vec2f(-1.0,  1.0), vec2f( 1.0,  1.0)
  );
  var uv = array<vec2f, 4>(
    vec2f(0.0, 1.0), vec2f(1.0, 1.0),
    vec2f(0.0, 0.0), vec2f(1.0, 0.0)
  );

  var out : VertexOutput;
  var scale = vec2f(1.0, 1.0);
  if (renderUniforms.canvasAspect > renderUniforms.simAspect) {
    scale.x = renderUniforms.simAspect / renderUniforms.canvasAspect;
  } else {
    scale.y = renderUniforms.canvasAspect / renderUniforms.simAspect;
  }

  out.position = vec4f(pos[vIdx] * scale, 0.0, 1.0);
  out.uv = uv[vIdx];
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let color = textureSample(myTexture, mySampler, in.uv).r;
  // Make it look green/matrix style
  return vec4f(0.0, color, 0.0, 1.0);
}
`;async function N(){const n=document.querySelector("#webgpu-canvas"),{device:e,context:G,canvasFormat:U}=await C(n),t=512,a=512,g=()=>e.createTexture({size:[t,a],format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),s=g(),m=g(),r=new Uint8Array(t*a*4);for(let i=0;i<r.length;i+=4){const o=Math.random()>.8?255:0;r[i]=o,r[i+1]=o,r[i+2]=o,r[i+3]=255}e.queue.writeTexture({texture:s},r,{bytesPerRow:t*4},[t,a]);const B=e.createShaderModule({code:V}),l=e.createComputePipeline({layout:"auto",compute:{module:B,entryPoint:"cs_main"}}),v=e.createShaderModule({code:I}),p=e.createRenderPipeline({layout:"auto",vertex:{module:v,entryPoint:"vs_main"},fragment:{module:v,entryPoint:"fs_main",targets:[{format:U}]},primitive:{topology:"triangle-strip"}}),x=e.createSampler(),P=e.createBindGroup({layout:l.getBindGroupLayout(0),entries:[{binding:0,resource:s.createView()},{binding:1,resource:m.createView()}]}),S=e.createBindGroup({layout:l.getBindGroupLayout(0),entries:[{binding:0,resource:m.createView()},{binding:1,resource:s.createView()}]}),c=e.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(c,0,new Float32Array([1,n.width/n.height,0,0]));const T=e.createBindGroup({layout:p.getBindGroupLayout(0),entries:[{binding:0,resource:x},{binding:1,resource:s.createView()},{binding:2,resource:{buffer:c}}]}),A=e.createBindGroup({layout:p.getBindGroupLayout(0),entries:[{binding:0,resource:x},{binding:1,resource:m.createView()},{binding:2,resource:{buffer:c}}]}),b={running:!0},y=new R({container:document.getElementById("gui-container"),title:"Life Controls"});y.add(b,"running").name("Running"),y.add({reset:()=>{e.queue.writeTexture({texture:s},r,{bytesPerRow:t*4},[t,a])}},"reset").name("Reset Simulation");let f=0;function h(){if(_(n)&&e.queue.writeBuffer(c,0,new Float32Array([1,n.width/n.height,0,0])),b.running){const w=e.createCommandEncoder(),u=w.beginComputePass();u.setPipeline(l),f%2===0?u.setBindGroup(0,P):u.setBindGroup(0,S),u.dispatchWorkgroups(t/8,a/8),u.end(),e.queue.submit([w.finish()]),f++}const o=e.createCommandEncoder(),d=o.beginRenderPass({colorAttachments:[{view:G.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});d.setPipeline(p),d.setBindGroup(0,f%2===0?T:A),d.draw(4),d.end(),e.queue.submit([o.finish()]),requestAnimationFrame(h)}requestAnimationFrame(h)}N().catch(console.error);
