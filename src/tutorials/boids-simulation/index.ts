import { initWebGPU } from "../../utils/webgpu-util";
import GUI from "lil-gui";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";

// ==========================================
// 1. Compute Shader (The Brains of the Boids)
// ==========================================
const computeShaderCode = `
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
`;

// ==========================================
// 2. Render Shader (Draw them as Triangles)
// ==========================================
const renderShaderCode = `
struct Boid {
  pos : vec2f,
  vel : vec2f,
}

struct RenderUniforms {
  values : vec4f,
}

@group(0) @binding(0) var<storage, read> boids : array<Boid>;
@group(0) @binding(1) var<uniform> renderUniforms : RenderUniforms;

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

  var finalPos = boid.pos + rotated;
  let aspectRatio = renderUniforms.values.x;
  if (aspectRatio > 1.0) {
    finalPos = vec2f(finalPos.x / aspectRatio, finalPos.y);
  } else {
    finalPos = vec2f(finalPos.x, finalPos.y * aspectRatio);
  }

  var out : VertexOutput;
  out.position = vec4f(finalPos, 0.0, 1.0);
  
  // Color based on velocity
  out.color = vec4f(0.5 + boid.vel.x * 20.0, 0.5 + boid.vel.y * 20.0, 1.0, 1.0);
  return out;
}

@fragment
fn fs_main(@location(0) color : vec4f) -> @location(0) vec4f {
  return color;
}
`;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  const numBoids = 1500;
  
  // --- 1. Create Double Buffers ---
  const boidData = new Float32Array(numBoids * 4); // pos(2), vel(2)
  for (let i = 0; i < numBoids; i++) {
    boidData[i * 4 + 0] = Math.random() * 2 - 1; // pos x
    boidData[i * 4 + 1] = Math.random() * 2 - 1; // pos y
    boidData[i * 4 + 2] = (Math.random() - 0.5) * 0.01; // vel x
    boidData[i * 4 + 3] = (Math.random() - 0.5) * 0.01; // vel y
  }

  const createBuffer = () => device.createBuffer({
    size: boidData.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const bufferA = createBuffer();
  const bufferB = createBuffer();
  device.queue.writeBuffer(bufferA, 0, boidData);

  const paramsBuffer = device.createBuffer({
    size: 32, // 5 floats (needs to be multiple of 16 for safety/alignment)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // --- 2. Pipelines ---
  const computeModule = device.createShaderModule({ code: computeShaderCode });
  const computePipeline = device.createComputePipeline({
    layout: 'auto',
    compute: { module: computeModule, entryPoint: "cs_main" }
  });

  const renderModule = device.createShaderModule({ code: renderShaderCode });
  const renderPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: renderModule, entryPoint: "vs_main" },
    fragment: { module: renderModule, entryPoint: "fs_main", targets: [{ format: canvasFormat }] },
    primitive: { topology: 'triangle-list' }
  });

  const renderUniformBuffer = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    renderUniformBuffer,
    0,
    new Float32Array([canvas.width / canvas.height, 0, 0, 0])
  );

  // --- 3. BindGroups (Ping-Pong) ---
  const bindGroupA = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: bufferA } },
      { binding: 1, resource: { buffer: bufferB } },
      { binding: 2, resource: { buffer: paramsBuffer } }
    ]
  });

  const bindGroupB = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: bufferB } },
      { binding: 1, resource: { buffer: bufferA } },
      { binding: 2, resource: { buffer: paramsBuffer } }
    ]
  });

  const renderBindGroupA = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: bufferA } },
      { binding: 1, resource: { buffer: renderUniformBuffer } },
    ]
  });
  const renderBindGroupB = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: bufferB } },
      { binding: 1, resource: { buffer: renderUniformBuffer } },
    ]
  });

  // --- 4. GUI ---
  const settings = { 
    cohesion: 0.02, 
    alignment: 0.05, 
    separation: 0.05, 
    visualRange: 0.15,
    speed: 1.0 
  };
  const gui = new GUI({ container: document.getElementById('gui-container') as HTMLElement, title: 'Boid Logic' });
  gui.add(settings, 'cohesion', 0, 0.1);
  gui.add(settings, 'alignment', 0, 0.1);
  gui.add(settings, 'separation', 0, 0.1);
  gui.add(settings, 'visualRange', 0, 0.5);
  gui.add(settings, 'speed', 0, 2.0).name('Animation Speed');

  let step = 0;

  // --- 5. Frame Loop ---
  function frame() {
    const resized = resizeCanvasToDisplaySize(canvas);
    if (resized) {
      device.queue.writeBuffer(
        renderUniformBuffer,
        0,
        new Float32Array([canvas.width / canvas.height, 0, 0, 0])
      );
    }
    // Update Uniforms
    device.queue.writeBuffer(paramsBuffer, 0, new Float32Array([
      settings.cohesion, 
      settings.alignment, 
      settings.separation, 
      settings.visualRange,
      settings.speed
    ]));

    const commandEncoder = device.createCommandEncoder();

    // A. Compute
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, step % 2 === 0 ? bindGroupA : bindGroupB);
    computePass.dispatchWorkgroups(Math.ceil(numBoids / 64));
    computePass.end();

    // B. Render
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{ 
        view: context!.getCurrentTexture().createView(), 
        loadOp: 'clear', storeOp: 'store', 
        clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 } 
      }]
    });
    renderPass.setPipeline(renderPipeline);
    // Draw the buffer we just WROTE to
    renderPass.setBindGroup(0, step % 2 === 0 ? renderBindGroupB : renderBindGroupA);
    renderPass.draw(3, numBoids); 
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    step++;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

init().catch(console.error);
