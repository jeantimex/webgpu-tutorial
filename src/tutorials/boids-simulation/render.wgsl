struct Boid {
  pos : vec2f,
  vel : vec2f,
}

struct RenderUniforms {
  values : vec4f,
}

@group(0) @binding(0) var<storage, read> boids : array<Boid>;
@group(0) @binding(1) var<uniform> renderUniforms : RenderUniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
}

@vertex
fn vs_main(
  @builtin(vertex_index) vIdx : u32,
  @builtin(instance_index) iIdx : u32
) -> VertexOutput {
  let boid = boids[iIdx];
  let angle = atan2(boid.vel.y, boid.vel.x);
  
  // A small triangle pointing in the direction of velocity
  var pos = array<vec2f, 3>(
    vec2f( 0.02,  0.0), // Tip
    vec2f(-0.015,  0.01), // Bottom Left
    vec2f(-0.015, -0.01)  // Bottom Right
  );

  // Rotate triangle
  let rotated = vec2f(
    pos[vIdx].x * cos(angle) - pos[vIdx].y * sin(angle),
    pos[vIdx].x * sin(angle) + pos[vIdx].y * cos(angle)
  );

  var finalPos = boid.pos + rotated;
  let aspectRatio = renderUniforms.values.x;
  if (aspectRatio > 1.0) {
    finalPos = vec2f(finalPos.x / aspectRatio, finalPos.y);
  } else {
    finalPos = vec2f(finalPos.x, finalPos.y * aspectRatio);
  }

  var out : VertexOutput;
  out.position = vec4f(finalPos, 0.0, 1.0);
  
  // Color based on velocity
  out.color = vec4f(0.5 + boid.vel.x * 20.0, 0.5 + boid.vel.y * 20.0, 1.0, 1.0);
  return out;
}

@fragment
fn fs_main(@location(0) color : vec4f) -> @location(0) vec4f {
  return color;
}
