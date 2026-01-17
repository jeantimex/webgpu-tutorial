# Hello Cube (3D & MVP)

This is our first **3D** tutorial. We draw a cube, introduce the **Model‑View‑Projection (MVP)** pipeline, and enable **depth testing** so the GPU can correctly sort front vs. back faces.

We intentionally define every cube vertex explicitly (36 vertices total) so the focus stays on the 3D math rather than index buffers.

**Key learning points:**

- How 3D positions become 2D pixels using MVP matrices.
- How to build projection and view matrices with `wgpu-matrix`.
- How to use a uniform buffer for a matrix.
- Why depth textures are required for correct 3D rendering.
- How to resize the canvas while keeping projection correct.

## 1. The cube geometry (explicit vertices)

A cube has 6 faces. Each face is two triangles, so we need **12 triangles** and **36 vertices** when we don’t use indices.

```typescript
// 36 vertices (12 triangles), each vertex is vec3f
// prettier-ignore
const vertexData = new Float32Array([
  // Front Face (z = 0.5)
  -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5, -0.5,  0.5,

  // Back Face (z = -0.5)
  -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,  -0.5, -0.5, -0.5,

  // Top Face (y = 0.5)
  -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,
   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,  -0.5,  0.5, -0.5,

  // Bottom Face (y = -0.5)
  -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,  -0.5, -0.5, -0.5,

  // Right Face (x = 0.5)
   0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,   0.5, -0.5, -0.5,

  // Left Face (x = -0.5)
  -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,  -0.5, -0.5, -0.5,
]);
```

This is not memory‑efficient, but it is very easy to understand. In later tutorials we switch to index buffers.

## 2. The MVP pipeline

3D coordinates must be transformed into **clip space** before the GPU can rasterize them. We do that with three matrices:

1. **Model matrix**: positions the object in the world.
2. **View matrix**: represents the camera.
3. **Projection matrix**: adds perspective.

We compute the combined MVP matrix and send it to the GPU as a uniform.

```typescript
const projectionMatrix = mat4.perspective(
  (2 * Math.PI) / 5,
  aspect,
  0.1,
  100.0
);
const viewMatrix = mat4.lookAt([2, 2, 2], [0, 0, 0], [0, 1, 0]);
const modelMatrix = mat4.identity();

const mvpMatrix = mat4.multiply(
  projectionMatrix,
  mat4.multiply(viewMatrix, modelMatrix)
);
```

We store this in a uniform buffer:

```typescript
const uniformBuffer = device.createBuffer({
  label: "Uniform Buffer",
  size: 64, // mat4x4f = 16 floats * 4 bytes
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as Float32Array);
```

## 3. Vertex shader: applying the matrix

The vertex shader multiplies each position by the MVP matrix to place it in clip space:

```typescript
struct Uniforms {
  mvpMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

@vertex
fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
  return uniforms.mvpMatrix * vec4f(pos, 1.0);
}
```

## 4. Depth testing (the Z‑buffer)

A cube has faces in front of and behind each other. Without depth testing, whichever triangle is drawn last will overwrite earlier ones.

We create a depth texture and enable depth testing in the pipeline:

```typescript
const depthTexture = device.createTexture({
  size: [canvas.width, canvas.height],
  format: "depth24plus",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});
```

```typescript
depthStencil: {
  depthWriteEnabled: true,
  depthCompare: "less",
  format: "depth24plus",
}
```

Then we attach it in the render pass:

```typescript
const renderPass = commandEncoder.beginRenderPass({
  colorAttachments: [{ ... }],
  depthStencilAttachment: {
    view: depthTexture.createView(),
    depthClearValue: 1.0,
    depthLoadOp: "clear",
    depthStoreOp: "store",
  },
});
```

## 5. The pipeline and draw call

We declare a single vertex buffer layout with a `vec3f` position:

```typescript
vertex: {
  module: vertexModule,
  entryPoint: "vs_main",
  buffers: [{
    arrayStride: 12,
    attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
  }],
},
```

Then we draw 36 vertices:

```typescript
renderPass.setPipeline(pipeline);
renderPass.setBindGroup(0, bindGroup);
renderPass.setVertexBuffer(0, vertexBuffer);
renderPass.draw(36);
```

## 6. Resize handling

When the canvas size changes, the aspect ratio changes too. We recompute the projection matrix and recreate the depth texture:

```typescript
if (resized) {
  updateProjection();
  depthTexture.destroy();
  depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
}
```

This keeps the cube correctly proportioned on any screen size.

## Common pitfalls

- **Forgetting depth testing**: faces render in the wrong order.
- **Using the wrong matrix order**: MVP multiplication must be projection * view * model.
- **Not updating projection on resize**: the cube looks stretched.
- **Allocating the wrong uniform size**: a `mat4x4f` is 64 bytes.
