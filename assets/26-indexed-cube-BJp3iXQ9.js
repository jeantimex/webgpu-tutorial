import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as w}from"./webgpu-util-BApOR-AX.js";import{m as o}from"./wgpu-matrix.module-Cf1N7Xmi.js";const d=`
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
`;async function y(){const r=document.querySelector("#webgpu-canvas"),{device:e,context:p,canvasFormat:l}=await w(r),a=new Float32Array([-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,-.5,-.5,.5,-.5]),n=new Uint16Array([0,1,2,2,3,0,1,5,6,6,2,1,5,4,7,7,6,5,4,0,3,3,7,4,3,2,6,6,7,3,4,5,1,1,0,4]),i=e.createBuffer({label:"Vertex Buffer",size:a.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(i,0,a);const u=e.createBuffer({label:"Index Buffer",size:n.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(u,0,n);const s=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),m=r.width/r.height,g=o.perspective(2*Math.PI/5,m,.1,100),h=o.lookAt([2,2,2],[0,0,0],[0,1,0]),x=o.identity(),v=o.multiply(g,o.multiply(h,x));e.queue.writeBuffer(s,0,v);const B=e.createTexture({size:[r.width,r.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),f=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:d}),entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:d}),entryPoint:"fs_main",targets:[{format:l}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),U=e.createBindGroup({layout:f.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:s}}]});function P(){const c=e.createCommandEncoder(),b=p.getCurrentTexture().createView(),t=c.beginRenderPass({colorAttachments:[{view:b,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:B.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});t.setPipeline(f),t.setBindGroup(0,U),t.setVertexBuffer(0,i),t.setIndexBuffer(u,"uint16"),t.drawIndexed(n.length),t.end(),e.queue.submit([c.finish()])}P()}y().catch(console.error);
