struct Uniforms {
  mvpMatrix : mat4x4f,
  ambient : vec4f,
  baseColor : vec4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

@fragment
fn fs_main() -> @location(0) vec4f {
  let baseColor = uniforms.baseColor.rgb;
  
  // Ambient Light: Uniform brightness everywhere
  let lighting = baseColor * clamp(uniforms.ambient.x, 0.0, 1.0);
  
  return vec4f(lighting, 1.0);
}
