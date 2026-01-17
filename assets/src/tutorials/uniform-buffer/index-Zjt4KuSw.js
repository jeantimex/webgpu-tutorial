import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as b}from"../../../canvas-util-BFZcuyXb.js";import{i as v}from"../../../webgpu-util-BApOR-AX.js";const B=`@vertex
fn vs_main(@location(0) pos : vec2f) -> @builtin(position) vec4f {
  return vec4f(pos, 0.0, 1.0);
}
`,U=`// Define the structure of our uniform
struct Uniforms {
  color : vec4f,
};

// Declare the uniform variable
// Group 0, Binding 0
@group(0) @binding(0) var<uniform> global : Uniforms;

@fragment
fn fs_main() -> @location(0) vec4f {
  // Return the color from the uniform buffer
  return global.color;
}
`;async function h(){const n=document.querySelector("#webgpu-canvas"),{device:e,context:c,canvasFormat:l}=await v(n),t=new Float32Array([0,.5,-.5,-.5,.5,-.5]),o=e.createBuffer({label:"Vertex Buffer",size:t.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(o,0,t);const a=new Float32Array([0,.5,.5,1]),i=e.createBuffer({label:"Uniform Color Buffer",size:a.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(i,0,a);const m=e.createShaderModule({label:"Uniform Buffer Vertex Shader",code:B}),d=e.createShaderModule({label:"Uniform Buffer Fragment Shader",code:U}),f=e.createRenderPipeline({label:"Uniform Pipeline",layout:"auto",vertex:{module:m,entryPoint:"vs_main",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:d,entryPoint:"fs_main",targets:[{format:l}]},primitive:{topology:"triangle-list"}}),g=e.createBindGroup({label:"Uniform Bind Group",layout:f.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i}}]});function s(){b(n);const u=e.createCommandEncoder(),p={colorAttachments:[{view:c.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},r=u.beginRenderPass(p);r.setPipeline(f),r.setVertexBuffer(0,o),r.setBindGroup(0,g),r.draw(3),r.end(),e.queue.submit([u.finish()])}s(),window.addEventListener("resize",s)}h().catch(n=>{console.error(n)});
