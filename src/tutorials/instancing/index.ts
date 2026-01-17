import { initWebGPU } from "../../utils/webgpu-util";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";
import vertexWGSL from "./vertex.wgsl?raw";
import fragmentWGSL from "./fragment.wgsl?raw";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Define Vertices (Triangle Geometry)
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
  // Struct InstanceData {
  //   color : vec4f (16 bytes)
  //   offset : vec2f (8 bytes)
  //   padding : vec2f (8 bytes) -- To align struct to 16 bytes?
  //   Actually, array element stride in uniform buffer must be multiple of 16 bytes.
  //   Size = 16 + 8 = 24. Next multiple of 16 is 32.
  //   So each element takes 32 bytes.
  // }
  const numInstances = 10;
  const floatsPerInstance = 8; // 32 bytes / 4 bytes per float = 8 floats
  const uniformBufferSize = numInstances * floatsPerInstance * 4;

  const uniformBuffer = device.createBuffer({
    label: "Instance Data Buffer",
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // 3. Compute Data for each instance
  const instanceData = new Float32Array(numInstances * floatsPerInstance);

  for (let i = 0; i < numInstances; i++) {
    const base = i * floatsPerInstance;

    // Color (Offset 0)
    instanceData[base + 0] = Math.random(); // R
    instanceData[base + 1] = Math.random(); // G
    instanceData[base + 2] = Math.random(); // B
    instanceData[base + 3] = 1.0; // A

    // Offset (Offset 4)
    instanceData[base + 4] = Math.random() * 1.6 - 0.8; // X
    instanceData[base + 5] = Math.random() * 1.6 - 0.8; // Y

    // Padding (Offset 6, 7) - Unused
    instanceData[base + 6] = 0;
    instanceData[base + 7] = 0;
  }

  // Upload
  device.queue.writeBuffer(uniformBuffer, 0, instanceData);

  // 4. Define Shaders
  const vertexSource = vertexWGSL.replace(
    /__INSTANCE_COUNT__/g,
    String(numInstances)
  );
  const vertexModule = device.createShaderModule({
    label: "Instancing Vertex Shader",
    code: vertexSource,
  });
  const fragmentModule = device.createShaderModule({
    label: "Instancing Fragment Shader",
    code: fragmentWGSL,
  });

  // 5. Create Pipeline
  const pipeline = device.createRenderPipeline({
    label: "Instancing Pipeline",
    layout: "auto",
    vertex: {
      module: vertexModule,
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
      module: fragmentModule,
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
    resizeCanvasToDisplaySize(canvas);
    const commandEncoder = device.createCommandEncoder();
    const textureView = context!.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);

    // Bind Vertex Buffer (Geometry)
    passEncoder.setVertexBuffer(0, vertexBuffer);

    // Bind Uniforms (Instance Array)
    passEncoder.setBindGroup(0, bindGroup);

    // Draw 3 vertices, 10 instances!
    passEncoder.draw(3, numInstances);

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
  window.addEventListener("resize", render);
}

init().catch((err) => {
  console.error(err);
});
