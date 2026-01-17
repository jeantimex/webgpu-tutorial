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

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) normal : vec3f,
  @location(1) shadowPos : vec3f,
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) normal : vec3f
) -> VertexOutput {
  var out : VertexOutput;
  let worldPos = uniforms.modelMatrix * vec4f(pos, 1.0);
  out.position = uniforms.viewProjectionMatrix * worldPos;

  // For non-uniform scaling, we'd need the inverse-transpose of the model matrix.
  out.normal = (uniforms.modelMatrix * vec4f(normal, 0.0)).xyz;
  let posFromLight = lightUniforms.lightViewProjectionMatrix * worldPos;
  let ndc = posFromLight.xyz / posFromLight.w;
  out.shadowPos = vec3f(
    ndc.xy * vec2f(0.5, -0.5) + vec2f(0.5, 0.5),
    ndc.z
  );

  return out;
}
