@group(0) @binding(0) var inputTex : texture_2d<f32>;
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
  let dims = textureDimensions(inputTex);
  let coords = vec2i(id.xy);

  if (coords.x >= i32(dims.x) || coords.y >= i32(dims.y)) {
    return;
  }

  // Count 8 neighbors
  var activeNeighbors = 0;
  for (var i = -1; i <= 1; i++) {
    for (var j = -1; j <= 1; j++) {
      if (i == 0 && j == 0) { continue; }
      
      // Use modulo for wrapping around edges (Toroidal grid)
      let neighborCoords = (coords + vec2i(i, j) + vec2i(dims)) % vec2i(dims);
      let value = textureLoad(inputTex, neighborCoords, 0).r;
      if (value > 0.5) {
        activeNeighbors++;
      }
    }
  }

  let currentState = textureLoad(inputTex, coords, 0).r > 0.5;
  var nextState = 0.0;

  if (currentState) {
    // Rule: Any live cell with two or three live neighbors lives
    if (activeNeighbors == 2 || activeNeighbors == 3) {
      nextState = 1.0;
    }
  } else {
    // Rule: Any dead cell with exactly three live neighbors becomes a live cell
    if (activeNeighbors == 3) {
      nextState = 1.0;
    }
  }

  textureStore(outputTex, coords, vec4f(nextState, nextState, nextState, 1.0));
}
