import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as m}from"../../../canvas-util-BFZcuyXb.js";import{i as p}from"../../../webgpu-util-BApOR-AX.js";const x=`struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec3f,
};

@vertex
fn vs_main(
  @location(0) pos : vec2f,
  @location(1) color : vec3f
) -> VertexOutput {
  var output : VertexOutput;
  output.position = vec4f(pos, 0.0, 1.0);
  output.color = color;
  return output;
}
`,g=`@fragment
fn fs_main(@location(0) color : vec3f) -> @location(0) vec4f {
  return vec4f(color, 1.0);
}
`;async function b(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:i,canvasFormat:s}=await p(t),n=new Float32Array([0,.5,1,0,0,-.5,-.5,0,1,0,.5,-.5,0,0,1]),o=e.createBuffer({label:"Interleaved Vertex Buffer",size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(o,0,n);const u=e.createShaderModule({label:"Interleaved Buffer Vertex Shader",code:x}),f=e.createShaderModule({label:"Interleaved Buffer Fragment Shader",code:g}),l={arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x3"}]},d=e.createRenderPipeline({label:"Interleaved Buffer Pipeline",layout:"auto",vertex:{module:u,entryPoint:"vs_main",buffers:[l]},fragment:{module:f,entryPoint:"fs_main",targets:[{format:s}]},primitive:{topology:"triangle-list"}});function a(){m(t);const c=e.createCommandEncoder(),v={colorAttachments:[{view:i.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},r=c.beginRenderPass(v);r.setPipeline(d),r.setVertexBuffer(0,o),r.draw(3),r.end(),e.queue.submit([c.finish()])}a(),window.addEventListener("resize",a)}b().catch(t=>{console.error(t)});
