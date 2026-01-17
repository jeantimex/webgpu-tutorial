// Define the structure of the output data going to the Fragment Shader
struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec3f,
};

// We receive the interpolated VertexOutput here
@fragment
fn fs_main(input : VertexOutput) -> @location(0) vec4f {
  return vec4f(input.color, 1.0);
}
