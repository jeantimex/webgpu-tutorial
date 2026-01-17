# Combined Transformations

In the last tutorial, we learned how to apply a single transformation (translation) using a matrix. But real-world objects often need to be moved, rotated, and scaled all at the same time.

In this tutorial, we will learn how to **combine multiple transformations** into a single model matrix. We will also explore the critical importance of operation order.

**Key Learning Points:**

- Chaining matrix operations: `Translate * Rotate * Scale`.
- Understanding why order matters (Local vs. Global space).
- Using `mat4.rotateZ` and `mat4.scale`.
- Resetting the matrix to identity before each frame.

## 1. The Transformation Chain

When we want to move, rotate, and scale an object, we usually want it to happen in a specific local order:

1.  **Scale**: Resize the object locally.
2.  **Rotate**: Rotate it around its local origin.
3.  **Translate**: Move it to its final position in the world.

In matrix math, this is often represented as: `FinalPosition = TranslationMatrix * RotationMatrix * ScaleMatrix * OriginalPosition`

Using `wgpu-matrix`, we chain these operations on our model matrix.

```typescript
// 1. Reset to identity
mat4.identity(modelMatrix);

// 2. Translate (Move)
mat4.translate(modelMatrix, [0.2, 0.0, 0.0], modelMatrix);

// 3. Rotate (Spin)
mat4.rotateZ(modelMatrix, Math.PI / 4, modelMatrix); // 45 degrees

// 4. Scale (Resize)
mat4.scale(modelMatrix, [0.5, 0.5, 1.0], modelMatrix);
```

### Why this order?

If you **Rotate** before you **Translate**, the object spins around its own center. If you **Translate** before you **Rotate**, the object orbits around the world origin (0,0) like a planet!

By applying operations to the matrix in the order `Translate -> Rotate -> Scale`, we effectively build the transformation from the "outside in" (or "left to right" in code execution), resulting in an object that is scaled, then rotated, then moved.
