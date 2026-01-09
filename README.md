# WebGPU Tutorial

Learn WebGPU via practical, step-by-step code samples and tutorials.

## Tutorials

| Index | Title | Description |
| :-- | :-- | :-- |
| 01 | [Hello WebGPU](01-hello-webgpu.md) | Learn how to set up WebGPU and draw a simple red triangle. |
| 02 | [Vertex Buffer](02-vertex-buffer.md) | Learn how to pass vertex data to the GPU using buffers. |
| 03 | [Multiple Vertex Buffers](03-multiple-vertex-buffers.md) | Learn how to use multiple vertex buffers for positions and colors. |
| 04 | [Interleaved Vertex Buffers](04-interleaved-vertex-buffers.md) | Learn how to pack multiple attributes into a single vertex buffer for efficiency. |
| 05 | [Shader Structs](05-shader-structs.md) | Learn how to organize shader inputs and outputs using WGSL structs. |
| 06 | [Uniform Buffer](06-uniform-buffer.md) | Learn how to use uniform buffers to pass global constants (like color) to shaders. |
| 07 | [Dynamic Uniform Buffer](07-dynamic-uniform-buffer.md) | Learn to use dynamic offsets to efficiently manage multiple uniforms in one buffer. |
| 08 | [Index Buffer](08-index-buffer.md) | Learn how to reuse vertices using index buffers to draw a square. |
| 09 | [Single Transformation](09-single-transformation.md) | Learn how to move, rotate, and scale geometry using transformation matrices and wgpu-matrix. |
| 10 | [Combined Transformations](10-combined-transformations.md) | Learn how to chain Translation, Rotation, and Scaling for complex movements. |
| 11 | [Aspect Ratio](11-aspect-ratio.md) | Learn how to correct geometric distortion caused by rectangular canvases. |
| 12 | [Instancing](12-instancing.md) | Learn how to draw multiple copies of the same geometry efficiently using storage buffers and instanced drawing. |
| 13 | [Instanced Vertex Buffer](13-instanced-vertex-buffer.md) | Learn to use `stepMode: "instance"` to pass per-instance data via vertex buffers. |
| 14 | [Switching Pipelines](14-switching-pipelines.md) | Learn how to switch render pipelines to draw objects with different shaders (Solid vs. Gradient). |
| 15 | [Switching Vertex Buffers](15-switching-vertex-buffers.md) | Learn how to reuse a pipeline while switching geometry data. |
| 16 | [Primitives](16-primitives.md) | Learn about different primitive topologies (Points, Lines, Triangles) by rendering multiple shapes. |

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
