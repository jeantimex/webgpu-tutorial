# Point Light

In this tutorial, we implement a **Point Light**.

Unlike Directional Light, which simulates a distant source like the sun (parallel rays), a Point Light acts like a light bulb or a candle: it has a specific **position** in 3D space, and light radiates outwards in all directions.

## 1. Light Direction Varies

With directional light, the light vector `L` was a constant uniform for the entire scene.

With point light, the direction `L` is different for every single pixel (fragment) on the surface! To calculate it, we need two pieces of information in the shader:
1.  **Light Position** (Uniform)
2.  **Surface Position** (Varying/Interpolated)

The direction vector is calculated as:
```wgsl
let L = normalize(lightPos - surfacePos);
```

## 2. World Space Coordinates

To perform this calculation correctly, both positions must be in the same coordinate space (usually **World Space**).

In our Vertex Shader, we calculate the `worldPos` by multiplying the vertex position by the **Model Matrix** only (not the View or Projection matrices). We pass this `worldPos` to the Fragment Shader.

```wgsl
// Vertex Shader
out.worldPos = (uniforms.modelMatrix * vec4f(pos, 1.0)).xyz;
```

## 3. The Result

In the demo, the light source is fixed at a specific position in space while the cube rotates. Notice how the highlight moves across the faces as they turn toward or away from the light source. This dynamic interaction is what gives point lights their realistic feel.
