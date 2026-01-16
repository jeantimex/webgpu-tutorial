import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{i as M}from"../../../webgpu-util-BApOR-AX.js";import{m as o}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";import{G as S}from"../../../lil-gui.esm-CNIGZg2U.js";const b=`
struct Uniforms {
  mvpMatrix : mat4x4f,
  ambient : vec4f,
  baseColor : vec4f,
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
  let baseColor = uniforms.baseColor.rgb;
  
  // Ambient Light: Uniform brightness everywhere
  let lighting = baseColor * clamp(uniforms.ambient.x, 0.0, 1.0);
  
  return vec4f(lighting, 1.0);
}
`;async function O(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:i,canvasFormat:a}=await M(t),r=new Float32Array([-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,-.5,-.5,.5,-.5]),n=new Uint16Array([0,1,2,2,3,0,1,5,6,6,2,1,5,4,7,7,6,5,4,0,3,3,7,4,3,2,6,6,7,3,4,5,1,1,0,4]),m=e.createBuffer({size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(m,0,r);const l=e.createBuffer({size:n.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(l,0,n);const u=e.createBuffer({size:96,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),x=t.width/t.height,v=o.perspective(2*Math.PI/5,x,.1,100),y=e.createTexture({size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),d=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:b}),entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:b}),entryPoint:"fs_main",targets:[{format:a}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),B=e.createBindGroup({layout:d.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:u}}]}),c={ambientIntensity:.5,baseColor:[255,0,0]},p=new S({container:document.getElementById("gui-container")});p.add(c,"ambientIntensity",0,1).name("Ambient Intensity"),p.addColor(c,"baseColor").name("Base Color");let f=0;function g(){f+=.01;const w=o.multiply(o.rotationY(f),o.rotationX(f*.5)),U=o.lookAt([2.5,2.5,2.5],[0,0,0],[0,1,0]),C=o.multiply(v,o.multiply(U,w));e.queue.writeBuffer(u,0,C),e.queue.writeBuffer(u,64,new Float32Array([c.ambientIntensity,0,0,0]));const[P,A,G]=T(c.baseColor);e.queue.writeBuffer(u,80,new Float32Array([P,A,G,1]));const h=e.createCommandEncoder(),I=i.getCurrentTexture().createView(),s=h.beginRenderPass({colorAttachments:[{view:I,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:y.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});s.setPipeline(d),s.setBindGroup(0,B),s.setVertexBuffer(0,m),s.setIndexBuffer(l,"uint16"),s.drawIndexed(n.length),s.end(),e.queue.submit([h.finish()]),requestAnimationFrame(g)}requestAnimationFrame(g)}O().catch(console.error);function T(t){if(Array.isArray(t)){const[i,a,r]=t,n=Math.max(i,a,r)>1?255:1;return[i/n,a/n,r/n]}const e=t.trim().replace("#","");if(e.length===6){const i=parseInt(e.slice(0,2),16)/255,a=parseInt(e.slice(2,4),16)/255,r=parseInt(e.slice(4,6),16)/255;return[i,a,r]}return[1,0,0]}
