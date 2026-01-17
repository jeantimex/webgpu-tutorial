import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as N}from"../../../canvas-util-BFZcuyXb.js";import{i as K}from"../../../webgpu-util-BApOR-AX.js";import{m as d}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";const Q=`struct Uniforms {
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
`,Z=`@group(0) @binding(1) var mySampler : sampler;
@group(0) @binding(2) var myTexture : texture_2d<f32>;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  return textureSample(myTexture, mySampler, in.uv);
}
`,$=Q,ee=Z;async function te(){const n=document.querySelector("#webgpu-canvas"),{device:e,context:I,canvasFormat:q}=await K(n),g=512,x=512,T=document.createElement("canvas");T.width=g,T.height=x;const r=T.getContext("2d");r.fillStyle="#ffffff",r.fillRect(0,0,g,x);const S=g/3,U=x/2,L=["#FF0000","#00FF00","#0000FF","#FFFF00","#00FFFF","#FF00FF"];r.font="bold 150px sans-serif",r.textAlign="center",r.textBaseline="middle";for(let t=0;t<6;t++){const y=t%3,v=Math.floor(t/3),o=y*S,a=v*U;r.fillStyle=L[t],r.fillRect(o,a,S,U),r.fillStyle="black",r.fillText((t+1).toString(),o+S/2,a+U/2),r.strokeStyle="black",r.lineWidth=5,r.strokeRect(o,a,S,U)}const W=await createImageBitmap(T),E=e.createTexture({size:[g,x],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});e.queue.copyExternalImageToTexture({source:W},{texture:E},[g,x]);const k=e.createSampler({magFilter:"linear",minFilter:"linear"}),G=1/3,M=1/2;function m(t){const y=t%3,v=Math.floor(t/3),o=y*G,a=v*M,b=o+G,h=a+M;return[o,h,b,h,b,a,o,a]}const i=m(0),s=m(1),c=m(2),u=m(3),l=m(4),f=m(5),A=new Float32Array([-.5,-.5,.5,i[0],i[1],.5,-.5,.5,i[2],i[3],.5,.5,.5,i[4],i[5],-.5,.5,.5,i[6],i[7],.5,-.5,-.5,s[0],s[1],-.5,-.5,-.5,s[2],s[3],-.5,.5,-.5,s[4],s[5],.5,.5,-.5,s[6],s[7],-.5,.5,-.5,c[6],c[7],-.5,.5,.5,c[0],c[1],.5,.5,.5,c[2],c[3],.5,.5,-.5,c[4],c[5],-.5,-.5,-.5,u[0],u[1],.5,-.5,-.5,u[2],u[3],.5,-.5,.5,u[4],u[5],-.5,-.5,.5,u[6],u[7],.5,-.5,-.5,l[2],l[3],.5,.5,-.5,l[4],l[5],.5,.5,.5,l[6],l[7],.5,-.5,.5,l[0],l[1],-.5,-.5,-.5,f[0],f[1],-.5,-.5,.5,f[2],f[3],-.5,.5,.5,f[4],f[5],-.5,.5,-.5,f[6],f[7]]),F=new Uint16Array([0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20]),C=e.createBuffer({size:A.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(C,0,A);const V=e.createBuffer({size:F.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(V,0,F);const O=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});function R(){const t=n.width/n.height;return d.perspective(2*Math.PI/5,t,.1,100)}N(n);let _=R(),B=e.createTexture({size:[n.width,n.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const H=e.createShaderModule({label:"Texture Atlas Vertex Shader",code:$}),Y=e.createShaderModule({label:"Texture Atlas Fragment Shader",code:ee}),D=e.createRenderPipeline({layout:"auto",vertex:{module:H,entryPoint:"vs_main",buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:Y,entryPoint:"fs_main",targets:[{format:q}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),X=e.createBindGroup({layout:D.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:O}},{binding:1,resource:k},{binding:2,resource:E.createView()}]});let P=0,w=0;const j=.8;function z(t){N(n)&&(_=R(),B.destroy(),B=e.createTexture({size:[n.width,n.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}));const v=w?(t-w)/1e3:0;w=t,P+=v*j;const o=d.lookAt([2.5,2.5,2.5],[0,0,0],[0,1,0]),a=d.multiply(d.rotationY(P),d.rotationX(P*.6)),b=d.multiply(_,d.multiply(o,a));e.queue.writeBuffer(O,0,b);const h=e.createCommandEncoder(),J=I.getCurrentTexture().createView(),p=h.beginRenderPass({colorAttachments:[{view:J,clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:B.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});p.setPipeline(D),p.setBindGroup(0,X),p.setVertexBuffer(0,C),p.setIndexBuffer(V,"uint16"),p.drawIndexed(F.length),p.end(),e.queue.submit([h.finish()]),requestAnimationFrame(z)}requestAnimationFrame(z)}te().catch(console.error);
