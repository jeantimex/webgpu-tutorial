import { initWebGPU } from "./utils/webgpu-util";
import { mat4, vec3, quat } from "wgpu-matrix";
import GUI from "lil-gui";

// --- Shader (Vertex + Fragment + Compute) ---
const shaderCode = `
struct Uniforms {
  viewProjectionMatrix : mat4x4f,
  lineWidth : f32,
  showWireframe : f32,
  fillOpacity : f32,
  totalInstances : u32,
  maxInstances : u32,
}
@group(0) @binding(0) var<uniform> uniforms : Uniforms;

// --- Compute Shader Structures ---

struct InstanceData {
  translation : vec3f,
  rotation : vec4f,
  scale : vec3f,
  color : vec4f,
}

struct DrawIndirectArgs {
  vertexCount : u32,
  instanceCount : atomic<u32>, // Atomic for Compute Shader
  firstVertex : u32,
  firstInstance : u32,
}

// Bindings for Compute
@group(1) @binding(0) var<storage, read> srcInstances : array<InstanceData>;
@group(1) @binding(1) var<storage, read_write> dstInstances : array<InstanceData>;
@group(1) @binding(2) var<storage, read_write> indirectDraws : array<DrawIndirectArgs>;

// Frustum Culling Helper
fn isVisible(center: vec3f, radius: f32, vp: mat4x4f) -> bool {
  // Extract frustum planes from VP matrix
  // We only check if the sphere is completely OUTSIDE any plane
  // Plane normals point INWARDS.
  
  // Left
  if (dot(vec4f(vp[0][3] + vp[0][0], vp[1][3] + vp[1][0], vp[2][3] + vp[2][0], vp[3][3] + vp[3][0]), vec4f(center, 1.0)) < -radius) { return false; }
  // Right
  if (dot(vec4f(vp[0][3] - vp[0][0], vp[1][3] - vp[1][0], vp[2][3] - vp[2][0], vp[3][3] - vp[3][0]), vec4f(center, 1.0)) < -radius) { return false; }
  // Bottom
  if (dot(vec4f(vp[0][3] + vp[0][1], vp[1][3] + vp[1][1], vp[2][3] + vp[2][1], vp[3][3] + vp[3][1]), vec4f(center, 1.0)) < -radius) { return false; }
  // Top
  if (dot(vec4f(vp[0][3] - vp[0][1], vp[1][3] - vp[1][1], vp[2][3] - vp[2][1], vp[3][3] - vp[3][1]), vec4f(center, 1.0)) < -radius) { return false; }
  // Near
  if (dot(vec4f(vp[0][3] + vp[0][2], vp[1][3] + vp[1][2], vp[2][3] + vp[2][2], vp[3][3] + vp[3][2]), vec4f(center, 1.0)) < -radius) { return false; }
  // Far
  if (dot(vec4f(vp[0][3] - vp[0][2], vp[1][3] - vp[1][2], vp[2][3] - vp[2][2], vp[3][3] - vp[3][2]), vec4f(center, 1.0)) < -radius) { return false; }

  return true;
}

@compute @workgroup_size(64)
fn cull_main(@builtin(global_invocation_id) global_id : vec3u) {
  let index = global_id.x;
  // Check bounds using the actual instance count from uniforms
  if (index >= uniforms.totalInstances) { return; }

  let instance = srcInstances[index];

  // Calculate bounding sphere
  // Max scale component * base radius (approx 0.5 for our shapes)
  let maxScale = max(instance.scale.x, max(instance.scale.y, instance.scale.z));
  let radius = maxScale * 0.8; // Conservative radius

  if (isVisible(instance.translation, radius, uniforms.viewProjectionMatrix)) {
    // Determine which mesh batch this belongs to
    // We assume 6 batches of equal size (Chunk Size)
    // To keep it simple, we pass the "batch ID" implicitly via index ranges
    // But we need to write to the correct "Draw" buffer section.

    // Assign mesh type using round-robin (index % 6) so all mesh types
    // are represented even with small instance counts.
    let meshIndex = index % 6;
    let chunkSize = uniforms.maxInstances / 6;
    
    // Atomic increment to get the write slot
    // atomicAdd returns the ORIGINAL value
    let slot = atomicAdd(&indirectDraws[meshIndex].instanceCount, 1u);
    
    // Calculate the destination index. 
    // We pack visible instances for Mesh X starting at MeshIndex * chunkSize
    let dstIndex = meshIndex * chunkSize + slot;
    
    dstInstances[dstIndex] = instance;
  }
}

// --- Render Shader ---

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) barycentric : vec3f,
  @location(1) color : vec4f,
}

// Helper to create matrix from TRS
fn composeMatrix(translate: vec3f, rotate: vec4f, scale: vec3f) -> mat4x4f {
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
  // Instance attributes (Now reading from the buffer populated by CS)
  @location(2) translation : vec3f,
  @location(3) rotation : vec4f,
  @location(4) scale : vec3f,
  @location(5) color : vec4f,
) -> VertexOutput {
  let modelMatrix = composeMatrix(translation, rotation, scale);

  var out : VertexOutput;
  out.position = uniforms.viewProjectionMatrix * modelMatrix * vec4f(pos, 1.0);
  
  // Procedural Barycentrics
  let idx = vertexIndex % 3;
  if (idx == 0) { out.barycentric = vec3f(1.0, 0.0, 0.0); } 
  else if (idx == 1) { out.barycentric = vec3f(0.0, 1.0, 0.0); } 
  else { out.barycentric = vec3f(0.0, 0.0, 1.0); }
  
  out.color = color;
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

  if (totalAlpha < 0.01) { discard; }

  let color = (wireColor * wireAlpha + fillColor * fillAlpha) / totalAlpha;
  return vec4f(color, totalAlpha);
}
`;

// --- Geometry Generators (Procedural Barycentric - Position Only) ---
// (Same generators as before, omitting full code for brevity in thought, but included in file write)
function createCube() {
  const vertices: number[] = [];
  const tempPositions: number[][] = [];
  function buildPlane(u: number, v: number, w: number, uDir: number, vDir: number, wDir: number) {
    const width = 1, height = 1, depth = 1;
    const gridX = 1, gridY = 1;
    const segmentWidth = width / gridX; const segmentHeight = height / gridY;
    const widthHalf = width / 2; const heightHalf = height / 2; const depthHalf = depth / 2;
    const gridX1 = gridX + 1; const gridY1 = gridY + 1;
    const localPositions: number[][] = [];
    for (let iy = 0; iy < gridY1; iy++) {
      const y = iy * segmentHeight - heightHalf;
      for (let ix = 0; ix < gridX1; ix++) {
        const x = ix * segmentWidth - widthHalf;
        const pos = [0, 0, 0];
        pos[u] = x * uDir; pos[v] = y * vDir; pos[w] = depthHalf * wDir;
        localPositions.push(pos);
      }
    }
    for (let iy = 0; iy < gridY; iy++) {
      for (let ix = 0; ix < gridX; ix++) {
        const a = ix + gridX1 * iy; const b = ix + gridX1 * (iy + 1);
        const c = (ix + 1) + gridX1 * (iy + 1); const d = (ix + 1) + gridX1 * iy;
        const posA = localPositions[a]; const posB = localPositions[b]; const posD = localPositions[d];
        vertices.push(posA[0], posA[1], posA[2]); vertices.push(posB[0], posB[1], posB[2]); vertices.push(posD[0], posD[1], posD[2]);
        const posC = localPositions[c];
        vertices.push(posB[0], posB[1], posB[2]); vertices.push(posC[0], posC[1], posC[2]); vertices.push(posD[0], posD[1], posD[2]);
      }
    }
  }
  buildPlane(2, 1, 0, -1, -1, 1); buildPlane(2, 1, 0, 1, -1, -1);
  buildPlane(0, 2, 1, 1, 1, 1); buildPlane(0, 2, 1, 1, -1, -1);
  buildPlane(0, 1, 2, 1, -1, 1); buildPlane(0, 1, 2, -1, -1, -1);
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
      const a = grid[iy][ix + 1]; const b = grid[iy][ix];
      const c = grid[iy + 1][ix]; const d = grid[iy + 1][ix + 1];
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
    const heightSegments = 1; const halfHeight = height / 2;
    const tempPositions: number[][] = []; const grid: number[][] = [];
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
        const a = grid[0][x]; const b = grid[0][x+1];
        const c = grid[1][x+1]; const d = grid[1][x];
        const pA = tempPositions[a], pB = tempPositions[b], pC = tempPositions[c], pD = tempPositions[d];
        vertices.push(...pA, ...pB, ...pD);
        vertices.push(...pB, ...pC, ...pD);
    }
    if (radiusTop > 0) {
        const centerIndex = tempPositions.length; tempPositions.push([0, halfHeight, 0]);
        for (let x = 0; x < radialSegments; x++) {
           const u = grid[0][x]; const v = grid[0][x+1];
           const pC = tempPositions[centerIndex]; const pU = tempPositions[u]; const pV = tempPositions[v];
           vertices.push(...pC, ...pU, ...pV);
        }
    }
    if (radiusBottom > 0) {
        const centerIndex = tempPositions.length; tempPositions.push([0, -halfHeight, 0]);
        for (let x = 0; x < radialSegments; x++) {
           const u = grid[1][x]; const v = grid[1][x+1];
           const pC = tempPositions[centerIndex]; const pU = tempPositions[u]; const pV = tempPositions[v];
           vertices.push(...pC, ...pV, ...pU);
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
      const a = (tubularSegments + 1) * j + i; const b = (tubularSegments + 1) * (j + 1) + i;
      const c = (tubularSegments + 1) * (j + 1) + i + 1; const d = (tubularSegments + 1) * j + i + 1;
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
    let sphereW = 16, sphereH = 12; let cylSegs = 16;
    let torusR = 8, torusT = 16; let torus2R = 6, torus2T = 12;

    if (params.resolution === 'Medium') {
      sphereW = 12; sphereH = 8; cylSegs = 12;
      torusR = 6; torusT = 12; torus2R = 5; torus2T = 10;
    } else if (params.resolution === 'Low') {
      sphereW = 8; sphereH = 6; cylSegs = 8;
      torusR = 4; torusT = 8; torus2R = 4; torus2T = 6;
    }

    const meshes = [
      createCube(),
      createSphere(0.5, sphereW, sphereH),
      createCylinder(0.5, 0.5, 1, cylSegs),
      createCylinder(0, 0.5, 1, cylSegs),
      createTorus(0.4, 0.15, torusR, torusT),
      createTorus(0.3, 0.1, torus2R, torus2T),
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
    
    // Update vertex counts in Indirect Buffer if it exists
    if (indirectDrawBuffer) {
      const indirectData = new Uint32Array(6 * 4); // 6 meshes * 4 u32
      // We must read the existing counts? No, we reset.
      // We just need to set vertexCount (offset 0) for each struct
      for (let i = 0; i < 6; i++) {
        // Struct: vertexCount, instanceCount, firstVertex, firstInstance
        // We only really care about vertexCount here. 
        // InstanceCount is reset by CPU each frame anyway.
        // firstVertex is 0.
        // firstInstance is calculated by the compute shader packing, but for drawing
        // we specify the offset in the buffer so firstInstance should be 0 relative to that offset
        // OR we map the correct range.
        
        // Actually, drawIndirect args are:
        // vertexCount, instanceCount, firstVertex, firstInstance
        
        // The Compute Shader packs instances into dstInstances.
        // Mesh 0's instances start at index 0.
        // Mesh 1's instances start at ChunkSize.
        // But `drawIndirect`'s `firstInstance` acts as an offset into the attributes IF they are stepMode=instance?
        // Yes. So firstInstance should be MeshIndex * ChunkSize.
        
        const chunkSize = Math.floor(MAX_INSTANCES / 6); // Must match shader's integer division
        indirectData[i * 4 + 0] = gpuMeshes[i].vertexCount;
        indirectData[i * 4 + 1] = 0; // Reset count
        indirectData[i * 4 + 2] = 0; // firstVertex
        indirectData[i * 4 + 3] = i * chunkSize; // firstInstance offset in dst buffer
      }
      device.queue.writeBuffer(indirectDrawBuffer, 0, indirectData);
    }
  }

  // 2. Uniforms
  const uniformBuffer = device.createBuffer({
    size: 96, // mat4x4f(64) + f32*3(12) + u32*2(8) + padding = 96 (16-byte aligned)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // 3. Buffers for Instances & Indirect
  const MAX_INSTANCES = 1000000;
  const INSTANCE_SIZE = 64; // 16 floats * 4 bytes (Aligned to WGSL struct)
  
  // Source Instances (CPU writes here, GPU reads)
  const srcInstanceBuffer = device.createBuffer({
    size: MAX_INSTANCES * INSTANCE_SIZE,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  // Destination Instances (GPU Compute writes here, GPU Vertex reads)
  const dstInstanceBuffer = device.createBuffer({
    size: MAX_INSTANCES * INSTANCE_SIZE,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX,
  });

  // Indirect Draw Buffer (GPU Compute writes atomic counts, GPU Render reads)
  // Array of 6 DrawIndirectArgs structs (4 * u32 each) = 24 * 4 bytes = 96 bytes
  const indirectDrawBuffer = device.createBuffer({
    size: 6 * 4 * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST,
  });

  // --- Pipelines ---

  // Bind Group Layouts
  const uniformBindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
    ],
  });

  const computeBindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } }, // srcInstances
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } }, // dstInstances
      { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } }, // indirectDraws
    ],
  });

  // Bind Groups
  const uniformBindGroup = device.createBindGroup({
    layout: uniformBindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
    ],
  });

  const computeBindGroup = device.createBindGroup({
    layout: computeBindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: srcInstanceBuffer } },
      { binding: 1, resource: { buffer: dstInstanceBuffer } },
      { binding: 2, resource: { buffer: indirectDrawBuffer } },
    ],
  });

  // Compute Pipeline
  const computePipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [uniformBindGroupLayout, computeBindGroupLayout] }),
    compute: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "cull_main",
    },
  });

  // Render Pipelines
  const renderPipelineDescriptor: GPURenderPipelineDescriptor = {
    layout: device.createPipelineLayout({ bindGroupLayouts: [uniformBindGroupLayout] }),
    vertex: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "vs_main",
      buffers: [
        { // Position
          arrayStride: 12,
          stepMode: "vertex",
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
        },
        { // Instance TRS + Color (Reading from dstInstanceBuffer)
          arrayStride: 64,
          stepMode: "instance",
          attributes: [
            { shaderLocation: 2, offset: 0, format: "float32x3" },  // translation
            { shaderLocation: 3, offset: 16, format: "float32x4" }, // rotation
            { shaderLocation: 4, offset: 32, format: "float32x3" }, // scale
            { shaderLocation: 5, offset: 48, format: "float32x4" }, // color
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

  const pipelineDoubleSide = device.createRenderPipeline(renderPipelineDescriptor);
  renderPipelineDescriptor.primitive!.cullMode = "back";
  const pipelineFrontSide = device.createRenderPipeline(renderPipelineDescriptor);

  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // --- State & Init ---
  const params = {
    count: 1000,
    lineWidth: 1.5,
    showWireframe: true,
    fillOpacity: 0.5,
    cullMode: 'none',
    resolution: 'High',
  };

  // Generate Source Data
  function generateInstances() {
    const floatCount = 16;
    const data = new Float32Array(MAX_INSTANCES * floatCount);
    const range = 100;
    const chunk = Math.floor(MAX_INSTANCES / 6);
    let offset = 0;
    
    for (let m = 0; m < 6; m++) {
      for (let i = 0; i < chunk; i++) {
        const x = (Math.random() - 0.5) * range * 2;
        const y = (Math.random() - 0.5) * range * 2;
        const z = (Math.random() - 0.5) * range * 2;
        const s = (Math.random() * 1.5 + 1.0) * 5.0;
        
        const axis = vec3.normalize([Math.random()-0.5, Math.random()-0.5, Math.random()-0.5]);
        const angle = Math.random() * Math.PI * 2;
        const q = quat.fromAxisAngle(axis, angle);

        // Trans (0-2)
        data[offset + 0] = x; data[offset + 1] = y; data[offset + 2] = z;
        // Pad (3)
        data[offset + 3] = 0;
        // Rot (4-7)
        data[offset + 4] = q[0]; data[offset + 5] = q[1]; data[offset + 6] = q[2]; data[offset + 7] = q[3];
        // Scale (8-10)
        data[offset + 8] = s; data[offset + 9] = s; data[offset + 10] = s;
        // Pad (11)
        data[offset + 11] = 0;
        // Color (12-15)
        data[offset + 12] = Math.random(); data[offset + 13] = Math.random(); data[offset + 14] = Math.random(); data[offset + 15] = 1.0;
        
        offset += floatCount;
      }
    }
    device.queue.writeBuffer(srcInstanceBuffer, 0, data);
  }

  generateInstances();
  updateMeshes(); // Initialize meshes and indirect buffer

  const gui = new GUI({ container: document.getElementById('gui-container') as HTMLElement });
  gui.add(params, 'count', [1, 10, 100, 1000, 10000, 100000, 1000000]).name('Object Count');
  gui.add(params, "lineWidth", 0.5, 5.0).name("Line Width");
  gui.add(params, "showWireframe").name("Show Wireframe");
  gui.add(params, "fillOpacity", 0.0, 1.0).name("Fill Opacity");
  gui.add(params, 'cullMode', ['none', 'back']).name('Cull Mode');
  gui.add(params, 'resolution', ['High', 'Medium', 'Low']).name('Resolution').onChange(updateMeshes);

  function render() {
    const totalCount = Number(params.count);
    
    // Uniforms
    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 500.0);
    const now = Date.now() / 5000;
    const radius = 250;
    const camX = Math.sin(now) * radius; const camY = Math.sin(now * 0.5) * radius * 0.5; const camZ = Math.cos(now) * radius;
    const viewMatrix = mat4.lookAt([camX, camY, camZ], [0, 0, 0], [0, 1, 0]);
    const vpMatrix = mat4.multiply(projectionMatrix, viewMatrix);
    
    device.queue.writeBuffer(uniformBuffer, 0, vpMatrix as Float32Array);
    device.queue.writeBuffer(uniformBuffer, 64, new Float32Array([params.lineWidth, params.showWireframe ? 1.0 : 0.0, params.fillOpacity]));
    device.queue.writeBuffer(uniformBuffer, 76, new Uint32Array([totalCount, MAX_INSTANCES]));

    // Reset Indirect Instance Counts (Offsets 4, 20, 36, 52, 68, 84)
    // Structure: vertexCount(0), instanceCount(4), firstVertex(8), firstInstance(12)
    // We only need to zero out the instanceCount (offset 4) for each of the 6 structs
    // A single write can do this if we prepared a buffer with zeros, but loop is fine for 6 items.
    // Better: write a zero buffer to the whole thing? No, vertexCount must be preserved.
    // We can write to specific offsets.
    
    // Faster: compute shader to reset? or just writeBuffer.
    // Let's use writeBuffer for simplicity on CPU side.
    for(let i=0; i<6; i++) {
        device.queue.writeBuffer(indirectDrawBuffer, (i * 16) + 4, new Uint32Array([0]));
    }

    const commandEncoder = device.createCommandEncoder();

    // 1. Compute Pass (Culling)
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, uniformBindGroup);
    computePass.setBindGroup(1, computeBindGroup);
    // Dispatch enough threads to cover totalCount
    // Workgroup size is 64
    const workgroupCount = Math.ceil(totalCount / 64);
    computePass.dispatchWorkgroups(workgroupCount);
    computePass.end();

    // 2. Render Pass
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
    renderPass.setBindGroup(0, uniformBindGroup);

    // Bind Vertex Buffers
    // Slot 0: Position (Mesh) - varies per draw
    // Slot 1: Instance Data (All visible instances) - fixed
    renderPass.setVertexBuffer(1, dstInstanceBuffer);

    // Draw 6 times using Indirect Buffer
    for (let m = 0; m < 6; m++) {
      const mesh = gpuMeshes[m];
      renderPass.setVertexBuffer(0, mesh.vertexBuffer);
      
      // Indirect draw
      // Offset = m * 16 bytes (4 u32s)
      renderPass.drawIndirect(indirectDrawBuffer, m * 16);
    }

    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

init().catch(console.error);
