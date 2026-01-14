import { initWebGPU } from "./utils/webgpu-util";
import { mat4, vec3 } from "wgpu-matrix";
import GUI from "lil-gui";

const shaderCode = `
struct Uniforms {
  viewProjectionMatrix : mat4x4f,
  lineWidth : f32,
  fillOpacity : f32,
  showWireframe : f32,
  alphaThreshold : f32,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var<storage, read> modelMatrices : array<mat4x4f>;
@group(0) @binding(2) var<storage, read> instanceColors : array<vec4f>;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) barycentric : vec3f,
  @location(1) color : vec3f,
  @location(2) normal : vec3f,
}

struct LineOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec3f,
}

@vertex
fn vs_main(
  @builtin(instance_index) instanceIndex : u32,
  @location(0) pos : vec3f,
  @location(1) barycentric : vec3f,
  @location(2) color : vec3f,
  @location(3) normal : vec3f,
) -> VertexOutput {
  var out : VertexOutput;
  let modelMatrix = modelMatrices[instanceIndex];
  let mvpMatrix = uniforms.viewProjectionMatrix * modelMatrix;
  out.position = mvpMatrix * vec4f(pos, 1.0);
  out.barycentric = barycentric;
  out.color = instanceColors[instanceIndex].rgb;
  // Transform normal by model matrix (ignoring translation)
  out.normal = (modelMatrix * vec4f(normal, 0.0)).xyz;
  return out;
}

@vertex
fn vs_line(
  @builtin(instance_index) instanceIndex : u32,
  @location(0) pos : vec3f,
) -> LineOutput {
  var out : LineOutput;
  let modelMatrix = modelMatrices[instanceIndex];
  let mvpMatrix = uniforms.viewProjectionMatrix * modelMatrix;
  out.position = mvpMatrix * vec4f(pos, 1.0);
  out.color = clamp(instanceColors[instanceIndex].rgb + vec3f(0.5), vec3f(0.0), vec3f(1.0));
  return out;
}

fn edgeFactor(bary : vec3f, width : f32) -> f32 {
  let d = fwidth(bary);
  let a3 = smoothstep(vec3f(0.0), d * width, bary);
  return min(min(a3.x, a3.y), a3.z);
}

@fragment
fn fs_lit(in : VertexOutput) -> @location(0) vec4f {
  // Lighting
  let lightDirection = normalize(vec3f(4.0, 10.0, 6.0));
  let light = dot(normalize(in.normal), lightDirection) * 0.5 + 0.5;
  let litColor = in.color * light;
  return vec4f(litColor, uniforms.fillOpacity);
}

@fragment
fn fs_wireframe(in : VertexOutput) -> @location(0) vec4f {
  let edge = 1.0 - edgeFactor(in.barycentric, uniforms.lineWidth);
  if (edge < uniforms.alphaThreshold) {
    discard;
  }
  let wireColor = vec3f(1.0, 1.0, 1.0);
  return vec4f(wireColor * edge, edge);
}

@fragment
fn fs_line(in : LineOutput) -> @location(0) vec4f {
  return vec4f(1.0, 1.0, 1.0, 1.0);
}
`;

type GeometryData = {
  vertices: Float32Array;
  vertexCount: number;
};

// Helper to compute face normal from 3 vertices
function computeFaceNormal(a: number[], b: number[], c: number[]): number[] {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  return [nx / len, ny / len, nz / len];
}

// Helper to add a triangle with barycentric coordinates and normal
// Each vertex now has: position(3) + barycentric(3) + color(3) + normal(3) = 12 floats
function addTriangle(
  vertices: number[],
  a: number[], b: number[], c: number[],
  color: number[],
  normal?: number[]
) {
  const n = normal || computeFaceNormal(a, b, c);
  vertices.push(...a, 1, 0, 0, ...color, ...n);
  vertices.push(...b, 0, 1, 0, ...color, ...n);
  vertices.push(...c, 0, 0, 1, ...color, ...n);
}

// Cube geometry
function createCubeGeometry(): GeometryData {
  const vertices: number[] = [];
  const s = 0.5;
  const corners = [
    [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
    [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s],
  ];
  const faces = [
    { indices: [[4, 5, 6], [4, 6, 7]], color: [1.0, 0.4, 0.4], normal: [0, 0, 1] },   // front
    { indices: [[1, 0, 3], [1, 3, 2]], color: [0.4, 1.0, 0.4], normal: [0, 0, -1] },  // back
    { indices: [[7, 6, 2], [7, 2, 3]], color: [0.4, 0.4, 1.0], normal: [0, 1, 0] },   // top
    { indices: [[0, 1, 5], [0, 5, 4]], color: [1.0, 1.0, 0.4], normal: [0, -1, 0] },  // bottom
    { indices: [[5, 1, 2], [5, 2, 6]], color: [1.0, 0.4, 1.0], normal: [1, 0, 0] },   // right
    { indices: [[0, 4, 7], [0, 7, 3]], color: [0.4, 1.0, 1.0], normal: [-1, 0, 0] },  // left
  ];
  for (const face of faces) {
    for (const tri of face.indices) {
      addTriangle(vertices, corners[tri[0]], corners[tri[1]], corners[tri[2]], face.color, face.normal);
    }
  }
  return { vertices: new Float32Array(vertices), vertexCount: vertices.length / 12 };
}

// Sphere geometry with smooth normals
function createSphereGeometry(segments = 8): GeometryData {
  const vertices: number[] = [];
  const positions: number[][] = [];
  const sphereNormals: number[][] = [];
  const grid: number[][] = [];

  for (let iy = 0; iy <= segments; iy++) {
    const row: number[] = [];
    const v = iy / segments;
    const phi = v * Math.PI;
    for (let ix = 0; ix <= segments; ix++) {
      const u = ix / segments;
      const theta = u * Math.PI * 2;
      const nx = -Math.cos(theta) * Math.sin(phi);
      const ny = Math.cos(phi);
      const nz = Math.sin(theta) * Math.sin(phi);
      positions.push([nx * 0.5, ny * 0.5, nz * 0.5]);
      sphereNormals.push([nx, ny, nz]);
      row.push(positions.length - 1);
    }
    grid.push(row);
  }

  for (let iy = 0; iy < segments; iy++) {
    for (let ix = 0; ix < segments; ix++) {
      const a = grid[iy][ix + 1], b = grid[iy][ix];
      const c = grid[iy + 1][ix], d = grid[iy + 1][ix + 1];
      const color = [0.3 + Math.random() * 0.4, 0.5 + Math.random() * 0.3, 0.8];
      if (iy !== 0) {
        // Use average normal for smooth shading
        const n = computeFaceNormal(positions[a], positions[b], positions[d]);
        addTriangle(vertices, positions[a], positions[b], positions[d], color, n);
      }
      if (iy !== segments - 1) {
        const n = computeFaceNormal(positions[b], positions[c], positions[d]);
        addTriangle(vertices, positions[b], positions[c], positions[d], color, n);
      }
    }
  }
  return { vertices: new Float32Array(vertices), vertexCount: vertices.length / 12 };
}

// Cylinder geometry
function createCylinderGeometry(segments = 12): GeometryData {
  const vertices: number[] = [];
  const height = 1, radius = 0.4;

  for (let i = 0; i < segments; i++) {
    const theta1 = (i / segments) * Math.PI * 2;
    const theta2 = ((i + 1) / segments) * Math.PI * 2;
    const x1 = Math.cos(theta1) * radius, z1 = Math.sin(theta1) * radius;
    const x2 = Math.cos(theta2) * radius, z2 = Math.sin(theta2) * radius;

    // Side faces - compute outward normal
    const nx1 = Math.cos(theta1), nz1 = Math.sin(theta1);
    const nx2 = Math.cos(theta2), nz2 = Math.sin(theta2);
    const sideNormal = [(nx1 + nx2) / 2, 0, (nz1 + nz2) / 2];
    const len = Math.sqrt(sideNormal[0] ** 2 + sideNormal[2] ** 2);
    sideNormal[0] /= len; sideNormal[2] /= len;

    const color = [0.9, 0.6, 0.3];
    addTriangle(vertices, [x1, -height/2, z1], [x2, -height/2, z2], [x2, height/2, z2], color, sideNormal);
    addTriangle(vertices, [x1, -height/2, z1], [x2, height/2, z2], [x1, height/2, z1], color, sideNormal);

    // Top cap
    addTriangle(vertices, [0, height/2, 0], [x1, height/2, z1], [x2, height/2, z2], [0.4, 0.8, 0.4], [0, 1, 0]);
    // Bottom cap
    addTriangle(vertices, [0, -height/2, 0], [x2, -height/2, z2], [x1, -height/2, z1], [0.4, 0.4, 0.8], [0, -1, 0]);
  }
  return { vertices: new Float32Array(vertices), vertexCount: vertices.length / 12 };
}

// Torus geometry
function createTorusGeometry(tubularSegments = 12, radialSegments = 8): GeometryData {
  const vertices: number[] = [];
  const R = 0.35, r = 0.15;
  const positions: number[][] = [];
  const torusNormals: number[][] = [];
  const grid: number[][] = [];

  for (let j = 0; j <= radialSegments; j++) {
    const row: number[] = [];
    const v = j / radialSegments * Math.PI * 2;
    for (let i = 0; i <= tubularSegments; i++) {
      const u = i / tubularSegments * Math.PI * 2;
      const x = (R + r * Math.cos(v)) * Math.cos(u);
      const y = r * Math.sin(v);
      const z = (R + r * Math.cos(v)) * Math.sin(u);
      positions.push([x, y, z]);
      // Normal points from center of tube to surface
      const cx = R * Math.cos(u), cz = R * Math.sin(u);
      const nx = x - cx, ny = y, nz = z - cz;
      const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
      torusNormals.push([nx/len, ny/len, nz/len]);
      row.push(positions.length - 1);
    }
    grid.push(row);
  }

  for (let j = 0; j < radialSegments; j++) {
    for (let i = 0; i < tubularSegments; i++) {
      const a = grid[j][i], b = grid[j + 1][i];
      const c = grid[j + 1][i + 1], d = grid[j][i + 1];
      const color = [0.8, 0.4, 0.6 + Math.random() * 0.2];
      const n1 = computeFaceNormal(positions[a], positions[b], positions[d]);
      const n2 = computeFaceNormal(positions[b], positions[c], positions[d]);
      addTriangle(vertices, positions[a], positions[b], positions[d], color, n1);
      addTriangle(vertices, positions[b], positions[c], positions[d], color, n2);
    }
  }
  return { vertices: new Float32Array(vertices), vertexCount: vertices.length / 12 };
}

// Cone geometry
function createConeGeometry(segments = 12): GeometryData {
  const vertices: number[] = [];
  const height = 1, radius = 0.45;
  const slope = radius / height;

  for (let i = 0; i < segments; i++) {
    const theta1 = (i / segments) * Math.PI * 2;
    const theta2 = ((i + 1) / segments) * Math.PI * 2;
    const x1 = Math.cos(theta1) * radius, z1 = Math.sin(theta1) * radius;
    const x2 = Math.cos(theta2) * radius, z2 = Math.sin(theta2) * radius;

    // Side normal (pointing outward and up)
    const midTheta = (theta1 + theta2) / 2;
    const nx = Math.cos(midTheta), nz = Math.sin(midTheta);
    const len = Math.sqrt(1 + slope * slope);
    const sideNormal = [nx / len, slope / len, nz / len];

    const color = [0.6, 0.8, 0.3];
    addTriangle(vertices, [0, height/2, 0], [x2, -height/2, z2], [x1, -height/2, z1], color, sideNormal);
    // Base
    addTriangle(vertices, [0, -height/2, 0], [x1, -height/2, z1], [x2, -height/2, z2], [0.8, 0.5, 0.3], [0, -1, 0]);
  }
  return { vertices: new Float32Array(vertices), vertexCount: vertices.length / 12 };
}

// Jewel geometry (faceted sphere with flat shading)
function createJewelGeometry(segments = 6): GeometryData {
  const vertices: number[] = [];
  const positions: number[][] = [];
  const grid: number[][] = [];

  for (let iy = 0; iy <= segments; iy++) {
    const row: number[] = [];
    const v = iy / segments;
    const phi = v * Math.PI;
    for (let ix = 0; ix <= segments; ix++) {
      const u = ix / segments;
      const theta = u * Math.PI * 2;
      const x = -0.5 * Math.cos(theta) * Math.sin(phi);
      const y = 0.5 * Math.cos(phi);
      const z = 0.5 * Math.sin(theta) * Math.sin(phi);
      positions.push([x, y, z]);
      row.push(positions.length - 1);
    }
    grid.push(row);
  }

  const gemColors = [[0.8, 0.2, 0.3], [0.2, 0.8, 0.3], [0.2, 0.3, 0.9], [0.9, 0.8, 0.2], [0.8, 0.3, 0.8]];
  let colorIdx = 0;
  for (let iy = 0; iy < segments; iy++) {
    for (let ix = 0; ix < segments; ix++) {
      const a = grid[iy][ix + 1], b = grid[iy][ix];
      const c = grid[iy + 1][ix], d = grid[iy + 1][ix + 1];
      const color = gemColors[colorIdx++ % gemColors.length];
      if (iy !== 0) addTriangle(vertices, positions[a], positions[b], positions[d], color);
      if (iy !== segments - 1) addTriangle(vertices, positions[b], positions[c], positions[d], color);
    }
  }
  return { vertices: new Float32Array(vertices), vertexCount: vertices.length / 12 };
}

// Rock geometry (randomized sphere)
function createRockGeometry(segments = 6): GeometryData {
  const vertices: number[] = [];
  const positions: number[][] = [];
  const grid: number[][] = [];

  let seed = 54321;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

  for (let iy = 0; iy <= segments; iy++) {
    const row: number[] = [];
    const v = iy / segments;
    const phi = v * Math.PI;
    const poleFactor = Math.sin(phi);
    for (let ix = 0; ix <= segments; ix++) {
      const u = ix / segments;
      const theta = u * Math.PI * 2;
      const r = 0.5 * (1 + (rand() - 0.5) * 0.3 * poleFactor);
      const x = -r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(theta) * Math.sin(phi);
      positions.push([x, y, z]);
      row.push(positions.length - 1);
    }
    grid.push(row);
  }

  for (let iy = 0; iy < segments; iy++) {
    for (let ix = 0; ix < segments; ix++) {
      const a = grid[iy][ix + 1], b = grid[iy][ix];
      const c = grid[iy + 1][ix], d = grid[iy + 1][ix + 1];
      const val = 0.3 + rand() * 0.4;
      const color = [val + rand() * 0.1, val, val - rand() * 0.05];
      if (iy !== 0) addTriangle(vertices, positions[a], positions[b], positions[d], color);
      if (iy !== segments - 1) addTriangle(vertices, positions[b], positions[c], positions[d], color);
    }
  }
  return { vertices: new Float32Array(vertices), vertexCount: vertices.length / 12 };
}

// Torus Knot geometry
function createTorusKnotGeometry(tubularSegments = 48, radialSegments = 6): GeometryData {
  const vertices: number[] = [];
  const p = 2, q = 3, radius = 0.3, tube = 0.1;
  const positions: number[][] = [];
  const grid: number[][] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const row: number[] = [];
    const u = i / tubularSegments * Math.PI * 2 * p;

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments * Math.PI * 2;
      const cos_v = Math.cos(v), sin_v = Math.sin(v);

      const px = (radius + tube * cos_v) * Math.cos(u);
      const py = (radius + tube * cos_v) * Math.sin(u);
      const pz = tube * Math.sin(q / p * u) + tube * sin_v * Math.cos(q / p * u) * 0.5;

      positions.push([px, pz, py]);
      row.push(positions.length - 1);
    }
    grid.push(row);
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = grid[i][j], b = grid[i + 1][j];
      const c = grid[i + 1][j + 1], d = grid[i][j + 1];
      const hue = (i / tubularSegments);
      const color = [0.5 + 0.5 * Math.sin(hue * 6.28), 0.5 + 0.5 * Math.sin(hue * 6.28 + 2), 0.5 + 0.5 * Math.sin(hue * 6.28 + 4)];
      addTriangle(vertices, positions[a], positions[b], positions[d], color);
      addTriangle(vertices, positions[b], positions[c], positions[d], color);
    }
  }
  return { vertices: new Float32Array(vertices), vertexCount: vertices.length / 12 };
}

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  const shaderModule = device.createShaderModule({ code: shaderCode });

  // Maximum number of instances (pre-allocate for this)
  const maxInstances = 1000000;

  // Create all geometry types
  const geometryTypes = [
    { name: "cube", data: createCubeGeometry() },
    { name: "sphere", data: createSphereGeometry() },
    { name: "cylinder", data: createCylinderGeometry() },
    { name: "torus", data: createTorusGeometry() },
    { name: "cone", data: createConeGeometry() },
    { name: "jewel", data: createJewelGeometry() },
    { name: "rock", data: createRockGeometry() },
    { name: "torusKnot", data: createTorusKnotGeometry() },
  ];

  // Create vertex buffers for each geometry type
  const vertexBuffers = geometryTypes.map(geo => {
    const buffer = device.createBuffer({
      size: geo.data.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(buffer, 0, geo.data.vertices);
    return buffer;
  });

  const lineIndexBuffers = geometryTypes.map((geo) => {
    const indices: number[] = [];
    for (let i = 0; i < geo.data.vertexCount; i += 3) {
      indices.push(i, i + 1, i + 1, i + 2, i + 2, i);
    }
    const indexData = new Uint32Array(indices);
    const buffer = device.createBuffer({
      size: indexData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(buffer, 0, indexData);
    return { buffer, indexCount: indexData.length };
  });

  // Generate random positions and geometry assignments
  let seed = 12345;
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const scatterSize = 8;
  const instanceData: { position: [number, number, number]; geometryIndex: number; color: [number, number, number, number] }[] = [];
  for (let i = 0; i < maxInstances; i++) {
    instanceData.push({
      position: [
        (random() - 0.5) * scatterSize,
        (random() - 0.5) * scatterSize,
        (random() - 0.5) * scatterSize,
      ],
      geometryIndex: Math.floor(random() * geometryTypes.length),
      color: [random(), random(), random(), 1.0],
    });
  }

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "read-only-storage" },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "read-only-storage" },
      },
    ],
  });

  const litPipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 48, // 12 floats * 4 bytes
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" },   // position
          { shaderLocation: 1, offset: 12, format: "float32x3" },  // barycentric
          { shaderLocation: 2, offset: 24, format: "float32x3" },  // color
          { shaderLocation: 3, offset: 36, format: "float32x3" },  // normal
        ],
      }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_lit",
      targets: [{
        format: canvasFormat,
        blend: {
          color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
          alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
        },
      }],
    },
    primitive: {
      topology: "triangle-list",
      cullMode: "back",
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      depthBias: 1,
      depthBiasSlopeScale: 0.5,
      format: "depth24plus",
    },
  });

  const litNoDepthPipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 48, // 12 floats * 4 bytes
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" },   // position
          { shaderLocation: 1, offset: 12, format: "float32x3" },  // barycentric
          { shaderLocation: 2, offset: 24, format: "float32x3" },  // color
          { shaderLocation: 3, offset: 36, format: "float32x3" },  // normal
        ],
      }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_lit",
      targets: [{
        format: canvasFormat,
        blend: {
          color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
          alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
        },
      }],
    },
    primitive: {
      topology: "triangle-list",
      cullMode: "back",
    },
    depthStencil: {
      depthWriteEnabled: false,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  const wireframePipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: {
      module: shaderModule,
      entryPoint: "vs_line",
      buffers: [{
        arrayStride: 48, // 12 floats * 4 bytes
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" },   // position
        ],
      }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_line",
      targets: [{ format: canvasFormat }],
    },
    primitive: {
      topology: "line-list",
      cullMode: "back",
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less-equal",
      format: "depth24plus",
    },
  });

  const uniformBuffer = device.createBuffer({
    size: 80,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Storage buffer for model matrices
  const modelMatrixBuffer = device.createBuffer({
    size: maxInstances * 64,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const instanceColorBuffer = device.createBuffer({
    size: maxInstances * 16,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: { buffer: modelMatrixBuffer } },
      { binding: 2, resource: { buffer: instanceColorBuffer } },
    ],
  });

  const params = {
    numInstances: 100,
    cubeSize: 1.0,
    showWireframe: true,
    lineWidth: 0.75,
    fillOpacity: 1.0,
    alphaThreshold: 0.5,
    rotationSpeed: 1.0,
  };

  const gui = new GUI({ container: document.getElementById("gui-container") as HTMLElement, title: "Instancing Settings" });
  gui.add(params, "numInstances", [1, 10, 100, 1000, 10000, 100000, 1000000]).name("Num Objects");
  gui.add(params, "cubeSize", 0.2, 3.0).name("Object Size");
  gui.add(params, "rotationSpeed", 0.0, 3.0).name("Rotation Speed");
  gui.add(params, "showWireframe").name("Show Wireframe");
  gui.add(params, "lineWidth", 0.5, 5.0).name("Line Width");
  gui.add(params, "fillOpacity", 0.0, 1.0).name("Fill Opacity");
  gui.add(params, "alphaThreshold", 0.0, 1.0).name("Alpha Threshold");

  const aspect = canvas.width / canvas.height;
  const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);

  // Pre-allocate model matrices array for max instances
  const modelMatricesData = new Float32Array(maxInstances * 16);
  const instanceColorsData = new Float32Array(maxInstances * 4);

  let time = 0;

  // Track geometry group offsets and counts for batched rendering
  let geometryBatches: { geometryIndex: number; startInstance: number; instanceCount: number }[] = [];

  function updateModelMatrices() {
    // Reorganize matrices by geometry type for batched instancing
    const groups: number[][] = geometryTypes.map(() => []);

    for (let i = 0; i < params.numInstances; i++) {
      groups[instanceData[i].geometryIndex].push(i);
    }

    let offset = 0;
    geometryBatches = [];

    for (let geoIdx = 0; geoIdx < geometryTypes.length; geoIdx++) {
      const indices = groups[geoIdx];
      if (indices.length === 0) continue;

      geometryBatches.push({
        geometryIndex: geoIdx,
        startInstance: offset,
        instanceCount: indices.length,
      });

      for (const i of indices) {
        const { position } = instanceData[i];
        const { color } = instanceData[i];
        const [posX, posY, posZ] = position;

        const rotationOffset = i * 0.2;
        const angle = (time + rotationOffset) * params.rotationSpeed;

        const translation = mat4.translation(vec3.create(posX, posY, posZ));
        const rotationY = mat4.rotationY(angle);
        const rotationX = mat4.rotationX(angle * 0.5);
        const scale = mat4.scaling(vec3.create(params.cubeSize, params.cubeSize, params.cubeSize));

        let modelMatrix = mat4.multiply(translation, rotationY);
        modelMatrix = mat4.multiply(modelMatrix, rotationX);
        modelMatrix = mat4.multiply(modelMatrix, scale);

        modelMatricesData.set(modelMatrix as Float32Array, offset * 16);
        instanceColorsData.set(color, offset * 4);
        offset++;
      }
    }

    device.queue.writeBuffer(modelMatrixBuffer, 0, modelMatricesData);
    device.queue.writeBuffer(instanceColorBuffer, 0, instanceColorsData);
  }

  function render() {
    time += 0.01;

    updateModelMatrices();

    const cameraDistance = scatterSize * 1.0;
    const viewMatrix = mat4.lookAt(
      [cameraDistance * 0.5, cameraDistance * 0.4, cameraDistance * 0.8],
      [0, 0, 0],
      [0, 1, 0]
    );
    const viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix);

    device.queue.writeBuffer(uniformBuffer, 0, viewProjectionMatrix as Float32Array);
    device.queue.writeBuffer(uniformBuffer, 64, new Float32Array([
      params.lineWidth,
      params.fillOpacity,
      params.showWireframe ? 1.0 : 0.0,
      params.alphaThreshold,
    ]));

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

    renderPass.setPipeline(params.fillOpacity < 1.0 ? litNoDepthPipeline : litPipeline);
    renderPass.setBindGroup(0, bindGroup);

    // Render each geometry type with batched instancing
    for (const batch of geometryBatches) {
      renderPass.setVertexBuffer(0, vertexBuffers[batch.geometryIndex]);
      renderPass.draw(
        geometryTypes[batch.geometryIndex].data.vertexCount,
        batch.instanceCount,
        0,
        batch.startInstance
      );
    }

    if (params.showWireframe) {
      renderPass.setPipeline(wireframePipeline);
      renderPass.setBindGroup(0, bindGroup);
      for (const batch of geometryBatches) {
        renderPass.setVertexBuffer(0, vertexBuffers[batch.geometryIndex]);
        const lineIndex = lineIndexBuffers[batch.geometryIndex];
        renderPass.setIndexBuffer(lineIndex.buffer, "uint32");
        renderPass.drawIndexed(
          lineIndex.indexCount,
          batch.instanceCount,
          0,
          0,
          batch.startInstance
        );
      }
    }

    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

init().catch(console.error);
