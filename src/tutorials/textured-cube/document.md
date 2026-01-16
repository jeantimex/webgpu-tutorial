# Textured Cube

In this tutorial, we move from solid colors to **Textures**. We'll learn how to map a 2D image onto our 3D cube.

### The Texture
We will use this WebGPU logo as our texture:
![WebGPU Logo](https://webgpu.github.io/webgpu-samples/assets/img/webgpu.png)

## 1. UV Coordinates

To tell the GPU how an image should wrap around a shape, we use **UV Coordinates**.
*   **U** is the horizontal axis (0 to 1).
*   **V** is the vertical axis (0 to 1).

Every vertex in our buffer now needs a pair of UV coordinates. Since a single corner of the cube needs different UVs depending on which face it belongs to (e.g., $(0,0)$ for the top-left of the Front face, but $(1,0)$ for the top-right of the Side face), we must use **24 vertices** (4 per face), just like we did for [Cube Face Colors](cube-face-colors.html).

```typescript
const vertexData = new Float32Array([
  // pos (x, y, z)      uv (u, v)
  // Front Face
  -0.5, -0.5,  0.5,     0, 1,
   0.5, -0.5,  0.5,     1, 1,
   0.5,  0.5,  0.5,     1, 0,
  -0.5,  0.5,  0.5,     0, 0,
  ...
]);
```

## 2. Loading the Image

WebGPU cannot directly load a JPG or PNG file into GPU memory. We use the browser's `Image` and `ImageBitmap` APIs to decode the file first.

```typescript
const img = new Image();
img.src = "texture.png";
await img.decode();
const imageBitmap = await createImageBitmap(img);

// Copy to GPU
device.queue.copyExternalImageToTexture(
  { source: imageBitmap },
  { texture: gpuTexture },
  [width, height]
);
```

## 3. Samplers

A **Sampler** defines *how* the GPU should read the texture.
*   **Filters**: What happens when a pixel is smaller or larger than the screen pixel? (`linear` for smooth, `nearest` for pixelated).
*   **Address Modes**: What happens if UVs go outside the 0..1 range? (`repeat`, `mirror`, `clamp-to-edge`).

```typescript
const sampler = device.createSampler({
  magFilter: "linear",
  minFilter: "linear",
});
```

## 4. The Shader

In the Fragment Shader, we use the `textureSample` function. It takes the texture, the sampler, and the UV coordinate to return the color at that exact spot.

```wgsl
@group(0) @binding(1) var mySampler : sampler;
@group(0) @binding(2) var myTexture : texture_2d<f32>;

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  return textureSample(myTexture, mySampler, in.uv);
}
```

## Summary

Texturing is the foundation of modern 3D graphics. By combining 3D geometry with 2D images, we can add immense detail without increasing the number of triangles.
