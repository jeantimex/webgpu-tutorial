struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
};

@vertex
fn vs_main(
  @location(0) pos : vec3f,         // From Geometry Buffer
  @location(1) offset : vec2f,      // From Instance Buffer
  @location(2) color : vec4f        // From Instance Buffer
) -> VertexOutput {
  var output : VertexOutput;
  output.position = vec4f(pos.xy + offset, pos.z, 1.0);
  output.color = color;
  return output;
}
