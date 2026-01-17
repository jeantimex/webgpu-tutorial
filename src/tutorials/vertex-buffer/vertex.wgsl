@vertex
fn vs_main(@location(0) position : vec2f) -> @builtin(position) vec4f {
  return vec4f(position, 0.0, 1.0);
}
