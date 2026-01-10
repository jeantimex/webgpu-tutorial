import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as I}from"./webgpu-util-BApOR-AX.js";import{G as w}from"./lil-gui.esm-CNIGZg2U.js";const _=`
struct Boid {
  pos : vec2f,
  vel : vec2f,
}

struct Params {
  cohesion : f32,
  alignment : f32,
  separation : f32,
  visualRange : f32,
  speedFactor : f32,
}

@group(0) @binding(0) var<storage, read> boidsIn : array<Boid>;
@group(0) @binding(1) var<storage, read_write> boidsOut : array<Boid>;
@group(0) @binding(2) var<uniform> params : Params;

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let index = id.x;
  if (index >= arrayLength(&boidsIn)) { return; }

  var boid = boidsIn[index];
  
  var center = vec2f(0.0, 0.0);
  var avgVel = vec2f(0.0, 0.0);
  var close = vec2f(0.0, 0.0);
  var neighbors = 0.0;

  let separationDistance = 0.05;

  for (var i = 0u; i < arrayLength(&boidsIn); i++) {
    if (i == index) { continue; }
    
    let other = boidsIn[i];
    let dist = distance(boid.pos, other.pos);

    if (dist < params.visualRange) {
      // 1. Cohesion (Stay together)
      center += other.pos;
      
      // 2. Alignment (Match speed)
      avgVel += other.vel;
      
      neighbors += 1.0;
    }

    // 3. Separation (Don't crash)
    if (dist < separationDistance) {
      close += (boid.pos - other.pos);
    }
  }

  if (neighbors > 0.0) {
    center /= neighbors;
    avgVel /= neighbors;

    // Apply weights from GUI
    boid.vel += (center - boid.pos) * params.cohesion;
    boid.vel += (avgVel - boid.vel) * params.alignment;
  }
  
  boid.vel += close * params.separation;

  // Speed limits
  let maxSpeed = 0.02;
  let minSpeed = 0.005;
  let speed = length(boid.vel);
  if (speed > maxSpeed) {
    boid.vel = (boid.vel / speed) * maxSpeed;
  } else if (speed < minSpeed) {
    boid.vel = (boid.vel / speed) * minSpeed;
  }

  // Update position with speed factor
  boid.pos += boid.vel * params.speedFactor;

  // Screen wrap (Toroidal)
  if (boid.pos.x > 1.0) { boid.pos.x = -1.0; }
  if (boid.pos.x < -1.0) { boid.pos.x = 1.0; }
  if (boid.pos.y > 1.0) { boid.pos.y = -1.0; }
  if (boid.pos.y < -1.0) { boid.pos.y = 1.0; }

  boidsOut[index] = boid;
}
`,A=`
struct Boid {
  pos : vec2f,
  vel : vec2f,
}

@group(0) @binding(0) var<storage, read> boids : array<Boid>;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
}

@vertex
fn vs_main(
  @builtin(vertex_index) vIdx : u32,
  @builtin(instance_index) iIdx : u32
) -> VertexOutput {
  let boid = boids[iIdx];
  let angle = atan2(boid.vel.y, boid.vel.x);
  
  // A small triangle pointing in the direction of velocity
  var pos = array<vec2f, 3>(
    vec2f( 0.02,  0.0), // Tip
    vec2f(-0.015,  0.01), // Bottom Left
    vec2f(-0.015, -0.01)  // Bottom Right
  );

  // Rotate triangle
  let rotated = vec2f(
    pos[vIdx].x * cos(angle) - pos[vIdx].y * sin(angle),
    pos[vIdx].x * sin(angle) + pos[vIdx].y * cos(angle)
  );

  var out : VertexOutput;
  out.position = vec4f(boid.pos + rotated, 0.0, 1.0);
  
  // Color based on velocity
  out.color = vec4f(0.5 + boid.vel.x * 20.0, 0.5 + boid.vel.y * 20.0, 1.0, 1.0);
  return out;
}

@fragment
fn fs_main(@location(0) color : vec4f) -> @location(0) vec4f {
  return color;
}
`;async function U(){const v=document.querySelector("#webgpu-canvas"),{device:e,context:h,canvasFormat:y}=await I(v),r=1500,t=new Float32Array(r*4);for(let i=0;i<r;i++)t[i*4+0]=Math.random()*2-1,t[i*4+1]=Math.random()*2-1,t[i*4+2]=(Math.random()-.5)*.01,t[i*4+3]=(Math.random()-.5)*.01;const b=()=>e.createBuffer({size:t.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),a=b(),c=b();e.queue.writeBuffer(a,0,t);const u=e.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),B=e.createShaderModule({code:_}),p=e.createComputePipeline({layout:"auto",compute:{module:B,entryPoint:"cs_main"}}),g=e.createShaderModule({code:A}),l=e.createRenderPipeline({layout:"auto",vertex:{module:g,entryPoint:"vs_main"},fragment:{module:g,entryPoint:"fs_main",targets:[{format:y}]},primitive:{topology:"triangle-list"}}),x=e.createBindGroup({layout:p.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:a}},{binding:1,resource:{buffer:c}},{binding:2,resource:{buffer:u}}]}),G=e.createBindGroup({layout:p.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:a}},{binding:2,resource:{buffer:u}}]}),P=e.createBindGroup({layout:l.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:a}}]}),S=e.createBindGroup({layout:l.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]}),o={cohesion:.02,alignment:.05,separation:.05,visualRange:.15,speed:1},n=new w({container:document.getElementById("gui-container"),title:"Boid Logic"});n.add(o,"cohesion",0,.1),n.add(o,"alignment",0,.1),n.add(o,"separation",0,.1),n.add(o,"visualRange",0,.5),n.add(o,"speed",0,2).name("Animation Speed");let f=0;function m(){e.queue.writeBuffer(u,0,new Float32Array([o.cohesion,o.alignment,o.separation,o.visualRange,o.speed]));const i=e.createCommandEncoder(),s=i.beginComputePass();s.setPipeline(p),s.setBindGroup(0,f%2===0?x:G),s.dispatchWorkgroups(Math.ceil(r/64)),s.end();const d=i.beginRenderPass({colorAttachments:[{view:h.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",clearValue:{r:.05,g:.05,b:.1,a:1}}]});d.setPipeline(l),d.setBindGroup(0,f%2===0?S:P),d.draw(3,r),d.end(),e.queue.submit([i.finish()]),f++,requestAnimationFrame(m)}requestAnimationFrame(m)}U().catch(console.error);
