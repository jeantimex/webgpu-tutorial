import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as O}from"./webgpu-util-BApOR-AX.js";import{m as t}from"./wgpu-matrix.module-BcnFMekQ.js";const h=`
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
`;async function M(){const a=document.querySelector("#webgpu-canvas"),x="https://webgpu.github.io/webgpu-samples/assets/img/webgpu.png",o=new Image;o.crossOrigin="anonymous",o.src=x,await o.decode();const i=await createImageBitmap(o),{device:e,context:v,canvasFormat:b}=await O(a),s=new Float32Array([-.5,-.5,.5,0,1,.5,-.5,.5,1,1,.5,.5,.5,1,0,-.5,.5,.5,0,0,.5,-.5,-.5,0,1,-.5,-.5,-.5,1,1,-.5,.5,-.5,1,0,.5,.5,-.5,0,0,-.5,.5,-.5,0,0,-.5,.5,.5,0,1,.5,.5,.5,1,1,.5,.5,-.5,1,0,-.5,-.5,-.5,0,1,.5,-.5,-.5,1,1,.5,-.5,.5,1,0,-.5,-.5,.5,0,0,.5,-.5,-.5,1,1,.5,.5,-.5,1,0,.5,.5,.5,0,0,.5,-.5,.5,0,1,-.5,-.5,-.5,0,1,-.5,-.5,.5,1,1,-.5,.5,.5,1,0,-.5,.5,-.5,0,0]),n=new Uint16Array([0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20]),c=e.createBuffer({size:s.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(c,0,s);const f=e.createBuffer({size:n.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(f,0,n);const m=e.createTexture({size:[i.width,i.height],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});e.queue.copyExternalImageToTexture({source:i},{texture:m},[i.width,i.height]);const U=e.createSampler({magFilter:"linear",minFilter:"linear"}),p=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),w=a.width/a.height,T=t.perspective(2*Math.PI/5,w,.1,100),B=e.createTexture({size:[a.width,a.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),d=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:h}),entryPoint:"vs_main",buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:e.createShaderModule({code:h}),entryPoint:"fs_main",targets:[{format:b}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),y=e.createBindGroup({layout:d.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:p}},{binding:1,resource:U},{binding:2,resource:m.createView()}]});let u=0;function l(){u+=.01;const P=t.lookAt([2,2,2],[0,0,0],[0,1,0]),G=t.multiply(t.rotationY(u),t.rotationX(u*.5)),E=t.multiply(T,t.multiply(P,G));e.queue.writeBuffer(p,0,E);const g=e.createCommandEncoder(),S=v.getCurrentTexture().createView(),r=g.beginRenderPass({colorAttachments:[{view:S,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:B.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});r.setPipeline(d),r.setBindGroup(0,y),r.setVertexBuffer(0,c),r.setIndexBuffer(f,"uint16"),r.drawIndexed(n.length),r.end(),e.queue.submit([g.finish()]),requestAnimationFrame(l)}requestAnimationFrame(l)}M().catch(console.error);
