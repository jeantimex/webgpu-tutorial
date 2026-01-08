import { initWebGPU } from "./utils/webgpu-util";
import { mat4 } from "wgpu-matrix";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Vertices (Triangle Geometry)
  // Standard Vertex Buffer (Mesh)
  // prettier-ignore
  const vertices = new Float32Array([
     0.0,  0.1, 0.5, // Top
    -0.1, -0.1, 0.5, // Bottom Left
     0.1, -0.1, 0.5  // Bottom Right
  ]);

  const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 2. Define Uniform Data (Array of Structs)
  // Struct: { matrix: mat4x4f (64 bytes), color: vec4f (16 bytes) }
  // Total size per instance: 80 bytes.
  // Note: WGSL uniform array stride must be multiple of 16. 80 is divisible by 16.
  const numInstances = 10;
  const structSizeFloat = 16 + 4; // 20 floats
  const structSizeBytes = structSizeFloat * 4; // 80 bytes
  const uniformBufferSize = numInstances * structSizeBytes;

  const uniformBuffer = device.createBuffer({
    label: "Instance Data Buffer",
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // 3. Compute Data for each instance
  const aspect = canvas.width / canvas.height;
  const instanceData = new Float32Array(numInstances * structSizeFloat);

  for (let i = 0; i < numInstances; i++) {
    // A. Matrix (Offset 0)
    // Start with Identity (using translation 0,0,0) to avoid mat4.create() issues
    const mvp = mat4.translation([0, 0, 0]);
    mat4.scale(mvp, [1 / aspect, 1, 1], mvp);
    const x = Math.random() * 1.6 - 0.8;
    const y = Math.random() * 1.6 - 0.8;
    mat4.translate(mvp, [x, y, 0], mvp);

    const base = i * structSizeFloat;
    instanceData.set(mvp, base + 0);

    // B. Color (Offset 16)
    instanceData[base + 16] = Math.random(); // R
    instanceData[base + 17] = Math.random(); // G
    instanceData[base + 18] = Math.random(); // B
    instanceData[base + 19] = 1.0; // A
  }

  // Upload
  device.queue.writeBuffer(uniformBuffer, 0, instanceData);

  // 4. Define Shaders
  const shaderModule = device.createShaderModule({
    label: "Instancing Shader",
    code: `
      struct Instance {
        matrix : mat4x4f,
        color : vec4f,
      };

      struct Uniforms {
        instances : array<Instance, ${numInstances}>,
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
        output.position = inst.matrix * vec4f(pos, 1.0);
        output.color = inst.color;
        
        return output;
      }

      @fragment
      fn fs_main(@location(0) color : vec4f) -> @location(0) vec4f {
        return color;
      }
    `,
  });

  // 5. Create Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Instancing Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        // Buffer 0: Geometry only
        {
          arrayStride: 3 * 4,
          stepMode: "vertex",
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

  // 6. Create Bind Group
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
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
    passEncoder.setPipeline(pipeline);

    // Bind Vertex Buffer (Geometry)
    passEncoder.setVertexBuffer(0, vertexBuffer);

    // Bind Uniforms (Matrix + Color Array)
    passEncoder.setBindGroup(0, bindGroup);

    // Draw 3 vertices, 10 instances!
    passEncoder.draw(3, numInstances);

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch((err) => {
  console.error(err);
});
