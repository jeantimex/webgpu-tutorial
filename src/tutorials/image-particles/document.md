# Image Particles

In this tutorial, we will push our particle system further by using an image to drive the colors and target positions of our particles. We'll recreate the famous **Mona Lisa** using 90,000+ particles and add an interactive "explosion" effect.

**Key Learning Points:**
- Loading an image and extracting pixel data via an offscreen canvas.
- Mapping pixel coordinates to Normalized Device Coordinates (NDC).
- Implementing a "Magnet" effect where particles attract to a specific target position.
- Handling interactive updates by writing new data to existing GPU buffers.

## 1. Extracting Image Data

WebGPU doesn't have a direct way to "read" a JPEG file into a buffer. Instead, we use the standard web approach:
1.  Load an `<img>` element.
2.  Draw it onto a hidden 2D `canvas`.
3.  Use `getImageData()` to get an array of RGBA bytes.

```typescript
const img = new Image();
img.src = "monalisa.jpg";
await img.decode();

const offscreen = document.createElement("canvas");
const ctx = offscreen.getContext("2d")!;
offscreen.width = 250;
offscreen.height = 375;
ctx.drawImage(img, 0, 0, 250, 375);

const imgData = ctx.getImageData(0, 0, 250, 375).data;
```

## 2. Particle Data Mapping

Each particle corresponds to one pixel in our grid. To represent this on the GPU, we use a `Particle` struct with the following key fields:

- **`targetPos` (`targetX`, `targetY`)**: These are the "destination" coordinates. We map the 2D grid index `(px, py)` to the `[-1, 1]` range. We multiply `targetX` by the image's aspect ratio to maintain portrait proportions and flip `targetY` because screen coordinates are top-down while WebGPU is bottom-up.
- **`color` (`r`, `g`, `b`)**: We extract the Red, Green, and Blue channels from the image data and normalize them from `0..255` to the `0..1` range required by the shader.

```typescript
const imageAspectRatio = width / height;

for (let i = 0; i < numParticles; i++) {
  const offset = i * floatPerParticle;
  const px = i % width;
  const py = Math.floor(i / width);

  // currentPos (x, y) - Start at random positions
  particleData[offset + 0] = Math.random() * 4 - 2;
  particleData[offset + 1] = Math.random() * 4 - 2;

  // targetPos (targetX, targetY) - Where the pixel belongs in the image
  // We use 1.2 as a scaling factor to control the image size on screen
  particleData[offset + 2] = (px / width - 0.5) * (1.2 * imageAspectRatio);
  particleData[offset + 3] = (0.5 - py / height) * 1.2;
  
  // color (r, g, b) - Normalized pixel colors
  particleData[offset + 4] = imgData[i * 4 + 0] / 255;
  particleData[offset + 5] = imgData[i * 4 + 1] / 255;
  particleData[offset + 6] = imgData[i * 4 + 2] / 255;

  // size - Small squares for a "pixel" look
  particleData[offset + 7] = 0.003;
}
```

## 3. The "Fly-in" Compute Shader

The Compute Shader is very simple. It calculates the interpolated position between the particle's current position and its `targetPos` using the `mix()` function.

Since each particle starts at a random position, they will appear to "fly in" from all directions to form the image.

```wgsl
@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let index = id.x;
  if (index >= arrayLength(&particles)) { return; }

  var p = particles[index];
  
  // Smoothly move the particle towards its target destination
  p.pos = mix(p.pos, p.targetPos, params.speed);

  particles[index] = p;
}
```

## 4. Performance

Even with nearly **100,000 particles**, WebGPU handles the simulation and rendering with ease. Each frame, the GPU:
1.  Calculates 100,000 position updates (Compute Pass).
2.  Draws 600,000 vertices (Render Pass).

This is the power of offloading heavy calculations to the graphics hardware!

## 5. Interactive Explosion

To make the demo more interactive, we added a click event listener to the canvas. When you click:
1.  We iterate through the particle data on the CPU and assign new random `pos` values to every particle.
2.  We use `device.queue.writeBuffer()` to upload these new positions to the GPU.
3.  Since the Compute Shader is constantly pulling particles towards their `targetPos`, they will automatically fly back to reform the Mona Lisa.

```typescript
canvas.addEventListener("click", () => {
  for (let i = 0; i < numParticles; i++) {
    const offset = i * floatPerParticle;
    // Randomize current position only
    particleData[offset + 0] = Math.random() * 4 - 2; 
    particleData[offset + 1] = Math.random() * 4 - 2;
  }
  device.queue.writeBuffer(particleBuffer, 0, particleData);
});
```
