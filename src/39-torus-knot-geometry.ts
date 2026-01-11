import { initWebGPU } from "./utils/webgpu-util";
import { mat4, vec3 } from "wgpu-matrix";
import GUI from "lil-gui";

const shaderCode = `
struct Uniforms {
  mvpMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
}

@vertex
fn vs_main(@location(0) pos : vec3f) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  return out;
}

@fragment
fn fs_wireframe() -> @location(0) vec4f {
  return vec4f(1.0, 1.0, 1.0, 1.0); // White lines
}

@fragment
fn fs_solid() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 0.5); // Transparent Red
}
`;

// Procedural Torus Knot Generator
function createTorusKnotGeometry(
  radius: number = 1,
  tube: number = 0.4,
  tubularSegments: number = 64,
  radialSegments: number = 8,
  p: number = 2,
  q: number = 3
) {
  const positions: number[] = [];
  const indicesLine: number[] = [];
  const indicesTri: number[] = [];

  // Helper to get position on the knot curve at angle u (0..2PI)
  function getKnotPosition(u: number) {
    const cu = Math.cos(u);
    const su = Math.sin(u);
    const quOverP = (q / p) * u;
    const cs = Math.cos(quOverP);

    const x = radius * (2 + cs) * 0.5 * cu;
    const y = radius * (2 + cs) * 0.5 * su;
    const z = radius * Math.sin(quOverP) * 0.5;

    return [x, y, z];
  }

  // Generate Vertices
  for (let i = 0; i <= tubularSegments; i++) {
    const u = (i / tubularSegments) * p * Math.PI * 2;
    const p1 = getKnotPosition(u);
    const p2 = getKnotPosition(u + 0.01); // Look ahead for tangent

    // Calculate basis vectors (Tangent, Normal, Binormal)
    const T = vec3.normalize(vec3.sub(p2, p1));
    const N = vec3.normalize(vec3.add(p1, p2)); // Approximate normal
    const B = vec3.normalize(vec3.cross(T, N));
    const N_corrected = vec3.cross(B, T);

    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      
      const cx = -tube * Math.cos(v);
      const cy = tube * Math.sin(v);

      // P = P1 + (cx * N + cy * B)
      const x = p1[0] + (cx * N_corrected[0] + cy * B[0]);
      const y = p1[1] + (cx * N_corrected[1] + cy * B[1]);
      const z = p1[2] + (cx * N_corrected[2] + cy * B[2]);

      positions.push(x, y, z);
    }
  }

  // Generate Indices
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = (radialSegments + 1) * i + j;
      const b = (radialSegments + 1) * (i + 1) + j;
      const c = (radialSegments + 1) * (i + 1) + j + 1;
      const d = (radialSegments + 1) * i + j + 1;

      // --- Wireframe (Line List) ---
      indicesLine.push(a, b); // Vertical
      indicesLine.push(a, d); // Horizontal
      indicesLine.push(a, c); // Diagonal

      // --- Solid (Triangle List) ---
      indicesTri.push(a, b, d);
      indicesTri.push(b, c, d);
    }
  }

  return {
    positions: new Float32Array(positions),
    indicesLine: new Uint16Array(indicesLine),
    indicesTri: new Uint16Array(indicesTri),
  };
}

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  const shaderModule = device.createShaderModule({ code: shaderCode });

  // --- Layout ---
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      buffer: { type: "uniform" },
    }],
  });

  // --- Pipeline 1: Wireframe ---
  const pipelineWireframe = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 12,
        attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
      }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_wireframe",
      targets: [{ format: canvasFormat }],
    },
    primitive: { topology: "line-list" },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  // --- Pipeline 2: Solid (Transparent) ---
  const pipelineSolid = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 12,
        attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
      }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_solid",
      targets: [{
        format: canvasFormat,
        blend: {
          color: {
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha",
            operation: "add",
          },
          alpha: {
            srcFactor: "one",
            dstFactor: "zero",
            operation: "add",
          },
        },
      }],
    },
    primitive: { topology: "triangle-list", cullMode: "none" },
    depthStencil: {
      depthWriteEnabled: false,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  // --- Buffers ---
  const maxVerts = 100000;
  const maxIndices = 600000;
  
  const vertexBuffer = device.createBuffer({
    size: maxVerts * 12,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  const indexBuffer = device.createBuffer({
    size: maxIndices * 2,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });

  const uniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const aspect = canvas.width / canvas.height;
  const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);
  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  // --- State & GUI ---
  const params = {
    radius: 1,
    tube: 0.3,
    tubularSegments: 64,
    radialSegments: 8,
    p: 2,
    q: 3,
    wireframe: true,
  };

  let indexCount = 0;

  function updateGeometry() {
    const data = createTorusKnotGeometry(
      params.radius,
      params.tube,
      Math.floor(params.tubularSegments),
      Math.floor(params.radialSegments),
      Math.floor(params.p),
      Math.floor(params.q)
    );
    
    device.queue.writeBuffer(vertexBuffer, 0, data.positions);
    
    const indices = params.wireframe ? data.indicesLine : data.indicesTri;
    device.queue.writeBuffer(indexBuffer, 0, indices);
    
    indexCount = indices.length;
  }

  const gui = new GUI({ 
    container: document.getElementById('gui-container') as HTMLElement,
    title: 'Knot Settings'
  });
  gui.add(params, 'radius', 0.1, 3.0).onChange(updateGeometry);
  gui.add(params, 'tube', 0.1, 3.0).onChange(updateGeometry);
  gui.add(params, 'tubularSegments', 3, 200, 1).onChange(updateGeometry);
  gui.add(params, 'radialSegments', 3, 32, 1).onChange(updateGeometry);
  gui.add(params, 'p', 1, 10, 1).name('P (Winds)').onChange(updateGeometry);
  gui.add(params, 'q', 1, 10, 1).name('Q (Loops)').onChange(updateGeometry);
  gui.add(params, 'wireframe').name('Wireframe').onChange(updateGeometry);

  updateGeometry();

  let angle = 0;
  function render() {
    angle += 0.005;
    
    const viewMatrix = mat4.lookAt([0, 0, 5], [0, 0, 0], [0, 1, 0]);
    const modelMatrix = mat4.multiply(mat4.rotationY(angle), mat4.rotationX(angle * 0.5));
    const mvpMatrix = mat4.multiply(projectionMatrix, mat4.multiply(viewMatrix, modelMatrix));

    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as Float32Array);

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

    renderPass.setPipeline(params.wireframe ? pipelineWireframe : pipelineSolid);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer, "uint16");
    renderPass.drawIndexed(indexCount);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

init().catch(console.error);