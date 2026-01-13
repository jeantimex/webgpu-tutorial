import { initWebGPU } from "./utils/webgpu-util";
import { mat4, vec3 } from "wgpu-matrix";
import GUI from "lil-gui";

const shaderCode = `
struct Uniforms {
  worldViewProjectionMatrix : mat4x4f,
  worldMatrix : mat4x4f,
  color : vec4f,
}

struct LineUniforms {
  thickness : f32,
  alphaThreshold : f32,
}

@group(0) @binding(0) var<uniform> uni : Uniforms;
@group(0) @binding(1) var<uniform> line : LineUniforms;
@group(0) @binding(2) var<storage, read> positions : array<f32>;
@group(0) @binding(3) var<storage, read> normals : array<f32>;
@group(0) @binding(4) var<storage, read> indices : array<u32>;

struct VSOutput {
  @builtin(position) position : vec4f,
  @location(0) barycentricCoord : vec3f,
  @location(1) normal : vec3f,
}

@vertex
fn vs_main(@builtin(vertex_index) vNdx : u32) -> VSOutput {
  // Compute which vertex within the triangle (0, 1, or 2)
  let vertNdx = vNdx % 3;

  // Get the actual vertex index from the index buffer
  let index = indices[vNdx];

  // Read position (3 floats per vertex)
  let pNdx = index * 3;
  let position = vec4f(positions[pNdx], positions[pNdx + 1], positions[pNdx + 2], 1.0);
  let normal = vec3f(normals[pNdx], normals[pNdx + 1], normals[pNdx + 2]);

  var vsOut : VSOutput;
  vsOut.position = uni.worldViewProjectionMatrix * position;
  vsOut.normal = (uni.worldMatrix * vec4f(normal, 0.0)).xyz;

  // Assign barycentric coordinate based on vertex index within triangle
  vsOut.barycentricCoord = vec3f(0.0);
  if (vertNdx == 0u) {
    vsOut.barycentricCoord.x = 1.0;
  } else if (vertNdx == 1u) {
    vsOut.barycentricCoord.y = 1.0;
  } else {
    vsOut.barycentricCoord.z = 1.0;
  }

  return vsOut;
}

fn edgeFactor(bary : vec3f) -> f32 {
  let d = fwidth(bary);
  let a3 = smoothstep(vec3f(0.0), d * line.thickness, bary);
  return min(min(a3.x, a3.y), a3.z);
}

@fragment
fn fs_main(v : VSOutput) -> @location(0) vec4f {
  // Lighting
  let lightDirection = normalize(vec3f(4.0, 10.0, 6.0));
  let light = dot(normalize(v.normal), lightDirection) * 0.5 + 0.5;
  let litColor = uni.color.rgb * light;

  // Wireframe edge factor
  let edge = 1.0 - edgeFactor(v.barycentricCoord);

  // Blend white wireframe over lit color
  let wireColor = vec3f(1.0, 1.0, 1.0);
  let finalColor = mix(litColor, wireColor, edge);

  // Alpha: solid where there's either fill or wireframe
  let a = max(edge, 1.0 - line.alphaThreshold);
  if (a < line.alphaThreshold) {
    discard;
  }

  return vec4f(finalColor, 1.0);
}
`;

// ============ Indexed Geometry Generators with Normals ============

interface IndexedGeometry {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  indexCount: number;
}

function createBoxGeometry(): IndexedGeometry {
  // For a box with proper normals, we need separate vertices per face (24 vertices)
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const faces = [
    { dir: [0, 0, 1], up: [0, 1, 0], right: [1, 0, 0] },   // front
    { dir: [0, 0, -1], up: [0, 1, 0], right: [-1, 0, 0] }, // back
    { dir: [0, 1, 0], up: [0, 0, -1], right: [1, 0, 0] },  // top
    { dir: [0, -1, 0], up: [0, 0, 1], right: [1, 0, 0] },  // bottom
    { dir: [1, 0, 0], up: [0, 1, 0], right: [0, 0, -1] },  // right
    { dir: [-1, 0, 0], up: [0, 1, 0], right: [0, 0, 1] },  // left
  ];

  for (const face of faces) {
    const baseIndex = positions.length / 3;
    const d = face.dir, u = face.up, r = face.right;

    // 4 corners of the face
    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < 2; i++) {
        const x = d[0] * 0.5 + (i * 2 - 1) * r[0] * 0.5 + (j * 2 - 1) * u[0] * 0.5;
        const y = d[1] * 0.5 + (i * 2 - 1) * r[1] * 0.5 + (j * 2 - 1) * u[1] * 0.5;
        const z = d[2] * 0.5 + (i * 2 - 1) * r[2] * 0.5 + (j * 2 - 1) * u[2] * 0.5;
        positions.push(x, y, z);
        normals.push(d[0], d[1], d[2]);
      }
    }

    // Two triangles per face
    indices.push(baseIndex, baseIndex + 2, baseIndex + 1);
    indices.push(baseIndex + 1, baseIndex + 2, baseIndex + 3);
  }

  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint32Array(indices), indexCount: indices.length };
}

function createSphereGeometry(radius = 0.5, widthSegments = 16, heightSegments = 12): IndexedGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const phi = v * Math.PI;

    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const theta = u * Math.PI * 2;

      const nx = -Math.sin(phi) * Math.cos(theta);
      const ny = Math.cos(phi);
      const nz = Math.sin(phi) * Math.sin(theta);

      positions.push(nx * radius, ny * radius, nz * radius);
      normals.push(nx, ny, nz);
    }
  }

  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const a = y * (widthSegments + 1) + x;
      const b = a + widthSegments + 1;
      const c = a + 1;
      const d = b + 1;

      if (y !== 0) indices.push(a, b, c);
      if (y !== heightSegments - 1) indices.push(c, b, d);
    }
  }

  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint32Array(indices), indexCount: indices.length };
}

// Jewel: Faceted sphere with flat normals (low-poly gem look)
function createJewelGeometry(radius = 0.5, widthSegments = 5, heightSegments = 3): IndexedGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Generate sphere vertices first
  const tempPositions: [number, number, number][] = [];

  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const phi = v * Math.PI;

    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const theta = u * Math.PI * 2;

      const nx = -Math.sin(phi) * Math.cos(theta);
      const ny = Math.cos(phi);
      const nz = Math.sin(phi) * Math.sin(theta);

      tempPositions.push([nx * radius, ny * radius, nz * radius]);
    }
  }

  // Build triangles with flat normals (each triangle gets its own vertices)
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const a = y * (widthSegments + 1) + x;
      const b = a + widthSegments + 1;
      const c = a + 1;
      const d = b + 1;

      if (y !== 0) {
        // Triangle a, b, c
        const pa = tempPositions[a], pb = tempPositions[b], pc = tempPositions[c];
        const faceNormal1 = computeFaceNormal(pa, pb, pc);
        const baseIdx1 = positions.length / 3;
        positions.push(...pa, ...pb, ...pc);
        normals.push(...faceNormal1, ...faceNormal1, ...faceNormal1);
        indices.push(baseIdx1, baseIdx1 + 1, baseIdx1 + 2);
      }

      if (y !== heightSegments - 1) {
        // Triangle c, b, d
        const pc = tempPositions[c], pb = tempPositions[b], pd = tempPositions[d];
        const faceNormal2 = computeFaceNormal(pc, pb, pd);
        const baseIdx2 = positions.length / 3;
        positions.push(...pc, ...pb, ...pd);
        normals.push(...faceNormal2, ...faceNormal2, ...faceNormal2);
        indices.push(baseIdx2, baseIdx2 + 1, baseIdx2 + 2);
      }
    }
  }

  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint32Array(indices), indexCount: indices.length };
}

// Rock: Sphere with randomized vertices for organic look
function createRockGeometry(radius = 0.5, widthSegments = 16, heightSegments = 12, randomness = 0.15): IndexedGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Generate randomized sphere vertices
  const tempPositions: [number, number, number][] = [];

  // Use seeded random for consistency (simple LCG)
  let seed = 12345;
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const phi = v * Math.PI;

    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const theta = u * Math.PI * 2;

      const nx = -Math.sin(phi) * Math.cos(theta);
      const ny = Math.cos(phi);
      const nz = Math.sin(phi) * Math.sin(theta);

      // Add randomness to radius (less at poles for smoother caps)
      const poleFactor = Math.sin(phi); // 0 at poles, 1 at equator
      const r = radius * (1 + (random() - 0.5) * 2 * randomness * poleFactor);

      tempPositions.push([nx * r, ny * r, nz * r]);
    }
  }

  // Build triangles with flat normals
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const a = y * (widthSegments + 1) + x;
      const b = a + widthSegments + 1;
      const c = a + 1;
      const d = b + 1;

      if (y !== 0) {
        const pa = tempPositions[a], pb = tempPositions[b], pc = tempPositions[c];
        const faceNormal1 = computeFaceNormal(pa, pb, pc);
        const baseIdx1 = positions.length / 3;
        positions.push(...pa, ...pb, ...pc);
        normals.push(...faceNormal1, ...faceNormal1, ...faceNormal1);
        indices.push(baseIdx1, baseIdx1 + 1, baseIdx1 + 2);
      }

      if (y !== heightSegments - 1) {
        const pc = tempPositions[c], pb = tempPositions[b], pd = tempPositions[d];
        const faceNormal2 = computeFaceNormal(pc, pb, pd);
        const baseIdx2 = positions.length / 3;
        positions.push(...pc, ...pb, ...pd);
        normals.push(...faceNormal2, ...faceNormal2, ...faceNormal2);
        indices.push(baseIdx2, baseIdx2 + 1, baseIdx2 + 2);
      }
    }
  }

  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint32Array(indices), indexCount: indices.length };
}

// Helper: Compute face normal from 3 vertices
function computeFaceNormal(a: [number, number, number], b: [number, number, number], c: [number, number, number]): [number, number, number] {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  return [nx / len, ny / len, nz / len];
}

function createCylinderGeometry(radiusTop = 0.5, radiusBottom = 0.5, height = 1, radialSegments = 16): IndexedGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const halfHeight = height / 2;

  // Side vertices
  for (let y = 0; y <= 1; y++) {
    const radius = y === 0 ? radiusTop : radiusBottom;
    const posY = y === 0 ? halfHeight : -halfHeight;

    for (let x = 0; x <= radialSegments; x++) {
      const theta = (x / radialSegments) * Math.PI * 2;
      const sinT = Math.sin(theta), cosT = Math.cos(theta);
      positions.push(radius * sinT, posY, radius * cosT);
      // Normal points outward (simplified - doesn't account for slant)
      normals.push(sinT, 0, cosT);
    }
  }

  for (let x = 0; x < radialSegments; x++) {
    const a = x, b = x + radialSegments + 1, c = x + 1, d = b + 1;
    indices.push(a, b, c, c, b, d);
  }

  // Top cap
  if (radiusTop > 0) {
    const centerIdx = positions.length / 3;
    positions.push(0, halfHeight, 0);
    normals.push(0, 1, 0);
    const ringStart = positions.length / 3;

    for (let x = 0; x <= radialSegments; x++) {
      const theta = (x / radialSegments) * Math.PI * 2;
      positions.push(radiusTop * Math.sin(theta), halfHeight, radiusTop * Math.cos(theta));
      normals.push(0, 1, 0);
    }

    for (let x = 0; x < radialSegments; x++) {
      indices.push(centerIdx, ringStart + x, ringStart + x + 1);
    }
  }

  // Bottom cap
  if (radiusBottom > 0) {
    const centerIdx = positions.length / 3;
    positions.push(0, -halfHeight, 0);
    normals.push(0, -1, 0);
    const ringStart = positions.length / 3;

    for (let x = 0; x <= radialSegments; x++) {
      const theta = (x / radialSegments) * Math.PI * 2;
      positions.push(radiusBottom * Math.sin(theta), -halfHeight, radiusBottom * Math.cos(theta));
      normals.push(0, -1, 0);
    }

    for (let x = 0; x < radialSegments; x++) {
      indices.push(centerIdx, ringStart + x + 1, ringStart + x);
    }
  }

  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint32Array(indices), indexCount: indices.length };
}

function createConeGeometry(radius = 0.5, height = 1, radialSegments = 16): IndexedGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const halfHeight = height / 2;

  // Compute slope for normals
  const slope = radius / height;

  // Apex (one vertex per segment for proper normals)
  for (let x = 0; x <= radialSegments; x++) {
    const theta = (x / radialSegments) * Math.PI * 2;
    positions.push(0, halfHeight, 0);
    const nx = Math.sin(theta), nz = Math.cos(theta);
    const len = Math.sqrt(1 + slope * slope);
    normals.push(nx / len, slope / len, nz / len);
  }

  // Base ring
  for (let x = 0; x <= radialSegments; x++) {
    const theta = (x / radialSegments) * Math.PI * 2;
    const sinT = Math.sin(theta), cosT = Math.cos(theta);
    positions.push(radius * sinT, -halfHeight, radius * cosT);
    const len = Math.sqrt(1 + slope * slope);
    normals.push(sinT / len, slope / len, cosT / len);
  }

  // Side triangles
  for (let x = 0; x < radialSegments; x++) {
    const apex = x;
    const base1 = radialSegments + 1 + x;
    const base2 = base1 + 1;
    indices.push(apex, base2, base1);
  }

  // Bottom cap
  const centerIdx = positions.length / 3;
  positions.push(0, -halfHeight, 0);
  normals.push(0, -1, 0);
  const ringStart = positions.length / 3;

  for (let x = 0; x <= radialSegments; x++) {
    const theta = (x / radialSegments) * Math.PI * 2;
    positions.push(radius * Math.sin(theta), -halfHeight, radius * Math.cos(theta));
    normals.push(0, -1, 0);
  }

  for (let x = 0; x < radialSegments; x++) {
    indices.push(centerIdx, ringStart + x + 1, ringStart + x);
  }

  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint32Array(indices), indexCount: indices.length };
}

function createTorusGeometry(radius = 0.4, tube = 0.15, radialSegments = 8, tubularSegments = 16): IndexedGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= radialSegments; j++) {
    for (let i = 0; i <= tubularSegments; i++) {
      const u = (i / tubularSegments) * Math.PI * 2;
      const v = (j / radialSegments) * Math.PI * 2;

      const x = (radius + tube * Math.cos(v)) * Math.cos(u);
      const y = (radius + tube * Math.cos(v)) * Math.sin(u);
      const z = tube * Math.sin(v);

      positions.push(x, y, z);

      // Normal = position on tube circle, relative to torus center line
      const cx = radius * Math.cos(u);
      const cy = radius * Math.sin(u);
      const nx = x - cx, ny = y - cy, nz = z;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      normals.push(nx / len, ny / len, nz / len);
    }
  }

  for (let j = 0; j < radialSegments; j++) {
    for (let i = 0; i < tubularSegments; i++) {
      const a = j * (tubularSegments + 1) + i;
      const b = (j + 1) * (tubularSegments + 1) + i;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c, c, b, d);
    }
  }

  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint32Array(indices), indexCount: indices.length };
}

function createTorusKnotGeometry(radius = 0.4, tube = 0.1, tubularSegments = 64, radialSegments = 8, p = 2, q = 3): IndexedGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  function getKnotPosition(u: number): [number, number, number] {
    const cu = Math.cos(u), su = Math.sin(u);
    const quOverP = (q / p) * u;
    const cs = Math.cos(quOverP);
    return [radius * (2 + cs) * 0.5 * cu, radius * (2 + cs) * 0.5 * su, radius * Math.sin(quOverP) * 0.5];
  }

  for (let i = 0; i <= tubularSegments; i++) {
    const u = (i / tubularSegments) * p * Math.PI * 2;
    const p1 = getKnotPosition(u);
    const p2 = getKnotPosition(u + 0.01);
    const T = vec3.normalize(vec3.sub(p2, p1));
    const N = vec3.normalize(vec3.add(p1, p2));
    const B = vec3.normalize(vec3.cross(T, N));
    const N2 = vec3.cross(B, T);

    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      const cx = -tube * Math.cos(v), cy = tube * Math.sin(v);
      const px = p1[0] + cx * N2[0] + cy * B[0];
      const py = p1[1] + cx * N2[1] + cy * B[1];
      const pz = p1[2] + cx * N2[2] + cy * B[2];
      positions.push(px, py, pz);

      // Normal points from center of tube to surface
      const nx = cx * N2[0] + cy * B[0];
      const ny = cx * N2[1] + cy * B[1];
      const nz = cx * N2[2] + cy * B[2];
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      normals.push(nx / len, ny / len, nz / len);
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c, c, b, d);
    }
  }

  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint32Array(indices), indexCount: indices.length };
}

// ============ Main ============

interface SceneObject {
  geometryIndex: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: [number, number, number, number];
  uniformBuffer: GPUBuffer;
  bindGroup: GPUBindGroup;
}

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  const shaderModule = device.createShaderModule({ code: shaderCode });

  // Create all indexed geometry types
  const geometries = [
    createBoxGeometry(),
    createSphereGeometry(0.5, 16, 12),
    createJewelGeometry(0.5, 5, 3),
    createRockGeometry(0.5, 16, 12, 0.15),
    createCylinderGeometry(0.5, 0.5, 1, 16),
    createConeGeometry(0.5, 1, 16),
    createTorusGeometry(0.4, 0.15, 8, 16),
    createTorusKnotGeometry(0.4, 0.1, 64, 8, 2, 3),
  ];

  // Create GPU buffers for each geometry
  const gpuGeometries = geometries.map((geo) => {
    const positionBuffer = device.createBuffer({
      size: geo.positions.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(positionBuffer, 0, geo.positions);

    const normalBuffer = device.createBuffer({
      size: geo.normals.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(normalBuffer, 0, geo.normals);

    const indexBuffer = device.createBuffer({
      size: geo.indices.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, geo.indices);

    return { positionBuffer, normalBuffer, indexBuffer, indexCount: geo.indexCount };
  });

  // Line uniforms buffer (shared by all objects)
  const lineUniformBuffer = device.createBuffer({
    size: 8,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Bind group layout
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
      { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
      { binding: 3, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
      { binding: 4, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
    ],
  });

  // Pipeline
  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [{
        format: canvasFormat,
        blend: {
          color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
          alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
        },
      }],
    },
    primitive: { topology: "triangle-list", cullMode: "none" },
    depthStencil: { depthWriteEnabled: true, depthCompare: "less", format: "depth24plus" },
  });

  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // Scene objects with per-object bind groups
  let objects: SceneObject[] = [];

  function createObject(geometryIndex: number): SceneObject {
    const spread = 30;
    const position: [number, number, number] = [
      (Math.random() - 0.5) * spread * 2,
      (Math.random() - 0.5) * spread * 2,
      (Math.random() - 0.5) * spread * 2,
    ];
    const rotation: [number, number, number] = [
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
    ];
    const scale = 9.0 + Math.random() * 12.0;
    const color: [number, number, number, number] = [Math.random(), Math.random(), Math.random(), 1.0];

    // Per-object uniform buffer: worldViewProjectionMatrix(64) + worldMatrix(64) + color(16) = 144 bytes
    const uniformBuffer = device.createBuffer({
      size: 144,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const geo = gpuGeometries[geometryIndex];
    const bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: lineUniformBuffer } },
        { binding: 2, resource: { buffer: geo.positionBuffer } },
        { binding: 3, resource: { buffer: geo.normalBuffer } },
        { binding: 4, resource: { buffer: geo.indexBuffer } },
      ],
    });

    return { geometryIndex, position, rotation, scale, color, uniformBuffer, bindGroup };
  }

  function generateObjects(count: number) {
    objects.forEach(obj => obj.uniformBuffer.destroy());
    objects = [];

    for (let i = 0; i < count; i++) {
      const geometryIndex = Math.floor(Math.random() * geometries.length);
      objects.push(createObject(geometryIndex));
    }
  }

  const params = {
    count: 10,
    thickness: 0.5,
    regenerate: () => generateObjects(params.count),
  };

  generateObjects(params.count);

  const gui = new GUI({ container: document.getElementById("gui-container") as HTMLElement });
  gui.add(params, "count", [1, 10, 1000, 10000, 100000, 1000000]).name("Object Count").onChange(() => generateObjects(params.count));
  gui.add(params, "thickness", 0.5, 5.0).name("Line Thickness");
  gui.add(params, "regenerate").name("Regenerate");

  const aspect = canvas.width / canvas.height;
  const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 500.0);

  let time = 0;

  function render() {
    time += 0.01;

    // Update line uniforms (thickness, alphaThreshold fixed at 0.5)
    device.queue.writeBuffer(lineUniformBuffer, 0, new Float32Array([params.thickness, 0.5]));

    // Camera
    const camRadius = 80;
    const camX = Math.sin(time * 0.5) * camRadius;
    const camZ = Math.cos(time * 0.5) * camRadius;
    const viewMatrix = mat4.lookAt([camX, 30, camZ], [0, 0, 0], [0, 1, 0]);
    const viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix);

    // Update per-object uniforms
    for (const obj of objects) {
      const worldMatrix = mat4.identity();
      mat4.translate(worldMatrix, obj.position, worldMatrix);
      mat4.rotateX(worldMatrix, obj.rotation[0] + time, worldMatrix);
      mat4.rotateY(worldMatrix, obj.rotation[1] + time * 0.7, worldMatrix);
      mat4.rotateZ(worldMatrix, obj.rotation[2] + time * 0.3, worldMatrix);
      mat4.scale(worldMatrix, [obj.scale, obj.scale, obj.scale], worldMatrix);

      const worldViewProjectionMatrix = mat4.multiply(viewProjectionMatrix, worldMatrix);

      device.queue.writeBuffer(obj.uniformBuffer, 0, worldViewProjectionMatrix as Float32Array);
      device.queue.writeBuffer(obj.uniformBuffer, 64, worldMatrix as Float32Array);
      device.queue.writeBuffer(obj.uniformBuffer, 128, new Float32Array(obj.color));
    }

    const commandEncoder = device.createCommandEncoder();
    const textureView = context!.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 },
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

    for (const obj of objects) {
      renderPass.setBindGroup(0, obj.bindGroup);
      renderPass.draw(gpuGeometries[obj.geometryIndex].indexCount);
    }

    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

init().catch(console.error);
