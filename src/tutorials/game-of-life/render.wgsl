struct RenderUniforms {
  simAspect : f32,
  canvasAspect : f32,
  padding : vec2f,
}

@group(0) @binding(0) var mySampler : sampler;
@group(0) @binding(1) var myTexture : texture_2d<f32>;
@group(0) @binding(2) var<uniform> renderUniforms : RenderUniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
}

@vertex
fn vs_main(@builtin(vertex_index) vIdx : u32) -> VertexOutput {
  var pos = array<vec2f, 4>(
    vec2f(-1.0, -1.0), vec2f( 1.0, -1.0),
    vec2f(-1.0,  1.0), vec2f( 1.0,  1.0)
  );
  var uv = array<vec2f, 4>(
    vec2f(0.0, 1.0), vec2f(1.0, 1.0),
    vec2f(0.0, 0.0), vec2f(1.0, 0.0)
  );

  var out : VertexOutput;
  var scale = vec2f(1.0, 1.0);
  if (renderUniforms.canvasAspect > renderUniforms.simAspect) {
    scale.x = renderUniforms.simAspect / renderUniforms.canvasAspect;
  } else {
    scale.y = renderUniforms.canvasAspect / renderUniforms.simAspect;
  }

  out.position = vec4f(pos[vIdx] * scale, 0.0, 1.0);
  out.uv = uv[vIdx];
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let color = textureSample(myTexture, mySampler, in.uv).r;
  // Make it look green/matrix style
  return vec4f(0.0, color, 0.0, 1.0);
}
