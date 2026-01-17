struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) localPos : vec3f,
};

// --- Fragment Shader 1: Solid Color ---
@fragment
fn fs_solid() -> @location(0) vec4f {
  return vec4f(1.0, 0.5, 0.0, 1.0); // Solid Orange
}

// --- Fragment Shader 2: Gradient ---
@fragment
fn fs_gradient(in : VertexOutput) -> @location(0) vec4f {
  // Calculate color based on Y position
  // Map Y from [-0.5, 0.5] to [0.0, 1.0]
  let t = in.localPos.y + 0.5;
  return vec4f(0.0, t, 1.0 - t, 1.0); // Blue to Green gradient
}
