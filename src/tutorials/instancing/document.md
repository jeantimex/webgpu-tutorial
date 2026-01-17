# Instancing

When you need hundreds or thousands of copies of the same mesh, issuing one draw call per object is slow. **Instancing** draws many copies of a mesh in a single call, while the shader uses `instance_index` to apply per-instance data like color and position offsets.

This tutorial demonstrates instancing with a **uniform buffer array**, which is a common first step before moving to instanced vertex buffers.

**Key learning points:**

- How `draw(vertexCount, instanceCount)` expands a single draw into many instances.
- How to access `@builtin(instance_index)` in the vertex shader.
- How to pack per-instance data into a uniform buffer array.
- Why uniform buffer alignment matters (16-byte rules).
- Where this approach starts to break down at high instance counts.

## 1. Instanced draw calls

A normal draw call runs the vertex shader once per vertex. Instanced drawing runs it once per **vertex per instance**.

```typescript
// Draw 3 vertices, 10 instances
passEncoder.draw(3, numInstances);
```

The GPU executes `vs_main` `vertexCount * instanceCount` times. Two built-ins help you index correctly:

- `@builtin(vertex_index)` changes every vertex.
- `@builtin(instance_index)` stays constant for the current instance, then increments.

## 2. Per-instance data in a uniform buffer

We store per-instance color and offset in a uniform buffer array. In WGSL, that means an array of structs:

```typescript
struct Instance {
  color : vec4f,
  offset : vec2f,
  // Implicit padding to reach 32-byte stride
};

struct Uniforms {
  instances : array<Instance, __INSTANCE_COUNT__>,
};

@group(0) @binding(0) var<uniform> global : Uniforms;
```

### Why the 32-byte stride?

Uniform buffer array elements must be aligned to **16 bytes**, and the element stride must be a multiple of 16 bytes. The `Instance` struct contains:

- `vec4f` = 16 bytes
- `vec2f` = 8 bytes
- Total = 24 bytes

The next multiple of 16 is **32**, so each array element consumes 32 bytes. That is why we add padding on the CPU side.

## 3. Packing the data in JavaScript

We precompute all instance data into a single `Float32Array`, with 8 floats per instance (32 bytes):

```typescript
const numInstances = 10;
const floatsPerInstance = 8;
const instanceData = new Float32Array(numInstances * floatsPerInstance);

for (let i = 0; i < numInstances; i++) {
  const base = i * floatsPerInstance;

  // Color (4 floats)
  instanceData[base + 0] = Math.random();
  instanceData[base + 1] = Math.random();
  instanceData[base + 2] = Math.random();
  instanceData[base + 3] = 1.0;

  // Offset (2 floats)
  instanceData[base + 4] = Math.random() * 1.6 - 0.8;
  instanceData[base + 5] = Math.random() * 1.6 - 0.8;

  // Padding (2 floats)
  instanceData[base + 6] = 0;
  instanceData[base + 7] = 0;
}
```

The memory layout matches the WGSL struct array:

- `color` (4 floats)
- `offset` (2 floats)
- `padding` (2 floats)

## 4. Use `instance_index` in the vertex shader

```typescript
@vertex
fn vs_main(
  @builtin(instance_index) instanceIdx : u32,
  @location(0) pos : vec3f
) -> VertexOutput {
  let inst = global.instances[instanceIdx];

  var output : VertexOutput;
  output.position = vec4f(pos.xy + inst.offset, pos.z, 1.0);
  output.color = inst.color;
  return output;
}
```

Each instance reads a different struct and applies a unique offset and color.

## 5. Bind the uniform buffer and draw

The bind group connects the uniform buffer to `@group(0) @binding(0)`:

```typescript
const bindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
});
```

Then we draw all instances in one call:

```typescript
passEncoder.setVertexBuffer(0, vertexBuffer);
passEncoder.setBindGroup(0, bindGroup);
passEncoder.draw(3, numInstances);
```

## 6. Limitations of uniform-buffer instancing

This technique is simple and works well for small instance counts, but uniform buffers have size limits (often 64KB per bind group on many GPUs). That means the number of instances you can store this way is capped.

For large numbers of instances, **instanced vertex buffers** are usually a better fit, because they do not have the same size restrictions and can be streamed more efficiently.

## Common pitfalls

- **Incorrect padding**: causes colors or offsets to read incorrectly.
- **Array size mismatch** between WGSL and JS.
- **Uniform buffer size limits**: large instance counts may fail validation.
