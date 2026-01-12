import { initWebGPU } from "./utils/webgpu-util";
import { mat4, vec3, quat } from "wgpu-matrix";
import GUI from "lil-gui";

// --- Shader ---
const shaderCode = `
struct Uniforms {
  viewProjectionMatrix : mat4x4f,
  lineWidth : f32,
  showWireframe : f32,
  fillOpacity : f32,
}
@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct InstanceInput {
  @location(2) translation : vec3f,
  @location(3) rotation : vec4f, // quaternion
  @location(4) scale : vec3f,
  @location(5) color : vec4f,
}

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) barycentric : vec3f,
  @location(1) color : vec4f,
}

// Helper to create matrix from TRS
fn composeMatrix(translate: vec3f, rotate: vec4f, scale: vec3f) -> mat4x4f {
  // Quaternion to Rotation Matrix
  let x = rotate.x; let y = rotate.y; let z = rotate.z; let w = rotate.w;
  let x2 = x + x; let y2 = y + y; let z2 = z + z;
  let xx = x * x2; let xy = x * y2; let xz = x * z2;
  let yy = y * y2; let yz = y * z2; let zz = z * z2;
  let wx = w * x2; let wy = w * y2; let wz = w * z2;

  var mat : mat4x4f;
  mat[0] = vec4f((1.0 - (yy + zz)) * scale.x, (xy + wz) * scale.x, (xz - wy) * scale.x, 0.0);
  mat[1] = vec4f((xy - wz) * scale.y, (1.0 - (xx + zz)) * scale.y, (yz + wx) * scale.y, 0.0);
  mat[2] = vec4f((xz + wy) * scale.z, (yz - wx) * scale.z, (1.0 - (xx + yy)) * scale.z, 0.0);
  mat[3] = vec4f(translate.x, translate.y, translate.z, 1.0);
  return mat;
}

@vertex
fn vs_main(
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) pos : vec3f,
  instance : InstanceInput,
) -> VertexOutput {
  let modelMatrix = composeMatrix(instance.translation, instance.rotation, instance.scale);

  var out : VertexOutput;
  out.position = uniforms.viewProjectionMatrix * modelMatrix * vec4f(pos, 1.0);
  
  // Calculate barycentric coordinates based on vertex index
  // 0 -> (1, 0, 0), 1 -> (0, 1, 0), 2 -> (0, 0, 1)
  let idx = vertexIndex % 3;
  if (idx == 0) {
    out.barycentric = vec3f(1.0, 0.0, 0.0);
  } else if (idx == 1) {
    out.barycentric = vec3f(0.0, 1.0, 0.0);
  } else {
    out.barycentric = vec3f(0.0, 0.0, 1.0);
  }
  
  out.color = instance.color;
  return out;
}

fn edgeFactor(bary : vec3f, width : f32) -> f32 {
  let d = fwidth(bary);
  let a3 = smoothstep(vec3f(0.0), d * width, bary);
  return min(min(a3.x, a3.y), a3.z);
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let edge = 1.0 - edgeFactor(in.barycentric, uniforms.lineWidth);
  let wireColor = vec3f(1.0, 1.0, 1.0);
  
  let fillColor = in.color.rgb;

  let wireAlpha = edge * uniforms.showWireframe;
  let fillAlpha = uniforms.fillOpacity * (1.0 - wireAlpha);
  let totalAlpha = wireAlpha + fillAlpha;

  if (totalAlpha < 0.01) {
    discard;
  }

  let color = (wireColor * wireAlpha + fillColor * fillAlpha) / totalAlpha;
  return vec4f(color, totalAlpha);
}
`;

// --- Geometry Generators (Procedural Barycentric - Position Only) ---

function createCube() {
  const vertices: number[] = [];
  const tempPositions: number[][] = [];

  function buildPlane(u: number, v: number, w: number, uDir: number, vDir: number, wDir: number) {
    const width = 1, height = 1, depth = 1;
    const gridX = 1, gridY = 1;
    const segmentWidth = width / gridX;
    const segmentHeight = height / gridY;
    const widthHalf = width / 2;
    const heightHalf = height / 2;
    const depthHalf = depth / 2;
    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;

    let vertexCounter = 0;
    const localPositions: number[][] = [];

    for (let iy = 0; iy < gridY1; iy++) {
      const y = iy * segmentHeight - heightHalf;
      for (let ix = 0; ix < gridX1; ix++) {
        const x = ix * segmentWidth - widthHalf;
        const pos = [0, 0, 0];
        pos[u] = x * uDir;
        pos[v] = y * vDir;
        pos[w] = depthHalf * wDir;
        localPositions.push(pos);
        vertexCounter++;
      }
    }

    for (let iy = 0; iy < gridY; iy++) {
      for (let ix = 0; ix < gridX; ix++) {
        const a = ix + gridX1 * iy;
        const b = ix + gridX1 * (iy + 1);
        const c = (ix + 1) + gridX1 * (iy + 1);
        const d = (ix + 1) + gridX1 * iy;

        const posA = localPositions[a];
        const posB = localPositions[b];
        const posD = localPositions[d];
        vertices.push(posA[0], posA[1], posA[2]);
        vertices.push(posB[0], posB[1], posB[2]);
        vertices.push(posD[0], posD[1], posD[2]);

        const posC = localPositions[c];
        vertices.push(posB[0], posB[1], posB[2]);
        vertices.push(posC[0], posC[1], posC[2]);
        vertices.push(posD[0], posD[1], posD[2]);
      }
    }
  }

  buildPlane(2, 1, 0, -1, -1, 1); // px
  buildPlane(2, 1, 0, 1, -1, -1); // nx
  buildPlane(0, 2, 1, 1, 1, 1);   // py
  buildPlane(0, 2, 1, 1, -1, -1); // ny
  buildPlane(0, 1, 2, 1, -1, 1);  // pz
  buildPlane(0, 1, 2, -1, -1, -1);// nz

  return { vertices: new Float32Array(vertices), vertexCount: vertices.length / 3 };
}

function createSphere(radius = 0.5, widthSegments = 16, heightSegments = 12) {
  const vertices: number[] = [];
  const tempPositions: number[][] = [];
  const grid: number[][] = [];

  for (let iy = 0; iy <= heightSegments; iy++) {
    const verticesRow: number[] = [];
    const v = iy / heightSegments;
    for (let ix = 0; ix <= widthSegments; ix++) {
      const u = ix / widthSegments;
      const px = -radius * Math.cos(u * 2 * Math.PI) * Math.sin(v * Math.PI);
      const py = radius * Math.cos(v * Math.PI);
      const pz = radius * Math.sin(u * 2 * Math.PI) * Math.sin(v * Math.PI);
      tempPositions.push([px, py, pz]);
      verticesRow.push(tempPositions.length - 1);
    }
    grid.push(verticesRow);
  }

  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = grid[iy][ix + 1];
      const b = grid[iy][ix];
      const c = grid[iy + 1][ix];
      const d = grid[iy + 1][ix + 1];

      if (iy !== 0) {
         const posB = tempPositions[b], posD = tempPositions[d], posA = tempPositions[a];
         vertices.push(...posB, ...posD, ...posA);
      }
      if (iy !== heightSegments - 1) {
         const posB = tempPositions[b], posC = tempPositions[c], posD = tempPositions[d];
         vertices.push(...posB, ...posC, ...posD);
      }
    }
  }
  return { vertices: new Float32Array(vertices), vertexCount: vertices.length / 3 };
}

function createCylinder(radiusTop = 0.5, radiusBottom = 0.5, height = 1, radialSegments = 16) {
    const vertices: number[] = [];
    const heightSegments = 1;
    const halfHeight = height / 2;

    const tempPositions: number[][] = [];
    const grid: number[][] = [];

    // Generate torso
    for (let y = 0; y <= heightSegments; y++) {
        const indexRow: number[] = [];
        const v = y / heightSegments;
        const radius = v * (radiusBottom - radiusTop) + radiusTop;

        for (let x = 0; x <= radialSegments; x++) {
            const u = x / radialSegments;
            const theta = u * Math.PI * 2;
            const px = radius * Math.sin(theta);
            const py = -v * height + halfHeight;
            const pz = radius * Math.cos(theta);
            tempPositions.push([px, py, pz]);
            indexRow.push(tempPositions.length - 1);
        }
        grid.push(indexRow);
    }

    for (let x = 0; x < radialSegments; x++) {
        const a = grid[0][x];
        const b = grid[0][x+1];
        const c = grid[1][x+1];
        const d = grid[1][x];

        // Torso
        const pA = tempPositions[a], pB = tempPositions[b], pC = tempPositions[c], pD = tempPositions[d];
        vertices.push(...pA, ...pB, ...pD);
        vertices.push(...pB, ...pC, ...pD);
    }
    
    // Caps
    if (radiusTop > 0) {
        const centerIndex = tempPositions.length;
        tempPositions.push([0, halfHeight, 0]);
        for (let x = 0; x < radialSegments; x++) {
           const u = grid[0][x];
           const v = grid[0][x+1];
           const pC = tempPositions[centerIndex];
           const pU = tempPositions[u];
           const pV = tempPositions[v];
           vertices.push(...pC, ...pU, ...pV);
        }
    }
    
    if (radiusBottom > 0) {
        const centerIndex = tempPositions.length;
        tempPositions.push([0, -halfHeight, 0]);
        for (let x = 0; x < radialSegments; x++) {
           const u = grid[1][x];
           const v = grid[1][x+1];
           const pC = tempPositions[centerIndex];
           const pU = tempPositions[u];
           const pV = tempPositions[v];
           vertices.push(...pC, ...pV, ...pU); // Reversed winding
        }
    }

    return { vertices: new Float32Array(vertices), vertexCount: vertices.length / 3 };
}

function createTorus(radius = 0.4, tube = 0.15, radialSegments = 8, tubularSegments = 16) {
  const vertices: number[] = [];
  const tempPositions: number[][] = [];
  
  for (let j = 0; j <= radialSegments; j++) {
    for (let i = 0; i <= tubularSegments; i++) {
      const u = (i / tubularSegments) * Math.PI * 2;
      const v = (j / radialSegments) * Math.PI * 2;

      const x = (radius + tube * Math.cos(v)) * Math.cos(u);
      const y = (radius + tube * Math.cos(v)) * Math.sin(u);
      const z = tube * Math.sin(v);
      tempPositions.push([x, y, z]);
    }
  }

  for (let j = 0; j < radialSegments; j++) {
    for (let i = 0; i < tubularSegments; i++) {
      const a = (tubularSegments + 1) * j + i;
      const b = (tubularSegments + 1) * (j + 1) + i;
      const c = (tubularSegments + 1) * (j + 1) + i + 1;
      const d = (tubularSegments + 1) * j + i + 1;

      const pA = tempPositions[a], pB = tempPositions[b], pC = tempPositions[c], pD = tempPositions[d];
      vertices.push(...pA, ...pB, ...pD);
      vertices.push(...pB, ...pC, ...pD);
    }
  }
  return { vertices: new Float32Array(vertices), vertexCount: vertices.length / 3 };
}

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // 1. Prepare Geometry Data (Buffers on GPU)
  let gpuMeshes: { vertexBuffer: GPUBuffer, vertexCount: number }[] = [];

  function updateMeshes() {
    let sphereW = 16, sphereH = 12;
    let cylSegs = 16;
    let torusR = 8, torusT = 16;
    let torus2R = 6, torus2T = 12;

    if (params.resolution === 'Medium') {
      sphereW = 12; sphereH = 8;
      cylSegs = 12;
      torusR = 6; torusT = 12;
      torus2R = 5; torus2T = 10;
    } else if (params.resolution === 'Low') {
      sphereW = 8; sphereH = 6;
      cylSegs = 8;
      torusR = 4; torusT = 8;
      torus2R = 4; torus2T = 6;
    }

    const meshes = [
      createCube(),
      createSphere(0.5, sphereW, sphereH),
      createCylinder(0.5, 0.5, 1, cylSegs), // Cylinder
      createCylinder(0, 0.5, 1, cylSegs),   // Cone
      createTorus(0.4, 0.15, torusR, torusT),
      createTorus(0.3, 0.1, torus2R, torus2T), // Placeholder for variety
    ];

    // Cleanup old buffers
    gpuMeshes.forEach(m => m.vertexBuffer.destroy());

    gpuMeshes = meshes.map(mesh => {
      const vertexBuffer = device.createBuffer({
        size: mesh.vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer(vertexBuffer, 0, mesh.vertices);

      return { vertexBuffer, vertexCount: mesh.vertexCount };
    });
  }

  // 2. Uniforms
  const uniformBuffer = device.createBuffer({
    size: 80, // vp(64) + lineWidth(4) + showWireframe(4) = 72 -> aligned to 80
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }],
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  // 3. Pipelines (Double-sided and Front-sided)
  const pipelineDescriptor: GPURenderPipelineDescriptor = {
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    }),
    vertex: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "vs_main",
      buffers: [
        // Buffer 0: Position Only
        {
          arrayStride: 12, // 3 floats
          stepMode: "vertex",
          attributes: [
             { shaderLocation: 0, offset: 0, format: "float32x3" }, // position
          ],
        },
        // Buffer 1: Instance TRS (vec3 + vec4 + vec3) + Color (vec4) = 3 + 4 + 3 + 4 = 14 floats = 56 bytes
        {
          arrayStride: 56,
          stepMode: "instance",
          attributes: [
            { shaderLocation: 2, offset: 0, format: "float32x3" },  // translation
            { shaderLocation: 3, offset: 12, format: "float32x4" }, // rotation
            { shaderLocation: 4, offset: 28, format: "float32x3" }, // scale
            { shaderLocation: 5, offset: 40, format: "float32x4" }, // color
          ],
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "fs_main",
      targets: [{
        format: canvasFormat,
        blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
        },
      }],
    },
    primitive: { topology: "triangle-list", cullMode: "none" },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  };

  const pipelineDoubleSide = device.createRenderPipeline(pipelineDescriptor);
  
  pipelineDescriptor.primitive!.cullMode = "back";
  const pipelineFrontSide = device.createRenderPipeline(pipelineDescriptor);

  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // --- Instance Management ---
  const MAX_INSTANCES = 1000000;
  // New size: 56 bytes per instance (14 floats)
  const instanceBuffer = device.createBuffer({
    size: MAX_INSTANCES * 56, 
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  const params = {
    count: 1000,
    lineWidth: 1.5,
    showWireframe: true,
    fillOpacity: 0.5,
    cullMode: 'none',
    resolution: 'High',
  };

  updateMeshes();

  function generateInstances() {
    const floatCount = 14; // 3(pos) + 4(rot) + 3(scale) + 4(color)
    const data = new Float32Array(MAX_INSTANCES * floatCount);
    const range = 100;
    const chunk = Math.floor(MAX_INSTANCES / 6);
    let offset = 0;
    
    for (let m = 0; m < 6; m++) {
      for (let i = 0; i < chunk; i++) {
        // Position
        const x = (Math.random() - 0.5) * range * 2;
        const y = (Math.random() - 0.5) * range * 2;
        const z = (Math.random() - 0.5) * range * 2;
        
        // Scale 5x
        const s = (Math.random() * 1.5 + 1.0) * 5.0;
        
        // Rotation (Quaternion)
        const axis = vec3.normalize([Math.random()-0.5, Math.random()-0.5, Math.random()-0.5]);
        const angle = Math.random() * Math.PI * 2;
        const q = quat.fromAxisAngle(axis, angle);

        // Write to buffer
        // Translation (3)
        data[offset + 0] = x;
        data[offset + 1] = y;
        data[offset + 2] = z;
        
        // Rotation (4)
        data[offset + 3] = q[0];
        data[offset + 4] = q[1];
        data[offset + 5] = q[2];
        data[offset + 6] = q[3];

        // Scale (3)
        data[offset + 7] = s;
        data[offset + 8] = s;
        data[offset + 9] = s;

        // Color (4)
        data[offset + 10] = Math.random();
        data[offset + 11] = Math.random();
        data[offset + 12] = Math.random();
        data[offset + 13] = 1.0;

        offset += floatCount;
      }
    }
    
    device.queue.writeBuffer(instanceBuffer, 0, data);
  }

  generateInstances();

  const gui = new GUI({ container: document.getElementById('gui-container') as HTMLElement });
  gui.add(params, 'count', [1, 10, 100, 1000, 10000, 100000, 1000000]).name('Object Count');
  gui.add(params, "lineWidth", 0.5, 5.0).name("Line Width");
  gui.add(params, "showWireframe").name("Show Wireframe");
  gui.add(params, "fillOpacity", 0.0, 1.0).name("Fill Opacity");
  gui.add(params, 'cullMode', ['none', 'back']).name('Cull Mode');
  gui.add(params, 'resolution', ['High', 'Medium', 'Low']).name('Resolution').onChange(updateMeshes);

  function render() {
    const totalCount = Number(params.count);
    const chunk = Math.floor(MAX_INSTANCES / 6);

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
    
    // Write uniforms: vpMatrix (64) + lineWidth (4) + showWireframe (4) + fillOpacity (4)
    device.queue.writeBuffer(uniformBuffer, 64, new Float32Array([
      params.lineWidth,
      params.showWireframe ? 1.0 : 0.0,
      params.fillOpacity
    ]));

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

    renderPass.setPipeline(params.cullMode === 'back' ? pipelineFrontSide : pipelineDoubleSide);
    renderPass.setBindGroup(0, bindGroup);

    let remaining = totalCount;

    for (let m = 0; m < 6; m++) {
      const mesh = gpuMeshes[m];
      
      let count = Math.ceil(remaining / (6 - m));
      if (count > chunk) count = chunk;
      
      if (count > 0) {
        renderPass.setVertexBuffer(0, mesh.vertexBuffer);
        
        // Bind the correct section of the instance buffer
        const byteOffset = m * chunk * 56;
        renderPass.setVertexBuffer(1, instanceBuffer, byteOffset, count * 56);
        
        renderPass.draw(mesh.vertexCount, count);
        
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