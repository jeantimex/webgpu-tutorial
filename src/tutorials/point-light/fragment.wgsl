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

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let N = normalize(in.normal);
  
  // Calculate direction FROM surface TO light
  let L = normalize(uniforms.lightPosIntensity.xyz - in.worldPos);
  
  // Diffuse term
  let diffuse = max(dot(N, L), 0.0);
  
  let baseColor = vec3f(1.0, 0.0, 0.0); // Red
  
  // Simple ambient to see the back
  let ambient = 0.1;
  
  let lighting = min(diffuse * max(uniforms.lightPosIntensity.w, 0.0) + ambient, 1.0);
  
  return vec4f(baseColor * lighting, 1.0);
}
