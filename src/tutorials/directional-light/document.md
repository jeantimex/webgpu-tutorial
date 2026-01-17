# Directional Light

This tutorial adds **directional lighting** (Lambert diffuse) to a 3D cube. Directional light simulates sunlight: a single direction with parallel rays that illuminate surfaces based on their orientation.

We introduce surface **normals**, the **normal matrix**, and the dot product used in diffuse lighting.

**Key learning points:**

- Why normals are required for lighting.
- How to transform normals correctly using a normal matrix.
- How Lambertian diffuse lighting works.
- How to pass light direction and intensity to the shader.
- Why indexed geometry uses per‑face normals for a cube.

## 1. Geometry with normals

Lighting needs a normal per vertex. For a cube, each face has a constant normal, so we store **24 vertices** (4 per face) instead of sharing vertices across faces. That keeps normals correct and produces flat shading.

```typescript
// Position + Normal per vertex
// Front (+Z)
-0.5, -0.5,  0.5,   0, 0, 1,
 0.5, -0.5,  0.5,   0, 0, 1,
 0.5,  0.5,  0.5,   0, 0, 1,
-0.5,  0.5,  0.5,   0, 0, 1,
```

We still index the vertices so we can render each face as two triangles:

```typescript
const indexData = new Uint16Array([
  0, 1, 2,  2, 3, 0,   // Front
  4, 5, 6,  6, 7, 4,   // Right
  // ...
]);
```

## 2. The uniform data

We need multiple matrices and a light direction. The uniform block includes:

- **MVP matrix** (camera projection)
- **Model matrix** (object transform)
- **Normal matrix** (inverse‑transpose of model)
- **Light direction + intensity**

```wgsl
struct Uniforms {
  mvpMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  normalMatrix : mat3x3f,
  lightDirIntensity : vec4f,
}
```

On the CPU we compute and upload all of these each frame.

## 3. The normal matrix (why not MVP?)

Normals are **directions**, not positions. They should not be affected by translation, and they require correct handling of non‑uniform scale. The standard fix is to use the **inverse‑transpose** of the model matrix’s upper‑left 3×3:

```typescript
mat3.fromMat4(modelMatrix, normalMatrix);
mat3.invert(normalMatrix, normalMatrix);
mat3.transpose(normalMatrix, normalMatrix);
```

This keeps normals perpendicular to the surface after rotation and scaling.

## 4. Vertex shader: transform positions and normals

```wgsl
@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) normal : vec3f
) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  out.normal = uniforms.normalMatrix * normal;
  return out;
}
```

The vertex shader emits clip‑space positions and world‑space normals for the fragment shader.

## 5. Fragment shader: Lambert diffuse

Directional light uses the dot product between the surface normal **N** and light direction **L**:

```wgsl
let N = normalize(in.normal);
let L = normalize(uniforms.lightDirIntensity.xyz);
let diffuse = max(dot(N, L), 0.0) * max(uniforms.lightDirIntensity.w, 0.0);
```

This produces:

- **1.0** when the surface faces the light.
- **0.0** when the surface is perpendicular.
- **0.0** when the light is behind the surface.

We multiply a base color by this diffuse term:

```wgsl
let baseColor = vec3f(1.0, 0.0, 0.0);
return vec4f(baseColor * diffuse, 1.0);
```

## 6. Light direction control

The light direction is normalized on the CPU and sent along with intensity:

```typescript
const lightDir = vec3.normalize([
  settings.lightDirX,
  settings.lightDirY,
  settings.lightDirZ,
]);

device.queue.writeBuffer(
  uniformBuffer,
  176,
  new Float32Array([lightDir[0], lightDir[1], lightDir[2], settings.intensity])
);
```

This makes the GUI sliders immediately affect lighting direction and brightness.

## Common pitfalls

- **Not normalizing the light direction**: produces incorrect brightness.
- **Skipping the normal matrix**: lighting breaks when the model rotates or scales.
- **Using shared cube vertices**: normals become averaged and edges look smooth.
