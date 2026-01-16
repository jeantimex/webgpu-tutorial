import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as h}from"../../../canvas-util-BGxJIWTK.js";import{i as w}from"../../../webgpu-util-BApOR-AX.js";import{m as i}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";const x=`
struct Uniforms {
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

@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0); // Solid Red
}
`;async function y(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:v,canvasFormat:B}=await w(t),u=new Float32Array([-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,-.5,-.5,.5,-.5]),a=new Uint16Array([0,1,2,2,3,0,1,5,6,6,2,1,5,4,7,7,6,5,4,0,3,3,7,4,3,2,6,6,7,3,4,5,1,1,0,4]),f=e.createBuffer({label:"Vertex Buffer",size:u.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(f,0,u);const c=e.createBuffer({label:"Index Buffer",size:a.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(c,0,a);const d=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});function p(){const g=t.width/t.height,o=i.perspective(2*Math.PI/5,g,.1,100),s=i.lookAt([2,2,2],[0,0,0],[0,1,0]),r=i.identity(),P=i.multiply(o,i.multiply(s,r));e.queue.writeBuffer(d,0,P)}h(t),p();let n=e.createTexture({size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const l=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:x}),entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:x}),entryPoint:"fs_main",targets:[{format:B}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),U=e.createBindGroup({layout:l.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:d}}]});function m(){h(t)&&(p(),n.destroy(),n=e.createTexture({size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}));const o=e.createCommandEncoder(),s=v.getCurrentTexture().createView(),r=o.beginRenderPass({colorAttachments:[{view:s,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:n.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});r.setPipeline(l),r.setBindGroup(0,U),r.setVertexBuffer(0,f),r.setIndexBuffer(c,"uint16"),r.drawIndexed(a.length),r.end(),e.queue.submit([o.finish()])}m(),window.addEventListener("resize",m)}y().catch(console.error);
