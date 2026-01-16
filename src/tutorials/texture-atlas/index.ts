import { initWebGPU } from "../../utils/webgpu-util";
import { mat4 } from "wgpu-matrix";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";

const shaderCode = `
struct Uniforms {
  mvpMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var mySampler : sampler;
@group(0) @binding(2) var myTexture : texture_2d<f32>;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) uv : vec2f
) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  out.uv = uv;
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  return textureSample(myTexture, mySampler, in.uv);
}
`;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // --- 1. Create a Texture Atlas Programmatically ---
  // Instead of loading an external image, we'll draw a texture atlas 
  // on a 2D canvas with numbers 1-6 in a 3x2 grid.
  const atlasWidth = 512;
  const atlasHeight = 512;
  const offscreen = document.createElement('canvas');
  offscreen.width = atlasWidth;
  offscreen.height = atlasHeight;
  const ctx = offscreen.getContext('2d')!;

  // Fill background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, atlasWidth, atlasHeight);

  // Draw 6 regions (3 columns, 2 rows)
  const cellW = atlasWidth / 3;
  const cellH = atlasHeight / 2;
  const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF"];
  
  ctx.font = "bold 150px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = col * cellW;
    const y = row * cellH;

    // Draw colored box
    ctx.fillStyle = colors[i];
    ctx.fillRect(x, y, cellW, cellH);
    
    // Draw number
    ctx.fillStyle = "black";
    ctx.fillText((i + 1).toString(), x + cellW / 2, y + cellH / 2);
    
    // Draw border
    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;
    ctx.strokeRect(x, y, cellW, cellH);
  }

  const atlasBitmap = await createImageBitmap(offscreen);

  // --- 2. Create GPU Texture ---
  const texture = device.createTexture({
    size: [atlasWidth, atlasHeight],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });
  device.queue.copyExternalImageToTexture({ source: atlasBitmap }, { texture }, [atlasWidth, atlasHeight]);

  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
  });

  // --- 3. Define Geometry with UV Mapping ---
  // We need to map each face to one cell in our 3x2 grid.
  // U step = 1/3, V step = 1/2
  const uStep = 1 / 3;
  const vStep = 1 / 2;

  // Helper to generate UVs for a specific cell index (0-5)
  // Index 0: col 0, row 0 -> U: 0..0.33, V: 0..0.5
  function getUVs(index: number) {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const u0 = col * uStep;
    const v0 = row * vStep;
    const u1 = u0 + uStep;
    const v1 = v0 + vStep;
    
    // Return quad UVs: BL, BR, TR, TL
    return [
      u0, v1, // Bottom-Left
      u1, v1, // Bottom-Right
      u1, v0, // Top-Right
      u0, v0  // Top-Left
    ];
  }

  const uv1 = getUVs(0); // Front
  const uv2 = getUVs(1); // Back
  const uv3 = getUVs(2); // Top
  const uv4 = getUVs(3); // Bottom
  const uv5 = getUVs(4); // Right
  const uv6 = getUVs(5); // Left

  // prettier-ignore
  const vertexData = new Float32Array([
    // pos (x, y, z)      uv (u, v)
    
    // Front Face (1)
    -0.5, -0.5,  0.5,     uv1[0], uv1[1],
     0.5, -0.5,  0.5,     uv1[2], uv1[3],
     0.5,  0.5,  0.5,     uv1[4], uv1[5],
    -0.5,  0.5,  0.5,     uv1[6], uv1[7],

    // Back Face (2)
     0.5, -0.5, -0.5,     uv2[0], uv2[1],
    -0.5, -0.5, -0.5,     uv2[2], uv2[3],
    -0.5,  0.5, -0.5,     uv2[4], uv2[5],
     0.5,  0.5, -0.5,     uv2[6], uv2[7],

    // Top Face (3)
    -0.5,  0.5, -0.5,     uv3[6], uv3[7], // rotated for better orientation
    -0.5,  0.5,  0.5,     uv3[0], uv3[1],
     0.5,  0.5,  0.5,     uv3[2], uv3[3],
     0.5,  0.5, -0.5,     uv3[4], uv3[5],

    // Bottom Face (4)
    -0.5, -0.5, -0.5,     uv4[0], uv4[1],
     0.5, -0.5, -0.5,     uv4[2], uv4[3],
     0.5, -0.5,  0.5,     uv4[4], uv4[5],
    -0.5, -0.5,  0.5,     uv4[6], uv4[7],

    // Right Face (5)
     0.5, -0.5, -0.5,     uv5[2], uv5[3],
     0.5,  0.5, -0.5,     uv5[4], uv5[5],
     0.5,  0.5,  0.5,     uv5[6], uv5[7],
     0.5, -0.5,  0.5,     uv5[0], uv5[1],

    // Left Face (6)
    -0.5, -0.5, -0.5,     uv6[0], uv6[1],
    -0.5, -0.5,  0.5,     uv6[2], uv6[3],
    -0.5,  0.5,  0.5,     uv6[4], uv6[5],
    -0.5,  0.5, -0.5,     uv6[6], uv6[7],
  ]);

  // prettier-ignore
  const indices = new Uint16Array([
    0, 1, 2, 2, 3, 0,       // Front
    4, 5, 6, 6, 7, 4,       // Back
    8, 9, 10, 10, 11, 8,    // Top
    12, 13, 14, 14, 15, 12, // Bottom
    16, 17, 18, 18, 19, 16, // Right
    20, 21, 22, 22, 23, 20, // Left
  ]);

  const vertexBuffer = device.createBuffer({
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertexData);

  const indexBuffer = device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, 0, indices);

  // --- 4. Uniforms ---
  const uniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  function getProjectionMatrix() {
    const aspect = canvas.width / canvas.height;
    return mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);
  }

  resizeCanvasToDisplaySize(canvas);
  let projectionMatrix = getProjectionMatrix();
  let depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // --- 5. Pipeline ---
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 20,
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" }, // pos
          { shaderLocation: 1, offset: 12, format: "float32x2" }, // uv
        ],
      }],
    },
    fragment: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive: { topology: "triangle-list", cullMode: "back" },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: texture.createView() },
    ],
  });

  let angle = 0;
  let lastTime = 0;
  const rotationSpeed = 0.8; // radians per second
  function render(time: number) {
    const resized = resizeCanvasToDisplaySize(canvas);
    if (resized) {
      projectionMatrix = getProjectionMatrix();
      depthTexture.destroy();
      depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }

    const deltaSeconds = lastTime ? (time - lastTime) / 1000 : 0;
    lastTime = time;
    angle += deltaSeconds * rotationSpeed;
    const viewMatrix = mat4.lookAt([2.5, 2.5, 2.5], [0, 0, 0], [0, 1, 0]);
    const modelMatrix = mat4.multiply(mat4.rotationY(angle), mat4.rotationX(angle * 0.6));
    const mvpMatrix = mat4.multiply(projectionMatrix, mat4.multiply(viewMatrix, modelMatrix));
    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as Float32Array);

    const commandEncoder = device.createCommandEncoder();
    const textureView = context!.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
        loadOp: "clear",
        storeOp: "store",
      }],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });

    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer, "uint16");
    renderPass.drawIndexed(indices.length);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

init().catch(console.error);
