import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{i as P}from"../../../webgpu-util-BApOR-AX.js";import{m as o}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";const c=`
struct Uniforms {
  mvpMatrix : mat4x4f,
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
  return vec4f(1.0, 0.0, 0.0, 1.0); // Solid Red
}
`;async function U(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:f,canvasFormat:p}=await P(t),a=new Float32Array([-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,.5,-.5,.5,-.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,-.5,-.5,.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,-.5,-.5,.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,.5,-.5,.5,-.5,-.5,-.5,-.5]),i=e.createBuffer({label:"Cube Vertex Buffer",size:a.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(i,0,a);const n=e.createBuffer({label:"Uniform Buffer",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),d=t.width/t.height,l=o.perspective(2*Math.PI/5,d,.1,100),m=o.lookAt([2,2,2],[0,0,0],[0,1,0]),h=o.identity(),v=o.multiply(l,o.multiply(m,h));e.queue.writeBuffer(n,0,v);const g=e.createTexture({label:"Depth Texture",size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),s=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:c}),entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:c}),entryPoint:"fs_main",targets:[{format:p}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),x=e.createBindGroup({layout:s.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:n}}]});function b(){const u=e.createCommandEncoder(),B=f.getCurrentTexture().createView(),r=u.beginRenderPass({colorAttachments:[{view:B,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:g.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});r.setPipeline(s),r.setBindGroup(0,x),r.setVertexBuffer(0,i),r.draw(36),r.end(),e.queue.submit([u.finish()])}b()}U().catch(console.error);
