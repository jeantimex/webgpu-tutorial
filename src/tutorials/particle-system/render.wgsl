struct Particle {
  pos : vec2f,
  vel : vec2f,
  color : vec3f,
  size : f32,
}

struct Uniforms {
  aspectRatio : f32,
}

@group(0) @binding(0) var<storage, read> particles : array<Particle>;
@group(0) @binding(1) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
}

@vertex
fn vs_main(
  @builtin(vertex_index) vIdx : u32,
  @builtin(instance_index) iIdx : u32
) -> VertexOutput {
  let p = particles[iIdx];

  // A simple quad (2 triangles) centered at (0,0)
  var corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f( 1.0, -1.0), vec2f(-1.0,  1.0),
    vec2f(-1.0,  1.0), vec2f( 1.0, -1.0), vec2f( 1.0,  1.0)
  );
  
  // Scale by particle size
  let cornerPos = corners[vIdx] * p.size; 
  
  // Apply Aspect Ratio Correction to the offset only (to keep the particle square)
  // We divide X by aspect ratio so that a unit width in X matches visual width in Y
  let correctedCorner = vec2f(cornerPos.x / uniforms.aspectRatio, cornerPos.y);

  let finalPos = p.pos + correctedCorner;

  var out : VertexOutput;
  out.position = vec4f(finalPos, 0.0, 1.0);
  out.color = vec4f(p.color, 1.0);
  
  return out;
}

@fragment
fn fs_main( @location(0) color : vec4f) -> @location(0) vec4f {
  return color;
}
