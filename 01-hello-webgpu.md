# Hello WebGPU

In this first tutorial, we will set up a basic WebGPU environment and draw a simple red triangle on the screen.

## Key Steps

1. **Check for WebGPU Support**: Ensure `navigator.gpu` is available.
2. **Request Adapter**: Get access to the physical GPU.
3. **Request Device**: Create a logical connection to the GPU.
4. **Configure Canvas**: Link the HTML canvas to the WebGPU context.
5. **Create Shader Module**: Write WGSL (WebGPU Shading Language) code for vertex and fragment shaders.
6. **Create Render Pipeline**: Define how the GPU should process our data.
7. **Render**: Encode commands and submit them to the GPU queue.

## The Code

The core of our drawing logic resides in `src/01-hello-webgpu.ts`. We use a simple shader that defines three vertices in normalized device coordinates.
