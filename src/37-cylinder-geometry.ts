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

// Procedural Cylinder Generator with Barycentric Coordinates
function createCylinderGeometry(
  radiusTop: number = 1,
  radiusBottom: number = 1,
  height: number = 2,
  radialSegments: number = 32,
  heightSegments: number = 1,
  openEnded: boolean = false,
  thetaStart: number = 0,
  thetaLength: number = Math.PI * 2
) {
  // For barycentric coords, we need non-indexed geometry
  const vertices: number[] = []; // Interleaved: pos(3) + bary(3) = 6 floats per vertex

  // Temporary storage for indexed positions
  const tempPositions: number[][] = [];
  const indexArray: number[][] = [];

  // Helper to add a triangle with barycentric coordinates
  function addTriangle(aIdx: number, bIdx: number, cIdx: number) {
    const posA = tempPositions[aIdx];
    const posB = tempPositions[bIdx];
    const posC = tempPositions[cIdx];

    vertices.push(posA[0], posA[1], posA[2], 1, 0, 0);
    vertices.push(posB[0], posB[1], posB[2], 0, 1, 0);
    vertices.push(posC[0], posC[1], posC[2], 0, 0, 1);
  }

  // 1. Generate Torso (Side Wall) positions
  const halfHeight = height / 2;

  for (let y = 0; y <= heightSegments; y++) {
    const indexRow: number[] = [];
    const v = y / heightSegments;
    const radius = v * (radiusBottom - radiusTop) + radiusTop;

    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments;
      const theta = u * thetaLength + thetaStart;

      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      tempPositions.push([
        radius * sinTheta,
        -v * height + halfHeight,
        radius * cosTheta,
      ]);
      indexRow.push(tempPositions.length - 1);
    }
    indexArray.push(indexRow);
  }

  // Generate triangles for the torso
  for (let x = 0; x < radialSegments; x++) {
    for (let y = 0; y < heightSegments; y++) {
      const a = indexArray[y][x];
      const b = indexArray[y + 1][x];
      const c = indexArray[y + 1][x + 1];
      const d = indexArray[y][x + 1];

      addTriangle(a, b, d);
      addTriangle(b, c, d);
    }
  }

  // 2. Generate Caps
  if (!openEnded && radiusTop > 0) {
    generateCap(true);
  }
  if (!openEnded && radiusBottom > 0) {
    generateCap(false);
  }

  function generateCap(top: boolean) {
    const radius = top ? radiusTop : radiusBottom;
    const sign = top ? 1 : -1;

    // Center vertex
    const centerIdx = tempPositions.length;
    tempPositions.push([0, halfHeight * sign, 0]);

    // Ring vertices
    const ringStartIdx = tempPositions.length;
    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments;
      const theta = u * thetaLength + thetaStart;

      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      tempPositions.push([
        radius * sinTheta,
        halfHeight * sign,
        radius * cosTheta,
      ]);
    }

    // Generate triangles (triangle fan)
    for (let x = 0; x < radialSegments; x++) {
      const curr = ringStartIdx + x;
      const next = ringStartIdx + x + 1;

      if (top) {
        addTriangle(centerIdx, curr, next);
      } else {
        addTriangle(centerIdx, next, curr);
      }
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
  const maxVerts = 100000;

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
    radiusTop: 1,
    radiusBottom: 1,
    height: 2,
    radialSegments: 32,
    heightSegments: 4,
    openEnded: false,
    thetaStart: 0,
    thetaLength: 2,
    showWireframe: true,
    lineWidth: 1.5,
    fillOpacity: 0.3,
  };

  let vertexCount = 0;

  function updateGeometry() {
    const data = createCylinderGeometry(
      params.radiusTop,
      params.radiusBottom,
      params.height,
      Math.floor(params.radialSegments),
      Math.floor(params.heightSegments),
      params.openEnded,
      params.thetaStart * Math.PI,
      params.thetaLength * Math.PI
    );

    device.queue.writeBuffer(vertexBuffer, 0, data.vertices);
    vertexCount = data.vertexCount;
  }

  const gui = new GUI({
    container: document.getElementById("gui-container") as HTMLElement,
    title: "Cylinder Settings",
  });
  gui.add(params, "radiusTop", 0, 3).onChange(updateGeometry);
  gui.add(params, "radiusBottom", 0, 3).onChange(updateGeometry);
  gui.add(params, "height", 0.1, 5).onChange(updateGeometry);
  gui.add(params, "radialSegments", 3, 64, 1).onChange(updateGeometry);
  gui.add(params, "heightSegments", 1, 32, 1).onChange(updateGeometry);
  gui.add(params, "openEnded").onChange(updateGeometry);
  gui
    .add(params, "thetaStart", 0, 2)
    .name("thetaStart (x PI)")
    .onChange(updateGeometry);
  gui
    .add(params, "thetaLength", 0, 2)
    .name("thetaLength (x PI)")
    .onChange(updateGeometry);
  gui.add(params, "showWireframe").name("Show Wireframe");
  gui.add(params, "lineWidth", 0.5, 5.0).name("Line Width");
  gui.add(params, "fillOpacity", 0.0, 1.0).name("Fill Opacity");

  updateGeometry();

  let angle = 0;
  function render() {
    angle += 0.005;

    const viewMatrix = mat4.lookAt([4, 4, 4], [0, 0, 0], [0, 1, 0]);
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