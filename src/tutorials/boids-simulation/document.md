# Boids Simulation

This tutorial implements **Boids**, a classic flocking simulation that models the collective behavior of birds, fish, or swarms. Each boid is an independent agent that follows three simple rules, and the group behavior emerges from those local interactions.

We run the flocking logic in a compute shader and render each boid as a small triangle pointing in its movement direction.

**Key learning points:**

- The three flocking rules: cohesion, alignment, separation.
- Why the simulation is **O(n^2)** and why the GPU is a good fit.
- How to use **storage buffers** and **ping‑ponging** for stable updates.
- How to rotate geometry in the vertex shader based on velocity.
- How to use uniforms to control simulation parameters in real time.

## 1. What Boids simulates

Each boid has a **position** and **velocity**. Every frame it checks nearby neighbors and adjusts its velocity based on three behaviors:

1. **Cohesion**: steer toward the center of nearby boids.
2. **Alignment**: match the average velocity of neighbors.
3. **Separation**: avoid crowding by steering away from close boids.

These rules are local, but the result looks like coordinated flocking.

## 2. Data representation

We store boids in a storage buffer as an array of structs:

```wgsl
struct Boid {
  pos : vec2f,
  vel : vec2f,
}

@group(0) @binding(0) var<storage, read> boidsIn : array<Boid>;
@group(0) @binding(1) var<storage, read_write> boidsOut : array<Boid>;
```

Each boid is 4 floats (pos.xy, vel.xy), and the buffer holds `numBoids` entries.

## 3. Ping‑ponging for stable updates

The compute shader must read the **previous** state while writing the **next** state. If we read and write the same buffer, updates will interfere. We solve this by alternating buffers each frame:

- **Buffer A**: input
- **Buffer B**: output
- Next frame, swap

This pattern is the same as double-buffered textures, but with storage buffers.

## 4. The compute step (flocking rules)

Each compute thread updates one boid. The shader loops through all boids to compute neighbor effects:

```wgsl
for (var i = 0u; i < arrayLength(&boidsIn); i++) {
  if (i == index) { continue; }
  let other = boidsIn[i];
  let dist = distance(boid.pos, other.pos);

  if (dist < params.visualRange) {
    center += other.pos;      // cohesion
    avgVel += other.vel;      // alignment
    neighbors += 1.0;
  }

  if (dist < separationDistance) {
    close += (boid.pos - other.pos); // separation
  }
}
```

Then we apply weights from a uniform buffer:

```wgsl
boid.vel += (center - boid.pos) * params.cohesion;
boid.vel += (avgVel - boid.vel) * params.alignment;
boid.vel += close * params.separation;
```

The GUI controls these weights so you can explore different flocking behaviors.

### O(n^2) complexity

Each boid checks every other boid, so the work per frame is `N * N`. For 1500 boids that is 2.25 million comparisons. The GPU handles this in parallel, which keeps it interactive.

## 5. Speed limits and wrapping

We clamp velocity so boids do not accelerate endlessly:

```wgsl
let maxSpeed = 0.02;
let minSpeed = 0.005;
```

Positions are wrapped to keep boids on screen (toroidal space):

```wgsl
if (boid.pos.x > 1.0) { boid.pos.x = -1.0; }
```

## 6. Rendering the boids

We render each boid as a small triangle and rotate it to face its velocity direction:

```wgsl
let angle = atan2(boid.vel.y, boid.vel.x);
let rotated = vec2f(
  pos[vIdx].x * cos(angle) - pos[vIdx].y * sin(angle),
  pos[vIdx].x * sin(angle) + pos[vIdx].y * cos(angle)
);
```

We use `instance_index` to draw one triangle per boid:

```typescript
renderPass.draw(3, numBoids);
```

## 7. Aspect ratio correction

The simulation is in normalized coordinates `[-1, 1]`. When the canvas aspect ratio changes, we scale positions in the vertex shader so the flocking field stays proportional.

```wgsl
let aspectRatio = renderUniforms.values.x;
if (aspectRatio > 1.0) {
  finalPos = vec2f(finalPos.x / aspectRatio, finalPos.y);
} else {
  finalPos = vec2f(finalPos.x, finalPos.y * aspectRatio);
}
```

## Common pitfalls

- **Reading and writing the same buffer** in one compute pass.
- **Forgetting speed clamping**, which can explode velocities.
- **Not accounting for aspect ratio**, which distorts motion.
- **High instance counts** causing heavy O(n^2) load.
