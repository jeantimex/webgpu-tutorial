# 44. Random Geometries

In this tutorial, we render multiple 3D objects with randomly assigned geometry types using techniques from the official WebGPU samples. This demonstrates indexed geometry, shader-computed barycentric coordinates, and per-object bind groups.

## Overview

We create 8 different geometry types:
- **Box** - A simple cube with 6 faces
- **Sphere** - A UV sphere with smooth shading
- **Jewel** - A low-poly faceted sphere (gem-like appearance)
- **Rock** - A sphere with randomized vertices (organic look)
- **Cylinder** - A cylinder with top and bottom caps
- **Cone** - A cone with a bottom cap
- **Torus** - A donut shape
- **Torus Knot** - A mathematical knot wrapped around a torus

## Key Techniques

### 1. Indexed Geometry

Instead of storing barycentric coordinates per vertex, we use indexed geometry:

```typescript
interface IndexedGeometry {
  positions: Float32Array;  // Vertex positions (x, y, z)
  normals: Float32Array;    // Vertex normals for lighting
  indices: Uint32Array;     // Triangle indices
  indexCount: number;
}
```

This is more memory-efficient since we don't duplicate vertex data.

### 2. Shader-Computed Barycentric Coordinates

The vertex shader computes barycentric coordinates from the vertex index:

```wgsl
@vertex
fn vs_main(@builtin(vertex_index) vNdx : u32) -> VSOutput {
  // Which vertex within the triangle (0, 1, or 2)
  let vertNdx = vNdx % 3;

  // Get actual vertex index from index buffer
  let index = indices[vNdx];

  // Read position from storage buffer
  let pNdx = index * 3;
  let position = vec4f(positions[pNdx], positions[pNdx + 1], positions[pNdx + 2], 1.0);

  var vsOut : VSOutput;
  vsOut.position = uni.worldViewProjectionMatrix * position;

  // Assign barycentric coordinate based on vertex index within triangle
  vsOut.barycentricCoord = vec3f(0.0);
  if (vertNdx == 0u) {
    vsOut.barycentricCoord.x = 1.0;
  } else if (vertNdx == 1u) {
    vsOut.barycentricCoord.y = 1.0;
  } else {
    vsOut.barycentricCoord.z = 1.0;
  }

  return vsOut;
}
```

### 3. Storage Buffers for Geometry

Positions, normals, and indices are stored in storage buffers, allowing the shader to read them directly:

```wgsl
@group(0) @binding(2) var<storage, read> positions : array<f32>;
@group(0) @binding(3) var<storage, read> normals : array<f32>;
@group(0) @binding(4) var<storage, read> indices : array<u32>;
```

### 4. Per-Object Bind Groups

Each object has its own bind group containing:
- Uniform buffer (transform matrices + color)
- Shared line uniforms (thickness, alpha threshold)
- Geometry buffers (positions, normals, indices)

```typescript
const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    { binding: 0, resource: { buffer: uniformBuffer } },
    { binding: 1, resource: { buffer: lineUniformBuffer } },
    { binding: 2, resource: { buffer: geo.positionBuffer } },
    { binding: 3, resource: { buffer: geo.normalBuffer } },
    { binding: 4, resource: { buffer: geo.indexBuffer } },
  ],
});
```

### 5. Edge Detection with Screen-Space Derivatives

The fragment shader uses `fwidth()` for resolution-independent wireframe lines:

```wgsl
fn edgeFactor(bary : vec3f) -> f32 {
  let d = fwidth(bary);
  let a3 = smoothstep(vec3f(0.0), d * line.thickness, bary);
  return min(min(a3.x, a3.y), a3.z);
}

@fragment
fn fs_main(v : VSOutput) -> @location(0) vec4f {
  let a = 1.0 - edgeFactor(v.barycentricCoord);
  if (a < line.alphaThreshold) {
    discard;
  }
  return vec4f(uni.color.rgb * a, a);
}
```

## Rendering Loop

The render loop is straightforward, but its performance is limited because it switches bind groups and issues a draw call for every single object:

```typescript
renderPass.setPipeline(pipeline);

for (const obj of objects) {
  renderPass.setBindGroup(0, obj.bindGroup);
  renderPass.draw(gpuGeometries[obj.geometryIndex].indexCount);
}
```

## GUI Controls

- **Object Count** - Dropdown to select number of objects (1, 10, 1000, 10000, 100000, 1000000)
- **Line Thickness** - Wireframe line width
- **Regenerate** - Create new random objects

## Advantages of This Approach

| Feature | Benefit |
|---------|---------|
| Indexed geometry | Less memory, shared vertices |
| Shader-computed barycentrics | No extra vertex attributes |
| Per-object bind groups | Simple to implement, easy to manage individual object state |
| Storage buffers | Flexible geometry access in shaders |
| `fwidth()` derivatives | Resolution-independent line thickness |

## Performance Considerations

This tutorial uses a straightforward per-object rendering approach that works well for small to moderate object counts. However, it is **not performant** at higher counts (10,000+). There are many techniques available to improve this.

### Current Bottlenecks

1. **Per-object uniform buffer updates** - Writing to each object's buffer every frame via `device.queue.writeBuffer`
2. **Per-object bind group switches** - Calling `setBindGroup` for each object
3. **Individual draw calls** - One `draw()` call per object
4. **CPU matrix calculations** - Computing matrices on CPU for each object every frame

### Optimization Strategies

#### 1. Instanced Rendering (High Impact)

Group objects by geometry type and draw all instances of the same geometry with a single `draw(vertexCount, instanceCount)` call. This reduces draw calls from 10,000 to just 8 (one per geometry type).

#### 2. Storage Buffer for Instance Data (High Impact)

Replace per-object uniform buffers with a single large storage buffer containing all transforms and colors. The shader reads data using `instance_index`. One buffer write per frame instead of 10,000.

#### 3. GPU-side Matrix Computation (Medium-High Impact)

Use a compute shader to calculate world/view/projection matrices on the GPU. The CPU only uploads raw position/rotation/scale data, and the compute shader generates the final matrices in parallel.

#### 4. Indirect Drawing (Medium Impact)

Use `drawIndirect` to reduce CPU-GPU synchronization. Draw parameters come from a GPU buffer, enabling fully GPU-driven rendering.

#### 5. Frustum Culling (Medium Impact)

Skip rendering objects outside the camera view. Can be done on CPU for moderate counts, or GPU compute for massive counts.

#### 6. Reduce Dynamic Updates (Low-Medium Impact)

- Only update the line uniforms buffer when thickness actually changes
- Consider static objects that don't need per-frame updates

#### 7. Level of Detail (LOD)

Use simpler geometry (fewer triangles) for distant objects.

## References

This implementation is based on the [WebGPU Wireframe Sample](https://webgpu.github.io/webgpu-samples/?sample=wireframe).
