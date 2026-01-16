# Directional Light

Up until now, our 3D objects have been "flat". They didn't react to light. In this tutorial, we implement **Directional Light** (Lambertian Reflection) to make our cube look solid.

## 1. The Normal Vector

To calculate how light hits a surface, we need to know which direction the surface is facing. This direction vector is called the **Normal**.

Since a cube has flat faces, every vertex on a single face shares the same normal.
*   **Top Face:** Normal points UP `(0, 1, 0)`
*   **Right Face:** Normal points RIGHT `(1, 0, 0)`

In our vertex buffer, we pass the **Normal** `(nx, ny, nz)` as an attribute along with the position. For simplicity, we use an **Index Buffer** and hardcode the color to **Red** in the shader.

## 2. Directional Light (Diffuse)

Directional light acts like the sun. The light rays are parallel and come from a single direction. In this tutorial, the light comes from the top-right-front `(1, 1, 1)`.

The core math used here is the **Dot Product**. It calculates the relationship between the Surface Normal (**N**) and the Light Direction (**L**).

### The Math
`brightness = max(dot(N, L), 0.0)`

*   **Direct Hit**: If the surface faces the light directly, the dot product is `1.0` (Maximum Brightness).
*   **Glancing Blow**: If the light is parallel to the surface, the result is `0.0` (No Light).
*   **From Behind**: If the light is behind the surface, the result is negative. We use `max(..., 0.0)` to clamp it to zero.

### Result
In this tutorial, faces that point away from the light will be **pitch black** because we haven't added any background "room" light yet. This makes the effect of the directional light very easy to see.

## 3. Transforming Normals

When the cube rotates, the normals must rotate with it! However, we cannot use the full MVP matrix because normals represent *directions*, not positions. They shouldn't be affected by translation (moving) or perspective.

We use the **Model Matrix** (specifically the 3x3 rotation part) to transform the normal into world space.

```wgsl
// Rotate the normal into world space using the Model Matrix
out.normal = (uniforms.modelMatrix * vec4f(normal, 0.0)).xyz;
```
