# WebGPU Tutorial

Learn WebGPU via practical, step-by-step code samples and tutorials. This project is a curated path from first triangle to real-time simulations, with a focus on clarity, modern GPU concepts, and hands-on code.

## Why WebGPU

WebGPU is the modern graphics and compute API for the web. It maps closely to Vulkan, Metal, and Direct3D 12, which means:

- Lower driver overhead and more predictable performance
- First-class compute shaders for GPGPU workloads
- Explicit pipelines and resource binding for clearer mental models

If you are coming from WebGL, the differences can feel big at first, but they unlock significantly more power and control.

## Project goals

- Teach WebGPU from first principles, without skipping the "why"
- Provide working, minimal examples you can run and modify
- Scale from 2D basics to 3D lighting, geometry, and compute simulations
- Keep shader and TypeScript code close so you can connect concepts quickly

## What to expect

- Each tutorial is self-contained and linked below
- The demos are interactive and designed to be modified
- We intentionally start simple and add complexity only when needed

If you are new to 3D math or GPU programming, this is a gentle path. If you are experienced, the later tutorials still offer concrete, modern WebGPU patterns.

## Tutorials

| Index | Title | Description |
| :-- | :-- | :-- |
| 01 | [Hello WebGPU](src/tutorials/hello-webgpu/document.md) | Learn how to set up WebGPU and draw a simple red triangle. |
| 02 | [Primitives](src/tutorials/primitives/document.md) | Learn about different primitive topologies (Points, Lines, Triangles) by rendering multiple shapes. |
| 03 | [Vertex Buffer](src/tutorials/vertex-buffer/document.md) | Learn how to pass vertex data to the GPU using buffers. |
| 04 | [Shader Structs](src/tutorials/shader-structs/document.md) | Learn how to organize shader inputs and outputs using WGSL structs. |
| 05 | [Uniform Buffer](src/tutorials/uniform-buffer/document.md) | Learn how to use uniform buffers to pass global constants (like color) to shaders. |
| 06 | [Index Buffer](src/tutorials/index-buffer/document.md) | Learn how to reuse vertices using index buffers to draw a square. |
| 07 | [Single Transformation](src/tutorials/single-transformation/document.md) | Learn how to move, rotate, and scale geometry using transformation matrices and wgpu-matrix. |
| 08 | [Instancing](src/tutorials/instancing/document.md) | Learn how to draw multiple copies of the same geometry efficiently using storage buffers and instanced drawing. |
| 09 | [Instanced Vertex Buffer](src/tutorials/instanced-vertex-buffer/document.md) | Learn to use `stepMode: "instance"` to pass per-instance data via vertex buffers. |
| 10 | [Switching Pipelines](src/tutorials/switching-pipelines/document.md) | Learn how to switch render pipelines to draw objects with different shaders (Solid vs. Gradient). |
| 11 | [Switching Vertex Buffers](src/tutorials/switching-vertex-buffers/document.md) | Learn how to reuse a pipeline while switching geometry data. |
| 12 | [Simple Compute Shader](src/tutorials/simple-compute/document.md) | Learn how to use Compute Shaders for GPGPU tasks by multiplying arrays. |
| 13 | [Particle System](src/tutorials/particle-system/document.md) | Combine Compute and Render pipelines to simulate and draw thousands of particles. |
| 14 | [Image Particles](src/tutorials/image-particles/document.md) | Use image data to drive particle colors and target positions for an interactive effect. |
| 15 | [Image Processing](src/tutorials/image-processing/document.md) | Manipulate image pixels directly using storage textures and compute shaders. |
| 16 | [Game of Life](src/tutorials/game-of-life/document.md) | Implement cellular automata using double buffering and toroidal coordinates. |
| 17 | [Boids Simulation](src/tutorials/boids-simulation/document.md) | Simulate flocking behavior using cohesion, alignment, and separation rules on the GPU. |
| 18 | [Hello Cube (3D & MVP)](src/tutorials/hello-cube/document.md) | Introduce 3D rendering with perspective projection and depth testing. |
| 19 | [Indexed Cube](src/tutorials/indexed-cube/document.md) | Optimize 3D geometry by reusing vertices with index buffers. |
| 20 | [Cube Face Colors](src/tutorials/cube-face-colors/document.md) | Learn how to handle distinct face attributes by splitting shared vertices. |
| 21 | [Textured Cube](src/tutorials/textured-cube/document.md) | Map a 2D image onto 3D geometry using UV coordinates and samplers. |
| 22 | [Texture Atlas](src/tutorials/texture-atlas/document.md) | Use a single texture with multiple regions to map different images to each face of a cube. |
| 23 | [Directional Light](src/tutorials/directional-light/document.md) | Implement Diffuse (Lambertian) lighting using surface normals and dot products. |
| 24 | [Ambient Light](src/tutorials/ambient-light/document.md) | Learn about global background lighting that affects all surfaces equally. |
| 25 | [Point Light](src/tutorials/point-light/document.md) | Simulate a light source with a specific position that radiates light in all directions. |
| 26 | [Sphere Geometry](src/tutorials/sphere-geometry/document.md) | Generate configurable sphere geometry (radius, segments, partial arcs) algorithmically. |
| 27 | [Box Geometry](src/tutorials/box-geometry/document.md) | Generate a box with configurable width, height, depth, and segments. |
| 28 | [Cylinder Geometry](src/tutorials/cylinder-geometry/document.md) | Generate configurable cylinders, cones, and tubes. |
| 29 | [Torus Geometry](src/tutorials/torus-geometry/document.md) | Generate a donut shape using two radii and segment counts. |
| 30 | [Torus Knot Geometry](src/tutorials/torus-knot-geometry/document.md) | Generate complex, interlinked torus knots using parametric equations. |
| 31 | [Cone Geometry](src/tutorials/cone-geometry/document.md) | Generate a cone shape (a cylinder with zero top radius). |
| 32 | [Plane Geometry](src/tutorials/plane-geometry/document.md) | Generate a flat 2D grid oriented in 3D space. |
| 33 | [Jewel Geometry](src/tutorials/jewel-geometry/document.md) | Generate a faceted low-poly sphere with per-face colors. |
| 34 | [Shadow Mapping](src/tutorials/shadow-mapping/document.md) | Learn how to implement basic shadow mapping using a depth pass and comparison samplers. |
| 35 | [Rock Geometry](src/tutorials/rock-geometry/document.md) | Generate an organic rock shape using randomized vertex radii and per-face colors. |
| 36 | [Wireframe](src/tutorials/wireframe/document.md) | Render models with solid shading and wireframe overlays using separate pipelines. |
