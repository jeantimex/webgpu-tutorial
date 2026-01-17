# Ambient Light

Directional light alone creates harsh contrast: bright faces and completely black faces. Real scenes have **ambient light**, a simple approximation of indirect light bouncing around the environment.

Ambient lighting is not directional and does not depend on surface normals. It adds a uniform base illumination to every fragment.

**Key learning points:**

- What ambient light represents in real‑time graphics.
- Why ambient light does not require normals.
- How to combine ambient intensity with a base color.
- How to pass lighting parameters through a uniform buffer.

## 1. What ambient light simulates

Ambient light approximates **global illumination** with a constant term. Instead of simulating light bounces, we apply a single scalar that brightens the entire object evenly.

That means:

- No light direction
- No shadowing
- No per‑face variation

It is useful as a “minimum brightness” layer when combined with other lights.

## 2. Simpler geometry input (no normals)

Because ambient lighting ignores surface direction, we only need positions. The vertex buffer stores just `vec3f` positions, and the shader has no normal attribute.

```typescript
const vertexData = new Float32Array([
  -0.5, -0.5,  0.5,
   0.5, -0.5,  0.5,
   0.5,  0.5,  0.5,
  -0.5,  0.5,  0.5,
  // ... remaining cube vertices
]);
```

## 3. Uniform data: MVP + ambient + base color

We keep the MVP matrix to place the cube in 3D, then add two lighting parameters:

- `ambient`: a single float stored in a `vec4f` for alignment.
- `baseColor`: the cube's color.

```wgsl
struct Uniforms {
  mvpMatrix : mat4x4f,
  ambient : vec4f,
  baseColor : vec4f,
}
```

On the CPU we upload the values every frame:

```typescript
device.queue.writeBuffer(uniformBuffer, 64, new Float32Array([settings.ambientIntensity, 0, 0, 0]));
device.queue.writeBuffer(uniformBuffer, 80, new Float32Array([r, g, b, 1]));
```

## 4. Fragment shader: constant lighting

Ambient lighting is just a multiplication of base color by intensity:

```wgsl
let baseColor = uniforms.baseColor.rgb;
let lighting = baseColor * clamp(uniforms.ambient.x, 0.0, 1.0);
return vec4f(lighting, 1.0);
```

Because every fragment uses the same value, the cube looks “flat.” That is expected: ambient light alone does not convey shape.

## 5. Why this still matters

Ambient light is rarely used alone, but it is almost always combined with other lights so shadows never become fully black. It provides a baseline that makes scenes more readable.

## Common pitfalls

- **Expecting shading**: ambient light does not vary by angle or surface.
- **Forgetting alignment**: use `vec4f` to avoid padding issues.
- **Using normals unnecessarily**: they are ignored in this lighting model.
