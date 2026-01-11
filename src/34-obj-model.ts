import { initWebGPU } from "./utils/webgpu-util";
import { parseOBJ } from "./utils/obj-loader";
import { mat4, vec3 } from "wgpu-matrix";

const shaderCode = `
struct Uniforms {
  mvpMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  cameraPos : vec3f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) normal : vec3f,
  @location(1) worldPos : vec3f,
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) normal : vec3f,
) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  out.normal = (uniforms.modelMatrix * vec4f(normal, 0.0)).xyz;
  out.worldPos = (uniforms.modelMatrix * vec4f(pos, 1.0)).xyz;
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let N = normalize(in.normal);
  let V = normalize(uniforms.cameraPos - in.worldPos);
  
  // Hardcoded Lights for simplicity
  let sunDir = normalize(vec3f(0.5, 1.0, 0.5));
  let sunColor = vec3f(1.0, 0.9, 0.8);
  
  // Ambient
  let ambient = vec3f(0.1, 0.1, 0.1);
  
  // Diffuse
  let diff = max(dot(N, sunDir), 0.0);
  let diffuse = diff * sunColor;
  
  // Specular (Phong)
  let R = reflect(-sunDir, N);
  let spec = pow(max(dot(V, R), 0.0), 32.0);
  let specular = spec * sunColor;
  
  // Teal Material
  let materialColor = vec3f(0.0, 0.6, 0.6);
  
  let finalColor = (ambient + diffuse) * materialColor + specular;
  return vec4f(finalColor, 1.0);
}
`;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const loading = document.getElementById("loading");
  
  // 1. Load OBJ File
  // Using a teapot from a reliable CDN (cdnjs or raw github)
  const url = "https://raw.githubusercontent.com/alecjacobson/common-3d-test-models/master/data/teapot.obj";
  
  let meshData;
  try {
    const response = await fetch(url);
    const text = await response.text();
    meshData = parseOBJ(text);
    if (loading) loading.style.display = "none";
  } catch (e) {
    console.error("Failed to load OBJ", e);
    if (loading) loading.innerText = "Failed to load model.";
    return;
  }

  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 2. Buffers
  const vertexBuffer = device.createBuffer({
    size: meshData.positions.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, meshData.positions);

  const normalBuffer = device.createBuffer({
    size: meshData.normals.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(normalBuffer, 0, meshData.normals);

  const indexBuffer = device.createBuffer({
    size: meshData.indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, 0, meshData.indices);

  // 3. Uniforms
  const uniformBufferSize = 144; // mvp(64) + model(64) + cam(16)
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

  // 4. Pipeline
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "vs_main",
      buffers: [
        { // Pos
          arrayStride: 12,
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
        },
        { // Normal
          arrayStride: 12,
          attributes: [{ shaderLocation: 1, offset: 0, format: "float32x3" }],
        }
      ],
    },
    fragment: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive: { topology: "triangle-list", cullMode: "none" }, // Disable culling for single-sided meshes like teapot
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

  let angle = 0;
  function render() {
    angle += 0.01;
    
    // Rotate and Scale (Teapot is often small/large)
    // Scale 0.1 because standard teapot is usually huge relative to 1.0 unit box
    const modelMatrix = mat4.multiply(mat4.rotationY(angle), mat4.scaling([0.2, 0.2, 0.2]));
    const viewMatrix = mat4.lookAt([2, 2, 2], [0, 0, 0], [0, 1, 0]);
    const mvpMatrix = mat4.multiply(projectionMatrix, mat4.multiply(viewMatrix, modelMatrix));

    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as Float32Array);
    device.queue.writeBuffer(uniformBuffer, 64, modelMatrix as Float32Array);
    device.queue.writeBuffer(uniformBuffer, 128, new Float32Array([2, 2, 2])); // Cam Pos

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
    renderPass.setVertexBuffer(1, normalBuffer);
    renderPass.setIndexBuffer(indexBuffer, "uint16");
    renderPass.drawIndexed(meshData.indices.length);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

init().catch(console.error);
