struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) localPos : vec3f,
};

@vertex
fn vs_main(@location(0) pos : vec3f) -> VertexOutput {
  var output : VertexOutput;
  output.position = vec4f(pos, 1.0);
  output.localPos = pos; // Pass local position to fragment for gradient
  return output;
}
