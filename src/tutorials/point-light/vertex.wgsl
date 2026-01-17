struct Uniforms {
  mvpMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  normalMatrix : mat3x3f,
  lightPosIntensity : vec4f, // Position.xyz + intensity
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) normal : vec3f,
  @location(1) worldPos : vec3f, // Needed to calculate light direction per-pixel
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) normal : vec3f,
) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  
  // Transform normal to world space
  out.normal = uniforms.normalMatrix * normal;
  
  // Transform position to world space
  out.worldPos = (uniforms.modelMatrix * vec4f(pos, 1.0)).xyz;
  
  return out;
}
