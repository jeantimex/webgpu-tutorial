import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as P}from"./webgpu-util-BApOR-AX.js";import{m as o}from"./wgpu-matrix.module-BcnFMekQ.js";const m=`
struct Uniforms {
  mvpMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) color : vec3f
) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  out.color = vec4f(color, 1.0);
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  return in.color;
}
`;async function w(){const r=document.querySelector("#webgpu-canvas"),{device:e,context:h,canvasFormat:x}=await P(r),s=new Float32Array([-.5,-.5,.5,1,0,0,.5,-.5,.5,1,0,0,.5,.5,.5,1,0,0,-.5,.5,.5,1,0,0,-.5,-.5,-.5,0,1,1,.5,-.5,-.5,0,1,1,.5,.5,-.5,0,1,1,-.5,.5,-.5,0,1,1,-.5,.5,-.5,0,1,0,-.5,.5,.5,0,1,0,.5,.5,.5,0,1,0,.5,.5,-.5,0,1,0,-.5,-.5,-.5,1,0,1,.5,-.5,-.5,1,0,1,.5,-.5,.5,1,0,1,-.5,-.5,.5,1,0,1,.5,-.5,-.5,0,0,1,.5,.5,-.5,0,0,1,.5,.5,.5,0,0,1,.5,-.5,.5,0,0,1,-.5,-.5,-.5,1,1,0,-.5,-.5,.5,1,1,0,-.5,.5,.5,1,1,0,-.5,.5,-.5,1,1,0]),n=new Uint16Array([0,1,2,2,3,0,5,4,7,7,6,5,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20]),c=e.createBuffer({label:"Vertex Buffer",size:s.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(c,0,s);const f=e.createBuffer({label:"Index Buffer",size:n.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(f,0,n);const d=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=r.width/r.height,v=o.perspective(2*Math.PI/5,g,.1,100);let i=0;function B(){const a=o.lookAt([Math.sin(i)*3,2,Math.cos(i)*3],[0,0,0],[0,1,0]),u=o.identity(),t=o.multiply(v,o.multiply(a,u));e.queue.writeBuffer(d,0,t)}const U=e.createTexture({size:[r.width,r.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),l=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:m}),entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:m}),entryPoint:"fs_main",targets:[{format:x}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),b=e.createBindGroup({layout:l.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:d}}]});function p(){i+=.01,B();const a=e.createCommandEncoder(),u=h.getCurrentTexture().createView(),t=a.beginRenderPass({colorAttachments:[{view:u,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:U.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});t.setPipeline(l),t.setBindGroup(0,b),t.setVertexBuffer(0,c),t.setIndexBuffer(f,"uint16"),t.drawIndexed(n.length),t.end(),e.queue.submit([a.finish()]),requestAnimationFrame(p)}requestAnimationFrame(p)}w().catch(console.error);
