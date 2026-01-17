import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as U}from"../../../canvas-util-BFZcuyXb.js";import{i as I}from"../../../webgpu-util-BApOR-AX.js";import{m as r}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";const R=`struct Uniforms {
  mvpMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
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
`,z=`@group(0) @binding(1) var mySampler : sampler;
@group(0) @binding(2) var myTexture : texture_2d<f32>;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  return textureSample(myTexture, mySampler, in.uv);
}
`,D=R,N=z;async function q(){const t=document.querySelector("#webgpu-canvas"),w="https://webgpu.github.io/webgpu-samples/assets/img/webgpu.png",o=new Image;o.crossOrigin="anonymous",o.src=w,await o.decode();const a=await createImageBitmap(o),{device:e,context:y,canvasFormat:P}=await I(t),m=new Float32Array([-.5,-.5,.5,0,1,.5,-.5,.5,1,1,.5,.5,.5,1,0,-.5,.5,.5,0,0,.5,-.5,-.5,0,1,-.5,-.5,-.5,1,1,-.5,.5,-.5,1,0,.5,.5,-.5,0,0,-.5,.5,-.5,0,0,-.5,.5,.5,0,1,.5,.5,.5,1,1,.5,.5,-.5,1,0,-.5,-.5,-.5,0,1,.5,-.5,-.5,1,1,.5,-.5,.5,1,0,-.5,-.5,.5,0,0,.5,-.5,-.5,1,1,.5,.5,-.5,1,0,.5,.5,.5,0,0,.5,-.5,.5,0,1,-.5,-.5,-.5,0,1,-.5,-.5,.5,1,1,-.5,.5,.5,1,0,-.5,.5,-.5,0,0]),u=new Uint16Array([0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20]),d=e.createBuffer({size:m.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(d,0,m);const l=e.createBuffer({size:u.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(l,0,u);const p=e.createTexture({size:[a.width,a.height],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});e.queue.copyExternalImageToTexture({source:a},{texture:p},[a.width,a.height]);const S=e.createSampler({magFilter:"linear",minFilter:"linear"}),g=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});function x(){const i=t.width/t.height;return r.perspective(2*Math.PI/5,i,.1,100)}U(t);let h=x(),s=e.createTexture({size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const B=e.createShaderModule({label:"Textured Cube Vertex Shader",code:D}),G=e.createShaderModule({label:"Textured Cube Fragment Shader",code:N}),v=e.createRenderPipeline({layout:"auto",vertex:{module:B,entryPoint:"vs_main",buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:G,entryPoint:"fs_main",targets:[{format:P}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),E=e.createBindGroup({layout:v.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:g}},{binding:1,resource:S},{binding:2,resource:p.createView()}]});let c=0,f=0;const M=.8;function T(i){U(t)&&(h=x(),s.destroy(),s=e.createTexture({size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}));const C=f?(i-f)/1e3:0;f=i,c+=C*M;const O=r.lookAt([2,2,2],[0,0,0],[0,1,0]),V=r.multiply(r.rotationY(c),r.rotationX(c*.5)),A=r.multiply(h,r.multiply(O,V));e.queue.writeBuffer(g,0,A);const b=e.createCommandEncoder(),_=y.getCurrentTexture().createView(),n=b.beginRenderPass({colorAttachments:[{view:_,clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:s.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});n.setPipeline(v),n.setBindGroup(0,E),n.setVertexBuffer(0,d),n.setIndexBuffer(l,"uint16"),n.drawIndexed(u.length),n.end(),e.queue.submit([b.finish()]),requestAnimationFrame(T)}requestAnimationFrame(T)}q().catch(console.error);
