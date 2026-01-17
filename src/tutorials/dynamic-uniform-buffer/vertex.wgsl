@vertex
fn vs_main(
  @builtin(instance_index) instanceIdx : u32,
  @location(0) pos : vec3f
) -> @builtin(position) vec4f {
  // Shift x-position based on instance index so we can see them separate
  let xOffset = (f32(instanceIdx) - 2.0) * 0.5;
  return vec4f(pos.x + xOffset, pos.y, pos.z, 1.0);
}
