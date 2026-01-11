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

// Procedural Box Generator (Wireframe)
function createBoxWireframe(
  width: number = 1,
  height: number = 1,
  depth: number = 1,
  widthSegments: number = 1,
  heightSegments: number = 1,
  depthSegments: number = 1
) {
  const positions: number[] = [];
  const indices: number[] = [];

  // Helper to build a plane for each face
  // u, v are the axes (0=x, 1=y, 2=z)
  // uDir, vDir are directions (1 or -1)
  // width, height are dimensions for this face
  // gridX, gridY are segments
  function buildPlane(
    u: number, v: number, w: number, 
    uDir: number, vDir: number, 
    width: number, height: number, depth: number,
    gridX: number, gridY: number
  ) {
    const segmentWidth = width / gridX;
    const segmentHeight = height / gridY;

    const widthHalf = width / 2;
    const heightHalf = height / 2;
    const depthHalf = depth / 2;

    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;

    let vertexCounter = 0;
    const startIndex = positions.length / 3;

    // Generate Vertices
    for (let iy = 0; iy < gridY1; iy++) {
      const y = iy * segmentHeight - heightHalf;

      for (let ix = 0; ix < gridX1; ix++) {
        const x = ix * segmentWidth - widthHalf;

        // Position vector components
        const vector = [0, 0, 0];
        vector[u] = x * uDir;
        vector[v] = y * vDir;
        vector[w] = depthHalf;

        positions.push(vector[0], vector[1], vector[2]);
        vertexCounter += 1;
      }
    }

    // Generate Indices (Line List)
    for (let iy = 0; iy < gridY; iy++) {
      for (let ix = 0; ix < gridX; ix++) {
        const a = startIndex + ix + gridX1 * iy;
        const b = startIndex + ix + gridX1 * (iy + 1);
        const c = startIndex + (ix + 1) + gridX1 * (iy + 1);
        const d = startIndex + (ix + 1) + gridX1 * iy;

        // Draw quad edges
        // a -> d (Top)
        indices.push(a, d);
        // a -> b (Left)
        indices.push(a, b);
        
        // Diagonal (a -> c)
        indices.push(a, c);

        // Closing edges for the last row/col
        if (iy === gridY - 1) {
          indices.push(b, c); // Bottom
        }
        if (ix === gridX - 1) {
          indices.push(d, c); // Right
        }
      }
    }
  }

  // 1. Right Face (+x)
  buildPlane(2, 1, 0, -1, -1, depth, height, width, depthSegments, heightSegments);
  // 2. Left Face (-x)
  buildPlane(2, 1, 0, 1, -1, depth, height, -width, depthSegments, heightSegments);
  // 3. Top Face (+y)
  buildPlane(0, 2, 1, 1, 1, width, depth, height, widthSegments, depthSegments);
  // 4. Bottom Face (-y)
  buildPlane(0, 2, 1, 1, -1, width, depth, -height, widthSegments, depthSegments);
  // 5. Front Face (+z)
  buildPlane(0, 1, 2, 1, -1, width, height, depth, widthSegments, heightSegments);
  // 6. Back Face (-z)
  buildPlane(0, 1, 2, -1, -1, width, height, -depth, widthSegments, heightSegments);

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
  const maxIndices = 200000;
  
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
    width: 1.5,
    height: 1.5,
    depth: 1.5,
    widthSegments: 2,
    heightSegments: 2,
    depthSegments: 2,
  };

  let indexCount = 0;

  function updateGeometry() {
    const data = createBoxWireframe(
      params.width,
      params.height,
      params.depth,
      Math.floor(params.widthSegments),
      Math.floor(params.heightSegments),
      Math.floor(params.depthSegments)
    );
    
    device.queue.writeBuffer(vertexBuffer, 0, data.positions);
    device.queue.writeBuffer(indexBuffer, 0, data.indices);
    indexCount = data.indices.length;
  }

  const gui = new GUI({ 
    container: document.getElementById('gui-container') as HTMLElement,
    title: 'Box Settings'
  });
  gui.add(params, 'width', 0.1, 3.0).onChange(updateGeometry);
  gui.add(params, 'height', 0.1, 3.0).onChange(updateGeometry);
  gui.add(params, 'depth', 0.1, 3.0).onChange(updateGeometry);
  gui.add(params, 'widthSegments', 1, 10, 1).onChange(updateGeometry);
  gui.add(params, 'heightSegments', 1, 10, 1).onChange(updateGeometry);
  gui.add(params, 'depthSegments', 1, 10, 1).onChange(updateGeometry);

  updateGeometry();

  let angle = 0;
  function render() {
    angle += 0.005;
    
    const viewMatrix = mat4.lookAt([3, 3, 3], [0, 0, 0], [0, 1, 0]);
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
