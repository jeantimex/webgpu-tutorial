struct Uniforms {
  modelMatrix : mat4x4f,
};

@group(0) @binding(0) var<uniform> global : Uniforms;

@vertex
fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
  return global.modelMatrix * vec4f(pos, 1.0);
}
