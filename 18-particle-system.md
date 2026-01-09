# 18. Particle System (Compute + Render)

In the previous tutorial, we ran a "headless" Compute Shader to double some numbers. Now, let's use the full power of WebGPU by combining **Compute** and **Render** pipelines to create a dynamic particle system.

**The Goal:**

- Use a **Compute Shader** to update the position and velocity of thousands of particles (Physics).
- Use a **Render Shader** to draw those particles (Graphics).
- Share data between them using a single **Storage Buffer**.

## 1. Shared Data Structure

Both shaders need to agree on the data format. We define a `Particle` struct.

```wgsl
struct Particle {
  pos : vec2f,  // 8 bytes
  vel : vec2f,  // 8 bytes
  size : f32,   // 4 bytes
  // Implicit padding: 4 bytes (Total stride: 24 bytes)
}
```

**Padding Note:** WGSL arrays often require elements to be aligned to 16 bytes (or 8 bytes depending on context). `vec2f` aligns to 8 bytes. To be safe and predictable, we treat our particle as taking up **6 floats** (24 bytes) in our JavaScript Float32Array.

## 2. The Compute Shader (Physics)

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
  // ... (Y-axis logic) ...

  particles[index] = p; // Write back
}
```

## 3. The Render Shader (Graphics)

This shader draws the particles. Instead of using a traditional Vertex Buffer with `setVertexBuffer`, we use **Storage Buffer Instancing**.

- We draw **6 vertices** (1 quad) for every particle.
- `vIdx` (Vertex Index): Tells us which corner of the quad we are drawing (0-5).
- `iIdx` (Instance Index): Tells us which particle we are drawing (0 to 9999).

We simply look up the particle data using `particles[iIdx]`.

```wgsl
@vertex
fn vs_main(@builtin(vertex_index) vIdx : u32, @builtin(instance_index) iIdx : u32) -> VertexOutput {
  let p = particles[iIdx]; // Get particle data

  // Calculate quad corner position based on vIdx and p.size
  // ...

  return output;
}
```

## 4. Synchronization

We don't need explicit barriers here because WebGPU automatically handles the dependency between the Compute Pass and the Render Pass when they are submitted in the same command buffer (or queue).

1.  **Compute Pass**: Updates all positions in the buffer.
2.  **Render Pass**: Reads the updated positions to draw.

## 5. Interactive Controls

We added **lil-gui** to allow real-time control over the simulation.

- **Particle Count**: Drag the slider to change the number of particles from 1 to 1,000,000.
- When the value changes, we destroy the old buffers and recreate them with the new size.

## Full Code

```typescript
// See src/18-particle-system.ts
```
