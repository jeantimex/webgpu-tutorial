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
fn fs_main() -> @location(0) vec4f {
  return vec4f(1.0, 1.0, 1.0, 1.0); // White lines
}
`;

// Procedural Sphere Generator
// Generates LINE indices that show the triangle structure
function createSphereTriangulatedWireframe(
  radius: number,
  widthSegments: number,
  heightSegments: number,
  phiStart: number,
  phiLength: number,
  thetaStart: number,
  thetaLength: number
) {
  const positions: number[] = [];
  const indices: number[] = [];

  const grid: number[][] = [];

  // Generate vertices
  for (let iy = 0; iy <= heightSegments; iy++) {
    const verticesRow: number[] = [];
    const v = iy / heightSegments;

    for (let ix = 0; ix <= widthSegments; ix++) {
      const u = ix / widthSegments;

      const px = -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
      const py = radius * Math.cos(thetaStart + v * thetaLength);
      const pz = radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);

      positions.push(px, py, pz);
      verticesRow.push(positions.length / 3 - 1);
    }
    grid.push(verticesRow);
  }

  // Generate indices (Line List)
  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = grid[iy][ix + 1];
      const b = grid[iy][ix];
      const c = grid[iy + 1][ix];
      const d = grid[iy + 1][ix + 1];

      // To show the triangle structure, we draw the edges of the two triangles
      // forming the quad: (b, c, d) and (b, d, a)
      
      // Horizontal (Top)
      indices.push(b, a);
      // Vertical (Left)
      indices.push(b, c);
      // Diagonal (Splitting the quad)
      indices.push(b, d);

      // Bottom and Right edges for the very last segments
      if (iy === heightSegments - 1) {
          indices.push(c, d);
      }
      if (ix === widthSegments - 1) {
          indices.push(a, d);
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    indices: new Uint16Array(indices),
  };
}

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // --- Pipeline ---
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 12,
        attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
      }],
    },
    fragment: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive: { topology: "line-list" },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  // --- Buffers ---
  const maxVerts = 100000;
  const maxIndices = 300000; // Increased for diagonals
  
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
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  // --- State & GUI ---
  const params = {
    radius: 1.5,
    widthSegments: 32,
    heightSegments: 16,
    phiStart: 0,
    phiLength: 2,
    thetaStart: 0,
    thetaLength: 1,
  };

  let indexCount = 0;

  function updateGeometry() {
    const data = createSphereTriangulatedWireframe(
      params.radius,
      params.widthSegments,
      params.heightSegments,
      params.phiStart * Math.PI,
      params.phiLength * Math.PI,
      params.thetaStart * Math.PI,
      params.thetaLength * Math.PI
    );
    
    device.queue.writeBuffer(vertexBuffer, 0, data.positions);
    device.queue.writeBuffer(indexBuffer, 0, data.indices);
    indexCount = data.indices.length;
  }

  const gui = new GUI({ 
    container: document.getElementById('gui-container') as HTMLElement,
    title: 'Sphere Settings'
  });
  gui.add(params, 'radius', 0.1, 3.0).onChange(updateGeometry);
  gui.add(params, 'widthSegments', 3, 64, 1).onChange(updateGeometry);
  gui.add(params, 'heightSegments', 2, 32, 1).onChange(updateGeometry);
  gui.add(params, 'phiStart', 0, 2).name('phiStart (x PI)').onChange(updateGeometry);
  gui.add(params, 'phiLength', 0, 2).name('phiLength (x PI)').onChange(updateGeometry);
  gui.add(params, 'thetaStart', 0, 1).name('thetaStart (x PI)').onChange(updateGeometry);
  gui.add(params, 'thetaLength', 0, 1).name('thetaLength (x PI)').onChange(updateGeometry);

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

    renderPass.setPipeline(pipeline);
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
