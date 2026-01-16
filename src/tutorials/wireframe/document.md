# Wireframe

This tutorial is a direct port of the official WebGPU wireframe sample. It renders a grid of animated models with two wireframe modes:

- **Line-list wireframe**: Draws explicit edges for crisp lines.
- **Barycentric wireframe**: Uses barycentric coordinates and `fwidth` for anti-aliased edges.

You can toggle between modes, adjust thickness/threshold, and control depth bias to avoid z-fighting with the lit pass.

## Key Ideas

- **Storage buffers in the vertex stage** for indexed wireframe drawing.
- **Depth bias** on the lit pass to keep wireframe lines stable.
- **Per-object uniform buffers** for model transforms and color.

## Reference

Based on: https://webgpu.github.io/webgpu-samples/?sample=wireframe
