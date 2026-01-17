# Image Processing

This tutorial shows how to use a **compute shader** to process image pixels on the GPU, then render the processed image to the screen. We implement a small filter system (grayscale, invert, blur) to demonstrate a full **compute → render** pipeline.

**Key learning points:**

- How `texture_storage_2d` enables GPU writes in compute shaders.
- The difference between `textureLoad` and `textureSample`.
- How to dispatch workgroups for a 2D image.
- How to chain a compute pass into a render pass.
- How to maintain image aspect ratio when rendering to a resizable canvas.

## 1. The two‑pass pipeline

We use two separate GPU pipelines:

1. **Compute pass**: reads the input texture, applies a filter, writes to an output storage texture.
2. **Render pass**: draws a full‑screen quad that samples the output texture.

This split keeps the compute shader focused on pixel processing and the render shader focused on presentation.

## 2. Create input and output textures

The input texture is sampled by the compute shader. The output texture is a **storage texture** so the compute shader can write to it.

```typescript
const inputTexture = device.createTexture({
  size: [source.width, source.height],
  format: "rgba8unorm",
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
});

const outputTexture = device.createTexture({
  size: [source.width, source.height],
  format: "rgba8unorm",
  usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
});
```

**Why `STORAGE_BINDING`?** Because compute shaders can only write to textures declared as storage textures in WGSL.

## 3. Compute shader: reading and writing pixels

In a compute shader, pixel coordinates are **integer** (not UVs). We use `textureLoad` and `textureStore`:

```typescript
let coords = vec2i(id.xy);
let color = textureLoad(inputTex, coords, 0);
textureStore(outputTex, coords, color);
```

- `textureLoad` reads a specific integer pixel coordinate.
- `textureSample` is only for filtered sampling in render shaders.

The output texture is declared like this:

```typescript
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;
```

## 4. Filters: grayscale, invert, blur

We pass a filter selection through a tiny uniform buffer (`params.filterType`). The compute shader branches based on the selected filter:

### Grayscale

```typescript
let lum = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
color = vec4f(lum, lum, lum, 1.0);
```

### Invert

```typescript
color = vec4f(1.0 - color.rgb, 1.0);
```

### Box blur (3x3)

```typescript
var acc = vec3f(0.0);
for (var i = -1; i <= 1; i++) {
  for (var j = -1; j <= 1; j++) {
    let offsetCoords = clamp(coords + vec2i(i, j), vec2i(0), vec2i(dims) - 1);
    acc += textureLoad(inputTex, offsetCoords, 0).rgb;
  }
}
color = vec4f(acc / 9.0, 1.0);
```

The blur reads neighboring pixels, averages them, and writes the result back to the output texture.

## 5. Dispatching compute workgroups

The shader uses `@workgroup_size(8, 8)`, so we dispatch enough workgroups to cover the entire image:

```typescript
computePass.dispatchWorkgroups(
  Math.ceil(source.width / 8),
  Math.ceil(source.height / 8)
);
```

We also guard against out‑of‑bounds threads in WGSL:

```typescript
if (coords.x >= i32(dims.x) || coords.y >= i32(dims.y)) {
  return;
}
```

## 6. Render pass: display the output texture

The render shader draws a full‑screen quad using a triangle strip and samples the output texture:

```typescript
renderPass.setPipeline(renderPipeline);
renderPass.setBindGroup(0, renderBindGroup);
renderPass.draw(4);
```

The fragment shader uses `textureSample` because we want filtering and normalized UVs.

## 7. Keep the image aspect ratio

The render shader computes a scale factor using a small uniform block:

```typescript
struct RenderUniforms {
  imageAspect : f32,
  canvasAspect : f32,
  padding : vec2f,
}
```

On resize, we update the uniform so the quad is scaled to **contain** the image without stretching.

## Common pitfalls

- **Forgetting `STORAGE_BINDING`** on the output texture.
- **Using `textureSample` in compute** (compute shaders should use `textureLoad`).
- **Incorrect workgroup count** leading to unprocessed pixels.
- **Not clamping blur samples** near image borders.
