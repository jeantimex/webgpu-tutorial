import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as x}from"../../../canvas-util-BFZcuyXb.js";import{i as B}from"../../../webgpu-util-BApOR-AX.js";import{m as n}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";const P=`struct Uniforms {
  modelMatrix : mat4x4f,
};

@group(0) @binding(0) var<uniform> global : Uniforms;

@vertex
fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
  return global.modelMatrix * vec4f(pos, 1.0);
}
`,y=`@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0);
}
`;async function U(){const o=document.querySelector("#webgpu-canvas"),{device:e,context:l,canvasFormat:m}=await B(o),i=new Float32Array([0,.5,.5,-.5,-.5,.5,.5,-.5,.5]),s=e.createBuffer({label:"Vertex Buffer",size:i.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(s,0,i);const f=e.createBuffer({label:"Uniform Matrix Buffer",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),r=n.create();function d(){n.identity(r),n.translate(r,[.2,0,0],r);const a=Math.PI/2;n.rotateZ(r,a,r),n.scale(r,[.5,.5,1],r),e.queue.writeBuffer(f,0,r)}d();const g=e.createShaderModule({label:"Combined Transform Vertex Shader",code:P}),p=e.createShaderModule({label:"Combined Transform Fragment Shader",code:y}),c=e.createRenderPipeline({label:"Combined Transformation Pipeline",layout:"auto",vertex:{module:g,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:p,entryPoint:"fs_main",targets:[{format:m}]},primitive:{topology:"triangle-list"}}),b=e.createBindGroup({layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:f}}]});function u(){x(o);const a=e.createCommandEncoder(),v={colorAttachments:[{view:l.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},t=a.beginRenderPass(v);t.setPipeline(c),t.setVertexBuffer(0,s),t.setBindGroup(0,b),t.draw(3),t.end(),e.queue.submit([a.finish()])}u(),window.addEventListener("resize",u)}U().catch(o=>{console.error(o)});
