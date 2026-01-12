import { initWebGPU } from "./utils/webgpu-util";
import { mat4 } from "wgpu-matrix";
import GUI from "lil-gui";

const shaderCode = `
struct Uniforms {
  mvpMatrix : mat4x4f,
  lineWidth : f32,
  fillOpacity : f32,
  showWireframe : f32,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) barycentric : vec3f,
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) barycentric : vec3f
) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  out.barycentric = barycentric;
  return out;
}

// Edge detection using barycentric coordinates
fn edgeFactor(bary : vec3f, width : f32) -> f32 {
  let d = fwidth(bary);
  let a3 = smoothstep(vec3f(0.0), d * width, bary);
  return min(min(a3.x, a3.y), a3.z);
}

@fragment
fn fs_main(@location(0) bary : vec3f) -> @location(0) vec4f {
  let edge = 1.0 - edgeFactor(bary, uniforms.lineWidth);

  // Wireframe color (white) and fill color (red)
  let wireColor = vec3f(1.0, 1.0, 1.0);
  let fillColor = vec3f(1.0, 0.2, 0.2);

  // Calculate wireframe alpha (only if wireframe is enabled)
  let wireAlpha = edge * uniforms.showWireframe;

  // Composite: wireframe over fill using "over" operator
  // Final = Wire * wireAlpha + Fill * fillAlpha * (1 - wireAlpha)
  let fillAlpha = uniforms.fillOpacity * (1.0 - wireAlpha);
  let totalAlpha = wireAlpha + fillAlpha;

  if (totalAlpha < 0.01) {
    discard;
  }

  // Premultiplied alpha blend
  let color = (wireColor * wireAlpha + fillColor * fillAlpha) / totalAlpha;

  return vec4f(color, totalAlpha);
}
`;

// Procedural Box Generator with Barycentric Coordinates
function createBoxGeometry(
  width: number = 1,
  height: number = 1,
  depth: number = 1,
  widthSegments: number = 1,
  heightSegments: number = 1,
  depthSegments: number = 1
) {
  // For barycentric coords, we need non-indexed geometry
  // Each triangle has 3 vertices with barycentric coords (1,0,0), (0,1,0), (0,0,1)
  const vertices: number[] = []; // Interleaved: pos(3) + bary(3) = 6 floats per vertex

  // Temporary storage for indexed geometry
  const tempPositions: number[][] = [];

  // Helper to build a plane for each face
  function buildPlane(
    u: number, v: number, w: number,
    uDir: number, vDir: number,
    planeWidth: number, planeHeight: number, planeDepth: number,
    gridX: number, gridY: number
  ) {
    const segmentWidth = planeWidth / gridX;
    const segmentHeight = planeHeight / gridY;

    const widthHalf = planeWidth / 2;
    const heightHalf = planeHeight / 2;
    const depthHalf = planeDepth / 2;

    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;

    const startIndex = tempPositions.length;

    // Generate vertex positions
    for (let iy = 0; iy < gridY1; iy++) {
      const y = iy * segmentHeight - heightHalf;
      for (let ix = 0; ix < gridX1; ix++) {
        const x = ix * segmentWidth - widthHalf;
        const pos = [0, 0, 0];
        pos[u] = x * uDir;
        pos[v] = y * vDir;
        pos[w] = depthHalf;
        tempPositions.push(pos);
      }
    }

    // Generate triangles with barycentric coordinates
    for (let iy = 0; iy < gridY; iy++) {
      for (let ix = 0; ix < gridX; ix++) {
        const a = startIndex + ix + gridX1 * iy;
        const b = startIndex + ix + gridX1 * (iy + 1);
        const c = startIndex + (ix + 1) + gridX1 * (iy + 1);
        const d = startIndex + (ix + 1) + gridX1 * iy;

        // Triangle 1: a, b, d
        const posA = tempPositions[a];
        const posB = tempPositions[b];
        const posD = tempPositions[d];

        // Vertex A with bary (1, 0, 0)
        vertices.push(posA[0], posA[1], posA[2], 1, 0, 0);
        // Vertex B with bary (0, 1, 0)
        vertices.push(posB[0], posB[1], posB[2], 0, 1, 0);
        // Vertex D with bary (0, 0, 1)
        vertices.push(posD[0], posD[1], posD[2], 0, 0, 1);

        // Triangle 2: b, c, d
        const posC = tempPositions[c];

        // Vertex B with bary (1, 0, 0)
        vertices.push(posB[0], posB[1], posB[2], 1, 0, 0);
        // Vertex C with bary (0, 1, 0)
        vertices.push(posC[0], posC[1], posC[2], 0, 1, 0);
        // Vertex D with bary (0, 0, 1)
        vertices.push(posD[0], posD[1], posD[2], 0, 0, 1);
      }
    }
  }

  // Build all 6 faces
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
    vertices: new Float32Array(vertices),
    vertexCount: vertices.length / 6, // 6 floats per vertex (pos + bary)
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
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      buffer: { type: "uniform" },
    }],
  });

  // --- Single Pipeline with Barycentric Wireframe ---
  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 24, // 6 floats: pos(3) + bary(3)
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" },  // position
          { shaderLocation: 1, offset: 12, format: "float32x3" }, // barycentric
        ],
      }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
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
            dstFactor: "one-minus-src-alpha",
            operation: "add",
          },
        },
      }],
    },
    primitive: { topology: "triangle-list", cullMode: "none" },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  // --- Buffers ---
  const maxVerts = 100000;

  const vertexBuffer = device.createBuffer({
    size: maxVerts * 24, // 6 floats per vertex
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  // Uniform buffer: mat4x4f (64) + lineWidth (4) + fillOpacity (4) = 72, aligned to 80
  const uniformBuffer = device.createBuffer({
    size: 80,
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
    width: 1.5,
    height: 1.5,
    depth: 1.5,
    widthSegments: 2,
    heightSegments: 2,
    depthSegments: 2,
    showWireframe: true,
    lineWidth: 1.5,
    fillOpacity: 0.3,
  };

  let vertexCount = 0;

  function updateGeometry() {
    const data = createBoxGeometry(
      params.width,
      params.height,
      params.depth,
      Math.floor(params.widthSegments),
      Math.floor(params.heightSegments),
      Math.floor(params.depthSegments)
    );

    device.queue.writeBuffer(vertexBuffer, 0, data.vertices);
    vertexCount = data.vertexCount;
  }

  const gui = new GUI({
    container: document.getElementById("gui-container") as HTMLElement,
    title: "Box Settings",
  });
  gui.add(params, "width", 0.1, 3.0).onChange(updateGeometry);
  gui.add(params, "height", 0.1, 3.0).onChange(updateGeometry);
  gui.add(params, "depth", 0.1, 3.0).onChange(updateGeometry);
  gui.add(params, "widthSegments", 1, 10, 1).onChange(updateGeometry);
  gui.add(params, "heightSegments", 1, 10, 1).onChange(updateGeometry);
  gui.add(params, "depthSegments", 1, 10, 1).onChange(updateGeometry);
  gui.add(params, "showWireframe").name("Show Wireframe");
  gui.add(params, "lineWidth", 0.5, 5.0).name("Line Width");
  gui.add(params, "fillOpacity", 0.0, 1.0).name("Fill Opacity");

  updateGeometry();

  let angle = 0;
  function render() {
    angle += 0.005;

    const viewMatrix = mat4.lookAt([3, 3, 3], [0, 0, 0], [0, 1, 0]);
    const modelMatrix = mat4.multiply(
      mat4.rotationY(angle),
      mat4.rotationX(angle * 0.5)
    );
    const mvpMatrix = mat4.multiply(
      projectionMatrix,
      mat4.multiply(viewMatrix, modelMatrix)
    );

    // Write uniforms: mvpMatrix + lineWidth + fillOpacity + showWireframe
    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as Float32Array);
    device.queue.writeBuffer(
      uniformBuffer,
      64,
      new Float32Array([
        params.lineWidth,
        params.fillOpacity,
        params.showWireframe ? 1.0 : 0.0,
      ])
    );

    const commandEncoder = device.createCommandEncoder();
    const textureView = context!.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
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
    renderPass.draw(vertexCount);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

init().catch(console.error);