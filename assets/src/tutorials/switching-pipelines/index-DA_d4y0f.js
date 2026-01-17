import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as v}from"../../../canvas-util-BFZcuyXb.js";import{i as g}from"../../../webgpu-util-BApOR-AX.js";const P=`struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) localPos : vec3f,
};

@vertex
fn vs_main(@location(0) pos : vec3f) -> VertexOutput {
  var output : VertexOutput;
  output.position = vec4f(pos, 1.0);
  output.localPos = pos; // Pass local position to fragment for gradient
  return output;
}
`,x=`struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) localPos : vec3f,
};

// --- Fragment Shader 1: Solid Color ---
@fragment
fn fs_solid() -> @location(0) vec4f {
  return vec4f(1.0, 0.5, 0.0, 1.0); // Solid Orange
}

// --- Fragment Shader 2: Gradient ---
@fragment
fn fs_gradient(in : VertexOutput) -> @location(0) vec4f {
  // Calculate color based on Y position
  // Map Y from [-0.5, 0.5] to [0.0, 1.0]
  let t = in.localPos.y + 0.5;
  return vec4f(0.0, t, 1.0 - t, 1.0); // Blue to Green gradient
}
`;async function b(){const n=document.querySelector("#webgpu-canvas"),{device:e,context:f,canvasFormat:r}=await g(n),o=new Float32Array([-.5,.5,0,-.9,-.5,0,-.1,-.5,0,.5,.5,0,.1,-.5,0,.9,-.5,0]),a=e.createBuffer({label:"Vertex Buffer",size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(a,0,o);const i=e.createShaderModule({label:"Multi-Material Vertex Shader",code:P}),s=e.createShaderModule({label:"Multi-Material Fragment Shader",code:x}),l={arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},d=e.createRenderPipeline({label:"Solid Pipeline",layout:"auto",vertex:{module:i,entryPoint:"vs_main",buffers:[l]},fragment:{module:s,entryPoint:"fs_solid",targets:[{format:r}]},primitive:{topology:"triangle-list"}}),p=e.createRenderPipeline({label:"Gradient Pipeline",layout:"auto",vertex:{module:i,entryPoint:"vs_main",buffers:[l]},fragment:{module:s,entryPoint:"fs_gradient",targets:[{format:r}]},primitive:{topology:"triangle-list"}});function c(){v(n);const u=e.createCommandEncoder(),m={colorAttachments:[{view:f.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},t=u.beginRenderPass(m);t.setVertexBuffer(0,a),t.setPipeline(d),t.draw(3,1,0,0),t.setPipeline(p),t.draw(3,1,3,0),t.end(),e.queue.submit([u.finish()])}c(),window.addEventListener("resize",c)}b().catch(n=>{console.error(n)});
