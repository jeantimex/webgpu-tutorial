import { initWebGPU } from "./utils/webgpu-util";
import { mat4, vec3 } from "wgpu-matrix";

const shaderCode = `
struct Uniforms {
  viewProjectionMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  color : vec4f,
}

struct LightUniforms {
  ambientColor : vec4f,
  dirLightDirection : vec4f,
  dirLightColor : vec4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var<uniform> lightUniforms : LightUniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) normal : vec3f,
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) normal : vec3f
) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.viewProjectionMatrix * uniforms.modelMatrix * vec4f(pos, 1.0);
  
  // Transform normal to world space (using 3x3 part of model matrix for uniform scaling)
  // For non-uniform scaling, we'd need the inverse-transpose of the model matrix.
  // Since we are only doing uniform scaling here, using the model matrix is roughly okay 
  // if we normalize, but correct way is to use a normal matrix. 
  // For this tutorial's simplicity with uniform scaling, we'll use the model matrix.
  out.normal = (uniforms.modelMatrix * vec4f(normal, 0.0)).xyz;
  
  return out;
}

@fragment
fn fs_main(@location(0) normal : vec3f) -> @location(0) vec4f {
  let N = normalize(normal);
  
  // Ambient
  let ambient = lightUniforms.ambientColor.rgb * 0.2; // 0.2 strength
  
  // Directional
  let L = normalize(-lightUniforms.dirLightDirection.xyz);
  let diff = max(dot(N, L), 0.0);
  let diffuse = diff * lightUniforms.dirLightColor.rgb;
  
  // Combine
  let lighting = ambient + diffuse;
  let finalColor = uniforms.color.rgb * lighting;
  
  return vec4f(finalColor, uniforms.color.a);
}
`;

// --- Geometry Helpers ---

function createBoxGeometry() {
  // 24 vertices (4 per face)
  const positions = [
    // Front face (z = 0.5)
    -0.5, -0.5,  0.5,
     0.5, -0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,
    // Back face (z = -0.5)
    -0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5, -0.5, -0.5,
    // Top face (y = 0.5)
    -0.5,  0.5, -0.5,
    -0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,
     0.5,  0.5, -0.5,
    // Bottom face (y = -0.5)
    -0.5, -0.5, -0.5,
     0.5, -0.5, -0.5,
     0.5, -0.5,  0.5,
    -0.5, -0.5,  0.5,
    // Right face (x = 0.5)
     0.5, -0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5,  0.5,  0.5,
     0.5, -0.5,  0.5,
    // Left face (x = -0.5)
    -0.5, -0.5, -0.5,
    -0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5,
  ];

  const normals = [
    // Front
     0,  0,  1,
     0,  0,  1,
     0,  0,  1,
     0,  0,  1,
    // Back
     0,  0, -1,
     0,  0, -1,
     0,  0, -1,
     0,  0, -1,
    // Top
     0,  1,  0,
     0,  1,  0,
     0,  1,  0,
     0,  1,  0,
    // Bottom
     0, -1,  0,
     0, -1,  0,
     0, -1,  0,
     0, -1,  0,
    // Right
     1,  0,  0,
     1,  0,  0,
     1,  0,  0,
     1,  0,  0,
    // Left
    -1,  0,  0,
    -1,  0,  0,
    -1,  0,  0,
    -1,  0,  0,
  ];

  const indices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ];

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
  };
}

function createPlaneGeometry(width = 10, height = 10) {
  const hw = width / 2;
  const hh = height / 2;
  
  const positions = [
    -hw, 0, -hh,
     hw, 0, -hh,
     hw, 0,  hh,
    -hw, 0,  hh,
  ];

  const normals = [
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
  ];

  const indices = [
    0, 2, 1, 0, 3, 2 
  ];

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
  };
}

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  const shaderModule = device.createShaderModule({ code: shaderCode });

  // --- Buffers Setup ---
  
  // 1. Light Uniforms (Static for now)
  // Ambient(16) + Direction(16) + Color(16) = 48 bytes -> aligned to 16
  const lightUniformBuffer = device.createBuffer({
    size: 48,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const lightData = new Float32Array([
    1.0, 1.0, 1.0, 1.0,  // Ambient Color (White)
    -0.5, -0.8, -0.2, 0.0, // Direction (Normalized later in shader, but better here)
    1.0, 1.0, 1.0, 1.0,  // Light Color (White)
  ]);
  device.queue.writeBuffer(lightUniformBuffer, 0, lightData);

  // 2. Object Uniforms (Dynamic)
  // ViewProj(64) + Model(64) + Color(16) = 144 bytes
  const UNIFORM_ALIGNMENT = 256; 
  const objectUniformBufferSize = UNIFORM_ALIGNMENT * 2; 
  
  const objectUniformBuffer = device.createBuffer({
    size: objectUniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // --- Bind Group Layout ---
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { 
          type: "uniform", 
          hasDynamicOffset: true,
          minBindingSize: 144
        },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      }
    ],
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: objectUniformBuffer,
          size: 144, 
        },
      },
      {
        binding: 1,
        resource: { buffer: lightUniformBuffer },
      }
    ],
  });

  // --- Pipeline ---
  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 12, // Position
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
        },
        {
          arrayStride: 12, // Normal
          attributes: [{ shaderLocation: 1, offset: 0, format: "float32x3" }],
        }
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive: { topology: "triangle-list", cullMode: "none" },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  // --- Geometries ---
  const boxGeo = createBoxGeometry();
  const planeGeo = createPlaneGeometry(20, 20); 

  // Plane Buffers
  const planePosBuffer = device.createBuffer({ size: planeGeo.positions.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(planePosBuffer, 0, planeGeo.positions);
  
  const planeNormalBuffer = device.createBuffer({ size: planeGeo.normals.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(planeNormalBuffer, 0, planeGeo.normals);

  const planeIndexBuffer = device.createBuffer({ size: planeGeo.indices.byteLength, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(planeIndexBuffer, 0, planeGeo.indices);

  // Box Buffers
  const boxPosBuffer = device.createBuffer({ size: boxGeo.positions.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(boxPosBuffer, 0, boxGeo.positions);

  const boxNormalBuffer = device.createBuffer({ size: boxGeo.normals.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(boxNormalBuffer, 0, boxGeo.normals);

  const boxIndexBuffer = device.createBuffer({ size: boxGeo.indices.byteLength, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(boxIndexBuffer, 0, boxGeo.indices);

  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // --- Scene State ---
  const aspect = canvas.width / canvas.height;
  const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);
  const viewMatrix = mat4.lookAt([5, 5, 5], [0, 0, 0], [0, 1, 0]);
  const viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix);

  const planeModelMatrix = mat4.identity();
  
  const boxModelMatrix = mat4.identity();
  mat4.translate(boxModelMatrix, [0, 1, 0], boxModelMatrix);
  mat4.scale(boxModelMatrix, [2, 2, 2], boxModelMatrix);

  const planeColor = [0.6, 0.6, 0.6, 1.0]; 
  const boxColor = [1.0, 0.2, 0.2, 1.0];   

  function renderFrame() {
    // Update Uniforms
    device.queue.writeBuffer(objectUniformBuffer, 0, viewProjectionMatrix as Float32Array);
    device.queue.writeBuffer(objectUniformBuffer, 64, planeModelMatrix as Float32Array);
    device.queue.writeBuffer(objectUniformBuffer, 128, new Float32Array(planeColor));
    
    const offset1 = UNIFORM_ALIGNMENT;
    device.queue.writeBuffer(objectUniformBuffer, offset1, viewProjectionMatrix as Float32Array);
    device.queue.writeBuffer(objectUniformBuffer, offset1 + 64, boxModelMatrix as Float32Array);
    device.queue.writeBuffer(objectUniformBuffer, offset1 + 128, new Float32Array(boxColor));

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
    
    // Draw Plane
    renderPass.setBindGroup(0, bindGroup, [0]); 
    renderPass.setVertexBuffer(0, planePosBuffer);
    renderPass.setVertexBuffer(1, planeNormalBuffer);
    renderPass.setIndexBuffer(planeIndexBuffer, "uint16");
    renderPass.drawIndexed(planeGeo.indices.length);
    
    // Draw Box
    renderPass.setBindGroup(0, bindGroup, [UNIFORM_ALIGNMENT]);
    renderPass.setVertexBuffer(0, boxPosBuffer);
    renderPass.setVertexBuffer(1, boxNormalBuffer);
    renderPass.setIndexBuffer(boxIndexBuffer, "uint16");
    renderPass.drawIndexed(boxGeo.indices.length);

    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(renderFrame);
  }

  requestAnimationFrame(renderFrame);
}

init().catch(console.error);