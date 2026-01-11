# 33. Combined Lighting (Phong)

Real-world scenes are rarely lit by just one light source. In this tutorial, we combine everything we've learned to implement the classic **Blinn-Phong Reflection Model**.

We will combine three lighting components into a single shader:
1.  **Ambient**: A constant base brightness (White).
2.  **Directional**: A warm "Sun" light (Yellowish).
3.  **Point**: An orbiting "Bulb" light (Cyan).

Additionally, we introduce **Specular Highlighting** to make the cube appear shiny.

## The Blinn-Phong Model

The total color of a pixel is the sum of its Ambient, Diffuse, and Specular components.

`Total = Ambient + (Diffuse * ObjectColor) + Specular`

### Specular Highlight
Specular highlights simulate the bright spot where light reflects directly into the camera. It depends on:
*   **View Vector (`V`)**: Direction from the surface to the camera.
*   **Half Vector (`H`)**: The vector exactly halfway between the Light Vector (`L`) and View Vector (`V`).

When the Surface Normal (`N`) aligns with `H`, it means the light is reflecting straight into your eye, creating a bright highlight.

```wgsl
let H = normalize(L + V);
let spec = pow(max(dot(N, H), 0.0), shininess);
```

## The Demo
*   **Red Cube**: The base material color.
*   **Yellow/Warm**: The static directional light.
*   **Cyan/Cool**: The moving point light orbiting the cube.
*   **White Spots**: The specular highlights from both light sources.
