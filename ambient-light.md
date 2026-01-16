# Ambient Light

In the previous tutorial, we saw that **Directional Light** creates strong contrasts: faces pointing toward the light are bright, while faces pointing away are completely black.

In the real world, shadows are rarely pitch black. Light bounces off walls, the floor, and other objects, filling the room with a base level of "background" light. This is called **Global Illumination**.

In real-time graphics, simulating billions of light bounces is too expensive. Instead, we use a cheap approximation called **Ambient Light**.

## 1. What is Ambient Light?

Ambient light is a constant amount of light added to **every single pixel** in the scene, regardless of its position or orientation.

*   It has **no direction**.
*   It has **no source position**.
*   It requires **no normal vectors**.

## 2. The Math

The calculation is incredibly simple:

`Final Color = Base Color * Ambient Intensity`

If our red cube `(1, 0, 0)` is in a room with `0.5` ambient light, it will appear dark red `(0.5, 0, 0)` evenly across all faces.

## 3. Why it looks "Flat"

Because ambient light applies equally to every face, our 3D cube will look like a flat 2D hexagon. There is no shading to distinguish the front face from the side face.

This is why Ambient Light is almost never used alone. It is designed to be the "minimum brightness" floor that is added to other lighting types (like Directional or Point lights).

## 4. Implementation

In this tutorial, we removed the `Normal` attribute from our vertex buffer because ambient light doesn't need it! We only pass the `Ambient Intensity` via a uniform buffer.

Use the slider in the demo to adjust the ambient intensity and see how the flat color changes.
