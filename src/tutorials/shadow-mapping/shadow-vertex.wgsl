struct Uniforms {
  viewProjectionMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  color : vec4f,
}

struct LightUniforms {
  ambientColor : vec4f,
  dirLightDirection : vec4f,
  dirLightColor : vec4f,
  lightViewProjectionMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var<uniform> lightUniforms : LightUniforms;

@vertex
fn vs_shadow(@location(0) pos : vec3f) -> @builtin(position) vec4f {
  return lightUniforms.lightViewProjectionMatrix * uniforms.modelMatrix * vec4f(pos, 1.0);
}
