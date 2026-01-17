# Instancing

In the last tutorial, we perfected our single object's transformation. But what if we want to draw _hundreds_ or _thousands_ of objects? Issuing thousands of individual `draw()` calls (one for each object) is extremely slow and CPU-intensive.

In this tutorial, we will learn how to use **Instancing** to draw many copies of the same mesh efficiently in a **single draw call**.

**Key Learning Points:**

- Using `draw(vertexCount, instanceCount)`.
- Accessing `@builtin(instance_index)` in the shader.
- Storing per-instance data in a **Uniform Buffer Array**.
- Understanding the limitations of Uniform Buffers for instancing.

## 1. Concepts

- **Instance**: One copy of the object.
- **`draw(vertexCount, instanceCount)`**: The command to draw `instanceCount` copies.
- **`@builtin(instance_index)`**: A variable in the vertex shader that tells you which copy you are currently processing (0, 1, 2...).

### The Draw Call

Standard drawing uses `draw(vertexCount)`. This runs the vertex shader once for each vertex.

Instanced drawing uses **`draw(vertexCount, instanceCount)`**.

- This command tells the GPU to draw the entire set of vertices (`vertexCount`) multiple times (`instanceCount`).
- **Vertex Shader Execution**: The shader runs `vertexCount * instanceCount` times total.
- **Indexing**:
  - `vertex_index` loops from `0` to `vertexCount - 1`.
  - `instance_index` stays constant for one whole shape, then increments for the next copy.

## 2. Array of Structs (Uniform Buffer)

We can pack all per-instance data (Color + Offset) into a single struct, and store an array of these structs in a **Uniform Buffer**.

```wgsl
struct Instance {
  color : vec4f,    // 16 bytes
  offset : vec2f,   // 8 bytes
}; // Total stride: 32 bytes (16-byte alignment requirement)

struct Uniforms {
  instances : array<Instance, 10>,
};
```

### Data Preparation in JavaScript

This is an important step. Because the GPU expects a single contiguous block of memory, we must interleave our colors and offsets in a single `Float32Array`.

For each instance, we need **8 floats** (32 bytes):

- **4 floats** for the RGBA color.
- **2 floats** for the Offset.
- **2 floats** for padding (to match the 16-byte alignment requirement of array elements in uniform buffers).

```typescript
const numInstances = 10;
const floatsPerInstance = 8;
const instanceData = new Float32Array(numInstances * floatsPerInstance);

for (let i = 0; i < numInstances; i++) {
  const base = i * floatsPerInstance;

  // Set Color (Indices 0-3)
  instanceData[base + 0] = r;
  instanceData[base + 1] = g;
  instanceData[base + 2] = b;
  instanceData[base + 3] = a;

  // Set Offset (Indices 4-5)
  instanceData[base + 4] = x;
  instanceData[base + 5] = y;
}
```

The resulting memory layout looks like this: `[ Color0 (4), Offset0 (2), Pad(2), Color1 (4), ... ]`

## 3. The Shader

In the shader, we access the global array using `instance_index`.

```wgsl
@vertex
fn vs_main(@builtin(instance_index) instanceIdx : u32, @location(0) pos : vec3f) -> VertexOutput {
  // 1. Pick the instance data struct
  let inst = global.instances[instanceIdx];

  // 2. Use offset and color
  var output : VertexOutput;
  output.position = vec4f(pos.xy + inst.offset, pos.z, 1.0);
  output.color = inst.color;

  return output;
}
```

## 4. Drawing

In the render loop, we simply tell the GPU how many instances to draw.

```typescript
// Draw 3 vertices, 10 times!
passEncoder.draw(3, 10);
```

## Summary & Next Steps

In this tutorial, we learned how to use **Instancing** to draw multiple copies of a shape with a single draw call. We used a **Uniform Buffer Array** to store unique transformation matrices and colors for each instance.

This approach is great for small to medium numbers of instances. however, WebGPU also provides another way to handle instanced data called **Instanced Vertex Buffers**. By setting the `stepMode` of a vertex buffer to `"instance"`, you can tell the GPU to automatically advance to the next data entry for each new instance drawn.

In the next tutorial, we will explore `stepMode: "instance"` and see how it compares to our current approach!
