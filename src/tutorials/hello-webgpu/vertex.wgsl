@vertex
fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4f {
  var pos = array<vec2f, 3>(
    vec2f(0.0, 0.5),
    vec2f(-0.5, -0.5),
    vec2f(0.5, -0.5)
  );
  return vec4f(pos[VertexIndex], 0.0, 1.0);
}
