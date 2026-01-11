import { initWebGPU } from "./utils/webgpu-util";
import { mat4 } from "wgpu-matrix";
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

// Procedural Cone Generator
// A cone is just a cylinder with radiusTop = 0
function createConeGeometry(
  radius: number = 1,
  height: number = 2,
  radialSegments: number = 32,
  heightSegments: number = 1,
  openEnded: boolean = false,
  thetaStart: number = 0,
  thetaLength: number = Math.PI * 2
) {
  const positions: number[] = [];
  const indicesLine: number[] = [];
  const indicesTri: number[] = [];
  let index = 0;
  const indexArray: number[][] = [];

  const halfHeight = height / 2;
  const radiusTop = 0;
  const radiusBottom = radius;

  // 1. Generate Torso (Side Wall)
  for (let y = 0; y <= heightSegments; y++) {
    const indexRow: number[] = [];
    const v = y / heightSegments;
    const currentRadius = v * (radiusBottom - radiusTop) + radiusTop;

    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments;
      const theta = u * thetaLength + thetaStart;

      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      positions.push(currentRadius * sinTheta, -v * height + halfHeight, currentRadius * cosTheta);
      indexRow.push(index++);
    }
    indexArray.push(indexRow);
  }

  // Generate indices for the torso
  for (let x = 0; x < radialSegments; x++) {
    for (let y = 0; y < heightSegments; y++) {
      const a = indexArray[y][x];
      const b = indexArray[y + 1][x];
      const c = indexArray[y + 1][x + 1];
      const d = indexArray[y][x + 1];

      // --- Wireframe ---
      indicesLine.push(a, b); // Vertical
      indicesLine.push(b, c); // Horizontal (Bottom)
      if (y === 0) indicesLine.push(a, d); // Top Horizontal (only if visible, but at top it's a point)
      indicesLine.push(d, c); // Right Vertical
      indicesLine.push(a, c); // Diagonal

      // --- Solid ---
      // For the top row (y=0) of a cone, 'a' and 'd' are the same point (apex).
      // Triangle `a, b, d` is degenerate. We only need `b, c, d`.
      if (y !== 0) {
        indicesTri.push(a, b, d);
      }
      indicesTri.push(b, c, d);
    }
  }

  // 2. Generate Cap (Bottom only)
  if (!openEnded && radiusBottom > 0) {
    generateCap();
  }

  function generateCap() {
    const centerIndexStart = index;
    const sign = -1; // Bottom

    // Center vertex
    positions.push(0, halfHeight * sign, 0);
    index++;

    const centerIndex = centerIndexStart;

    // Loop around
    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments;
      const theta = u * thetaLength + thetaStart;

      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      positions.push(radius * sinTheta, halfHeight * sign, radius * cosTheta);
      
      const current = index++;
      
      // --- Wireframe ---
      indicesLine.push(centerIndex, current);
      if (x > 0) {
        indicesLine.push(current - 1, current);
      }

      // --- Solid ---
      if (x > 0) {
        indicesTri.push(centerIndex, current, current - 1);
      }
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
    height: 2,
    radialSegments: 32,
    heightSegments: 4,
    openEnded: false,
    thetaStart: 0,
    thetaLength: 2, // x PI
    wireframe: true,
  };

  let indexCount = 0;

  function updateGeometry() {
    const data = createConeGeometry(
      params.radius,
      params.height,
      Math.floor(params.radialSegments),
      Math.floor(params.heightSegments),
      params.openEnded,
      params.thetaStart * Math.PI,
      params.thetaLength * Math.PI
    );
    
    device.queue.writeBuffer(vertexBuffer, 0, data.positions);
    
    const indices = params.wireframe ? data.indicesLine : data.indicesTri;
    device.queue.writeBuffer(indexBuffer, 0, indices);
    
    indexCount = indices.length;
  }

  const gui = new GUI({ 
    container: document.getElementById('gui-container') as HTMLElement,
    title: 'Cone Settings'
  });
  gui.add(params, 'radius', 0, 3).onChange(updateGeometry);
  gui.add(params, 'height', 0.1, 5).onChange(updateGeometry);
  gui.add(params, 'radialSegments', 3, 64, 1).onChange(updateGeometry);
  gui.add(params, 'heightSegments', 1, 32, 1).onChange(updateGeometry);
  gui.add(params, 'openEnded').onChange(updateGeometry);
  gui.add(params, 'thetaStart', 0, 2).name('thetaStart (x PI)').onChange(updateGeometry);
  gui.add(params, 'thetaLength', 0, 2).name('thetaLength (x PI)').onChange(updateGeometry);
  gui.add(params, 'wireframe').name('Wireframe').onChange(updateGeometry);

  updateGeometry();

  let angle = 0;
  function render() {
    angle += 0.005;
    
    const viewMatrix = mat4.lookAt([4, 4, 4], [0, 0, 0], [0, 1, 0]);
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