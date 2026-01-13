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

The render loop is efficient - just switch bind groups for each object:

```typescript
renderPass.setPipeline(pipeline);

for (const obj of objects) {
  renderPass.setBindGroup(0, obj.bindGroup);
  renderPass.draw(gpuGeometries[obj.geometryIndex].indexCount);
}
```

## GUI Controls

- **Object Count** - Number of objects (1-100)
- **Line Thickness** - Wireframe line width
- **Alpha Threshold** - Cutoff for wireframe visibility
- **Regenerate** - Create new random objects

## Advantages of This Approach

| Feature | Benefit |
|---------|---------|
| Indexed geometry | Less memory, shared vertices |
| Shader-computed barycentrics | No extra vertex attributes |
| Per-object bind groups | Fast switching, no uniform updates during draw |
| Storage buffers | Flexible geometry access in shaders |
| `fwidth()` derivatives | Resolution-independent line thickness |

## References

This implementation is based on the [WebGPU Wireframe Sample](https://webgpu.github.io/webgpu-samples/?sample=wireframe).
