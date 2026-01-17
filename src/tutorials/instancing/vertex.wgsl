struct Instance {
  color : vec4f,
  offset : vec2f,
  // Implicit padding of 8 bytes here to reach 32-byte stride
};

struct Uniforms {
  instances : array<Instance, __INSTANCE_COUNT__>,
};

@group(0) @binding(0) var<uniform> global : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
};

@vertex
fn vs_main(
  @builtin(instance_index) instanceIdx : u32,
  @location(0) pos : vec3f
) -> VertexOutput {
  // Pick the instance data
  let inst = global.instances[instanceIdx];
  
  var output : VertexOutput;
  // Apply offset to position
  output.position = vec4f(pos.xy + inst.offset, pos.z, 1.0);
  output.color = inst.color;
  
  return output;
}
