# Shader Structs

In the last tutorial, we learned how to interleave multiple attributes into a single buffer. However, as our data becomes more complex, passing individual arguments to our shader functions (like `fn vs_main(@location(0) a: f32, @location(1) b: f32...)`) becomes messy and hard to read.

In this tutorial, we will learn how to use **Structs** in WGSL to organize our shader inputs and outputs. This is best practice for writing clean, scalable shader code.

**Key Learning Points:**

- Defining `struct` types in WGSL.
- Using structs as function arguments and return types.
- Accessing struct fields using dot notation (e.g., `input.position`).
- Cleaning up the `vs_main` and `fs_main` signatures.

## 1. Defining Structs

In WGSL, we can define a `struct` to group related data fields.

### Vertex Input Struct

Instead of defining arguments in the function signature, we define a struct that matches our Vertex Buffer layout.

```typescript
struct VertexInput {
  @location(0) position : vec2f,
  @location(1) color : vec3f,
};
```

### Vertex Output Struct

We also define a struct for the data we want to pass to the fragment shader (and the rasterizer).

```typescript
struct VertexOutput {
  @builtin(position) position : vec4f, // Required for the rasterizer
  @location(0) color : vec3f,          // Our custom data
};
```

## 2. Using Structs in Functions

Now our `vs_main` function becomes much cleaner. It takes a single `VertexInput` argument and returns a `VertexOutput`.

```typescript
@vertex
fn vs_main(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.position = vec4f(input.position, 0.0, 1.0);
  output.color = input.color;
  return output;
}
```

Similarly, the fragment shader receives the interpolated `VertexOutput`.

```typescript
@fragment
fn fs_main(input : VertexOutput) -> @location(0) vec4f {
  return vec4f(input.color, 1.0);
}
```

## Why use Structs?

1. **Organization**: Keeps related data together.
2. **Readability**: `input.color` is clearer than just `color`.
3. **Scalability**: Adding a new attribute (like a Texture Coordinate) involves just adding a field to the struct, rather than changing function signatures everywhere.
