import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as p}from"../../../canvas-util-BFZcuyXb.js";import{i as v}from"../../../webgpu-util-BApOR-AX.js";const B=`@vertex
fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
  return vec4f(pos, 1.0);
}
`,w=`@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(0.0, 1.0, 0.5, 1.0);
}
`;async function b(){const r=document.querySelector("#webgpu-canvas"),{device:e,context:f,canvasFormat:u}=await v(r),a=new Float32Array([-.5,.5,0,-.9,-.5,0,-.1,-.5,0]),n=e.createBuffer({label:"Triangle Buffer",size:a.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(n,0,a);const o=new Float32Array([.1,.5,0,.1,-.5,0,.9,-.5,0,.1,.5,0,.9,-.5,0,.9,.5,0]),s=e.createBuffer({label:"Square Buffer",size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(s,0,o);const l=e.createShaderModule({label:"Switching Vertex Buffers Vertex Shader",code:B}),d=e.createShaderModule({label:"Switching Vertex Buffers Fragment Shader",code:w}),m=e.createRenderPipeline({label:"Basic Pipeline",layout:"auto",vertex:{module:l,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:d,entryPoint:"fs_main",targets:[{format:u}]},primitive:{topology:"triangle-list"}});function i(){p(r);const c=e.createCommandEncoder(),g={colorAttachments:[{view:f.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},t=c.beginRenderPass(g);t.setPipeline(m),t.setVertexBuffer(0,n),t.draw(3),t.setVertexBuffer(0,s),t.draw(6),t.end(),e.queue.submit([c.finish()])}i(),window.addEventListener("resize",i)}b().catch(r=>{console.error(r)});
