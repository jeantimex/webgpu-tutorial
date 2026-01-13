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
  @location(1) color : vec3f,
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) barycentric : vec3f,
  @location(2) color : vec3f,
) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  out.barycentric = barycentric;
  out.color = color;
  return out;
}

fn edgeFactor(bary : vec3f, width : f32) -> f32 {
  let d = fwidth(bary);
  let a3 = smoothstep(vec3f(0.0), d * width, bary);
  return min(min(a3.x, a3.y), a3.z);
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let edge = 1.0 - edgeFactor(in.barycentric, uniforms.lineWidth);

  let wireColor = vec3f(1.0, 1.0, 1.0);
  let fillColor = in.color;

  let wireAlpha = edge * uniforms.showWireframe;
  let fillAlpha = uniforms.fillOpacity * (1.0 - wireAlpha);
  let totalAlpha = wireAlpha + fillAlpha;

  if (totalAlpha < 0.01) {
    discard;
  }

  let color = (wireColor * wireAlpha + fillColor * fillAlpha) / totalAlpha;
  return vec4f(color, totalAlpha);
}
`;

function createJewelGeometry(
  radius: number,
  widthSegments: number,
  heightSegments: number
) {
  const vertices: number[] = []; // pos(3) + bary(3) + color(3) = 9 floats per vertex
  const tempPositions: number[][] = [];
  const grid: number[][] = [];

  // 1. Generate vertices
  for (let iy = 0; iy <= heightSegments; iy++) {
    const verticesRow: number[] = [];
    const v = iy / heightSegments;
    const uOffset = 0;

    for (let ix = 0; ix <= widthSegments; ix++) {
      const u = ix / widthSegments;

      const x = -radius * Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI);
      const y = radius * Math.cos(v * Math.PI);
      const z = radius * Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI);

      tempPositions.push([x, y, z]);
      verticesRow.push(tempPositions.length - 1);
    }
    grid.push(verticesRow);
  }

  // 2. Generate triangles with random face colors
  function addTriangle(a: number, b: number, c: number) {
    const pA = tempPositions[a];
    const pB = tempPositions[b];
    const pC = tempPositions[c];

    // Random color for this face (Jewel facet)
    // We'll make it a variation of a base color (e.g., ruby or sapphire)
    const hue = 0.9 + Math.random() * 0.1; // Reddish
    const sat = 0.8 + Math.random() * 0.2;
    const val = 0.4 + Math.random() * 0.6; // Vary brightness for "sparkle"
    
    // Simple HSV to RGB (approximate for red/pinkish)
    const r = val;
    const g = val * (1 - sat);
    const blue = val * (1 - sat);

    // Push 3 vertices
    vertices.push(...pA, 1, 0, 0, r, g, blue);
    vertices.push(...pB, 0, 1, 0, r, g, blue);
    vertices.push(...pC, 0, 0, 1, r, g, blue);
  }

  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = grid[iy][ix + 1];
      const b = grid[iy][ix];
      const c = grid[iy + 1][ix];
      const d = grid[iy + 1][ix + 1];

      if (iy !== 0) addTriangle(a, b, d);
      if (iy !== heightSegments - 1) addTriangle(b, c, d);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    vertexCount: vertices.length / 9,
  };
}

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  const shaderModule = device.createShaderModule({ code: shaderCode });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      buffer: { type: "uniform" },
    }],
  });

  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 36, // 9 floats * 4 bytes
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" },  // position
          { shaderLocation: 1, offset: 12, format: "float32x3" }, // barycentric
          { shaderLocation: 2, offset: 24, format: "float32x3" }, // color
        ],
      }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [{
        format: canvasFormat,
        blend: {
          color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
          alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
        },
      }],
    },
    primitive: { topology: "triangle-list" },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  const maxVerts = 50000;
  const vertexBuffer = device.createBuffer({
    size: maxVerts * 36,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  const uniformBuffer = device.createBuffer({
    size: 80,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  const params = {
    radius: 1.5,
    widthSegments: 7,
    heightSegments: 5,
    showWireframe: true,
    lineWidth: 1.5,
    fillOpacity: 0.8,
  };

  let vertexCount = 0;

  function updateGeometry() {
    const data = createJewelGeometry(
      params.radius,
      params.widthSegments,
      params.heightSegments
    );
    device.queue.writeBuffer(vertexBuffer, 0, data.vertices);
    vertexCount = data.vertexCount;
  }

  const gui = new GUI({ container: document.getElementById("gui-container") as HTMLElement, title: "Jewel Settings" });
  gui.add(params, "radius", 0.5, 3.0).onChange(updateGeometry);
  gui.add(params, "widthSegments", 3, 20, 1).onChange(updateGeometry);
  gui.add(params, "heightSegments", 2, 20, 1).onChange(updateGeometry);
  gui.add(params, "showWireframe");
  gui.add(params, "lineWidth", 0.5, 5.0);
  gui.add(params, "fillOpacity", 0.0, 1.0);

  updateGeometry();

  const aspect = canvas.width / canvas.height;
  const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);

  let angle = 0;
  function render() {
    angle += 0.005;
    const viewMatrix = mat4.lookAt([0, 0, 5], [0, 0, 0], [0, 1, 0]);
    const modelMatrix = mat4.multiply(mat4.rotationY(angle), mat4.rotationX(angle * 0.5));
    const mvpMatrix = mat4.multiply(projectionMatrix, mat4.multiply(viewMatrix, modelMatrix));

    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as Float32Array);
    device.queue.writeBuffer(uniformBuffer, 64, new Float32Array([params.lineWidth, params.fillOpacity, params.showWireframe ? 1.0 : 0.0]));

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
    renderPass.draw(vertexCount);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

init().catch(console.error);
