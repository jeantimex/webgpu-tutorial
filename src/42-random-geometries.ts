import { initWebGPU } from "./utils/webgpu-util";
import { mat4, vec3 } from "wgpu-matrix";
import GUI from "lil-gui";

// --- Geometry Generators (Simplified Solid Only) ---
// We need positions, normals, and indices.

function createCube() {
  const positions = new Float32Array([
    // Front
    -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    // Back
    0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,
    // Top
    -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
    // Bottom
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
    // Right
    0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5,
    // Left
    -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
  ]);
  const normals = new Float32Array([
    // Front
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    // Back
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    // Top
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    // Bottom
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    // Right
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    // Left
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
  ]);
  const indices = new Uint16Array([
    0, 1, 2, 0, 2, 3,       // Front
    4, 5, 6, 4, 6, 7,       // Back
    8, 9, 10, 8, 10, 11,    // Top
    12, 13, 14, 12, 14, 15, // Bottom
    16, 17, 18, 16, 18, 19, // Right
    20, 21, 22, 20, 22, 23, // Left
  ]);
  return { positions, normals, indices };
}

function createSphere(radius = 0.5, widthSegments = 16, heightSegments = 12) {
  const positions = [];
  const normals = [];
  const indices = [];
  
  for (let iy = 0; iy <= heightSegments; iy++) {
    const v = iy / heightSegments;
    const theta = v * Math.PI; // 0 to PI
    for (let ix = 0; ix <= widthSegments; ix++) {
      const u = ix / widthSegments;
      const phi = u * 2 * Math.PI; // 0 to 2PI

      const x = -radius * Math.cos(phi) * Math.sin(theta);
      const y = radius * Math.cos(theta);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      positions.push(x, y, z);
      normals.push(x/radius, y/radius, z/radius);
    }
  }

  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = iy * (widthSegments + 1) + ix + 1;
      const b = iy * (widthSegments + 1) + ix;
      const c = (iy + 1) * (widthSegments + 1) + ix;
      const d = (iy + 1) * (widthSegments + 1) + ix + 1;

      if (iy !== 0) indices.push(b, c, d);
      if (iy !== heightSegments - 1) indices.push(b, d, a);
    }
  }
  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint16Array(indices) };
}

function createCylinder(radiusTop = 0.5, radiusBottom = 0.5, height = 1, radialSegments = 16) {
  const positions = [];
  const normals = [];
  const indices = [];
  
  // Side
  const slope = (radiusBottom - radiusTop) / height;
  for (let y = 0; y <= 1; y++) {
    const v = y;
    const r = v * (radiusBottom - radiusTop) + radiusTop;
    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments;
      const theta = u * 2 * Math.PI;
      const sin = Math.sin(theta);
      const cos = Math.cos(theta);
      
      positions.push(r * sin, -v * height + height/2, r * cos);
      normals.push(sin, slope, cos); // Approximate normal
    }
  }
  // Indices for side
  for (let x = 0; x < radialSegments; x++) {
    const a = x;
    const b = x + 1;
    const c = x + radialSegments + 1;
    const d = x + radialSegments + 2;
    indices.push(a, c, d);
    indices.push(a, d, b);
  }
  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint16Array(indices) };
}

function createTorus(radius = 0.4, tube = 0.15, radialSegments = 8, tubularSegments = 16) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let j = 0; j <= radialSegments; j++) {
    for (let i = 0; i <= tubularSegments; i++) {
      const u = (i / tubularSegments) * Math.PI * 2;
      const v = (j / radialSegments) * Math.PI * 2;

      const x = (radius + tube * Math.cos(v)) * Math.cos(u);
      const y = (radius + tube * Math.cos(v)) * Math.sin(u);
      const z = tube * Math.sin(v);

      positions.push(x, y, z);
      
      // Normal
      const cx = radius * Math.cos(u);
      const cy = radius * Math.sin(u);
      const n = vec3.normalize([x - cx, y - cy, z]);
      normals.push(n[0], n[1], n[2]);
    }
  }

  for (let j = 0; j < radialSegments; j++) {
    for (let i = 0; i < tubularSegments; i++) {
      const a = (tubularSegments + 1) * j + i;
      const b = (tubularSegments + 1) * (j + 1) + i;
      const c = (tubularSegments + 1) * (j + 1) + i + 1;
      const d = (tubularSegments + 1) * j + i + 1;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }
  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint16Array(indices) };
}

// --- Shader ---
const shaderCode = `
struct Uniforms {
  viewProjectionMatrix : mat4x4f,
  lightDir : vec3f,
}
@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct InstanceInput {
  @location(2) modelMatrix0 : vec4f,
  @location(3) modelMatrix1 : vec4f,
  @location(4) modelMatrix2 : vec4f,
  @location(5) modelMatrix3 : vec4f,
  @location(6) color : vec4f,
}

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) normal : vec3f,
  @location(1) color : vec4f,
}

@vertex
fn vs_main(
  @location(0) position : vec3f,
  @location(1) normal : vec3f,
  instance : InstanceInput,
) -> VertexOutput {
  let modelMatrix = mat4x4f(
    instance.modelMatrix0,
    instance.modelMatrix1,
    instance.modelMatrix2,
    instance.modelMatrix3
  );

  var out : VertexOutput;
  out.position = uniforms.viewProjectionMatrix * modelMatrix * vec4f(position, 1.0);
  out.normal = (modelMatrix * vec4f(normal, 0.0)).xyz;
  out.color = instance.color;
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let N = normalize(in.normal);
  let L = normalize(uniforms.lightDir);
  let light = max(dot(N, L), 0.0) + 0.2; 
  return vec4f(in.color.rgb * light, 1.0);
}
`;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Prepare Geometry Data (Buffers on GPU)
  const meshes = [
    createCube(),
    createSphere(),
    createCylinder(0.5, 0.5, 1, 16), // Cylinder
    createCylinder(0, 0.5, 1, 16),   // Cone
    createTorus(),
    createTorus(0.3, 0.1, 6, 12), // Placeholder for variety
  ];

  const gpuMeshes = meshes.map(mesh => {
    const vertexBuffer = device.createBuffer({
      size: mesh.positions.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, mesh.positions);

    const normalBuffer = device.createBuffer({
      size: mesh.normals.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(normalBuffer, 0, mesh.normals);

    const indexBuffer = device.createBuffer({
      size: mesh.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, mesh.indices);

    return { vertexBuffer, normalBuffer, indexBuffer, indexCount: mesh.indices.length };
  });

  // 2. Uniforms
  const uniformBuffer = device.createBuffer({
    size: 80, // vp(64) + lightDir(12) + pad(4)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }],
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  // Fixed Light Direction (Top-Right-Front)
  const lightDirection = vec3.normalize([1.0, 2.0, 1.0]);
  device.queue.writeBuffer(uniformBuffer, 64, lightDirection as Float32Array);

  // 3. Pipeline
  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    }),
    vertex: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "vs_main",
      buffers: [
        // Buffer 0: Position
        {
          arrayStride: 12,
          stepMode: "vertex",
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
        },
        // Buffer 1: Normal
        {
          arrayStride: 12,
          stepMode: "vertex",
          attributes: [{ shaderLocation: 1, offset: 0, format: "float32x3" }],
        },
        // Buffer 2: Instance Matrix (4 * vec4) + Color (vec4) = 5 attributes
        {
          arrayStride: 80,
          stepMode: "instance",
          attributes: [
            { shaderLocation: 2, offset: 0, format: "float32x4" },
            { shaderLocation: 3, offset: 16, format: "float32x4" },
            { shaderLocation: 4, offset: 32, format: "float32x4" },
            { shaderLocation: 5, offset: 48, format: "float32x4" },
            { shaderLocation: 6, offset: 64, format: "float32x4" },
          ],
        },
      ],
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

  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // --- Instance Management ---
  const MAX_INSTANCES = 1000000;
  const instanceBuffer = device.createBuffer({
    size: MAX_INSTANCES * 80,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  const params = {
    count: 1000,
  };

  function generateInstances() {
    const data = new Float32Array(MAX_INSTANCES * 20);
    const range = 100;
    const chunk = Math.floor(MAX_INSTANCES / 6);
    let offset = 0;
    const tempMat = mat4.create();
    
    for (let m = 0; m < 6; m++) {
      for (let i = 0; i < chunk; i++) {
        const x = (Math.random() - 0.5) * range * 2;
        const y = (Math.random() - 0.5) * range * 2;
        const z = (Math.random() - 0.5) * range * 2;
        
        // Scale 5x
        const s = (Math.random() * 1.5 + 1.0) * 5.0;
        
        const rx = Math.random() * Math.PI;
        const ry = Math.random() * Math.PI;

        mat4.identity(tempMat);
        mat4.translate(tempMat, [x, y, z], tempMat);
        mat4.rotateX(tempMat, rx, tempMat);
        mat4.rotateY(tempMat, ry, tempMat);
        mat4.scale(tempMat, [s, s, s], tempMat);

        for (let k = 0; k < 16; k++) data[offset + k] = tempMat[k];
        
        data[offset + 16] = Math.random();
        data[offset + 17] = Math.random();
        data[offset + 18] = Math.random();
        data[offset + 19] = 1.0;

        offset += 20;
      }
    }
    
    device.queue.writeBuffer(instanceBuffer, 0, data);
  }

  generateInstances();

  const gui = new GUI({ container: document.getElementById('gui-container') as HTMLElement });
  gui.add(params, 'count', [1, 10, 100, 1000, 10000, 100000, 1000000]).name('Object Count');

  function render() {
    const totalCount = Number(params.count);
    const chunk = Math.floor(MAX_INSTANCES / 6);
    const countPerMesh = Math.ceil(totalCount / 6);

    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 500.0);
    
    const now = Date.now() / 5000;
    const radius = 250;
    const camX = Math.sin(now) * radius;
    const camY = Math.sin(now * 0.5) * radius * 0.5;
    const camZ = Math.cos(now) * radius;

    const viewMatrix = mat4.lookAt([camX, camY, camZ], [0, 0, 0], [0, 1, 0]);
    const vpMatrix = mat4.multiply(projectionMatrix, viewMatrix);
    device.queue.writeBuffer(uniformBuffer, 0, vpMatrix as Float32Array);

    const commandEncoder = device.createCommandEncoder();
    const textureView = context!.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.1, g: 0.1, b: 0.15, a: 1.0 },
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

    let remaining = totalCount;

    for (let m = 0; m < 6; m++) {
      const mesh = gpuMeshes[m];
      
      // Calculate how many instances of THIS mesh to draw
      // Distribute remaining count evenly among remaining meshes
      let count = Math.ceil(remaining / (6 - m));
      if (count > chunk) count = chunk;
      
      if (count > 0) {
        renderPass.setVertexBuffer(0, mesh.vertexBuffer);
        renderPass.setVertexBuffer(1, mesh.normalBuffer);
        
        // Bind the correct section of the instance buffer
        const byteOffset = m * chunk * 80;
        renderPass.setVertexBuffer(2, instanceBuffer, byteOffset, count * 80);
        
        renderPass.setIndexBuffer(mesh.indexBuffer, "uint16");
        renderPass.drawIndexed(mesh.indexCount, count);
        
        remaining -= count;
      }
    }

    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

init().catch(console.error);