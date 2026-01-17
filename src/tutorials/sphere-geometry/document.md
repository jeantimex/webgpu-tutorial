# Sphere Geometry

This tutorial generates a **procedural sphere** and renders it with both a solid lit pass and an optional wireframe overlay. It reuses the wireframe techniques from the wireframe demo, but focuses on a single sphere so you can study the geometry and line rendering in detail.

**Key learning points:**

- How the sphere mesh is generated from latitude/longitude segments.
- How we pack positions and normals into a single vertex buffer.
- How the lit pass uses a standard model/view/projection matrix.
- Two different wireframe strategies: **line‑list** and **barycentric**.
- How to switch pipelines and bind groups based on GUI settings.

## 1. Procedural sphere generation

We build a sphere by sampling latitude/longitude angles and producing vertices with normals. The helper returns vertices with multiple attributes; we extract just position and normal:

```typescript
const { vertices: verticesWithUVs, indices } = createSphereMesh(
  radius,
  widthSegments,
  heightSegments
);
const numVertices = verticesWithUVs.length / 8;
const vertices = new Float32Array(numVertices * 6);
for (let i = 0; i < numVertices; ++i) {
  const srcNdx = i * 8;
  const dstNdx = i * 6;
  vertices.set(verticesWithUVs.subarray(srcNdx, srcNdx + 6), dstNdx);
}
```

This produces:

- `vertices`: `position.xyz + normal.xyz`
- `indices`: triangle indices for the sphere surface

## 2. Lit pass

The lit pass is a standard Lambert shader:

```wgsl
@vertex fn vs(vin: Vertex) -> VSOut {
  var vOut: VSOut;
  vOut.position = uni.worldViewProjectionMatrix * vin.position;
  vOut.normal = (uni.worldMatrix * vec4f(vin.normal, 0)).xyz;
  return vOut;
}

@fragment fn fs(vin: VSOut) -> @location(0) vec4f {
  let lightDirection = normalize(vec3f(4, 10, 6));
  let light = dot(normalize(vin.normal), lightDirection) * 0.5 + 0.5;
  return vec4f(uni.color.rgb * light, uni.color.a);
}
```

We update the uniform buffer each frame with:

- `worldViewProjectionMatrix`
- `worldMatrix`
- `color`

## 3. Wireframe rendering: two techniques

We offer two wireframe styles controlled by the GUI:

### A) Line‑list wireframe

The `line-list` approach draws explicit edges by turning each triangle into 3 line segments. The shader reads index and position data from storage buffers:

```wgsl
@vertex fn vsIndexedU32(@builtin(vertex_index) vNdx: u32) -> VSOut {
  let triNdx = vNdx / 6;
  let vertNdx = (vNdx % 2 + vNdx / 2) % 3;
  let index = indices[triNdx * 3 + vertNdx];

  let pNdx = index * line.stride;
  let position = vec4f(positions[pNdx], positions[pNdx + 1], positions[pNdx + 2], 1);

  var vOut: VSOut;
  vOut.position = uni.worldViewProjectionMatrix * position;
  return vOut;
}
```

This produces crisp hard edges, but can suffer from z‑fighting, so we expose **depth bias** controls.

### B) Barycentric wireframe

The barycentric method renders filled triangles and uses barycentric coordinates to detect edges in the fragment shader:

```wgsl
@vertex fn vsIndexedU32BarycentricCoordinateBasedLines(...) -> BarycentricCoordinateBasedVSOutput {
  // each vertex gets a barycentric axis value
  vsOut.barycenticCoord = vec3f(0);
  vsOut.barycenticCoord[vertNdx] = 1.0;
  return vsOut;
}

fn edgeFactor(bary: vec3f) -> f32 {
  let d = fwidth(bary);
  let a3 = smoothstep(vec3f(0.0), d * line.thickness, bary);
  return min(min(a3.x, a3.y), a3.z);
}
```

This produces smooth, anti‑aliased lines and avoids z‑fighting, but costs more in the fragment shader.

## 4. Switching wireframe modes

We keep two wireframe pipelines and switch based on GUI state:

```typescript
const [bindGroupNdx, countMult, pipeline] =
  settings.barycentricCoordinatesBased
    ? [1, 1, barycentricCoordinatesBasedWireframePipeline]
    : [0, 2, wireframePipeline];

pass.setPipeline(pipeline);
pass.setBindGroup(0, bindGroupNdx === 0
  ? wireframeBindGroup
  : barycentricCoordinatesBasedWireframeBindGroup
);
pass.draw(model.vertexCount * countMult);
```

- The line‑list path draws twice as many vertices (`countMult = 2`) because each triangle becomes 3 line segments.
- The barycentric path draws the triangle list directly.

## 5. Resizing and camera

We resize the canvas each frame and rebuild the depth texture if needed. The camera is set up with a standard perspective projection and a fixed view looking at the origin.

## Common pitfalls

- **Using the wrong stride** in the line‑list shader (must match position layout).
- **Forgetting depth bias** on line‑list rendering (z‑fighting).
- **Not updating bind groups** after rebuilding geometry.
