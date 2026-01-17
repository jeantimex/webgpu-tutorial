@vertex
fn vs_main(@location(0) pos : vec2f) -> @builtin(position) vec4f {
  return vec4f(pos, 0.0, 1.0);
}
