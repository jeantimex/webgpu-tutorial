# WebGPU Tutorial

Learn WebGPU via practical, step-by-step code samples and tutorials.

## Tutorials

- [01. Hello WebGPU](01-hello-webgpu.md) - Learn how to set up WebGPU and draw a simple red triangle.
- [02. Vertex Buffer](02-vertex-buffer.md) - Learn how to pass vertex data to the GPU using buffers.
- [03. Multiple Vertex Buffers](03-multiple-vertex-buffers.md) - Learn how to use multiple vertex buffers for positions and colors.
- [04. Interleaved Vertex Buffers](04-interleaved-vertex-buffers.md) - Learn how to pack multiple attributes into a single vertex buffer for efficiency.
- [05. Shader Structs](05-shader-structs.md) - Learn how to organize shader inputs and outputs using WGSL structs.
- [06. Uniform Buffer](06-uniform-buffer.md) - Learn how to use uniform buffers to pass global constants (like color) to shaders.
- [07. Index Buffer](07-index-buffer.md) - Learn how to reuse vertices using index buffers to draw a square.
- [08. Single Transformation](08-single-transformation.md) - Learn how to move, rotate, and scale geometry using transformation matrices and wgpu-matrix.
- [09. Combined Transformations](09-combined-transformations.md) - Learn how to chain Translation, Rotation, and Scaling for complex movements.
- [10. Aspect Ratio](10-aspect-ratio.md) - Learn how to correct geometric distortion caused by rectangular canvases.
- [11. Instancing](11-instancing.md) - Learn how to draw multiple copies of the same geometry efficiently using storage buffers and instanced drawing.
- [12. Instanced Vertex Buffer](12-instanced-vertex-buffer.md) - Learn to use `stepMode: "instance"` to pass per-instance data via vertex buffers.

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
