struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec3f,
};

@fragment
fn fs_main(input : VertexOutput) -> @location(0) vec4f {
  return vec4f(input.color, 1.0);
}
