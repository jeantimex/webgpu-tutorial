# WebGPU Tutorial

Learn WebGPU via practical, step-by-step code samples and tutorials.

## Tutorials

| Index | Title | Description |
| :-- | :-- | :-- |
| 01 | [Hello WebGPU](hello-webgpu.md) | Learn how to set up WebGPU and draw a simple red triangle. |
| 02 | [Primitives](primitives.md) | Learn about different primitive topologies (Points, Lines, Triangles) by rendering multiple shapes. |
| 03 | [Vertex Buffer](vertex-buffer.md) | Learn how to pass vertex data to the GPU using buffers. |
| 04 | [Multiple Vertex Buffers](multiple-vertex-buffers.md) | Learn how to use multiple vertex buffers for positions and colors. |
| 05 | [Interleaved Vertex Buffers](interleaved-vertex-buffers.md) | Learn how to pack multiple attributes into a single vertex buffer for efficiency. |
| 06 | [Shader Structs](shader-structs.md) | Learn how to organize shader inputs and outputs using WGSL structs. |
| 07 | [Uniform Buffer](uniform-buffer.md) | Learn how to use uniform buffers to pass global constants (like color) to shaders. |
| 08 | [Dynamic Uniform Buffer](dynamic-uniform-buffer.md) | Learn to use dynamic offsets to efficiently manage multiple uniforms in one buffer. |
| 09 | [Index Buffer](index-buffer.md) | Learn how to reuse vertices using index buffers to draw a square. |
| 10 | [Single Transformation](single-transformation.md) | Learn how to move, rotate, and scale geometry using transformation matrices and wgpu-matrix. |
| 11 | [Combined Transformations](combined-transformations.md) | Learn how to chain Translation, Rotation, and Scaling for complex movements. |
| 12 | [Aspect Ratio](12-aspect-ratio.md) | Learn how to correct geometric distortion caused by rectangular canvases. |
| 13 | [Instancing](instancing.md) | Learn how to draw multiple copies of the same geometry efficiently using storage buffers and instanced drawing. |
| 14 | [Instanced Vertex Buffer](instanced-vertex-buffer.md) | Learn to use `stepMode: "instance"` to pass per-instance data via vertex buffers. |
| 15 | [Switching Pipelines](switching-pipelines.md) | Learn how to switch render pipelines to draw objects with different shaders (Solid vs. Gradient). |
| 16 | [Switching Vertex Buffers](switching-vertex-buffers.md) | Learn how to reuse a pipeline while switching geometry data. |
| 17 | [Simple Compute Shader](simple-compute.md) | Learn how to use Compute Shaders for GPGPU tasks by multiplying arrays. |
| 18 | [Particle System](particle-system.md) | Combine Compute and Render pipelines to simulate and draw thousands of particles. |
| 19 | [Image Particles](image-particles.md) | Use image data to drive particle colors and target positions for an interactive effect. |
| 20 | [Image Processing](image-processing.md) | Manipulate image pixels directly using storage textures and compute shaders. |
| 21 | [Game of Life](game-of-life.md) | Implement cellular automata using double buffering and toroidal coordinates. |
| 22 | [Optimized Blur](22-shared-memory-blur.md) | Use workgroup shared memory to significantly reduce memory bandwidth for image filters. |
| 23 | [Boids Simulation](boids-simulation.md) | Simulate flocking behavior using cohesion, alignment, and separation rules on the GPU. |
| 24 | [Image Histogram](24-image-histogram.md) | Use atomic operations to safely analyze image data across parallel threads. |
| 25 | [Hello Cube (3D & MVP)](hello-cube.md) | Introduce 3D rendering with perspective projection and depth testing. |
| 26 | [Indexed Cube](indexed-cube.md) | Optimize 3D geometry by reusing vertices with index buffers. |
| 27 | [Cube Face Colors](cube-face-colors.md) | Learn how to handle distinct face attributes by splitting shared vertices. |
| 28 | [Textured Cube](textured-cube.md) | Map a 2D image onto 3D geometry using UV coordinates and samplers. |
| 29 | [Texture Atlas](texture-atlas.md) | Use a single texture with multiple regions to map different images to each face of a cube. |
| 30 | [Directional Light](directional-light.md) | Implement Diffuse (Lambertian) lighting using surface normals and dot products. |
| 31 | [Ambient Light](ambient-light.md) | Learn about global background lighting that affects all surfaces equally. |
| 32 | [Point Light](point-light.md) | Simulate a light source with a specific position that radiates light in all directions. |
| 33 | [Combined Lighting](33-combined-lighting.md) | Combine Ambient, Directional, and Point lights with Specular highlights (Blinn-Phong). |
| 34 | [Loading OBJ Model](34-obj-model.md) | Parse and render a 3D model (Utah Teapot) from an OBJ file. |
| 35 | [Sphere Geometry](sphere-geometry.md) | Generate configurable sphere geometry (radius, segments, partial arcs) algorithmically. |
| 36 | [Box Geometry](box-geometry.md) | Generate a box with configurable width, height, depth, and segments. |
| 37 | [Cylinder Geometry](cylinder-geometry.md) | Generate configurable cylinders, cones, and tubes. |
| 38 | [Torus Geometry](torus-geometry.md) | Generate a donut shape using two radii and segment counts. |
| 39 | [Torus Knot Geometry](torus-knot-geometry.md) | Generate complex, interlinked torus knots using parametric equations. |
| 40 | [Cone Geometry](cone-geometry.md) | Generate a cone shape (a cylinder with zero top radius). |
| 41 | [Plane Geometry](plane-geometry.md) | Generate a flat 2D grid oriented in 3D space. |
| 42 | [Jewel Geometry](jewel-geometry.md) | Generate a faceted low-poly sphere with per-face colors. |
| 43 | [Shadow Mapping](shadow-mapping.md) | Learn how to implement basic shadow mapping using a depth pass and comparison samplers. |
| 44 | [Random Geometries](44-random-geometries.md) | Render multiple objects with different geometries and wireframes using per-object bind groups. |
| 45 | [Rock Geometry](rock-geometry.md) | Generate an organic rock shape using randomized vertex radii and per-face colors. |
| 46 | [Geometries Instancing](46-geometries-instancing.md) | Render multiple cubes efficiently using GPU instancing with storage buffers for per-instance transforms. |

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
