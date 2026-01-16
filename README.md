# WebGPU Tutorial

Learn WebGPU via practical, step-by-step code samples and tutorials.

## Tutorials

| Index | Title | Description |
| :-- | :-- | :-- |
| 01 | [Hello WebGPU](hello-webgpu.md) | Learn how to set up WebGPU and draw a simple red triangle. |
| 02 | [Primitives](primitives.md) | Learn about different primitive topologies (Points, Lines, Triangles) by rendering multiple shapes. |
| 03 | [Vertex Buffer](vertex-buffer.md) | Learn how to pass vertex data to the GPU using buffers. |
| 04 | [Shader Structs](shader-structs.md) | Learn how to organize shader inputs and outputs using WGSL structs. |
| 05 | [Uniform Buffer](uniform-buffer.md) | Learn how to use uniform buffers to pass global constants (like color) to shaders. |
| 06 | [Index Buffer](index-buffer.md) | Learn how to reuse vertices using index buffers to draw a square. |
| 07 | [Single Transformation](single-transformation.md) | Learn how to move, rotate, and scale geometry using transformation matrices and wgpu-matrix. |
| 08 | [Instancing](instancing.md) | Learn how to draw multiple copies of the same geometry efficiently using storage buffers and instanced drawing. |
| 09 | [Instanced Vertex Buffer](instanced-vertex-buffer.md) | Learn to use `stepMode: "instance"` to pass per-instance data via vertex buffers. |
| 10 | [Switching Pipelines](switching-pipelines.md) | Learn how to switch render pipelines to draw objects with different shaders (Solid vs. Gradient). |
| 11 | [Switching Vertex Buffers](switching-vertex-buffers.md) | Learn how to reuse a pipeline while switching geometry data. |
| 12 | [Simple Compute Shader](simple-compute.md) | Learn how to use Compute Shaders for GPGPU tasks by multiplying arrays. |
| 13 | [Particle System](particle-system.md) | Combine Compute and Render pipelines to simulate and draw thousands of particles. |
| 14 | [Image Particles](image-particles.md) | Use image data to drive particle colors and target positions for an interactive effect. |
| 15 | [Image Processing](image-processing.md) | Manipulate image pixels directly using storage textures and compute shaders. |
| 16 | [Game of Life](game-of-life.md) | Implement cellular automata using double buffering and toroidal coordinates. |
| 17 | [Boids Simulation](boids-simulation.md) | Simulate flocking behavior using cohesion, alignment, and separation rules on the GPU. |
| 18 | [Hello Cube (3D & MVP)](hello-cube.md) | Introduce 3D rendering with perspective projection and depth testing. |
| 19 | [Indexed Cube](indexed-cube.md) | Optimize 3D geometry by reusing vertices with index buffers. |
| 20 | [Cube Face Colors](cube-face-colors.md) | Learn how to handle distinct face attributes by splitting shared vertices. |
| 21 | [Textured Cube](textured-cube.md) | Map a 2D image onto 3D geometry using UV coordinates and samplers. |
| 22 | [Texture Atlas](texture-atlas.md) | Use a single texture with multiple regions to map different images to each face of a cube. |
| 23 | [Directional Light](directional-light.md) | Implement Diffuse (Lambertian) lighting using surface normals and dot products. |
| 24 | [Ambient Light](ambient-light.md) | Learn about global background lighting that affects all surfaces equally. |
| 25 | [Point Light](point-light.md) | Simulate a light source with a specific position that radiates light in all directions. |
| 26 | [Sphere Geometry](sphere-geometry.md) | Generate configurable sphere geometry (radius, segments, partial arcs) algorithmically. |
| 27 | [Box Geometry](box-geometry.md) | Generate a box with configurable width, height, depth, and segments. |
| 28 | [Cylinder Geometry](cylinder-geometry.md) | Generate configurable cylinders, cones, and tubes. |
| 29 | [Torus Geometry](torus-geometry.md) | Generate a donut shape using two radii and segment counts. |
| 30 | [Torus Knot Geometry](torus-knot-geometry.md) | Generate complex, interlinked torus knots using parametric equations. |
| 31 | [Cone Geometry](cone-geometry.md) | Generate a cone shape (a cylinder with zero top radius). |
| 32 | [Plane Geometry](plane-geometry.md) | Generate a flat 2D grid oriented in 3D space. |
| 33 | [Jewel Geometry](jewel-geometry.md) | Generate a faceted low-poly sphere with per-face colors. |
| 34 | [Shadow Mapping](shadow-mapping.md) | Learn how to implement basic shadow mapping using a depth pass and comparison samplers. |
| 35 | [Rock Geometry](rock-geometry.md) | Generate an organic rock shape using randomized vertex radii and per-face colors. |
| 36 | [Wireframe](wireframe.md) | Render models with solid shading and wireframe overlays using separate pipelines. |


## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20.19.0 or later recommended)
- A browser with WebGPU support (e.g., Chrome, Edge, or Firefox Nightly)

### Installation

```bash
npm install
```

### Development

Start the Vite development server:

```bash
npm run dev
```

Then open your browser and navigate to the provided local URL (usually `http://localhost:5173`).
