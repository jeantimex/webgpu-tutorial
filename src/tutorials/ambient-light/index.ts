import { initWebGPU } from "../../utils/webgpu-util";
import { mat4 } from "wgpu-matrix";
import GUI from "lil-gui";
import { resizeCanvasToDisplaySize } from "../../utils/canvas-util";

const shaderCode = `
struct Uniforms {
  mvpMatrix : mat4x4f,
  ambient : vec4f,
  baseColor : vec4f,
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
  let baseColor = uniforms.baseColor.rgb;
  
  // Ambient Light: Uniform brightness everywhere
  let lighting = baseColor * clamp(uniforms.ambient.x, 0.0, 1.0);
  
  return vec4f(lighting, 1.0);
}
`;

async function init() {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  const { device, context, canvasFormat } = await initWebGPU(canvas);

  // --- 1. Geometry Data (Pos only) ---
  // We don't need normals for ambient light because it doesn't depend on direction!
  // prettier-ignore
  const vertexData = new Float32Array([
    -0.5, -0.5,  0.5, // 0
     0.5, -0.5,  0.5, // 1
     0.5,  0.5,  0.5, // 2
    -0.5,  0.5,  0.5, // 3
    -0.5, -0.5, -0.5, // 4
     0.5, -0.5, -0.5, // 5
     0.5,  0.5, -0.5, // 6
    -0.5,  0.5, -0.5, // 7
  ]);

  // prettier-ignore
  const indexData = new Uint16Array([
    0, 1, 2,  2, 3, 0, // Front
    1, 5, 6,  6, 2, 1, // Right
    5, 4, 7,  7, 6, 5, // Back
    4, 0, 3,  3, 7, 4, // Left
    3, 2, 6,  6, 7, 3, // Top
    4, 5, 1,  1, 0, 4, // Bottom
  ]);

  const vertexBuffer = device.createBuffer({
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertexData);

  const indexBuffer = device.createBuffer({
    size: indexData.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, 0, indexData);

  // --- 2. Uniforms ---
  // MVP Matrix (64 bytes) + Ambient (16 bytes) + BaseColor (16 bytes) = 96 bytes
  const uniformBufferSize = 96;
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  function getProjectionMatrix() {
    const aspect = canvas.width / canvas.height;
    return mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);
  }

  resizeCanvasToDisplaySize(canvas);
  let projectionMatrix = getProjectionMatrix();
  let depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // --- 3. Pipeline ---
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 12, // 3 floats (pos)
        attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
      }],
    },
    fragment: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: "fs_main",
      targets: [{ format: canvasFormat }],
    },
    primitive: { topology: "triangle-list", cullMode: "back" },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  // --- 4. GUI & State ---
  const settings = {
    ambientIntensity: 0.5,
    baseColor: [255, 0, 0],
  };
  const gui = new GUI({ container: document.getElementById('gui-container') as HTMLElement });
  gui.add(settings, "ambientIntensity", 0.0, 1.0).name("Ambient Intensity");
  gui.addColor(settings, "baseColor").name("Base Color");

  let angle = 0;

  function render() {
    const resized = resizeCanvasToDisplaySize(canvas);
    if (resized) {
      projectionMatrix = getProjectionMatrix();
      depthTexture.destroy();
      depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }
    angle += 0.01;
    
    const modelMatrix = mat4.multiply(mat4.rotationY(angle), mat4.rotationX(angle * 0.5));
    const viewMatrix = mat4.lookAt([2.5, 2.5, 2.5], [0, 0, 0], [0, 1, 0]);
    const mvpMatrix = mat4.multiply(projectionMatrix, mat4.multiply(viewMatrix, modelMatrix));

    // Upload Uniforms
    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as Float32Array);
    device.queue.writeBuffer(
      uniformBuffer,
      64,
      new Float32Array([settings.ambientIntensity, 0, 0, 0])
    );
    const [r, g, b] = normalizeColor(settings.baseColor);
    device.queue.writeBuffer(
      uniformBuffer,
      80,
      new Float32Array([r, g, b, 1])
    );

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
    renderPass.drawIndexed(indexData.length);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

init().catch(console.error);
  function normalizeColor(color: string | number[]) {
    if (Array.isArray(color)) {
      const [r, g, b] = color;
      const scale = Math.max(r, g, b) > 1 ? 255 : 1;
      return [r / scale, g / scale, b / scale];
    }

    const hex = color.trim().replace("#", "");
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return [r, g, b];
    }

    return [1, 0, 0];
  }
