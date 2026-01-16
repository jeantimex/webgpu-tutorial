import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as b}from"../../../canvas-util-Dbsun61p.js";import{i as _}from"../../../webgpu-util-BApOR-AX.js";import{m as r}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";const w=`
struct Uniforms {
  mvpMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var mySampler : sampler;
@group(0) @binding(2) var myTexture : texture_2d<f32>;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) uv : vec2f
) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  out.uv = uv;
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  return textureSample(myTexture, mySampler, in.uv);
}
`;async function I(){const t=document.querySelector("#webgpu-canvas"),y="https://webgpu.github.io/webgpu-samples/assets/img/webgpu.png",o=new Image;o.crossOrigin="anonymous",o.src=y,await o.decode();const i=await createImageBitmap(o),{device:e,context:P,canvasFormat:B}=await _(t),m=new Float32Array([-.5,-.5,.5,0,1,.5,-.5,.5,1,1,.5,.5,.5,1,0,-.5,.5,.5,0,0,.5,-.5,-.5,0,1,-.5,-.5,-.5,1,1,-.5,.5,-.5,1,0,.5,.5,-.5,0,0,-.5,.5,-.5,0,0,-.5,.5,.5,0,1,.5,.5,.5,1,1,.5,.5,-.5,1,0,-.5,-.5,-.5,0,1,.5,-.5,-.5,1,1,.5,-.5,.5,1,0,-.5,-.5,.5,0,0,.5,-.5,-.5,1,1,.5,.5,-.5,1,0,.5,.5,.5,0,0,.5,-.5,.5,0,1,-.5,-.5,-.5,0,1,-.5,-.5,.5,1,1,-.5,.5,.5,1,0,-.5,.5,-.5,0,0]),s=new Uint16Array([0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20]),p=e.createBuffer({size:m.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(p,0,m);const d=e.createBuffer({size:s.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(d,0,s);const l=e.createTexture({size:[i.width,i.height],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});e.queue.copyExternalImageToTexture({source:i},{texture:l},[i.width,i.height]);const E=e.createSampler({magFilter:"linear",minFilter:"linear"}),g=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});function h(){const n=t.width/t.height;return r.perspective(2*Math.PI/5,n,.1,100)}b(t);let x=h(),u=e.createTexture({size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const v=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:w}),entryPoint:"vs_main",buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:e.createShaderModule({code:w}),entryPoint:"fs_main",targets:[{format:B}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),S=e.createBindGroup({layout:v.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:g}},{binding:1,resource:E},{binding:2,resource:l.createView()}]});let c=0,f=0;const G=.8;function T(n){b(t)&&(x=h(),u.destroy(),u=e.createTexture({size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}));const M=f?(n-f)/1e3:0;f=n,c+=M*G;const O=r.lookAt([2,2,2],[0,0,0],[0,1,0]),A=r.multiply(r.rotationY(c),r.rotationX(c*.5)),C=r.multiply(x,r.multiply(O,A));e.queue.writeBuffer(g,0,C);const U=e.createCommandEncoder(),V=P.getCurrentTexture().createView(),a=U.beginRenderPass({colorAttachments:[{view:V,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:u.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});a.setPipeline(v),a.setBindGroup(0,S),a.setVertexBuffer(0,p),a.setIndexBuffer(d,"uint16"),a.drawIndexed(s.length),a.end(),e.queue.submit([U.finish()]),requestAnimationFrame(T)}requestAnimationFrame(T)}I().catch(console.error);
