import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{i as B}from"../../../webgpu-util-BApOR-AX.js";import{G as C}from"../../../lil-gui.esm-CNIGZg2U.js";const G=`
struct Particle {
  pos : vec2f,
  vel : vec2f,
  color : vec3f, // Random color
  size : f32,
}

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;

@compute @workgroup_size(64)
fn cs_main( @builtin(global_invocation_id) id : vec3u) {
  let index = id.x;
  if (index >= arrayLength(&particles)) { return; }

  var p = particles[index];
  
  // 1. Update Position
  p.pos += p.vel;

  // 2. Collision Detection (Dynamic size check)
  let limit = 1.0 - p.size; 

  if (p.pos.x > limit) { p.pos.x = limit; p.vel.x *= -1.0; } 
  else if (p.pos.x < -limit) { p.pos.x = -limit; p.vel.x *= -1.0; }

  if (p.pos.y > limit) { p.pos.y = limit; p.vel.y *= -1.0; } 
  else if (p.pos.y < -limit) { p.pos.y = -limit; p.vel.y *= -1.0; }

  particles[index] = p;
}
`,w=`
struct Particle {
  pos : vec2f,
  vel : vec2f,
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

  // A simple quad (2 triangles) centered at (0,0)
  var corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f( 1.0, -1.0), vec2f(-1.0,  1.0),
    vec2f(-1.0,  1.0), vec2f( 1.0, -1.0), vec2f( 1.0,  1.0)
  );
  
  // Scale by particle size
  let cornerPos = corners[vIdx] * p.size; 
  
  // Apply Aspect Ratio Correction to the offset only (to keep the particle square)
  // We divide X by aspect ratio so that a unit width in X matches visual width in Y
  let correctedCorner = vec2f(cornerPos.x / uniforms.aspectRatio, cornerPos.y);

  let finalPos = p.pos + correctedCorner;

  var out : VertexOutput;
  out.position = vec4f(finalPos, 0.0, 1.0);
  out.color = vec4f(p.color, 1.0);
  
  return out;
}

@fragment
fn fs_main( @location(0) color : vec4f) -> @location(0) vec4f {
  return color;
}
`;async function M(){const c=document.querySelector("#webgpu-canvas"),{device:t,context:P,canvasFormat:y}=await B(c),b=c.width/c.height,l=t.createBuffer({label:"Uniform Buffer",size:4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(l,0,new Float32Array([b]));const h=t.createShaderModule({label:"Compute Shader",code:G}),u=t.createComputePipeline({label:"Particle Compute Pipeline",layout:"auto",compute:{module:h,entryPoint:"cs_main"}}),p=t.createShaderModule({label:"Render Shader",code:w}),d=t.createRenderPipeline({label:"Particle Render Pipeline",layout:"auto",vertex:{module:p,entryPoint:"vs_main",buffers:[]},fragment:{module:p,entryPoint:"fs_main",targets:[{format:y}]},primitive:{topology:"triangle-list"}});let n,f,m,s=100;function v(r){n&&n.destroy(),s=r;const a=8,e=new Float32Array(r*a);for(let i=0;i<r;i++){const o=i*a;e[o+0]=(Math.random()-.5)*1.5,e[o+1]=(Math.random()-.5)*1.5,e[o+2]=(Math.random()-.5)*.02,e[o+3]=(Math.random()-.5)*.02,e[o+4]=Math.random(),e[o+5]=Math.random(),e[o+6]=Math.random(),e[o+7]=.005+Math.random()*.01}n=t.createBuffer({label:"Particle System Buffer",size:e.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,mappedAtCreation:!0}),new Float32Array(n.getMappedRange()).set(e),n.unmap(),f=t.createBindGroup({label:"Compute BindGroup",layout:u.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:n}}]}),m=t.createBindGroup({label:"Render BindGroup",layout:d.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:n}},{binding:1,resource:{buffer:l}}]})}v(100);const x={particleCount:100};new C({container:document.getElementById("gui-container"),title:"Particle Settings"}).add(x,"particleCount",[1,10,100,1e3,1e4,1e5,1e6]).name("Particle Count").onChange(r=>{v(r)});function g(){const r=t.createCommandEncoder(),a=r.beginComputePass();a.setPipeline(u),a.setBindGroup(0,f),a.dispatchWorkgroups(Math.ceil(s/64)),a.end();const e=P.getCurrentTexture().createView(),i=r.beginRenderPass({colorAttachments:[{view:e,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]});i.setPipeline(d),i.setBindGroup(0,m),i.draw(6,s),i.end(),t.queue.submit([r.finish()]),requestAnimationFrame(g)}requestAnimationFrame(g)}M().catch(c=>{console.error(c)});
