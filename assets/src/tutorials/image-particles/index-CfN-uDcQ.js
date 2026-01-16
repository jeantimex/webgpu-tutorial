import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{i as I}from"../../../webgpu-util-BApOR-AX.js";const S=`
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
`;async function V(){const a=document.querySelector("#webgpu-canvas"),v=document.getElementById("loading-overlay");v.style.display="block";const{device:t,context:M,canvasFormat:U}=await I(a),C="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/405px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",d=new Image;d.crossOrigin="anonymous",d.src=C,await d.decode();const f=document.createElement("canvas"),P=f.getContext("2d",{willReadFrequently:!0}),n=250,i=375;f.width=n,f.height=i,P.drawImage(d,0,0,n,i);const l=P.getImageData(0,0,n,i).data,c=n*i,G=n/i,y=document.getElementById("particle-count");y&&(y.innerText=`${c.toLocaleString()} particles`);const m=8,o=new Float32Array(c*m);for(let r=0;r<c;r++){const e=r*m,s=r%n,g=Math.floor(r/n);o[e+0]=Math.random()*4-2,o[e+1]=Math.random()*4-2,o[e+2]=(s/n-.5)*(1.2*G),o[e+3]=(.5-g/i)*1.2,o[e+4]=l[r*4+0]/255,o[e+5]=l[r*4+1]/255,o[e+6]=l[r*4+2]/255,o[e+7]=.004}const u=t.createBuffer({label:"Mona Lisa Particles",size:o.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});new Float32Array(u.getMappedRange()).set(o),u.unmap();const R=a.width/a.height,_=t.createBuffer({size:4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(_,0,new Float32Array([R]));const b=t.createBuffer({size:8,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),O=t.createShaderModule({code:S}),h=t.createComputePipeline({layout:"auto",compute:{module:O,entryPoint:"cs_main"}}),x=t.createShaderModule({code:q}),w=t.createRenderPipeline({layout:"auto",vertex:{module:x,entryPoint:"vs_main"},fragment:{module:x,entryPoint:"fs_main",targets:[{format:U}]},primitive:{topology:"triangle-list"}}),A=t.createBindGroup({layout:h.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:u}},{binding:1,resource:{buffer:b}}]}),F=t.createBindGroup({layout:w.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:u}},{binding:1,resource:{buffer:_}}]});v.style.display="none";const L=.02;a.addEventListener("click",()=>{for(let r=0;r<c;r++){const e=r*m;o[e+0]=Math.random()*4-2,o[e+1]=Math.random()*4-2}t.queue.writeBuffer(u,0,o)});function B(r){t.queue.writeBuffer(b,0,new Float32Array([L,r/1e3]));const e=t.createCommandEncoder(),s=e.beginComputePass();s.setPipeline(h),s.setBindGroup(0,A),s.dispatchWorkgroups(Math.ceil(c/64)),s.end();const g=M.getCurrentTexture().createView(),p=e.beginRenderPass({colorAttachments:[{view:g,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]});p.setPipeline(w),p.setBindGroup(0,F),p.draw(6,c),p.end(),t.queue.submit([e.finish()]),requestAnimationFrame(B)}requestAnimationFrame(B)}V().catch(a=>{console.error(a)});
