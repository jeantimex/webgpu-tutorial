// Define the structure of our uniform
struct Uniforms {
  color : vec4f,
};

// Declare the uniform variable
// Group 0, Binding 0
@group(0) @binding(0) var<uniform> global : Uniforms;

@fragment
fn fs_main() -> @location(0) vec4f {
  // Return the color from the uniform buffer
  return global.color;
}
