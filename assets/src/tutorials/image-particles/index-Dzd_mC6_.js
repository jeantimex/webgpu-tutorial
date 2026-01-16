import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as C}from"../../../canvas-util-BGxJIWTK.js";import{i as I}from"../../../webgpu-util-BApOR-AX.js";const q=`
struct Particle {
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
`,D=`
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
`;async function V(){const a=document.querySelector("#webgpu-canvas"),P=document.getElementById("loading-overlay");P.style.display="block";const{device:e,context:M,canvasFormat:U}=await I(a),G="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/405px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",f=new Image;f.crossOrigin="anonymous",f.src=G,await f.decode();const l=document.createElement("canvas"),y=l.getContext("2d",{willReadFrequently:!0}),n=250,i=375;l.width=n,l.height=i,y.drawImage(f,0,0,n,i);const m=y.getImageData(0,0,n,i).data,c=n*i,R=n/i,h=document.getElementById("particle-count");h&&(h.innerText=`${c.toLocaleString()} particles`);const g=8,r=new Float32Array(c*g);for(let t=0;t<c;t++){const o=t*g,d=t%n,s=Math.floor(t/n);r[o+0]=Math.random()*4-2,r[o+1]=Math.random()*4-2,r[o+2]=(d/n-.5)*(1.2*R),r[o+3]=(.5-s/i)*1.2,r[o+4]=m[t*4+0]/255,r[o+5]=m[t*4+1]/255,r[o+6]=m[t*4+2]/255,r[o+7]=.004}const u=e.createBuffer({label:"Mona Lisa Particles",size:r.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});new Float32Array(u.getMappedRange()).set(r),u.unmap(),C(a);const A=a.width/a.height,v=e.createBuffer({size:4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(v,0,new Float32Array([A]));const _=e.createBuffer({size:8,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),F=e.createShaderModule({code:q}),b=e.createComputePipeline({layout:"auto",compute:{module:F,entryPoint:"cs_main"}}),w=e.createShaderModule({code:D}),x=e.createRenderPipeline({layout:"auto",vertex:{module:w,entryPoint:"vs_main"},fragment:{module:w,entryPoint:"fs_main",targets:[{format:U}]},primitive:{topology:"triangle-list"}}),O=e.createBindGroup({layout:b.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:u}},{binding:1,resource:{buffer:_}}]}),L=e.createBindGroup({layout:x.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:u}},{binding:1,resource:{buffer:v}}]});P.style.display="none";const S=.02;a.addEventListener("click",()=>{for(let t=0;t<c;t++){const o=t*g;r[o+0]=Math.random()*4-2,r[o+1]=Math.random()*4-2}e.queue.writeBuffer(u,0,r)});function B(t){C(a)&&e.queue.writeBuffer(v,0,new Float32Array([a.width/a.height])),e.queue.writeBuffer(_,0,new Float32Array([S,t/1e3]));const d=e.createCommandEncoder(),s=d.beginComputePass();s.setPipeline(b),s.setBindGroup(0,O),s.dispatchWorkgroups(Math.ceil(c/64)),s.end();const z=M.getCurrentTexture().createView(),p=d.beginRenderPass({colorAttachments:[{view:z,clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]});p.setPipeline(x),p.setBindGroup(0,L),p.draw(6,c),p.end(),e.queue.submit([d.finish()]),requestAnimationFrame(B)}requestAnimationFrame(B)}V().catch(a=>{console.error(a)});
