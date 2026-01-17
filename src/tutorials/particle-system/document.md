# Particle System (Compute + Render)

In the previous tutorial, we ran a "headless" Compute Shader to double some numbers. Now, let's use the full power of WebGPU by combining **Compute** and **Render** pipelines to create a dynamic particle system.

**The Goal:**
- Use a **Compute Shader** to update the position and velocity of thousands of particles (Physics).
- Use a **Render Shader** to draw those particles (Graphics).
- Share data between them using a single **Storage Buffer**.

## 1. Shared Data Structure

Both shaders need to agree on the data format. We define a `Particle` struct.

```wgsl
struct Particle {
  pos : vec2f,    // 8 bytes
  vel : vec2f,    // 8 bytes
  color : vec3f,  // 12 bytes
  size : f32,     // 4 bytes
  // Total stride: 32 bytes (8 floats) - No padding needed
}
```

**Padding Note:** WGSL arrays often require elements to be aligned to 16 bytes (or 8 bytes depending on context). `vec2f` aligns to 8 bytes. To be safe and predictable, we treat our particle as taking up **8 floats** (32 bytes) in our JavaScript Float32Array.

## 2. Data Initialization

In JavaScript, we prepare a `Float32Array` to hold all our particle data. We need to be careful to match the memory layout of the shader struct.

Since our struct has:
- `pos`: 2 floats
- `vel`: 2 floats
- `color`: 3 floats
- `size`: 1 float

This totals **8 floats** (32 bytes), which aligns perfectly with GPU requirements.

```typescript
const numParticles = 10000;
const floatPerParticle = 8;
const particleData = new Float32Array(numParticles * floatPerParticle);

for (let i = 0; i < numParticles; i++) {
  const offset = i * floatPerParticle;
  
  // Position (x, y)
  particleData[offset + 0] = (Math.random() - 0.5) * 1.5;
  particleData[offset + 1] = (Math.random() - 0.5) * 1.5;
  
  // Velocity (vx, vy)
  particleData[offset + 2] = (Math.random() - 0.5) * 0.02;
  particleData[offset + 3] = (Math.random() - 0.5) * 0.02;
  
  // Color (r, g, b)
  particleData[offset + 4] = Math.random();
  particleData[offset + 5] = Math.random();
  particleData[offset + 6] = Math.random();
  
  // Size
  particleData[offset + 7] = 0.005 + Math.random() * 0.01;
}

// Create the GPU Buffer and upload data
const particleBuffer = device.createBuffer({
  size: particleData.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  mappedAtCreation: true
});
new Float32Array(particleBuffer.getMappedRange()).set(particleData);
particleBuffer.unmap();
```

## 3. The Compute Shader (Physics)

This shader runs once per particle. It reads the current position, adds velocity, and checks for collisions with the screen edges.

```wgsl
@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let index = id.x;
  if (index >= arrayLength(&particles)) { return; }

  var p = particles[index];
  
  // Update Position
  p.pos += p.vel;

  // Collision Logic (Bounce off walls)
  let limit = 1.0 - p.size; 
  if (p.pos.x > limit) { p.pos.x = limit; p.vel.x *= -1.0; } 
  else if (p.pos.x < -limit) { p.pos.x = -limit; p.vel.x *= -1.0; }

  if (p.pos.y > limit) { p.pos.y = limit; p.vel.y *= -1.0; } 
  else if (p.pos.y < -limit) { p.pos.y = -limit; p.vel.y *= -1.0; }

  particles[index] = p; // Write back
}
```

## 4. The Render Shader (Graphics)

This shader draws the particles. Instead of using a traditional Vertex Buffer with `setVertexBuffer`, we use **Storage Buffer Instancing**.

### Understanding Vertex and Instance Indices

In our JavaScript, we call `passEncoder.draw(6, numParticles)`. This tells WebGPU:
- **`6`**: The number of vertices per instance (to draw one quad made of two triangles).
- **`numParticles`**: The number of instances (how many particles to draw).

WebGPU will execute the Vertex Shader a total of `6 * numParticles` times. To help us distinguish between them, it provides two built-in variables:

1.  **`@builtin(vertex_index)`**: This index cycles from `0` to `5` for *every* particle. It tells us which corner of the current particle's quad we are drawing.
2.  **`@builtin(instance_index)`**: This index stays constant for all 6 vertices of a single particle, ranging from `0` up to `numParticles - 1`. It tells us *which* particle in our storage buffer we should look up.

```wgsl
@vertex
fn vs_main(
  @builtin(vertex_index) vIdx : u32, 
  @builtin(instance_index) iIdx : u32
) -> VertexOutput {
  // Use iIdx to fetch the unique data for THIS particle
  let p = particles[iIdx]; 

  // Use vIdx to determine which corner of the quad to position
  var corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f( 1.0, -1.0), vec2f(-1.0,  1.0),
    vec2f(-1.0,  1.0), vec2f( 1.0, -1.0), vec2f( 1.0,  1.0)
  );
  
  // ... rest of the logic ...
}
```

## 5. Synchronization

We don't need explicit barriers here because WebGPU automatically handles the dependency between the Compute Pass and the Render Pass when they are submitted in the same command buffer (or queue).

1.  **Compute Pass**: Updates all positions in the buffer.
2.  **Render Pass**: Reads the updated positions to draw.

## 6. Interactive Controls

We added **lil-gui** to allow real-time control over the simulation.
- **Particle Count**: Select from 1 to 1,000,000 particles.
- **Re-initialization**: When the count changes, we cannot simply "resize" the existing buffer. We must:
    1.  **Destroy** the old `particleBuffer` using `.destroy()` to free GPU memory.
    2.  Create a **new buffer** with the new size.
    3.  Create **new BindGroups** pointing to this new buffer.

```typescript
function initParticles(count: number) {
  if (particleBuffer) particleBuffer.destroy(); // Important!
  
  // ... create new buffer and bind groups ...
}
```

### Resource Management Tip
*   **Buffers & Textures**: Always call `.destroy()` on these large resources when you are done with them (e.g., resizing). This frees up VRAM immediately. If you rely on Garbage Collection, you might run out of GPU memory before the JS engine cleans up.
*   **BindGroups**: These are lightweight pointers. You don't need to manually destroy them; simply overwriting the JavaScript variable is enough.
*   **Pipelines & Layouts**: Usually created once at startup and reused.
