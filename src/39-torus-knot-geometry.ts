import { initWebGPU } from "./utils/webgpu-util";
import { mat4, vec3 } from "wgpu-matrix";
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

// Procedural Torus Knot Generator with Barycentric Coordinates
function createTorusKnotGeometry(
  radius: number = 1,
  tube: number = 0.4,
  tubularSegments: number = 64,
  radialSegments: number = 8,
  p: number = 2,
  q: number = 3
) {
  // For barycentric coords, we need non-indexed geometry
  const vertices: number[] = []; // Interleaved: pos(3) + bary(3) = 6 floats per vertex

  // Temporary storage for indexed positions
  const tempPositions: number[][] = [];

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

      tempPositions.push([x, y, z]);
    }
  }

  // Helper to add a triangle with barycentric coordinates
  function addTriangle(aIdx: number, bIdx: number, cIdx: number) {
    const posA = tempPositions[aIdx];
    const posB = tempPositions[bIdx];
    const posC = tempPositions[cIdx];

    vertices.push(posA[0], posA[1], posA[2], 1, 0, 0);
    vertices.push(posB[0], posB[1], posB[2], 0, 1, 0);
    vertices.push(posC[0], posC[1], posC[2], 0, 0, 1);
  }

  // Generate Triangles
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = (radialSegments + 1) * i + j;
      const b = (radialSegments + 1) * (i + 1) + j;
      const c = (radialSegments + 1) * (i + 1) + j + 1;
      const d = (radialSegments + 1) * i + j + 1;

      addTriangle(a, b, d);
      addTriangle(b, c, d);
    }
  }

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
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      },
    ],
  });

  // --- Single Pipeline with Barycentric Wireframe ---
  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 24, // 6 floats: pos(3) + bary(3)
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x3" }, // position
            { shaderLocation: 1, offset: 12, format: "float32x3" }, // barycentric
          ],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [
        {
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
        },
      ],
    },
    primitive: { topology: "triangle-list", cullMode: "none" },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  // --- Buffers ---
  const maxVerts = 200000;

  const vertexBuffer = device.createBuffer({
    size: maxVerts * 24, // 6 floats per vertex
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  // Uniform buffer: mat4x4f (64) + lineWidth (4) + fillOpacity (4) + showWireframe (4) = 76, aligned to 80
  const uniformBuffer = device.createBuffer({
    size: 80,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const aspect = canvas.width / canvas.height;
  const projectionMatrix = mat4.perspective(
    (2 * Math.PI) / 5,
    aspect,
    0.1,
    100.0
  );
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
    showWireframe: true,
    lineWidth: 1.5,
    fillOpacity: 0.3,
  };

  let vertexCount = 0;

  function updateGeometry() {
    const data = createTorusKnotGeometry(
      params.radius,
      params.tube,
      Math.floor(params.tubularSegments),
      Math.floor(params.radialSegments),
      Math.floor(params.p),
      Math.floor(params.q)
    );

    device.queue.writeBuffer(vertexBuffer, 0, data.vertices);
    vertexCount = data.vertexCount;
  }

  const gui = new GUI({
    container: document.getElementById("gui-container") as HTMLElement,
    title: "Knot Settings",
  });
  gui.add(params, "radius", 0.1, 3.0).onChange(updateGeometry);
  gui.add(params, "tube", 0.1, 3.0).onChange(updateGeometry);
  gui.add(params, "tubularSegments", 3, 200, 1).onChange(updateGeometry);
  gui.add(params, "radialSegments", 3, 32, 1).onChange(updateGeometry);
  gui.add(params, "p", 1, 10, 1).name("P (Winds)").onChange(updateGeometry);
  gui.add(params, "q", 1, 10, 1).name("Q (Loops)").onChange(updateGeometry);
  gui.add(params, "showWireframe").name("Show Wireframe");
  gui.add(params, "lineWidth", 0.5, 5.0).name("Line Width");
  gui.add(params, "fillOpacity", 0.0, 1.0).name("Fill Opacity");

  updateGeometry();

  let angle = 0;
  function render() {
    angle += 0.005;

    const viewMatrix = mat4.lookAt([0, 0, 5], [0, 0, 0], [0, 1, 0]);
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