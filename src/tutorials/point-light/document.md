# Point Light

Directional light uses a single constant direction. A **point light** has a position in space, so every surface point sees a **different light direction**. This tutorial implements a point light using per‑fragment world positions and Lambertian diffuse shading.

**Key learning points:**

- How point lights differ from directional lights.
- Why the light direction must be computed per fragment.
- How to pass world‑space positions from vertex to fragment.
- How to combine diffuse lighting with a small ambient term.
- How the normal matrix keeps lighting correct under rotation.

## 1. Point light vs. directional light

A directional light uses a single light vector `L` for the whole scene. A point light uses a **light position** and computes `L` per fragment:

```wgsl
let L = normalize(lightPos - surfacePos);
```

This makes highlights move naturally across the surface as the object rotates.

## 2. World‑space positions

To compute `lightPos - surfacePos`, both values must be in the same space. We use **world space**.

The vertex shader outputs world position:

```wgsl
out.worldPos = (uniforms.modelMatrix * vec4f(pos, 1.0)).xyz;
```

It also transforms normals using the normal matrix:

```wgsl
out.normal = uniforms.normalMatrix * normal;
```

## 3. Uniform data

We send these values in a uniform block:

```wgsl
struct Uniforms {
  mvpMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  normalMatrix : mat3x3f,
  lightPosIntensity : vec4f,
}
```

On the CPU, we pack the light position and intensity into the last vec4:

```typescript
device.queue.writeBuffer(
  uniformBuffer,
  176,
  new Float32Array([
    settings.lightPosX,
    settings.lightPosY,
    settings.lightPosZ,
    settings.intensity,
  ])
);
```

## 4. Fragment shader lighting

We compute Lambert diffuse using the per‑fragment light vector:

```wgsl
let N = normalize(in.normal);
let L = normalize(uniforms.lightPosIntensity.xyz - in.worldPos);
let diffuse = max(dot(N, L), 0.0);
```

We add a small ambient term so the back faces are not fully black:

```wgsl
let ambient = 0.1;
let lighting = min(diffuse * max(uniforms.lightPosIntensity.w, 0.0) + ambient, 1.0);
return vec4f(baseColor * lighting, 1.0);
```

## 5. Why the normal matrix still matters

Even with a point light, the diffuse term depends on surface normals. If you rotate the cube, the normals must rotate too. The normal matrix (inverse‑transpose of the model matrix’s 3×3) keeps this correct.

## Common pitfalls

- **Using view space for one value and world space for another**: lighting breaks.
- **Skipping normal normalization**: diffuse intensity becomes unstable.
- **Not updating light position** in the uniform buffer when GUI changes.
