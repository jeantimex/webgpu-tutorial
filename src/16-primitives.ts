import { initWebGPU } from "./utils/webgpu-util";

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // --- 1. geometries ---
  const createBuffer = (arr: Float32Array) => {
    const buffer = device.createBuffer({
      size: arr.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(buffer, 0, arr);
    return { buffer, count: arr.length / 3 };
  };

  // 1. Point List (A dense grid of points to make them visible)
  const pointFloats: number[] = [];
  for (let x = -0.5; x <= 0.5; x += 0.1) {
    for (let y = -0.5; y <= 0.5; y += 0.1) {
      pointFloats.push(x, y, 0.0);
    }
  }
  const pointData = new Float32Array(pointFloats);
  const points = createBuffer(pointData);

  // 2. Line List (X shape)
  const lineListData = new Float32Array([
    -0.5, -0.5, 0.0, 0.5, 0.5, 0.0, -0.5, 0.5, 0.0, 0.5, -0.5, 0.0,
  ]);
  const lines = createBuffer(lineListData);

  // 3. Line Strip (Zig-zag)
  const lineStripData = new Float32Array([
    -0.5, -0.5, 0.0, -0.2, 0.5, 0.0, 0.2, -0.5, 0.0, 0.5, 0.5, 0.0,
  ]);
  const strip = createBuffer(lineStripData);

  // 4. Triangle List (Quad)
  const triListData = new Float32Array([
    -0.5, 0.5, 0.0, -0.5, -0.5, 0.0, 0.5, -0.5, 0.0, -0.5, 0.5, 0.0, 0.5, -0.5,
    0.0, 0.5, 0.5, 0.0,
  ]);
  const tris = createBuffer(triListData);

  // 5. Triangle Strip (Quad)
  const triStripData = new Float32Array([
    -0.5, 0.5, 0.0, -0.5, -0.5, 0.0, 0.5, 0.5, 0.0, 0.5, -0.5, 0.0,
  ]);
  const tristrip = createBuffer(triStripData);

  // --- 2. Dynamic Uniforms ---
  // Struct: { offset: vec2f, color: vec4f }
  // Size: 8 + 16 + padding = 32 bytes?
  // Alignment: 256 bytes for dynamic offset.

  const minAlignment = device.limits.minUniformBufferOffsetAlignment; // 256
  const uniformBuffer = device.createBuffer({
    size: 5 * minAlignment,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const tempFloat = new Float32Array(minAlignment / 4);
  const data = [
    { x: -0.8, color: [1, 0, 0, 1] }, // Red Points
    { x: -0.4, color: [1, 1, 0, 1] }, // Yellow Lines
    { x: 0.0, color: [0, 1, 0, 1] }, // Green Strip
    { x: 0.4, color: [0, 1, 1, 1] }, // Cyan Tris
    { x: 0.8, color: [0, 0, 1, 1] }, // Blue Strip
  ];

  data.forEach((d, i) => {
    // Offset (0, 1)
    tempFloat[0] = d.x;
    tempFloat[1] = 0.0;
    // Color (2, 3, 4, 5) -> Wait, WGSL struct alignment
    // struct Uniforms { offset: vec2f, color: vec4f }
    // offset: 0-8
    // color: 16-32 (must align to 16)
    tempFloat[2] = 0; // padding
    tempFloat[3] = 0; // padding
    tempFloat[4] = d.color[0];
    tempFloat[5] = d.color[1];
    tempFloat[6] = d.color[2];
    tempFloat[7] = d.color[3];

    device.queue.writeBuffer(uniformBuffer, i * minAlignment, tempFloat);
  });

  // --- 3. Shared Shader & Explicit Layout ---
  const shaderModule = device.createShaderModule({
    code: `
      struct Uniforms {
        offset : vec2f,
        color : vec4f,
      };
      @group(0) @binding(0) var<uniform> global : Uniforms;

      @vertex
      fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
        // Scale down to fit 5 items
        let scaled = pos * 0.15; 
        return vec4f(scaled.x + global.offset.x, scaled.y + global.offset.y, 0.0, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return global.color;
      }
    `,
  });

  // Explicit Layout to ensure compatibility between pipelines
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform", hasDynamicOffset: true },
      },
    ],
  });

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });

  const vertexState = {
    module: shaderModule,
    entryPoint: "vs_main",
    buffers: [
      {
        arrayStride: 12,
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" as const },
        ],
      },
    ],
  };

  const fragmentState = {
    module: shaderModule,
    entryPoint: "fs_main",
    targets: [{ format: canvasFormat }],
  };

  // --- 4. Create 5 Pipelines ---
  const createPipeline = (topology: GPUPrimitiveTopology) => {
    return device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: vertexState,
      fragment: fragmentState,
      primitive: { topology },
    });
  };

  const pipelines = [
    { pipe: createPipeline("point-list"), buffer: points, name: "Points" },
    { pipe: createPipeline("line-list"), buffer: lines, name: "Lines" },
    { pipe: createPipeline("line-strip"), buffer: strip, name: "LineStrip" },
    { pipe: createPipeline("triangle-list"), buffer: tris, name: "Triangles" },
    {
      pipe: createPipeline("triangle-strip"),
      buffer: tristrip,
      name: "TriStrip",
    },
  ];

  // --- 5. Create Bind Group ---
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer, offset: 0, size: 32 }, // size of one struct
      },
    ],
  });

  // --- 6. Render ---
  function render() {
    const commandEncoder = device.createCommandEncoder();
    const textureView = context!.getCurrentTexture().createView();

    const pass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    pipelines.forEach((p, i) => {
      pass.setPipeline(p.pipe);
      pass.setVertexBuffer(0, p.buffer.buffer);
      // Set uniform window
      pass.setBindGroup(0, bindGroup, [i * minAlignment]);
      pass.draw(p.buffer.count);
    });

    pass.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

init().catch(console.error);
