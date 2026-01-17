# Switching Pipelines

In previous tutorials, we focused on drawing objects that all share the same shader logic (e.g., all solid colors). But in a real application, you often need to render different types of objects: some solid, some textured, some glowing, some wireframe.

In this tutorial, we will learn how to **Switch Pipelines** within a single render pass to change _how_ objects are drawn.

**Key Learning Points:**

- Creating multiple `GPURenderPipeline` objects.
- Using different Entry Points in the same shader module.
- Switching state efficiently with `setPipeline`.
- Understanding when to switch pipelines vs. updating uniforms.

## 1. Defining Multiple Pipelines

We can create multiple `GPURenderPipeline` objects from the same shader module, just pointing to different entry points!

```typescript
// Pipeline 1: Uses 'fs_solid' function
const solidPipeline = device.createRenderPipeline({
  // ... vertex setup ...
  fragment: {
    module: shaderModule,
    entryPoint: "fs_solid",
    targets: [{ format: canvasFormat }],
  },
});

// Pipeline 2: Uses 'fs_gradient' function
const gradientPipeline = device.createRenderPipeline({
  // ... vertex setup ...
  fragment: {
    module: shaderModule,
    entryPoint: "fs_gradient",
    targets: [{ format: canvasFormat }],
  },
});
```

## 2. Multiple Fragment Entry Points

In our WGSL code, we define two different fragment functions within the same shader module.

```wgsl
// Fragment Shader 1: Always returns Solid Orange
@fragment
fn fs_solid() -> @location(0) vec4f {
  return vec4f(1.0, 0.5, 0.0, 1.0);
}

// Fragment Shader 2: Returns a gradient based on Y position
@fragment
fn fs_gradient(in : VertexOutput) -> @location(0) vec4f {
  let t = in.localPos.y + 0.5;
  return vec4f(0.0, t, 1.0 - t, 1.0);
}
```

By creating two pipelines that point to these different functions, we can effectively give objects different "materials".

**Why is this powerful?** While our example just swaps colors, in a real engine you would use this to swap entirely different rendering logic:

- **PBR vs. Unlit**: One pipeline for realistic lighting, one for UI elements.
- **Shadow Mapping**: One pipeline to render the scene normally, another to render just the depth from the light's perspective (often using a different **Vertex Shader** entry point too!).
- **Wireframe**: Switching topology in the pipeline state.

## 3. The Render Loop

Switching pipelines is as simple as calling `setPipeline` again inside the same render pass.

```typescript
// 1. Draw Left Triangle (Solid)
passEncoder.setPipeline(solidPipeline);
passEncoder.draw(3, 1, 0, 0);

// 2. Draw Right Triangle (Gradient)
passEncoder.setPipeline(gradientPipeline);
passEncoder.draw(3, 1, 3, 0); // Start at vertex 3
```

This is extremely efficient. The GPU keeps the shared state (like the bound vertex buffer) active, and only updates the pipeline state.

## 4. Design Decisions: Pipelines vs. Uniforms vs. Instancing

We have now learned three ways to change how objects look. When should you use which?

| Technique | Example Use Case | Best For... |
| :-- | :-- | :-- |
| **Switching Pipelines** | Drawing a solid character, then a glowing ghost. | **Completely different math**. If you need different shaders (e.g., one calculates light, one is just solid color), you _must_ switch pipelines. |
| **Switching Uniforms** | Drawing a red car, then a blue car. | **Same math, different data**. If the shader code is identical (e.g., both use `fs_solid`), but only the color value changes, just update/switch the uniform buffer. |
| **Instancing** | Drawing 100 trees. | **Identical mesh & shader, many copies**. If you are drawing the exact same geometry many times with only small variations (position, color), use instancing. |

**In Summary:**

- Change the **Logic** -> Switch Pipeline.

* Change the **Parameters** -> Update Uniforms.
* Draw **Many Copies** -> Use Instancing.

### For WebGL Developers

In WebGL, you use `gl.useProgram(program)` to switch shaders. However, WebGL has a "global state machine" where blending, depth testing, and topology are set separately (`gl.enable(gl.BLEND)`, `gl.depthFunc(...)`).

In **WebGPU**, the `GPURenderPipeline` bundles **all** of this together:

- Shaders (Vertex + Fragment)
- Blend Mode
- Depth/Stencil State
- Primitive Topology (Triangle List, Line Strip, etc.)
- Vertex Layouts

This means `setPipeline` is heavier than `useProgram` conceptually, but usually faster for the driver because it doesn't have to validate a mix-and-match of random states on every draw call.
