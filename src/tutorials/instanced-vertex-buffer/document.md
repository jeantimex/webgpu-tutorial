# Instanced Vertex Buffer

In the last tutorial, we implemented instancing using a Uniform Buffer Array to store position and color data. While this works for small batches, Uniform Buffers have strict size limits, making them unsuitable for massive numbers of instances (like particles or grass).

In this tutorial, we will learn how to use **Instanced Vertex Buffers**. This is the standard, scalable way to handle per-instance data.

**Key Learning Points:**

- Setting `stepMode: "instance"` in `GPUVertexBufferLayout`.
- Interleaving per-instance data (offsets, colors).
- Passing instance data as standard shader attributes (`@location(...)`).
- Binding multiple vertex buffers (Geometry + Instance Data).

## 1. Concepts

- **Instance**: One copy of the object.
- **`stepMode: "instance"`**: Tells the pipeline that this buffer's data should be read once per instance.
- **Attributes**: Per-instance data (like offset and color) is received as standard attributes in the vertex shader.

## 2. Preparing the Data

In JavaScript, we prepare a single `Float32Array` that contains the data for all 10 instances. We interleave the **Offset** and **Color** for each instance.

- **Offset**: 2 floats (x, y).
- **Color**: 4 floats (r, g, b, a).
- **Total per instance**: 6 floats (24 bytes).

```typescript
const numInstances = 10;
const floatsPerInstance = 6;
const instanceData = new Float32Array(numInstances * floatsPerInstance);

for (let i = 0; i < numInstances; i++) {
  const base = i * floatsPerInstance;

  // Set Offset (Indices 0, 1)
  instanceData[base + 0] = x;
  instanceData[base + 1] = y;

  // Set Color (Indices 2, 3, 4, 5)
  instanceData[base + 2] = r;
  instanceData[base + 3] = g;
  instanceData[base + 4] = b;
  instanceData[base + 5] = a;
}
```

The resulting memory layout is: `[ Off0, Col0, Off1, Col1, ... ]`

## 3. Pipeline Configuration

We define two buffers in our `vertex` state: one for the shared geometry and one for the unique instance data.

```typescript
buffers: [
  // Buffer 0: Geometry (Shared)
  {
    arrayStride: 3 * 4,
    stepMode: "vertex", // Read for every vertex
    attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
  },
  // Buffer 1: Instance Data (Unique per copy)
  {
    arrayStride: 6 * 4, // 6 floats * 4 bytes = 24 bytes
    stepMode: "instance", // Read ONCE per instance
    attributes: [
      { shaderLocation: 1, offset: 0, format: "float32x2" }, // Offset
      { shaderLocation: 2, offset: 8, format: "float32x4" }, // Color
    ],
  },
],
```

## 4. The Shader

The shader receives both the vertex position and the instance data as attributes.

```wgsl
@vertex
fn vs_main(
  @location(0) pos : vec3f,    // Vertex Position
  @location(1) offset : vec2f, // Instance Offset
  @location(2) color : vec4f   // Instance Color
) -> VertexOutput {
  var output : VertexOutput;
  // Apply the instance offset directly to the vertex position
  output.position = vec4f(pos.xy + offset, pos.z, 1.0);
  output.color = color;
  return output;
}
```

## 5. Drawing

In the render loop, we bind both buffers and specify the number of instances.

```typescript
passEncoder.setVertexBuffer(0, geometryBuffer);
passEncoder.setVertexBuffer(1, instanceBuffer);

// Draw 3 vertices, 10 times!
passEncoder.draw(3, 10);
```
