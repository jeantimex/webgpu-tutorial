import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as x}from"../../../canvas-util-BFZcuyXb.js";import{i as w}from"../../../webgpu-util-BApOR-AX.js";import{m as n}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";const y=`struct Uniforms {
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
`,S=`@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0);
}
`,T=y,G=S;async function C(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:h,canvasFormat:v}=await w(t),u=new Float32Array([-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,-.5,-.5,.5,-.5]),o=new Uint16Array([0,1,2,2,3,0,1,5,6,6,2,1,5,4,7,7,6,5,4,0,3,3,7,4,3,2,6,6,7,3,4,5,1,1,0,4]),f=e.createBuffer({label:"Vertex Buffer",size:u.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(f,0,u);const c=e.createBuffer({label:"Index Buffer",size:o.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(c,0,o);const d=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});function p(){const g=t.width/t.height,a=n.perspective(2*Math.PI/5,g,.1,100),s=n.lookAt([2,2,2],[0,0,0],[0,1,0]),r=n.identity(),P=n.multiply(a,n.multiply(s,r));e.queue.writeBuffer(d,0,P)}x(t),p();let i=e.createTexture({size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const B=e.createShaderModule({label:"Indexed Cube Vertex Shader",code:T}),b=e.createShaderModule({label:"Indexed Cube Fragment Shader",code:G}),l=e.createRenderPipeline({layout:"auto",vertex:{module:B,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:b,entryPoint:"fs_main",targets:[{format:v}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),U=e.createBindGroup({layout:l.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:d}}]});function m(){x(t)&&(p(),i.destroy(),i=e.createTexture({size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}));const a=e.createCommandEncoder(),s=h.getCurrentTexture().createView(),r=a.beginRenderPass({colorAttachments:[{view:s,clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:i.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});r.setPipeline(l),r.setBindGroup(0,U),r.setVertexBuffer(0,f),r.setIndexBuffer(c,"uint16"),r.drawIndexed(o.length),r.end(),e.queue.submit([a.finish()])}m(),window.addEventListener("resize",m)}C().catch(console.error);
