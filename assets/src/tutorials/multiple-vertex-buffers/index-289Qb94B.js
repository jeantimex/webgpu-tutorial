import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as B}from"../../../canvas-util-BFZcuyXb.js";import{i as b}from"../../../webgpu-util-BApOR-AX.js";const x=`struct VertexOutput {
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
`,y=`@fragment
fn fs_main(@location(0) color : vec3f) -> @location(0) vec4f {
  return vec4f(color, 1.0);
}
`;async function P(){const o=document.querySelector("#webgpu-canvas"),{device:e,context:u,canvasFormat:f}=await b(o),r=new Float32Array([0,.5,-.5,-.5,.5,-.5]),n=new Float32Array([1,0,0,0,1,0,0,0,1]),a=e.createBuffer({label:"Position Buffer",size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(a,0,r);const i=e.createBuffer({label:"Color Buffer",size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(i,0,n);const l=e.createShaderModule({label:"Multiple Buffers Vertex Shader",code:x}),p=e.createShaderModule({label:"Multiple Buffers Fragment Shader",code:y}),d={arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]},m={arrayStride:12,attributes:[{shaderLocation:1,offset:0,format:"float32x3"}]},v=e.createRenderPipeline({label:"Multiple Buffers Pipeline",layout:"auto",vertex:{module:l,entryPoint:"vs_main",buffers:[d,m]},fragment:{module:p,entryPoint:"fs_main",targets:[{format:f}]},primitive:{topology:"triangle-list"}});function s(){B(o);const c=e.createCommandEncoder(),g={colorAttachments:[{view:u.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},t=c.beginRenderPass(g);t.setPipeline(v),t.setVertexBuffer(0,a),t.setVertexBuffer(1,i),t.draw(3),t.end(),e.queue.submit([c.finish()])}s(),window.addEventListener("resize",s)}P().catch(o=>{console.error(o)});
