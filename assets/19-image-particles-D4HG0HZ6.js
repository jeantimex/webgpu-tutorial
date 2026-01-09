import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as I}from"./webgpu-util-BApOR-AX.js";import{G as L}from"./lil-gui.esm-CNIGZg2U.js";const V=`
struct Particle {
  pos : vec2f,
  targetPos : vec2f,
  color : vec3f,
  size : f32,
}

struct Params {
  speed : f32,
  scatter : f32, // 0.0 = Assemble, 1.0 = Scatter
  time : f32,
}

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(0) @binding(1) var<uniform> params : Params;

// Simple random function
fn rand(co: vec2f) -> f32 {
    return fract(sin(dot(co, vec2f(12.9898, 78.233))) * 43758.5453);
}

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let index = id.x;
  if (index >= arrayLength(&particles)) { return; }

  var p = particles[index];
  
  // Create a scattered destination based on index
  let seed = f32(index);
  let scatteredPos = vec2f(
    rand(vec2f(seed, 1.0)) * 2.0 - 1.0,
    rand(vec2f(seed, 2.0)) * 2.0 - 1.0
  );

  // Determine current destination based on the "scatter" parameter
  let destination = mix(p.targetPos, scatteredPos, params.scatter);

  // Move towards destination (Lerp)
  p.pos = mix(p.pos, destination, params.speed);

  particles[index] = p;
}
`,q=`
struct Particle {
  pos : vec2f,
  targetPos : vec2f,
  color : vec3f,
  size : f32,
}

struct Uniforms {
  aspectRatio : f32,
}

@group(0) @binding(0) var<storage, read> particles : array<Particle>;
@group(0) @binding(1) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
}

@vertex
fn vs_main(
  @builtin(vertex_index) vIdx : u32,
  @builtin(instance_index) iIdx : u32
) -> VertexOutput {
  let p = particles[iIdx];

  var corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f( 1.0, -1.0), vec2f(-1.0,  1.0),
    vec2f(-1.0,  1.0), vec2f( 1.0, -1.0), vec2f( 1.0,  1.0)
  );
  
  let cornerPos = corners[vIdx] * p.size; 
  
  // Apply Aspect Ratio Correction to the entire X coordinate
  // This keeps both the particles and the overall image from stretching
  let finalPos = vec2f((p.pos.x + cornerPos.x) / uniforms.aspectRatio, p.pos.y + cornerPos.y);

  var out : VertexOutput;
  out.position = vec4f(finalPos, 0.0, 1.0);
  out.color = vec4f(p.color, 1.0);
  
  return out;
}

@fragment
fn fs_main(@location(0) color : vec4f) -> @location(0) vec4f {
  return color;
}
`;async function z(){const s=document.querySelector("#webgpu-canvas"),v=document.getElementById("loading-overlay");v.style.display="block";const{device:e,context:U,canvasFormat:G}=await I(s),M="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/405px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",c=new Image;c.crossOrigin="anonymous",c.src=M,await c.decode();const l=document.createElement("canvas"),P=l.getContext("2d",{willReadFrequently:!0}),a=250,n=375;l.width=a,l.height=n,P.drawImage(c,0,0,a,n);const m=P.getImageData(0,0,a,n).data,u=a*n,A=a/n,y=8,r=new Float32Array(u*y);for(let o=0;o<u;o++){const t=o*y,i=o%a,g=Math.floor(o/a);r[t+0]=Math.random()*2-1,r[t+1]=Math.random()*2-1,r[t+2]=(i/a-.5)*(1.2*A),r[t+3]=(.5-g/n)*1.2,r[t+4]=m[o*4+0]/255,r[t+5]=m[o*4+1]/255,r[t+6]=m[o*4+2]/255,r[t+7]=.003}const d=e.createBuffer({label:"Mona Lisa Particles",size:r.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});new Float32Array(d.getMappedRange()).set(r),d.unmap();const R=s.width/s.height,b=e.createBuffer({size:4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(b,0,new Float32Array([R]));const h=e.createBuffer({size:12,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),O=e.createShaderModule({code:V}),_=e.createComputePipeline({layout:"auto",compute:{module:O,entryPoint:"cs_main"}}),x=e.createShaderModule({code:q}),w=e.createRenderPipeline({layout:"auto",vertex:{module:x,entryPoint:"vs_main"},fragment:{module:x,entryPoint:"fs_main",targets:[{format:G}]},primitive:{topology:"triangle-list"}}),S=e.createBindGroup({layout:_.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:d}},{binding:1,resource:{buffer:h}}]}),F=e.createBindGroup({layout:w.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:d}},{binding:1,resource:{buffer:b}}]}),f={speed:.02,scatter:0},B=new L({container:document.getElementById("gui-container"),title:"Mona Lisa Controls"});B.add(f,"speed",.005,.1).name("Assembly Speed"),B.add(f,"scatter",0,1).name("Scatter Amount"),v.style.display="none";function C(o){e.queue.writeBuffer(h,0,new Float32Array([f.speed,f.scatter,o/1e3]));const t=e.createCommandEncoder(),i=t.beginComputePass();i.setPipeline(_),i.setBindGroup(0,S),i.dispatchWorkgroups(Math.ceil(u/64)),i.end();const g=U.getCurrentTexture().createView(),p=t.beginRenderPass({colorAttachments:[{view:g,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]});p.setPipeline(w),p.setBindGroup(0,F),p.draw(6,u),p.end(),e.queue.submit([t.finish()]),requestAnimationFrame(C)}requestAnimationFrame(C)}z().catch(s=>{console.error(s)});
