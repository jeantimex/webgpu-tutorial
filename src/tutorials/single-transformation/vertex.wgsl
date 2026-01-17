struct Uniforms {
  modelMatrix : mat4x4f,
};

@group(0) @binding(0) var<uniform> global : Uniforms;

@vertex
fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
  // Multiply the position by the matrix
  // Note: W component is 1.0 for points
  return global.modelMatrix * vec4f(pos, 1.0);
}
