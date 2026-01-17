# Image Processing (Storage Textures)

In this tutorial, we will learn how to use Compute Shaders to manipulate image data directly. We'll implement a real-time filter system (Grayscale, Invert, and Blur) that processes every pixel of an image on the GPU.

**Key Learning Points:**
- Using `texture_storage_2d` to write to textures from a compute shader.
- Understanding `textureLoad` vs `textureSample`.
- Implementing simple image kernels (Box Blur).
- Coordinating a two-pass pipeline: Compute -> Render.

## 1. Storage Textures

Normally, textures in shaders are read-only (using `textureSample`). To allow a Compute Shader to write data into a texture, we must create it with the `STORAGE_BINDING` usage.

```typescript
const outputTexture = device.createTexture({
  size: [width, height],
  format: "rgba8unorm",
  usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
});
```

In WGSL, we declare it like this:
```wgsl
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;
```

## 2. Working with Pixels

In a Compute Shader, we work with integer coordinates (pixels) rather than normalized UVs (0 to 1).

### Reading (`textureLoad`)
We fetch the color of a specific pixel at `(x, y)`:
```wgsl
let coords = vec2i(id.xy);
let color = textureLoad(inputTex, coords, 0); // 0 is the mip-level
```

### Writing (`textureStore`)
We save the modified color back to the storage texture:
```wgsl
textureStore(outputTex, coords, modifiedColor);
```

## 3. Implementing Filters

### Grayscale
We calculate luminance by weighting the Red, Green, and Blue channels based on human eye sensitivity.
```wgsl
let lum = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
color = vec4f(lum, lum, lum, 1.0);
```

### Box Blur (3x3)
A blur effect is created by averaging the color of a pixel with its neighbors. A 3x3 kernel looks at the 8 surrounding pixels and the center pixel (9 total).
```wgsl
var acc = vec3f(0.0);
for (var i = -1; i <= 1; i++) {
  for (var j = -1; j <= 1; j++) {
    let offsetCoords = clamp(coords + vec2i(i, j), vec2i(0), vec2i(dims) - 1);
    acc += textureLoad(inputTex, offsetCoords, 0).rgb;
  }
}
let blurredColor = vec4f(acc / 9.0, 1.0);
```
