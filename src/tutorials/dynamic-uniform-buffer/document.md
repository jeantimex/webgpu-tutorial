# Dynamic Uniform Buffer

In the last tutorial, we learned how to use a Uniform Buffer to pass global data to a shader. But if we want to draw many objects with different uniforms (like different colors), creating a separate Bind Group for each one is inefficient.

In this tutorial, we will learn how to use **Dynamic Uniform Buffers**. This allows us to put data for many objects into a single large buffer and simply "slide a window" over it for each draw call.

**Key Learning Points:**

- Storing multiple uniform blocks in a single `GPUBuffer`.
- Understanding `minUniformBufferOffsetAlignment` (usually 256 bytes).
- Creating a Bind Group Layout with `hasDynamicOffset: true`.
- Using the dynamic offset parameter in `setBindGroup`.

## 1. Alignment Rules

The catch is **Alignment**. When using dynamic offsets, the offset must be a multiple of `device.limits.minUniformBufferOffsetAlignment` (usually **256 bytes**).

Even if our data is only 16 bytes (a `vec4f` color), we must pad it to 256 bytes in the buffer.

```typescript
const minAlignment = device.limits.minUniformBufferOffsetAlignment; // 256
const dynamicStride = Math.ceil(dataSize / minAlignment) * minAlignment;
```

## 2. Bind Group Layout

We must explicitly enable dynamic offsets in the layout:

```typescript
buffer: {
  type: "uniform",
  hasDynamicOffset: true, // <--- Important!
}
```

## 3. Rendering with Offsets

In the render loop, we reuse the same Bind Group but pass a different offset array for each object.

```typescript
for (let i = 0; i < numInstances; i++) {
  const dynamicOffset = i * dynamicStride;

  // 1. Set the Bind Group with a Dynamic Offset
  // The `[dynamicOffset]` array shifts the view of the buffer for Binding 0.
  // The shader thinks it's reading from the start of the buffer,
  // but it's actually reading from `dynamicOffset`.
  passEncoder.setBindGroup(0, bindGroup, [dynamicOffset]);

  // 2. Draw the object
  // draw(vertexCount, instanceCount, firstVertex, firstInstance)
  // We use `firstInstance = i` to tell the shader which index this is.
  passEncoder.draw(3, 1, 0, i);
}
```

### How it works together:

1.  **`setBindGroup(..., [offset])`**: Moves the "window" of the uniform buffer to point to the correct color for this object.
2.  **`draw(..., i)`**: Sets the `@builtin(instance_index)` in the vertex shader to `i`.
3.  **Vertex Shader**: Uses `instanceIdx` to calculate the position offset (shifting the triangle left/right), while the color comes transparently from the "windowed" uniform buffer.

This technique is very efficient because we don't have to create 5 different bind groups. We just slide the window!

## 4. Comparison with Other Techniques

We have now seen three ways to draw multiple objects with different properties. Which one should you use?

| Technique | Tutorial | Best For... | Pros | Cons |
| :-- | :-- | :-- | :-- | :-- |
| **Dynamic Uniforms** | 07 | Medium number of objects (e.g., hundreds) | Easy to update individual objects; flexible. | Still requires a separate `draw` call for each object (CPU overhead). |
| **Uniform Arrays** | 12 | Small, fixed number of objects | Can use **Instancing** (one draw call!). | Uniform buffer size limits (64KB max) limit the number of instances (~1000). |
| **Instanced Vertex Buffers** | 13 | Massive number of objects (particles, trees) | Extremely fast; scalable to millions of instances. | Harder to update individual instances dynamically. |

- Use **Dynamic Uniforms** when you have distinct objects (like a player, an enemy, a house) that need separate draw calls anyway (e.g., different meshes).
- Use **Instancing** (Tutorial 12 or 13) when you are drawing **copies** of the exact same mesh (e.g., a forest).
