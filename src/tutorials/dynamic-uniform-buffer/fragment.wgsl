struct Uniforms {
  color : vec4f,
};

// Group 0, Binding 0, with dynamic offset
@group(0) @binding(0) var<uniform> global : Uniforms;

@fragment
fn fs_main() -> @location(0) vec4f {
  return global.color;
}
