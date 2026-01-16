import { initWebGPU } from "./utils/webgpu-util";
import { mat4 } from "wgpu-matrix";

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
  
  // --- 1. Load Texture Image ---
  const imgUrl = "https://webgpu.github.io/webgpu-samples/assets/img/webgpu.png";
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imgUrl;
  await img.decode();
  const imageBitmap = await createImageBitmap(img);

  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // --- 2. Define Geometry ---
  // prettier-ignore
  const cubeVertices = new Float32Array([
    // pos (x, y, z)      uv (u, v)
    // Front Face
    -0.5, -0.5,  0.5,     0, 1,
     0.5, -0.5,  0.5,     1, 1,
     0.5,  0.5,  0.5,     1, 0,
    -0.5,  0.5,  0.5,     0, 0,

    // Back Face (Corrected Winding)
     0.5, -0.5, -0.5,     0, 1, // BL
    -0.5, -0.5, -0.5,     1, 1, // BR
    -0.5,  0.5, -0.5,     1, 0, // TR
     0.5,  0.5, -0.5,     0, 0, // TL

    // Top Face
    -0.5,  0.5, -0.5,     0, 0,
    -0.5,  0.5,  0.5,     0, 1,
     0.5,  0.5,  0.5,     1, 1,
     0.5,  0.5, -0.5,     1, 0,

    // Bottom Face
    -0.5, -0.5, -0.5,     0, 1,
     0.5, -0.5, -0.5,     1, 1,
     0.5, -0.5,  0.5,     1, 0,
    -0.5, -0.5,  0.5,     0, 0,

    // Right Face
     0.5, -0.5, -0.5,     1, 1,
     0.5,  0.5, -0.5,     1, 0,
     0.5,  0.5,  0.5,     0, 0,
     0.5, -0.5,  0.5,     0, 1,

    // Left Face
    -0.5, -0.5, -0.5,     0, 1,
    -0.5, -0.5,  0.5,     1, 1,
    -0.5,  0.5,  0.5,     1, 0,
    -0.5,  0.5, -0.5,     0, 0,
  ]);

  // prettier-ignore
  const cubeIndices = new Uint16Array([
    0, 1, 2, 2, 3, 0,       // Front
    4, 5, 6, 6, 7, 4,       // Back
    8, 9, 10, 10, 11, 8,    // Top
    12, 13, 14, 14, 15, 12, // Bottom
    16, 17, 18, 18, 19, 16, // Right
    20, 21, 22, 22, 23, 20, // Left
  ]);

  const vertexBuffer = device.createBuffer({
    size: cubeVertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, cubeVertices);

  const indexBuffer = device.createBuffer({
    size: cubeIndices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, 0, cubeIndices);

  // --- 3. Create Texture and Sampler ---
  const texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });
  device.queue.copyExternalImageToTexture({ source: imageBitmap }, { texture }, [imageBitmap.width, imageBitmap.height]);

  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
  });

  // --- 4. Uniforms and Depth ---
  const uniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const aspect = canvas.width / canvas.height;
  const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);

  const depthTexture = device.createTexture({
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
        arrayStride: 20, // 5 floats * 4 bytes
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
    primitive: { 
      topology: "triangle-list",
      cullMode: "back",
    },
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
  function render() {
    angle += 0.01;
    const viewMatrix = mat4.lookAt([2, 2, 2], [0, 0, 0], [0, 1, 0]);
    const modelMatrix = mat4.multiply(mat4.rotationY(angle), mat4.rotationX(angle * 0.5));
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
    renderPass.drawIndexed(cubeIndices.length);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

init().catch(console.error);