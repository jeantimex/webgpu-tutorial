@group(0) @binding(0)
var<storage, read_write> data : array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
  if (global_id.x >= arrayLength(&data)) {
    return;
  }
  data[global_id.x] = data[global_id.x] * 2.0;
}
