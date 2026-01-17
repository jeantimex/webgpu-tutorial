# Shadow Mapping

Shadow mapping renders the scene twice: once from the light’s point of view to build a **depth map**, then again from the camera to shade pixels that are occluded. This tutorial implements a basic shadow map with a directional light.

**Key learning points:**

- How a depth texture acts as a shadow map.
- Why the scene must be rendered from the light’s view first.
- How to transform a world position into shadow map UVs.
- How to sample a depth texture with a comparison sampler.
- How to use dynamic uniform offsets for multiple objects.

## 1. Two render passes

Shadow mapping is a two‑pass technique:

1. **Shadow pass**: render depth from the light’s perspective.
2. **Main pass**: render normally from the camera, and use the shadow map to darken occluded pixels.

The shadow pass has **no color attachments**, only depth:

```typescript
const shadowPass = commandEncoder.beginRenderPass({
  colorAttachments: [],
  depthStencilAttachment: {
    view: shadowDepthView,
    depthClearValue: 1.0,
    depthLoadOp: "clear",
    depthStoreOp: "store",
  },
});
```

## 2. Light view‑projection matrix

A directional light uses an orthographic projection. We compute a light view‑projection matrix each frame and store it in the light uniform buffer:

```typescript
const lightViewMatrix = mat4.lookAt(lightPos, [0, 0, 0], [0, 1, 0]);
const lightProjectionMatrix = mat4.ortho(-12, 12, -12, 12, 0.1, 30);
const lightViewProjectionMatrix = mat4.multiply(lightProjectionMatrix, lightViewMatrix);
```

This matrix is also used by the shadow pass vertex shader to write depth.

## 3. Shadow pass vertex shader

The shadow pass only needs positions. It transforms each vertex into the light’s clip space:

```wgsl
@vertex
fn vs_shadow(@location(0) pos : vec3f) -> @builtin(position) vec4f {
  return lightUniforms.lightViewProjectionMatrix * uniforms.modelMatrix * vec4f(pos, 1.0);
}
```

The output depth becomes the shadow map.

## 4. Main pass: compute shadow UVs

In the lit vertex shader we also compute the position in light space and convert it to texture coordinates:

```wgsl
let posFromLight = lightUniforms.lightViewProjectionMatrix * worldPos;
let ndc = posFromLight.xyz / posFromLight.w;
out.shadowPos = vec3f(
  ndc.xy * vec2f(0.5, -0.5) + vec2f(0.5, 0.5),
  ndc.z
);
```

This maps clip‑space `[-1, 1]` to texture UV space `[0, 1]`.

## 5. Shadow sampling with PCF

We use a comparison sampler and a 3×3 PCF kernel to soften edges:

```wgsl
let bias = max(0.004 * (1.0 - dot(normal, lightDir)), 0.001);
let texelSize = 1.0 / shadowMapSize;

var visibility = 0.0;
for (var y = -1; y <= 1; y++) {
  for (var x = -1; x <= 1; x++) {
    let offset = vec2f(vec2(x, y)) * texelSize;
    visibility += textureSampleCompare(
      shadowMap,
      shadowSampler,
      uvClamped + offset,
      depthClamped - bias
    );
  }
}
visibility = visibility / 9.0;
```

- `textureSampleCompare` returns 1.0 when the fragment is **not** in shadow.
- The bias reduces self‑shadowing artifacts.

## 6. Lighting combination

We apply a simple ambient + directional diffuse model, then multiply diffuse by the shadow term:

```wgsl
let ambient = lightUniforms.ambientColor.rgb * 0.3;
let diff = max(dot(N, L), 0.0);
let diffuse = diff * lightUniforms.dirLightColor.rgb;

let shadow = computeShadow(in.shadowPos, N, L);
let lighting = ambient + diffuse * shadow;
```

## 7. Dynamic uniform offsets

We draw both the plane and the box using the same uniform buffer, but with different offsets:

```typescript
pass.setBindGroup(0, bindGroup, [0]);           // plane
pass.setBindGroup(0, bindGroup, [UNIFORM_ALIGNMENT]); // box
```

This avoids allocating separate uniform buffers per object.

## Common pitfalls

- **Shadow acne**: use a bias and depth slope scale in the shadow pipeline.
- **Peter‑panning**: too much bias lifts the shadow away from the object.
- **Incorrect light projection bounds**: shadows may clip or shimmer.
- **Sampling outside [0,1]**: clamp UVs or discard when out of bounds.
