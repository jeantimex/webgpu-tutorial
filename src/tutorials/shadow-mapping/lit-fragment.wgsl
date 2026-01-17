@group(0) @binding(2) var shadowMap : texture_depth_2d;
@group(0) @binding(3) var shadowSampler : sampler_comparison;

const shadowMapSize : f32 = 2048.0;

fn computeShadow(shadowPos : vec3f, normal : vec3f, lightDir : vec3f) -> f32 {
  let uv = shadowPos.xy;
  let depth = shadowPos.z;
  let inBounds = select(0.0, 1.0,
    uv.x >= 0.0 && uv.x <= 1.0 &&
    uv.y >= 0.0 && uv.y <= 1.0 &&
    depth >= 0.0 && depth <= 1.0
  );
  let uvClamped = clamp(uv, vec2f(0.0, 0.0), vec2f(1.0, 1.0));
  let depthClamped = clamp(depth, 0.0, 1.0);
  let bias = max(0.004 * (1.0 - dot(normal, lightDir)), 0.001);
  let texelSize = 1.0 / shadowMapSize;

  var visibility = 0.0;
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let offset = vec2f(vec2(x, y)) * texelSize;
      visibility += textureSampleCompare(
        shadowMap,
        shadowSampler,
        uvClamped + offset,
        depthClamped - bias
      );
    }
  }
  visibility = visibility / 9.0;
  return mix(1.0, visibility, inBounds);
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let N = normalize(in.normal);

  let ambient = lightUniforms.ambientColor.rgb * 0.3;
  let L = normalize(-lightUniforms.dirLightDirection.xyz);
  let diff = max(dot(N, L), 0.0);
  let diffuse = diff * lightUniforms.dirLightColor.rgb;

  let shadow = computeShadow(in.shadowPos, N, L);
  let lighting = ambient + diffuse * shadow;
  let finalColor = uniforms.color.rgb * lighting;

  return vec4f(finalColor, uniforms.color.a);
}
