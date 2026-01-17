import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as v}from"../../../canvas-util-BFZcuyXb.js";import{i as g}from"../../../webgpu-util-BApOR-AX.js";const B=`struct VertexInput {
  @location(0) position : vec2f,
  @location(1) color : vec3f,
};

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec3f,
};

@vertex
fn vs_main(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.position = vec4f(input.position, 0.0, 1.0);
  output.color = input.color;
  return output;
}
`,b=`struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec3f,
};

@fragment
fn fs_main(input : VertexOutput) -> @location(0) vec4f {
  return vec4f(input.color, 1.0);
}
`;async function V(){const n=document.querySelector("#webgpu-canvas"),{device:e,context:s,canvasFormat:f}=await g(n),r=new Float32Array([-.5,.5,1,0,0,-.5,-.5,0,1,0,.5,-.5,0,0,1,.5,.5,1,1,0]),o=new Uint16Array([0,1,2,0,2,3]),i=e.createBuffer({label:"Vertex Buffer",size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(i,0,r);const a=e.createBuffer({label:"Index Buffer",size:o.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(a,0,o);const l=e.createShaderModule({label:"Index Buffer Vertex Shader",code:B}),d=e.createShaderModule({label:"Index Buffer Fragment Shader",code:b}),p={arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x3"}]},x=e.createRenderPipeline({label:"Index Buffer Pipeline",layout:"auto",vertex:{module:l,entryPoint:"vs_main",buffers:[p]},fragment:{module:d,entryPoint:"fs_main",targets:[{format:f}]},primitive:{topology:"triangle-list",cullMode:"back"}});function u(){v(n);const c=e.createCommandEncoder(),m={colorAttachments:[{view:s.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},t=c.beginRenderPass(m);t.setPipeline(x),t.setVertexBuffer(0,i),t.setIndexBuffer(a,"uint16"),t.drawIndexed(6),t.end(),e.queue.submit([c.finish()])}u(),window.addEventListener("resize",u)}V().catch(n=>{console.error(n)});
