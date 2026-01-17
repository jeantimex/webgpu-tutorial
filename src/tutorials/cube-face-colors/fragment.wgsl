struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  return in.color;
}
