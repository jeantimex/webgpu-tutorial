import { initWebGPU } from "./utils/webgpu-util";
import { mat4, vec3 } from "wgpu-matrix";
import GUI from "lil-gui";

const shaderCode = `
struct Uniforms {
  mvpMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  cameraPos : vec3f, // Needed for specular
  time : f32,        // Used to animate point light
}

struct DirectionalLight {
  dir : vec3f,
  color : vec3f,
}

struct PointLight {
  pos : vec3f,
  color : vec3f,
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
  
  // Base Material Color (Red)
  let materialColor = vec3f(1.0, 0.0, 0.0);
  
  // --- 1. Ambient Light ---
  let ambientStrength = 0.1;
  let ambientColor = vec3f(1.0, 1.0, 1.0);
  let ambient = ambientColor * ambientStrength;

  // --- 2. Directional Light (Sun) ---
  let sunDir = normalize(vec3f(1.0, 1.0, 1.0));
  let sunColor = vec3f(1.0, 1.0, 0.9); // Warm light
  
  // Diffuse
  let diffDir = max(dot(N, sunDir), 0.0);
  let diffuseDir = diffDir * sunColor;
  
  // Specular (Blinn-Phong)
  let H_dir = normalize(sunDir + V);
  let specDir = pow(max(dot(N, H_dir), 0.0), 32.0); // Shininess = 32
  let specularDir = specDir * sunColor;

  // --- 3. Point Light (Orbiting Bulb) ---
  let lightRadius = 2.5;
  let pointPos = vec3f(
    sin(uniforms.time) * lightRadius, 
    1.0, 
    cos(uniforms.time) * lightRadius
  );
  let pointColor = vec3f(0.0, 0.8, 1.0); // Cyan light
  
  let L_point = normalize(pointPos - in.worldPos);
  
  // Diffuse
  let diffPoint = max(dot(N, L_point), 0.0);
  let diffusePoint = diffPoint * pointColor;
  
  // Specular
  let H_point = normalize(L_point + V);
  let specPoint = pow(max(dot(N, H_point), 0.0), 32.0);
  let specularPoint = specPoint * pointColor;

  // --- Combine Everything ---
  // Ambient + (Diffuse * Material) + Specular
  // Note: Specular is additive (white reflection), usually not tinted by material
  
  let finalColor = 
    (ambient + diffuseDir + diffusePoint) * materialColor + 
    (specularDir + specularPoint);

  return vec4f(finalColor, 1.0);
}
`;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // --- 1. Geometry Data ---
  // prettier-ignore
  const vertexData = new Float32Array([
    // Position           // Normal
    -0.5, -0.5,  0.5,     -0.577, -0.577,  0.577,
     0.5, -0.5,  0.5,      0.577, -0.577,  0.577,
     0.5,  0.5,  0.5,      0.577,  0.577,  0.577,
    -0.5,  0.5,  0.5,     -0.577,  0.577,  0.577,
    -0.5, -0.5, -0.5,     -0.577, -0.577, -0.577,
     0.5, -0.5, -0.5,      0.577, -0.577, -0.577,
     0.5,  0.5, -0.5,      0.577,  0.577, -0.577,
    -0.5,  0.5, -0.5,     -0.577,  0.577, -0.577,
  ]);

  // prettier-ignore
  const indexData = new Uint16Array([
    0, 1, 2,  2, 3, 0, // Front
    1, 5, 6,  6, 2, 1, // Right
    5, 4, 7,  7, 6, 5, // Back
    4, 0, 3,  3, 7, 4, // Left
    3, 2, 6,  6, 7, 3, // Top
    4, 5, 1,  1, 0, 4, // Bottom
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
  // MVP(64) + Model(64) + CameraPos(12) + Time(4) = 144 bytes
  const uniformBufferSize = 144;
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
        arrayStride: 24, 
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

  let angle = 0;
  const cameraPos = [3.0, 3.0, 3.0]; // Fixed camera position

  function render(time: number) {
    angle += 0.01;
    
    const modelMatrix = mat4.rotationY(angle);
    const viewMatrix = mat4.lookAt(cameraPos, [0, 0, 0], [0, 1, 0]);
    const mvpMatrix = mat4.multiply(projectionMatrix, mat4.multiply(viewMatrix, modelMatrix));

    // Upload Uniforms
    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as Float32Array);
    device.queue.writeBuffer(uniformBuffer, 64, modelMatrix as Float32Array);
    device.queue.writeBuffer(uniformBuffer, 128, new Float32Array([...cameraPos, time / 1000]));

    const commandEncoder = device.createCommandEncoder();
    const textureView = context!.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.05, g: 0.05, b: 0.05, a: 1.0 }, // Dark background
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
