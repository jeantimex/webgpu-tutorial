# WebGPU Tutorial

Learn WebGPU via practical, step-by-step code samples and tutorials.

## Tutorials

| Index | Title | Description |
| :-- | :-- | :-- |
| 01 | [Hello WebGPU](01-hello-webgpu.md) | Learn how to set up WebGPU and draw a simple red triangle. |
| 02 | [Primitives](02-primitives.md) | Learn about different primitive topologies (Points, Lines, Triangles) by rendering multiple shapes. |
| 03 | [Vertex Buffer](03-vertex-buffer.md) | Learn how to pass vertex data to the GPU using buffers. |
| 04 | [Multiple Vertex Buffers](04-multiple-vertex-buffers.md) | Learn how to use multiple vertex buffers for positions and colors. |
| 05 | [Interleaved Vertex Buffers](05-interleaved-vertex-buffers.md) | Learn how to pack multiple attributes into a single vertex buffer for efficiency. |
| 06 | [Shader Structs](06-shader-structs.md) | Learn how to organize shader inputs and outputs using WGSL structs. |
| 07 | [Uniform Buffer](07-uniform-buffer.md) | Learn how to use uniform buffers to pass global constants (like color) to shaders. |
| 08 | [Dynamic Uniform Buffer](08-dynamic-uniform-buffer.md) | Learn to use dynamic offsets to efficiently manage multiple uniforms in one buffer. |
| 09 | [Index Buffer](09-index-buffer.md) | Learn how to reuse vertices using index buffers to draw a square. |
| 10 | [Single Transformation](10-single-transformation.md) | Learn how to move, rotate, and scale geometry using transformation matrices and wgpu-matrix. |
| 11 | [Combined Transformations](11-combined-transformations.md) | Learn how to chain Translation, Rotation, and Scaling for complex movements. |
| 12 | [Aspect Ratio](12-aspect-ratio.md) | Learn how to correct geometric distortion caused by rectangular canvases. |
| 13 | [Instancing](13-instancing.md) | Learn how to draw multiple copies of the same geometry efficiently using storage buffers and instanced drawing. |
| 14 | [Instanced Vertex Buffer](14-instanced-vertex-buffer.md) | Learn to use `stepMode: "instance"` to pass per-instance data via vertex buffers. |
| 15 | [Switching Pipelines](15-switching-pipelines.md) | Learn how to switch render pipelines to draw objects with different shaders (Solid vs. Gradient). |
| 16 | [Switching Vertex Buffers](16-switching-vertex-buffers.md) | Learn how to reuse a pipeline while switching geometry data. |
| 17 | [Simple Compute Shader](17-simple-compute.md) | Learn how to use Compute Shaders for GPGPU tasks by multiplying arrays. |

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
