# Uniform Buffer

So far we have only sent data that changes **per vertex** (positions and colors). But real rendering needs data that stays constant for a draw call: object colors, transformation matrices, lighting parameters, and more. WebGPU uses **uniform buffers** for this kind of data.

This tutorial introduces uniform buffers and bind groups, the mechanism that connects CPU-side resources to shader variables.

**Key learning points:**

- The difference between **vertex attributes** and **uniforms**.
- How to create and fill a `GPUBuffer` with `GPUBufferUsage.UNIFORM`.
- How `@group` and `@binding` in WGSL map to bind groups in JavaScript.
- Why alignment matters and why `vec4f` is the safe choice for small uniforms.
- How to bind uniform data at draw time.

## 1. Attributes vs. uniforms

- **Attributes** (`@location`) change per vertex and come from vertex buffers.
- **Uniforms** (`var<uniform>`) stay constant for a whole draw call and come from uniform buffers.

Attributes describe geometry. Uniforms describe global or per-object parameters.

## 2. Create the uniform data

We want a single constant color for the entire triangle. Use a `Float32Array` with four floats (RGBA).

```typescript
const color = new Float32Array([0.0, 0.5, 0.5, 1.0]);
```

### Alignment note

Uniform buffers follow strict alignment rules. A `vec3f` is 12 bytes, but in uniform memory it is padded to 16 bytes. Using `vec4f` avoids padding surprises and matches 16-byte alignment by default.

## 3. Allocate the uniform buffer

```typescript
const uniformBuffer = device.createBuffer({
  label: "Uniform Color Buffer",
  size: color.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(uniformBuffer, 0, color);
```

We use `COPY_DST` so we can upload data from the CPU. This is how you update uniforms each frame as well.

## 4. Declare the uniform in WGSL

Uniforms live in a struct and are referenced via a global `var<uniform>` that specifies a group and binding.

```typescript
struct Uniforms {
  color : vec4f,
};

@group(0) @binding(0) var<uniform> global : Uniforms;
```

This creates a single uniform block at **group 0, binding 0**.

## 5. Use the uniform in the fragment shader

```typescript
@fragment
fn fs_main() -> @location(0) vec4f {
  return global.color;
}
```

Every pixel now reads the same color from the uniform buffer.

## 6. Let the pipeline infer the bind group layout

We set `layout: "auto"` so WebGPU derives the bind group layout from the shader code:

```typescript
const pipeline = device.createRenderPipeline({
  label: "Uniform Pipeline",
  layout: "auto",
  vertex: {
    module: vertexModule,
    entryPoint: "vs_main",
    buffers: [
      {
        arrayStride: 2 * 4,
        attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
      },
    ],
  },
  fragment: {
    module: fragmentModule,
    entryPoint: "fs_main",
    targets: [{ format: canvasFormat }],
  },
  primitive: { topology: "triangle-list" },
});
```

The pipeline now knows there is a uniform block at group 0 / binding 0.

## 7. Create the bind group

A **bind group** is a container for resources that match a layout. We connect the uniform buffer to binding 0:

```typescript
const bindGroup = device.createBindGroup({
  label: "Uniform Bind Group",
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: { buffer: uniformBuffer },
    },
  ],
});
```

## 8. Bind it at draw time

```typescript
passEncoder.setPipeline(pipeline);
passEncoder.setVertexBuffer(0, vertexBuffer);
passEncoder.setBindGroup(0, bindGroup);
passEncoder.draw(3);
```

The bind group makes the uniform buffer visible to the shader for this draw call.

## Groups vs. bindings (why both?)

Bindings are individual slots, while groups are **collections** of bindings. Grouping lets you update resources at different frequencies:

- **Group 0**: per-frame data (camera, time, lighting)
- **Group 1**: per-material data (textures, roughness)
- **Group 2**: per-object data (transform, color)

You can swap an entire group with one call, which is efficient and keeps state management clean.

## Common pitfalls

- **Using a `vec3f` without padding**: leads to incorrect reads.
- **Forgetting `COPY_DST`**: prevents uploading data.
- **Binding the wrong group index**: results in invalid or missing uniform data.
