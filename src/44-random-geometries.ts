import { initWebGPU } from "./utils/webgpu-util";
import { mat4, vec3 } from "wgpu-matrix";
import GUI from "lil-gui";

const shaderCode = `
struct Uniforms {
  worldViewProjectionMatrix : mat4x4f,
  color : vec4f,
}

struct LineUniforms {
  thickness : f32,
  alphaThreshold : f32,
}

@group(0) @binding(0) var<uniform> uni : Uniforms;
@group(0) @binding(1) var<uniform> line : LineUniforms;
@group(0) @binding(2) var<storage, read> positions : array<f32>;
@group(0) @binding(3) var<storage, read> indices : array<u32>;

struct VSOutput {
  @builtin(position) position : vec4f,
  @location(0) barycentricCoord : vec3f,
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

  var vsOut : VSOutput;
  vsOut.position = uni.worldViewProjectionMatrix * position;

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
  let a = 1.0 - edgeFactor(v.barycentricCoord);
  if (a < line.alphaThreshold) {
    discard;
  }
  return vec4f(uni.color.rgb * a, a);
}
`;

// ============ Indexed Geometry Generators ============

interface IndexedGeometry {
  positions: Float32Array;
  indices: Uint32Array;
  indexCount: number;
}

function createBoxGeometry(): IndexedGeometry {
  // 8 vertices for a cube
  const positions = new Float32Array([
    -0.5, -0.5, -0.5,  // 0
     0.5, -0.5, -0.5,  // 1
     0.5,  0.5, -0.5,  // 2
    -0.5,  0.5, -0.5,  // 3
    -0.5, -0.5,  0.5,  // 4
     0.5, -0.5,  0.5,  // 5
     0.5,  0.5,  0.5,  // 6
    -0.5,  0.5,  0.5,  // 7
  ]);

  // 12 triangles (6 faces * 2 triangles)
  const indices = new Uint32Array([
    // Front
    0, 1, 2, 0, 2, 3,
    // Back
    5, 4, 7, 5, 7, 6,
    // Top
    3, 2, 6, 3, 6, 7,
    // Bottom
    4, 5, 1, 4, 1, 0,
    // Right
    1, 5, 6, 1, 6, 2,
    // Left
    4, 0, 3, 4, 3, 7,
  ]);

  return { positions, indices, indexCount: indices.length };
}

function createSphereGeometry(radius = 0.5, widthSegments = 16, heightSegments = 12): IndexedGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  // Generate vertices
  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const phi = v * Math.PI;

    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const theta = u * Math.PI * 2;

      positions.push(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }
  }

  // Generate indices
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

  return { positions: new Float32Array(positions), indices: new Uint32Array(indices), indexCount: indices.length };
}

function createCylinderGeometry(radiusTop = 0.5, radiusBottom = 0.5, height = 1, radialSegments = 16): IndexedGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const halfHeight = height / 2;

  // Side vertices
  for (let y = 0; y <= 1; y++) {
    const radius = y === 0 ? radiusTop : radiusBottom;
    const posY = y === 0 ? halfHeight : -halfHeight;

    for (let x = 0; x <= radialSegments; x++) {
      const theta = (x / radialSegments) * Math.PI * 2;
      positions.push(radius * Math.sin(theta), posY, radius * Math.cos(theta));
    }
  }

  // Side indices
  for (let x = 0; x < radialSegments; x++) {
    const a = x, b = x + radialSegments + 1, c = x + 1, d = b + 1;
    indices.push(a, b, c, c, b, d);
  }

  // Top cap
  if (radiusTop > 0) {
    const centerIdx = positions.length / 3;
    positions.push(0, halfHeight, 0);
    const ringStart = positions.length / 3;

    for (let x = 0; x <= radialSegments; x++) {
      const theta = (x / radialSegments) * Math.PI * 2;
      positions.push(radiusTop * Math.sin(theta), halfHeight, radiusTop * Math.cos(theta));
    }

    for (let x = 0; x < radialSegments; x++) {
      indices.push(centerIdx, ringStart + x, ringStart + x + 1);
    }
  }

  // Bottom cap
  if (radiusBottom > 0) {
    const centerIdx = positions.length / 3;
    positions.push(0, -halfHeight, 0);
    const ringStart = positions.length / 3;

    for (let x = 0; x <= radialSegments; x++) {
      const theta = (x / radialSegments) * Math.PI * 2;
      positions.push(radiusBottom * Math.sin(theta), -halfHeight, radiusBottom * Math.cos(theta));
    }

    for (let x = 0; x < radialSegments; x++) {
      indices.push(centerIdx, ringStart + x + 1, ringStart + x);
    }
  }

  return { positions: new Float32Array(positions), indices: new Uint32Array(indices), indexCount: indices.length };
}

function createConeGeometry(radius = 0.5, height = 1, radialSegments = 16): IndexedGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const halfHeight = height / 2;

  // Apex
  positions.push(0, halfHeight, 0);

  // Base ring
  for (let x = 0; x <= radialSegments; x++) {
    const theta = (x / radialSegments) * Math.PI * 2;
    positions.push(radius * Math.sin(theta), -halfHeight, radius * Math.cos(theta));
  }

  // Side triangles
  for (let x = 0; x < radialSegments; x++) {
    indices.push(0, x + 2, x + 1);
  }

  // Bottom cap
  const centerIdx = positions.length / 3;
  positions.push(0, -halfHeight, 0);

  for (let x = 0; x < radialSegments; x++) {
    indices.push(centerIdx, x + 1, x + 2);
  }

  return { positions: new Float32Array(positions), indices: new Uint32Array(indices), indexCount: indices.length };
}

function createTorusGeometry(radius = 0.4, tube = 0.15, radialSegments = 8, tubularSegments = 16): IndexedGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= radialSegments; j++) {
    for (let i = 0; i <= tubularSegments; i++) {
      const u = (i / tubularSegments) * Math.PI * 2;
      const v = (j / radialSegments) * Math.PI * 2;
      positions.push(
        (radius + tube * Math.cos(v)) * Math.cos(u),
        (radius + tube * Math.cos(v)) * Math.sin(u),
        tube * Math.sin(v)
      );
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

  return { positions: new Float32Array(positions), indices: new Uint32Array(indices), indexCount: indices.length };
}

function createTorusKnotGeometry(radius = 0.4, tube = 0.1, tubularSegments = 64, radialSegments = 8, p = 2, q = 3): IndexedGeometry {
  const positions: number[] = [];
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
      positions.push(p1[0] + cx * N2[0] + cy * B[0], p1[1] + cx * N2[1] + cy * B[1], p1[2] + cx * N2[2] + cy * B[2]);
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

  return { positions: new Float32Array(positions), indices: new Uint32Array(indices), indexCount: indices.length };
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
    createCylinderGeometry(0.5, 0.5, 1, 16),
    createConeGeometry(0.5, 1, 16),
    createTorusGeometry(0.4, 0.15, 8, 16),
    createTorusKnotGeometry(0.4, 0.1, 64, 8, 2, 3),
  ];

  // Create GPU buffers for each geometry (positions as storage, indices as storage)
  const gpuGeometries = geometries.map((geo) => {
    const positionBuffer = device.createBuffer({
      size: geo.positions.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(positionBuffer, 0, geo.positions);

    const indexBuffer = device.createBuffer({
      size: geo.indices.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, geo.indices);

    return { positionBuffer, indexBuffer, indexCount: geo.indexCount };
  });

  // Line uniforms buffer (shared by all objects)
  const lineUniformBuffer = device.createBuffer({
    size: 8, // thickness (f32) + alphaThreshold (f32)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Bind group layout
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
      { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
      { binding: 3, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
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
    const scale = 1.0 + Math.random() * 2.0;
    const color: [number, number, number, number] = [Math.random(), Math.random(), Math.random(), 1.0];

    // Per-object uniform buffer: mat4x4f (64) + color vec4f (16) = 80 bytes
    const uniformBuffer = device.createBuffer({
      size: 80,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const geo = gpuGeometries[geometryIndex];
    const bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: lineUniformBuffer } },
        { binding: 2, resource: { buffer: geo.positionBuffer } },
        { binding: 3, resource: { buffer: geo.indexBuffer } },
      ],
    });

    return { geometryIndex, position, rotation, scale, color, uniformBuffer, bindGroup };
  }

  function generateObjects(count: number) {
    // Destroy old uniform buffers
    objects.forEach(obj => obj.uniformBuffer.destroy());
    objects = [];

    for (let i = 0; i < count; i++) {
      const geometryIndex = Math.floor(Math.random() * geometries.length);
      objects.push(createObject(geometryIndex));
    }
  }

  const params = {
    count: 10,
    thickness: 1.5,
    alphaThreshold: 0.5,
    regenerate: () => generateObjects(params.count),
  };

  generateObjects(params.count);

  const gui = new GUI({ container: document.getElementById("gui-container") as HTMLElement });
  gui.add(params, "count", 1, 100, 1).name("Object Count").onChange(() => generateObjects(params.count));
  gui.add(params, "thickness", 0.5, 5.0).name("Line Thickness");
  gui.add(params, "alphaThreshold", 0.0, 1.0).name("Alpha Threshold");
  gui.add(params, "regenerate").name("Regenerate");

  const aspect = canvas.width / canvas.height;
  const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 500.0);

  let time = 0;

  function render() {
    time += 0.01;

    // Update line uniforms
    device.queue.writeBuffer(lineUniformBuffer, 0, new Float32Array([params.thickness, params.alphaThreshold]));

    // Camera
    const camRadius = 80;
    const camX = Math.sin(time * 0.5) * camRadius;
    const camZ = Math.cos(time * 0.5) * camRadius;
    const viewMatrix = mat4.lookAt([camX, 30, camZ], [0, 0, 0], [0, 1, 0]);
    const viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix);

    // Update per-object uniforms
    for (const obj of objects) {
      const modelMatrix = mat4.identity();
      mat4.translate(modelMatrix, obj.position, modelMatrix);
      mat4.rotateX(modelMatrix, obj.rotation[0] + time, modelMatrix);
      mat4.rotateY(modelMatrix, obj.rotation[1] + time * 0.7, modelMatrix);
      mat4.rotateZ(modelMatrix, obj.rotation[2] + time * 0.3, modelMatrix);
      mat4.scale(modelMatrix, [obj.scale, obj.scale, obj.scale], modelMatrix);

      const worldViewProjectionMatrix = mat4.multiply(viewProjectionMatrix, modelMatrix);

      device.queue.writeBuffer(obj.uniformBuffer, 0, worldViewProjectionMatrix as Float32Array);
      device.queue.writeBuffer(obj.uniformBuffer, 64, new Float32Array(obj.color));
    }

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

    // Render each object by switching bind groups
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
