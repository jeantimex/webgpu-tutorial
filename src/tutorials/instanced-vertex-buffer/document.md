# Instanced Vertex Buffer

Uniform-buffer instancing works, but uniform buffers have strict size limits. For large instance counts, the scalable approach is **instanced vertex buffers**: regular vertex buffers whose `stepMode` is set to `"instance"` so each instance reads a new chunk of data.

This tutorial shows how to provide per-instance offsets and colors via a second vertex buffer.

**Key learning points:**

- How `stepMode: "instance"` advances data once per instance.
- How to interleave per-instance attributes (offset + color).
- How to bind multiple vertex buffers (geometry + instance data).
- How instance attributes flow into WGSL with `@location`.

## 1. Two buffers: geometry and instance data

We keep geometry in one buffer and instance data in another. The geometry buffer is read per vertex, while the instance buffer advances once per instance.

```typescript
// Geometry: triangle vertices
const vertices = new Float32Array([
   0.0,  0.1, 0.5,
  -0.1, -0.1, 0.5,
   0.1, -0.1, 0.5
]);
```

Instance data includes an offset (vec2) and a color (vec4):

```typescript
const numInstances = 10;
const floatsPerInstance = 6; // 2 for offset, 4 for color
const instanceData = new Float32Array(numInstances * floatsPerInstance);

for (let i = 0; i < numInstances; i++) {
  const base = i * floatsPerInstance;

  // Offset
  instanceData[base + 0] = Math.random() * 1.6 - 0.8;
  instanceData[base + 1] = Math.random() * 1.6 - 0.8;

  // Color
  instanceData[base + 2] = Math.random();
  instanceData[base + 3] = Math.random();
  instanceData[base + 4] = Math.random();
  instanceData[base + 5] = 1.0;
}
```

## 2. Describe the two buffer layouts

The pipeline declares both buffers in the `vertex.buffers` array. The first buffer is `stepMode: "vertex"` (default), the second is `stepMode: "instance"`.

```typescript
buffers: [
  // Buffer 0: Geometry
  {
    arrayStride: 3 * 4,
    stepMode: "vertex",
    attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
  },
  // Buffer 1: Instance data
  {
    arrayStride: 6 * 4,
    stepMode: "instance",
    attributes: [
      { shaderLocation: 1, offset: 0, format: "float32x2" }, // offset
      { shaderLocation: 2, offset: 8, format: "float32x4" }, // color
    ],
  },
],
```

**Key idea:** attributes in the second buffer advance once per instance, not per vertex.

## 3. Vertex shader inputs

Instance data appears as normal vertex attributes, just sourced from the instance buffer:

```typescript
@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) offset : vec2f,
  @location(2) color : vec4f
) -> VertexOutput {
  var output : VertexOutput;
  output.position = vec4f(pos.xy + offset, pos.z, 1.0);
  output.color = color;
  return output;
}
```

## 4. Bind both buffers and draw

```typescript
passEncoder.setVertexBuffer(0, geometryBuffer);
passEncoder.setVertexBuffer(1, instanceBuffer);
passEncoder.draw(3, numInstances);
```

The GPU now draws the triangle multiple times, applying a new offset and color for each instance.

## Why this scales better

- Instance data lives in a normal vertex buffer, not a uniform buffer.
- Vertex buffers can be much larger and are optimized for streaming.
- You avoid uniform buffer size limits and alignment padding.

## Common pitfalls

- **Wrong `stepMode`**: if you forget `"instance"`, all instances share the first entry.
- **Attribute mismatch**: WGSL `@location` values must match the pipeline layout.
- **Wrong stride or offsets**: leads to color/offset corruption.
