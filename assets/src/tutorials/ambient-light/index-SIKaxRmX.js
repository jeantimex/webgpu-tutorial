import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as B}from"../../../canvas-util-BFZcuyXb.js";import{i as E}from"../../../webgpu-util-BApOR-AX.js";import{m as o}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";import{G as z}from"../../../lil-gui.esm-CNIGZg2U.js";const O=`struct Uniforms {
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
`,V=`struct Uniforms {
  mvpMatrix : mat4x4f,
  ambient : vec4f,
  baseColor : vec4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

@fragment
fn fs_main() -> @location(0) vec4f {
  let baseColor = uniforms.baseColor.rgb;
  
  // Ambient Light: Uniform brightness everywhere
  let lighting = baseColor * clamp(uniforms.ambient.x, 0.0, 1.0);
  
  return vec4f(lighting, 1.0);
}
`,L=O,q=V;async function D(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:i,canvasFormat:a}=await E(t),r=new Float32Array([-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,-.5,-.5,.5,-.5]),n=new Uint16Array([0,1,2,2,3,0,1,5,6,6,2,1,5,4,7,7,6,5,4,0,3,3,7,4,3,2,6,6,7,3,4,5,1,1,0,4]),l=e.createBuffer({size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(l,0,r);const d=e.createBuffer({size:n.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(d,0,n);const u=e.createBuffer({size:96,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});function p(){const v=t.width/t.height;return o.perspective(2*Math.PI/5,v,.1,100)}B(t);let g=p(),f=e.createTexture({size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const U=e.createShaderModule({label:"Ambient Light Vertex Shader",code:L}),w=e.createShaderModule({label:"Ambient Light Fragment Shader",code:q}),h=e.createRenderPipeline({layout:"auto",vertex:{module:U,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:w,entryPoint:"fs_main",targets:[{format:a}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),C=e.createBindGroup({layout:h.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:u}}]}),c={ambientIntensity:.5,baseColor:[255,0,0]},b=new z({container:document.getElementById("gui-container")});b.add(c,"ambientIntensity",0,1).name("Ambient Intensity"),b.addColor(c,"baseColor").name("Base Color");let m=0;function x(){B(t)&&(g=p(),f.destroy(),f=e.createTexture({size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT})),m+=.01;const P=o.multiply(o.rotationY(m),o.rotationX(m*.5)),A=o.lookAt([2.5,2.5,2.5],[0,0,0],[0,1,0]),S=o.multiply(g,o.multiply(A,P));e.queue.writeBuffer(u,0,S),e.queue.writeBuffer(u,64,new Float32Array([c.ambientIntensity,0,0,0]));const[M,G,T]=_(c.baseColor);e.queue.writeBuffer(u,80,new Float32Array([M,G,T,1]));const y=e.createCommandEncoder(),I=i.getCurrentTexture().createView(),s=y.beginRenderPass({colorAttachments:[{view:I,clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:f.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});s.setPipeline(h),s.setBindGroup(0,C),s.setVertexBuffer(0,l),s.setIndexBuffer(d,"uint16"),s.drawIndexed(n.length),s.end(),e.queue.submit([y.finish()]),requestAnimationFrame(x)}requestAnimationFrame(x)}D().catch(console.error);function _(t){if(Array.isArray(t)){const[i,a,r]=t,n=Math.max(i,a,r)>1?255:1;return[i/n,a/n,r/n]}const e=t.trim().replace("#","");if(e.length===6){const i=parseInt(e.slice(0,2),16)/255,a=parseInt(e.slice(2,4),16)/255,r=parseInt(e.slice(4,6),16)/255;return[i,a,r]}return[1,0,0]}
