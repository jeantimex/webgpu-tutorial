import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as P}from"../../../canvas-util-BFZcuyXb.js";import{i as C}from"../../../webgpu-util-BApOR-AX.js";import{G}from"../../../lil-gui.esm-CNIGZg2U.js";const w=`struct Particle {
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
`,S=`struct Particle {
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
`,M=w,U=S;async function _(){const r=document.querySelector("#webgpu-canvas"),{device:t,context:y,canvasFormat:h}=await C(r);P(r);const b=r.width/r.height,s=t.createBuffer({label:"Uniform Buffer",size:4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(s,0,new Float32Array([b]));const x=t.createShaderModule({label:"Compute Shader",code:M}),u=t.createComputePipeline({label:"Particle Compute Pipeline",layout:"auto",compute:{module:x,entryPoint:"cs_main"}}),p=t.createShaderModule({label:"Render Shader",code:U}),d=t.createRenderPipeline({label:"Particle Render Pipeline",layout:"auto",vertex:{module:p,entryPoint:"vs_main",buffers:[]},fragment:{module:p,entryPoint:"fs_main",targets:[{format:h}]},primitive:{topology:"triangle-list"}});let i,f,m,l=100;function v(o){i&&i.destroy(),l=o;const a=8,e=new Float32Array(o*a);for(let c=0;c<o;c++){const n=c*a;e[n+0]=(Math.random()-.5)*1.5,e[n+1]=(Math.random()-.5)*1.5,e[n+2]=(Math.random()-.5)*.02,e[n+3]=(Math.random()-.5)*.02,e[n+4]=Math.random(),e[n+5]=Math.random(),e[n+6]=Math.random(),e[n+7]=.005+Math.random()*.01}i=t.createBuffer({label:"Particle System Buffer",size:e.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,mappedAtCreation:!0}),new Float32Array(i.getMappedRange()).set(e),i.unmap(),f=t.createBindGroup({label:"Compute BindGroup",layout:u.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i}}]}),m=t.createBindGroup({label:"Render BindGroup",layout:d.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i}},{binding:1,resource:{buffer:s}}]})}v(100);const B={particleCount:100};new G({container:document.getElementById("gui-container"),title:"Particle Settings"}).add(B,"particleCount",[1,10,100,1e3,1e4,1e5,1e6]).name("Particle Count").onChange(o=>{v(o)});function g(){P(r)&&t.queue.writeBuffer(s,0,new Float32Array([r.width/r.height]));const a=t.createCommandEncoder(),e=a.beginComputePass();e.setPipeline(u),e.setBindGroup(0,f),e.dispatchWorkgroups(Math.ceil(l/64)),e.end();const c=y.getCurrentTexture().createView(),n=a.beginRenderPass({colorAttachments:[{view:c,clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]});n.setPipeline(d),n.setBindGroup(0,m),n.draw(6,l),n.end(),t.queue.submit([a.finish()]),requestAnimationFrame(g)}requestAnimationFrame(g)}_().catch(r=>{console.error(r)});
