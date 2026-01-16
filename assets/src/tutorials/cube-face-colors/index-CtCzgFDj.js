import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{r as v}from"../../../canvas-util-6cCf-wah.js";import{i as w}from"../../../webgpu-util-BApOR-AX.js";import{m as o}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";const B=`
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
`;async function M(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:U,canvasFormat:P}=await w(t),l=new Float32Array([-.5,-.5,.5,1,0,0,.5,-.5,.5,1,0,0,.5,.5,.5,1,0,0,-.5,.5,.5,1,0,0,-.5,-.5,-.5,0,1,1,.5,-.5,-.5,0,1,1,.5,.5,-.5,0,1,1,-.5,.5,-.5,0,1,1,-.5,.5,-.5,0,1,0,-.5,.5,.5,0,1,0,.5,.5,.5,0,1,0,.5,.5,-.5,0,1,0,-.5,-.5,-.5,1,0,1,.5,-.5,-.5,1,0,1,.5,-.5,.5,1,0,1,-.5,-.5,.5,1,0,1,.5,-.5,-.5,0,0,1,.5,.5,-.5,0,0,1,.5,.5,.5,0,0,1,.5,-.5,.5,0,0,1,-.5,-.5,-.5,1,1,0,-.5,-.5,.5,1,1,0,-.5,.5,.5,1,1,0,-.5,.5,-.5,1,1,0]),n=new Uint16Array([0,1,2,2,3,0,5,4,7,7,6,5,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20]),p=e.createBuffer({label:"Vertex Buffer",size:l.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(p,0,l);const m=e.createBuffer({label:"Index Buffer",size:n.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(m,0,n);const h=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});function s(){const a=t.width/t.height;return o.perspective(2*Math.PI/5,a,.1,100)}let u=0,c=s();function b(){const a=o.lookAt([Math.sin(u)*3,2,Math.cos(u)*3],[0,0,0],[0,1,0]),i=o.identity(),d=o.multiply(c,o.multiply(a,i));e.queue.writeBuffer(h,0,d)}v(t),c=s();let f=e.createTexture({size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const g=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:B}),entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:B}),entryPoint:"fs_main",targets:[{format:P}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),y=e.createBindGroup({layout:g.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:h}}]});function x(){v(t)&&(c=s(),f.destroy(),f=e.createTexture({size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT})),u+=.01,b();const i=e.createCommandEncoder(),d=U.getCurrentTexture().createView(),r=i.beginRenderPass({colorAttachments:[{view:d,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:f.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});r.setPipeline(g),r.setBindGroup(0,y),r.setVertexBuffer(0,p),r.setIndexBuffer(m,"uint16"),r.drawIndexed(n.length),r.end(),e.queue.submit([i.finish()]),requestAnimationFrame(x)}requestAnimationFrame(x)}M().catch(console.error);
