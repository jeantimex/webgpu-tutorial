# Wireframe

This tutorial demonstrates two ways to draw **wireframes** in WebGPU and compares their trade‑offs. We render a grid of animated models using a lit pass plus an optional wireframe overlay.

The two wireframe techniques are:

- **Line‑list wireframe**: converts each triangle into explicit line segments.
- **Barycentric wireframe**: renders filled triangles and draws edges in the fragment shader using barycentric coordinates and `fwidth`.

**Key learning points:**

- How to use storage buffers in the vertex stage to render indexed wireframes.
- How depth bias helps prevent z‑fighting between the solid model and wireframe lines.
- How barycentric coordinates enable smooth, anti‑aliased edges.
- How to manage per‑object uniforms for hundreds of models.

## 1. Scene setup

We load a set of predefined meshes and create GPU buffers for each:

```typescript
const models = Object.values(modelData).map((data) =>
  createVertexAndIndexBuffer(device, data)
);
```

We then create 200 objects, each with its own uniform buffer and random color. This is intentionally heavy to stress the wireframe system.

## 2. Lit pass (solid shading)

The lit pass uses a standard Lambert shader. We include a depth bias on this pass when line‑list wireframe is active, to push the solid surface slightly backward and reduce z‑fighting.

```typescript
depthStencil: {
  depthWriteEnabled: true,
  depthCompare: "less",
  depthBias: settings.depthBias,
  depthBiasSlopeScale: settings.depthBiasSlopeScale,
  format: depthFormat,
}
```

## 3. Line‑list wireframe

In the line‑list method, we convert each triangle into three line segments in the vertex shader. This requires access to the index buffer and position buffer as **storage buffers**:

```wgsl
@group(0) @binding(1) var<storage, read> positions: array<f32>;
@group(0) @binding(2) var<storage, read> indices: array<u32>;
```

The shader maps the incoming `vertex_index` to a triangle and edge:

```wgsl
let triNdx = vNdx / 6;
let vertNdx = (vNdx % 2 + vNdx / 2) % 3;
let index = indices[triNdx * 3 + vertNdx];
```

Each triangle produces 6 vertices (3 line segments), so the draw call uses a multiplier:

```typescript
pass.draw(vertexCount * 2);
```

**Pros:** crisp edges, easy to understand.
**Cons:** can z‑fight and produces hard, aliased lines.

## 4. Barycentric wireframe

The barycentric method renders triangles normally and marks edges in the fragment shader. Each vertex gets a barycentric coordinate:

```wgsl
vsOut.barycenticCoord = vec3f(0);
vsOut.barycenticCoord[vertNdx] = 1.0;
```

In the fragment shader, `fwidth` gives pixel‑space derivatives that allow smooth edge thickness:

```wgsl
fn edgeFactor(bary: vec3f) -> f32 {
  let d = fwidth(bary);
  let a3 = smoothstep(vec3f(0.0), d * line.thickness, bary);
  return min(min(a3.x, a3.y), a3.z);
}
```

**Pros:** smooth anti‑aliased lines, no z‑fighting.
**Cons:** requires a fragment pass over full triangles (more fill‑rate).

## 5. Per‑object uniforms

Each object has its own uniform buffer containing:

- `worldViewProjectionMatrix`
- `worldMatrix`
- `color`

We update these every frame and draw each model in the lit pass.

## 6. GUI controls

The GUI lets you:

- Toggle between line‑list and barycentric modes
- Adjust thickness and alpha threshold (barycentric)
- Adjust depth bias and slope scale (line‑list)
- Toggle lit models or wireframe lines
- Pause animation

## Common pitfalls

- **Missing storage buffer usage** for indexed line‑list rendering.
- **Incorrect draw multiplier** for line‑list edges.
- **No depth bias** leading to flickering wireframes.
- **Using barycentric lines without blending** (edges look jagged).
