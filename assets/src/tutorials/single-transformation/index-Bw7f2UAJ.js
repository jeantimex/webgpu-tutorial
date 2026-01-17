import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as v}from"../../../canvas-util-BFZcuyXb.js";import{i as b}from"../../../webgpu-util-BApOR-AX.js";import{m as x}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";const B=`struct Uniforms {
  modelMatrix : mat4x4f,
};

@group(0) @binding(0) var<uniform> global : Uniforms;

@vertex
fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
  // Multiply the position by the matrix
  // Note: W component is 1.0 for points
  return global.modelMatrix * vec4f(pos, 1.0);
}
`,y=`@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0);
}
`;async function P(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:c,canvasFormat:u}=await b(t),n=new Float32Array([0,.5,.5,-.5,-.5,.5,.5,-.5,.5]),o=e.createBuffer({label:"Vertex Buffer",size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(o,0,n);const l=x.translation([.5,0,0]),a=e.createBuffer({label:"Uniform Matrix Buffer",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(a,0,l);const m=e.createShaderModule({label:"Transformation Vertex Shader",code:B}),d=e.createShaderModule({label:"Transformation Fragment Shader",code:y}),i=e.createRenderPipeline({label:"Transformation Pipeline",layout:"auto",vertex:{module:m,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:d,entryPoint:"fs_main",targets:[{format:u}]},primitive:{topology:"triangle-list"}}),p=e.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:a}}]});function s(){v(t);const f=e.createCommandEncoder(),g={colorAttachments:[{view:c.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},r=f.beginRenderPass(g);r.setPipeline(i),r.setVertexBuffer(0,o),r.setBindGroup(0,p),r.draw(3),r.end(),e.queue.submit([f.finish()])}s(),window.addEventListener("resize",s)}P().catch(t=>{console.error(t)});
