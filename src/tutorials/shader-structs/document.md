# Shader Structs

As vertex data grows (position, color, normals, UVs, tangents), shader function signatures become noisy. WGSL structs let us **bundle related attributes** and **pass them around as a single value**, which keeps shaders readable and easier to extend.

This tutorial shows how to define input/output structs in WGSL and how they map to the same interleaved vertex buffer layout from the previous tutorial.

**Key learning points:**

- How WGSL `struct` fields attach to `@location` and `@builtin` attributes.
- Why struct-based IO scales better than long parameter lists.
- How vertex output structs flow into fragment input structs.
- How buffer layout still controls the actual data feeding those structs.

## 1. The vertex data is unchanged

We use the same interleaved buffer as before: position (x,y) + color (r,g,b) per vertex.

```typescript
// x, y, r, g, b
// prettier-ignore
const vertices = new Float32Array([
  0.0,  0.5,  1.0, 0.0, 0.0, // Top (Red)
 -0.5, -0.5,  0.0, 1.0, 0.0, // Bottom Left (Green)
  0.5, -0.5,  0.0, 0.0, 1.0  // Bottom Right (Blue)
]);
```

The buffer layout is still a 5-float stride with two attributes (location 0 and 1).

## 2. Define a struct for vertex inputs

Instead of listing every attribute in the function signature, we define a struct whose fields carry `@location` attributes.

```typescript
struct VertexInput {
  @location(0) position : vec2f,
  @location(1) color : vec3f,
};
```

This tells WebGPU:

- The `position` field comes from attribute location 0.
- The `color` field comes from attribute location 1.

The **buffer layout still drives the data**, but the struct makes the shader readable.

## 3. Define a struct for vertex outputs

The vertex shader must always write a clip-space position. Anything else you return is interpolated and passed to the fragment shader.

```typescript
struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec3f,
};
```

Why both `@builtin` and `@location`?

- `@builtin(position)` is required for rasterization.
- `@location(0)` is a user-defined value that will be interpolated across the triangle and become fragment input.

## 4. Clean vertex and fragment signatures

With structs, the vertex shader becomes a simple data transform:

```typescript
@vertex
fn vs_main(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.position = vec4f(input.position, 0.0, 1.0);
  output.color = input.color;
  return output;
}
```

And the fragment shader just reads the interpolated color:

```typescript
@fragment
fn fs_main(input : VertexOutput) -> @location(0) vec4f {
  return vec4f(input.color, 1.0);
}
```

## 5. Pipeline and buffer layout still matter

Structs do not replace buffer layouts. The mapping still works the same way:

- **Buffer layout** maps raw bytes to `shaderLocation` values.
- **Struct fields** declare which `shaderLocation` each field should read.

```typescript
const vertexBufferLayout: GPUVertexBufferLayout = {
  arrayStride: 5 * 4,
  attributes: [
    { shaderLocation: 0, offset: 0, format: "float32x2" }, // position
    { shaderLocation: 1, offset: 2 * 4, format: "float32x3" }, // color
  ],
};
```

If the locations mismatch, fields get the wrong data. The struct itself does not validate layout; it only declares intent.

## 6. Why this pattern is important

- **Scales cleanly**: add a UV or normal by adding a field, not rewriting the signature.
- **Readable**: `input.position` is clearer than `pos` at location 0.
- **Reusable**: the same `VertexOutput` struct can be shared across multiple shaders.

## Common pitfalls

- **Mismatched locations** between WGSL and the buffer layout.
- **Forgetting `@builtin(position)`** in the output struct.
- **Duplicating structs** across files without keeping them consistent.
