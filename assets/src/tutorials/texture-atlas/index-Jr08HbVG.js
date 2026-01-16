import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{i as W}from"../../../webgpu-util-BApOR-AX.js";import{m}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";const C=`
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
`;async function Y(){const d=document.querySelector("#webgpu-canvas"),{device:e,context:R,canvasFormat:_}=await W(d),g=512,x=512,U=document.createElement("canvas");U.width=g,U.height=x;const t=U.getContext("2d");t.fillStyle="#ffffff",t.fillRect(0,0,g,x);const y=g/3,T=x/2,D=["#FF0000","#00FF00","#0000FF","#FFFF00","#00FFFF","#FF00FF"];t.font="bold 150px sans-serif",t.textAlign="center",t.textBaseline="middle";for(let r=0;r<6;r++){const v=r%3,h=Math.floor(r/3),o=v*y,n=h*T;t.fillStyle=D[r],t.fillRect(o,n,y,T),t.fillStyle="black",t.fillText((r+1).toString(),o+y/2,n+T/2),t.strokeStyle="black",t.lineWidth=5,t.strokeRect(o,n,y,T)}const I=await createImageBitmap(U),B=e.createTexture({size:[g,x],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});e.queue.copyExternalImageToTexture({source:I},{texture:B},[g,x]);const q=e.createSampler({magFilter:"linear",minFilter:"linear"}),P=1/3,S=1/2;function p(r){const v=r%3,h=Math.floor(r/3),o=v*P,n=h*S,a=o+P,A=n+S;return[o,A,a,A,a,n,o,n]}const i=p(0),s=p(1),c=p(2),u=p(3),l=p(4),f=p(5),w=new Float32Array([-.5,-.5,.5,i[0],i[1],.5,-.5,.5,i[2],i[3],.5,.5,.5,i[4],i[5],-.5,.5,.5,i[6],i[7],.5,-.5,-.5,s[0],s[1],-.5,-.5,-.5,s[2],s[3],-.5,.5,-.5,s[4],s[5],.5,.5,-.5,s[6],s[7],-.5,.5,-.5,c[6],c[7],-.5,.5,.5,c[0],c[1],.5,.5,.5,c[2],c[3],.5,.5,-.5,c[4],c[5],-.5,-.5,-.5,u[0],u[1],.5,-.5,-.5,u[2],u[3],.5,-.5,.5,u[4],u[5],-.5,-.5,.5,u[6],u[7],.5,-.5,-.5,l[2],l[3],.5,.5,-.5,l[4],l[5],.5,.5,.5,l[6],l[7],.5,-.5,.5,l[0],l[1],-.5,-.5,-.5,f[0],f[1],-.5,-.5,.5,f[2],f[3],-.5,.5,.5,f[4],f[5],-.5,.5,-.5,f[6],f[7]]),F=new Uint16Array([0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20]),E=e.createBuffer({size:w.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(E,0,w);const G=e.createBuffer({size:F.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(G,0,F);const M=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),N=d.width/d.height,k=m.perspective(2*Math.PI/5,N,.1,100),L=e.createTexture({size:[d.width,d.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),O=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:C}),entryPoint:"vs_main",buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:e.createShaderModule({code:C}),entryPoint:"fs_main",targets:[{format:_}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),z=e.createBindGroup({layout:O.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:M}},{binding:1,resource:q},{binding:2,resource:B.createView()}]});let b=0;function V(){b+=.01;const r=m.lookAt([2.5,2.5,2.5],[0,0,0],[0,1,0]),v=m.multiply(m.rotationY(b),m.rotationX(b*.6)),h=m.multiply(k,m.multiply(r,v));e.queue.writeBuffer(M,0,h);const o=e.createCommandEncoder(),n=R.getCurrentTexture().createView(),a=o.beginRenderPass({colorAttachments:[{view:n,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:L.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});a.setPipeline(O),a.setBindGroup(0,z),a.setVertexBuffer(0,E),a.setIndexBuffer(G,"uint16"),a.drawIndexed(F.length),a.end(),e.queue.submit([o.finish()]),requestAnimationFrame(V)}requestAnimationFrame(V)}Y().catch(console.error);
