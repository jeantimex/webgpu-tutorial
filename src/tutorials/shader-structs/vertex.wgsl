// Define the structure of the input data coming from the Vertex Buffer
struct VertexInput {
  @location(0) position : vec2f,
  @location(1) color : vec3f,
};

// Define the structure of the output data going to the Fragment Shader
struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec3f,
};

@vertex
fn vs_main(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  // We can access input fields using dot notation
  output.position = vec4f(input.position, 0.0, 1.0);
  output.color = input.color;
  return output;
}
