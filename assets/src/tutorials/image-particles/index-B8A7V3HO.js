import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as C}from"../../../canvas-util-BFZcuyXb.js";import{i as I}from"../../../webgpu-util-BApOR-AX.js";const q=`struct Particle {
  pos : vec2f,
  targetPos : vec2f,
  color : vec3f,
  size : f32,
}

struct Params {
  speed : f32,
  time : f32,
}

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(0) @binding(1) var<uniform> params : Params;

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let index = id.x;
  if (index >= arrayLength(&particles)) { return; }

  var p = particles[index];
  
  // Move towards target position (Lerp)
  p.pos = mix(p.pos, p.targetPos, params.speed);

  particles[index] = p;
}
`,D=`struct Particle {
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
`,V=q,E=D;async function T(){const o=document.querySelector("#webgpu-canvas"),P=document.getElementById("loading-overlay");P.style.display="block";const{device:e,context:M,canvasFormat:U}=await I(o),G="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/405px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",f=new Image;f.crossOrigin="anonymous",f.src=G,await f.decode();const l=document.createElement("canvas"),y=l.getContext("2d",{willReadFrequently:!0}),a=250,i=375;l.width=a,l.height=i,y.drawImage(f,0,0,a,i);const m=y.getImageData(0,0,a,i).data,c=a*i,L=a/i,h=document.getElementById("particle-count");h&&(h.innerText=`${c.toLocaleString()} particles`);const g=8,t=new Float32Array(c*g);for(let n=0;n<c;n++){const r=n*g,d=n%a,s=Math.floor(n/a);t[r+0]=Math.random()*4-2,t[r+1]=Math.random()*4-2,t[r+2]=(d/a-.5)*(1.2*L),t[r+3]=(.5-s/i)*1.2,t[r+4]=m[n*4+0]/255,t[r+5]=m[n*4+1]/255,t[r+6]=m[n*4+2]/255,t[r+7]=.004}const u=e.createBuffer({label:"Mona Lisa Particles",size:t.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});new Float32Array(u.getMappedRange()).set(t),u.unmap(),C(o);const R=o.width/o.height,v=e.createBuffer({size:4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(v,0,new Float32Array([R]));const _=e.createBuffer({size:8,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),S=e.createShaderModule({code:V}),b=e.createComputePipeline({layout:"auto",compute:{module:S,entryPoint:"cs_main"}}),w=e.createShaderModule({code:E}),x=e.createRenderPipeline({layout:"auto",vertex:{module:w,entryPoint:"vs_main"},fragment:{module:w,entryPoint:"fs_main",targets:[{format:U}]},primitive:{topology:"triangle-list"}}),A=e.createBindGroup({layout:b.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:u}},{binding:1,resource:{buffer:_}}]}),F=e.createBindGroup({layout:x.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:u}},{binding:1,resource:{buffer:v}}]});P.style.display="none";const O=.02;o.addEventListener("click",()=>{for(let n=0;n<c;n++){const r=n*g;t[r+0]=Math.random()*4-2,t[r+1]=Math.random()*4-2}e.queue.writeBuffer(u,0,t)});function B(n){C(o)&&e.queue.writeBuffer(v,0,new Float32Array([o.width/o.height])),e.queue.writeBuffer(_,0,new Float32Array([O,n/1e3]));const d=e.createCommandEncoder(),s=d.beginComputePass();s.setPipeline(b),s.setBindGroup(0,A),s.dispatchWorkgroups(Math.ceil(c/64)),s.end();const z=M.getCurrentTexture().createView(),p=d.beginRenderPass({colorAttachments:[{view:z,clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]});p.setPipeline(x),p.setBindGroup(0,F),p.draw(6,c),p.end(),e.queue.submit([d.finish()]),requestAnimationFrame(B)}requestAnimationFrame(B)}T().catch(o=>{console.error(o)});
