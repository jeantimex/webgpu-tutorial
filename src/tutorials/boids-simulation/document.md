# Boids Simulation (Flocking)

In this tutorial, we will implement a **Boids Simulation**, an artificial life program that simulates the flocking behavior of birds. This moves beyond simple independent particles into **Agent-Based Simulation**, where every entity reacts to every other entity.

**Key Learning Points:**
- Implementing the three rules of flocking: **Cohesion**, **Alignment**, and **Separation**.
- Handling $O(n^2)$ complexity on the GPU.
- Using **Double Buffering** for stable state updates.
- Using math functions like `atan2`, `cos`, and `sin` in WGSL to rotate triangles.
- Controlling simulation parameters via Uniform Buffers and GUI.

## 1. The Three Rules of Flocking

1.  **Cohesion**: Boids try to fly towards the "center of mass" of their neighbors (the average position).
2.  **Alignment**: Boids try to match the velocity (speed and direction) of their neighbors.
3.  **Separation**: Boids try to keep a minimum distance from others to avoid crashing.

## 2. O(n^2) on the GPU

In our simulation of 1,500 boids, each boid must check every other boid.
- **CPU approach**: A simple nested loop would take 1500 * 1500 = 2,250,000 operations per frame. This can quickly slow down as the number of boids increases.
- **GPU approach**: We launch 1,500 parallel threads. Each thread performs 1,500 checks simultaneously. WebGPU handles millions of these checks effortlessly.

## 3. Rotating Triangles in the Shader

Unlike our earlier tutorials where we drew static squares, we want our birds to point in the direction they are flying. We use `atan2(vel.y, vel.x)` to find the angle of travel and a **Rotation Matrix** logic to transform our triangle vertices.

```wgsl
let angle = atan2(boid.vel.y, boid.vel.x);
let rotated = vec2f(
  pos[vIdx].x * cos(angle) - pos[vIdx].y * sin(angle),
  pos[vIdx].x * sin(angle) + pos[vIdx].y * cos(angle)
);
```
