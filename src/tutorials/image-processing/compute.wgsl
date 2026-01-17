struct Params {
  filterType : u32,
}

@group(0) @binding(0) var inputTex : texture_2d<f32>;
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> params : Params;

@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let dims = textureDimensions(inputTex);
  let coords = vec2i(id.xy);

  if (coords.x >= i32(dims.x) || coords.y >= i32(dims.y)) {
    return;
  }

  var color = textureLoad(inputTex, coords, 0);

  if (params.filterType == 1u) {
    // Grayscale
    let lum = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
    color = vec4f(lum, lum, lum, 1.0);
  } else if (params.filterType == 2u) {
    // Invert
    color = vec4f(1.0 - color.rgb, 1.0);
  } else if (params.filterType == 3u) {
    // Simple 3x3 Box Blur
    var acc = vec3f(0.0);
    for (var i = -1; i <= 1; i++) {
      for (var j = -1; j <= 1; j++) {
        let offsetCoords = clamp(coords + vec2i(i, j), vec2i(0), vec2i(dims) - 1);
        acc += textureLoad(inputTex, offsetCoords, 0).rgb;
      }
    }
    color = vec4f(acc / 9.0, 1.0);
  }

  textureStore(outputTex, coords, color);
}
