@vertex
fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
  return vec4f(pos, 1.0);
}
