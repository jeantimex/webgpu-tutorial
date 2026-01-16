import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{i as _}from"../../../webgpu-util-BApOR-AX.js";import{G as C}from"../../../lil-gui.esm-CNIGZg2U.js";const V=`
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
`,U=`
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
`;async function R(){const y=document.querySelector("#webgpu-canvas"),{device:e,context:h,canvasFormat:w}=await _(y),o=512,n=512,m=()=>e.createTexture({size:[o,n],format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),u=m(),c=m(),i=new Uint8Array(o*n*4);for(let t=0;t<i.length;t+=4){const r=Math.random()>.8?255:0;i[t]=r,i[t+1]=r,i[t+2]=r,i[t+3]=255}e.queue.writeTexture({texture:u},i,{bytesPerRow:o*4},[o,n]);const G=e.createShaderModule({code:V}),s=e.createComputePipeline({layout:"auto",compute:{module:G,entryPoint:"cs_main"}}),p=e.createShaderModule({code:U}),d=e.createRenderPipeline({layout:"auto",vertex:{module:p,entryPoint:"vs_main"},fragment:{module:p,entryPoint:"fs_main",targets:[{format:w}]},primitive:{topology:"triangle-strip"}}),v=e.createSampler(),S=e.createBindGroup({layout:s.getBindGroupLayout(0),entries:[{binding:0,resource:u.createView()},{binding:1,resource:c.createView()}]}),T=e.createBindGroup({layout:s.getBindGroupLayout(0),entries:[{binding:0,resource:c.createView()},{binding:1,resource:u.createView()}]}),P=e.createBindGroup({layout:d.getBindGroupLayout(0),entries:[{binding:0,resource:v},{binding:1,resource:u.createView()}]}),B=e.createBindGroup({layout:d.getBindGroupLayout(0),entries:[{binding:0,resource:v},{binding:1,resource:c.createView()}]}),g={running:!0},x=new C({container:document.getElementById("gui-container"),title:"Life Controls"});x.add(g,"running").name("Running"),x.add({reset:()=>{e.queue.writeTexture({texture:u},i,{bytesPerRow:o*4},[o,n])}},"reset").name("Reset Simulation");let l=0;function f(){if(g.running){const b=e.createCommandEncoder(),a=b.beginComputePass();a.setPipeline(s),l%2===0?a.setBindGroup(0,S):a.setBindGroup(0,T),a.dispatchWorkgroups(o/8,n/8),a.end(),e.queue.submit([b.finish()]),l++}const t=e.createCommandEncoder(),r=t.beginRenderPass({colorAttachments:[{view:h.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});r.setPipeline(d),r.setBindGroup(0,l%2===0?P:B),r.draw(4),r.end(),e.queue.submit([t.finish()]),requestAnimationFrame(f)}requestAnimationFrame(f)}R().catch(console.error);
