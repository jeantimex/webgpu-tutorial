import { initWebGPU } from "../../utils/webgpu-util";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Geometry (Triangle)
  // prettier-ignore
  const vertices = new Float32Array([
     0.0,  0.5, 0.0, // Top
    -0.5, -0.5, 0.0, // Bottom Left
     0.5, -0.5, 0.0  // Bottom Right
  ]);

  const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 2. Define Dynamic Uniform Data (Colors)
  // Challenge: Dynamic Uniform Offsets must be aligned to 256 bytes.
  // Our color is vec4f (16 bytes). We must pad it to 256 bytes.

  const deviceLimits = device.limits;
  const minUniformOffsetAlignment =
    deviceLimits.minUniformBufferOffsetAlignment;
  // Usually 256, but always check limits. It's guaranteed to be at least 256.

  const numInstances = 5;
  const colorDataSize = 4 * 4; // 16 bytes per color

  // Create a buffer large enough for 5 instances, each aligned to minUniformOffsetAlignment
  const dynamicStride =
    Math.ceil(colorDataSize / minUniformOffsetAlignment) *
    minUniformOffsetAlignment;

  const uniformBufferSize = numInstances * dynamicStride;
  const uniformBuffer = device.createBuffer({
    label: "Dynamic Uniform Buffer",
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Populate data
  const uniformData = new Float32Array(uniformBufferSize / 4);

  for (let i = 0; i < numInstances; i++) {
    // Generate random color
    const r = Math.random();
    const g = Math.random();
    const b = Math.random();

    // Calculate offset in the Float32Array
    // Stride is in bytes, so divide by 4 for float index
    const offset = (i * dynamicStride) / 4;

    uniformData[offset + 0] = r;
    uniformData[offset + 1] = g;
    uniformData[offset + 2] = b;
    uniformData[offset + 3] = 1.0;
  }

  device.queue.writeBuffer(uniformBuffer, 0, uniformData);

  // 3. Define Shaders
  const shaderModule = device.createShaderModule({
    label: "Dynamic Uniform Shader",
    code: `
      struct Uniforms {
        color : vec4f,
      };

      // Group 0, Binding 0, with dynamic offset
      @group(0) @binding(0) var<uniform> global : Uniforms;

      @vertex
      fn vs_main(
        @builtin(instance_index) instanceIdx : u32,
        @location(0) pos : vec3f
      ) -> @builtin(position) vec4f {
        // Shift x-position based on instance index so we can see them separate
        let xOffset = (f32(instanceIdx) - 2.0) * 0.5;
        return vec4f(pos.x + xOffset, pos.y, pos.z, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return global.color;
      }
    `,
  });

  // 4. Create Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Dynamic Uniform Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 3 * 4,
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  // 5. Create Bind Group
  // IMPORTANT: We use the SAME buffer for all instances.
  // The layout must allow for dynamic offsets.
  // Since we used layout: "auto", WebGPU detects 'var<uniform>' and defaults to non-dynamic?
  // Wait, if we want dynamic, we usually need to specify it manually OR write the shader in a way...
  // Actually, standard uniform bindings CAN support dynamic offsets if the bind group layout allows it.
  // But 'auto' layout might infer non-dynamic "buffer".

  // Let's create the BindGroupLayout MANUALLY to ensure it supports dynamic offsets.

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
        buffer: {
          type: "uniform",
          hasDynamicOffset: true, // <--- Key Enable
        },
      },
    ],
  });

  // Re-create pipeline with explicit layout
  const pipelineWithLayout = device.createRenderPipeline({
    label: "Dynamic Pipeline",
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    }),
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 3 * 4,
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  // 6. Create Bind Group (Just ONE)
  // It binds the whole buffer (or a large enough range).
  // The offset will be applied later during draw.
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: 0,
          size: colorDataSize, // Window size: just one color struct
        },
      },
    ],
  });

  // 7. Render
  function render() {
    const commandEncoder = device.createCommandEncoder();
    const textureView = context!.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipelineWithLayout);
    passEncoder.setVertexBuffer(0, vertexBuffer);

    // Draw 5 triangles, each with a different dynamic offset
    for (let i = 0; i < numInstances; i++) {
      const dynamicOffset = i * dynamicStride;

      // Set Bind Group with Dynamic Offset
      // This slides the "window" of the uniform buffer
      passEncoder.setBindGroup(0, bindGroup, [dynamicOffset]);

      // Note: We use draw(3, 1, 0, i) to use 'i' as instance_index for positioning
      // vertexCount, instanceCount, firstVertex, firstInstance
      passEncoder.draw(3, 1, 0, i);
    }

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch((err) => {
  console.error(err);
});
