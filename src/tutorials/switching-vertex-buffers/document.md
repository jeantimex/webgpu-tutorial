# Switching Vertex Buffers

In the last tutorial, we learned how to switch pipelines to change _how_ objects are drawn. But often, we want to keep the same visual style (same pipeline) but draw different _shapes_ (e.g., a triangle and a square).

In this tutorial, we will learn how to **Switch Vertex Buffers**. This allows us to reuse a single pipeline for completely different geometries.

**Key Learning Points:**

- Creating separate `GPUBuffer` objects for different meshes.
- Ensuring different buffers match the same Pipeline Layout.
- Binding different buffers using `setVertexBuffer` before drawing.
- Comparison: Switching Buffers vs. Instancing.

## 1. Multiple Buffers

We create two separate Vertex Buffers: one for a Triangle and one for a Square.

```typescript
const triangleBuffer = device.createBuffer({ ... });
// ... write triangle data ...

const squareBuffer = device.createBuffer({ ... });
// ... write square data ...
```

## 2. Shared Pipeline

We create a single pipeline. The key is that **both buffers must match the pipeline's layout**.

- Our pipeline expects `float32x3` positions.
- Both our triangle data and square data provide exactly that.

## 3. The Render Loop

In the render loop, we simply bind the buffer we want to use before issuing the draw call.

```typescript
// 1. Draw Triangle
passEncoder.setVertexBuffer(0, triangleBuffer);
passEncoder.draw(3);

// 2. Draw Square
passEncoder.setVertexBuffer(0, squareBuffer);
passEncoder.draw(6);
```

This is much more efficient than recreating pipelines or even switching pipelines, as binding a buffer is a very lightweight operation for the GPU.

## 4. Trade-offs: Switching Buffers vs. Instancing

While switching vertex buffers is simple and flexible, it has one major drawback compared to **Instancing** (Tutorial 12/13):

- **Switching Buffers**: Requires a **separate draw call** for every object (`draw(3)`, `draw(6)`). If you have 10,000 different objects, that's 10,000 commands the CPU has to send to the GPU. This can become a "CPU bottleneck."
- **Instancing**: Draws many copies in **one single draw call** (`draw(3, 10000)`). This is significantly faster for the CPU.

**When to switch buffers?** Use this technique when your objects have **different geometry** (e.g., a car and a tree) but share the same material properties. If you are drawing 100 identical trees, use Instancing!
