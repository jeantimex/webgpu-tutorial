import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as v}from"../../../canvas-util-BFZcuyXb.js";import{i as p}from"../../../webgpu-util-BApOR-AX.js";const g=`@vertex
fn vs_main(@location(0) position : vec2f) -> @builtin(position) vec4f {
  return vec4f(position, 0.0, 1.0);
}
`,x=`@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0);
}
`;async function b(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:s,canvasFormat:c}=await p(t),n=new Float32Array([0,.5,-.5,-.5,.5,-.5]),o=e.createBuffer({label:"Triangle Vertex Buffer",size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(o,0,n);const f=e.createShaderModule({label:"Vertex Buffer Vertex Shader",code:g}),u=e.createShaderModule({label:"Vertex Buffer Fragment Shader",code:x}),l={arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]},d=e.createRenderPipeline({label:"Vertex Buffer Pipeline",layout:"auto",vertex:{module:f,entryPoint:"vs_main",buffers:[l]},fragment:{module:u,entryPoint:"fs_main",targets:[{format:c}]},primitive:{topology:"triangle-list"}});function a(){v(t);const i=e.createCommandEncoder(),m={colorAttachments:[{view:s.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},r=i.beginRenderPass(m);r.setPipeline(d),r.setVertexBuffer(0,o),r.draw(3),r.end(),e.queue.submit([i.finish()])}a(),window.addEventListener("resize",a)}b().catch(t=>{console.error(t)});
