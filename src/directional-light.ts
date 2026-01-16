import { initWebGPU } from "./utils/webgpu-util";
import { mat3, mat4, vec3 } from "wgpu-matrix";
import GUI from "lil-gui";

const shaderCode = `
struct Uniforms {
  mvpMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  normalMatrix : mat3x3f,
  lightDirIntensity : vec4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) normal : vec3f,
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) normal : vec3f,
) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  
  // Transform normal to world space
  out.normal = uniforms.normalMatrix * normal;
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let N = normalize(in.normal);
  let L = normalize(uniforms.lightDirIntensity.xyz);
  
  // Diffuse only
  let diffuse = max(dot(N, L), 0.0) * max(uniforms.lightDirIntensity.w, 0.0);
  
  let baseColor = vec3f(1.0, 0.0, 0.0); // Red
  return vec4f(baseColor * diffuse, 1.0);
}
`;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // --- 1. Geometry Data (Pos + Normal) ---
  // 24 Vertices (per-face normals)
  // prettier-ignore
  const vertexData = new Float32Array([
    // Position           // Normal
    // Front (+Z)
    -0.5, -0.5,  0.5,      0,  0,  1,
     0.5, -0.5,  0.5,      0,  0,  1,
     0.5,  0.5,  0.5,      0,  0,  1,
    -0.5,  0.5,  0.5,      0,  0,  1,
    // Right (+X)
     0.5, -0.5,  0.5,      1,  0,  0,
     0.5, -0.5, -0.5,      1,  0,  0,
     0.5,  0.5, -0.5,      1,  0,  0,
     0.5,  0.5,  0.5,      1,  0,  0,
    // Back (-Z)
     0.5, -0.5, -0.5,      0,  0, -1,
    -0.5, -0.5, -0.5,      0,  0, -1,
    -0.5,  0.5, -0.5,      0,  0, -1,
     0.5,  0.5, -0.5,      0,  0, -1,
    // Left (-X)
    -0.5, -0.5, -0.5,     -1,  0,  0,
    -0.5, -0.5,  0.5,     -1,  0,  0,
    -0.5,  0.5,  0.5,     -1,  0,  0,
    -0.5,  0.5, -0.5,     -1,  0,  0,
    // Top (+Y)
    -0.5,  0.5,  0.5,      0,  1,  0,
     0.5,  0.5,  0.5,      0,  1,  0,
     0.5,  0.5, -0.5,      0,  1,  0,
    -0.5,  0.5, -0.5,      0,  1,  0,
    // Bottom (-Y)
    -0.5, -0.5, -0.5,      0, -1,  0,
     0.5, -0.5, -0.5,      0, -1,  0,
     0.5, -0.5,  0.5,      0, -1,  0,
    -0.5, -0.5,  0.5,      0, -1,  0,
  ]);

  // Indices
  // prettier-ignore
  const indexData = new Uint16Array([
    0, 1, 2,  2, 3, 0,       // Front
    4, 5, 6,  6, 7, 4,       // Right
    8, 9, 10, 10, 11, 8,     // Back
    12, 13, 14, 14, 15, 12,  // Left
    16, 17, 18, 18, 19, 16,  // Top
    20, 21, 22, 22, 23, 20,  // Bottom
  ]);

  const vertexBuffer = device.createBuffer({
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertexData);

  const indexBuffer = device.createBuffer({
    size: indexData.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, 0, indexData);

  // --- 2. Uniforms ---
  const uniformBufferSize = 192; // 64 (mvp) + 64 (model) + 48 (normal) + 16 (lightDir + pad)
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const aspect = canvas.width / canvas.height;
  const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);
  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // --- 3. Pipeline ---
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 24, // 3 floats (pos) + 3 floats (normal)
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" }, // pos
          { shaderLocation: 1, offset: 12, format: "float32x3" }, // normal
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
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  const settings = {
    lightDirX: 1.0,
    lightDirY: 1.0,
    lightDirZ: 1.0,
    intensity: 1.0,
    animate: true,
  };
  const gui = new GUI({ container: document.getElementById("gui-container") as HTMLElement });
  gui.add(settings, "lightDirX", -1.0, 1.0).name("Light Dir X");
  gui.add(settings, "lightDirY", -1.0, 1.0).name("Light Dir Y");
  gui.add(settings, "lightDirZ", -1.0, 1.0).name("Light Dir Z");
  gui.add(settings, "intensity", 0.0, 2.0).name("Intensity");
  gui.add(settings, "animate").name("Animate");

  let angle = 0;
  const normalMatrix = mat3.create();
  const normalMatrixData = new Float32Array(12);

  function render() {
    if (settings.animate) {
      angle += 0.01;
    }
    
    const modelMatrix = mat4.multiply(mat4.rotationY(angle), mat4.rotationX(angle * 0.5));
    const viewMatrix = mat4.lookAt([2.5, 2.5, 2.5], [0, 0, 0], [0, 1, 0]);
    const mvpMatrix = mat4.multiply(projectionMatrix, mat4.multiply(viewMatrix, modelMatrix));

    mat3.fromMat4(modelMatrix, normalMatrix);
    mat3.invert(normalMatrix, normalMatrix);
    mat3.transpose(normalMatrix, normalMatrix);
    normalMatrixData.set(normalMatrix);

    // Upload Uniforms
    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as Float32Array);
    device.queue.writeBuffer(uniformBuffer, 64, modelMatrix as Float32Array);
    device.queue.writeBuffer(uniformBuffer, 128, normalMatrixData);
    const lightDir = vec3.normalize([
      settings.lightDirX,
      settings.lightDirY,
      settings.lightDirZ,
    ]);
    device.queue.writeBuffer(
      uniformBuffer,
      176,
      new Float32Array([lightDir[0], lightDir[1], lightDir[2], settings.intensity])
    );

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
    renderPass.drawIndexed(indexData.length);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

init().catch(console.error);
