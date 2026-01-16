import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as m}from"../../../canvas-util-BGxJIWTK.js";import{i as T}from"../../../webgpu-util-BApOR-AX.js";import{m as o}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";const h=`
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
`;async function w(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:g,canvasFormat:v}=await T(t),s=new Float32Array([-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,.5,-.5,.5,-.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,-.5,-.5,.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,-.5,-.5,.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,.5,-.5,.5,-.5,-.5,-.5,-.5]),u=e.createBuffer({label:"Cube Vertex Buffer",size:s.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(u,0,s);const c=e.createBuffer({label:"Uniform Buffer",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});function f(){const l=t.width/t.height,i=o.perspective(2*Math.PI/5,l,.1,100),n=o.lookAt([2,2,2],[0,0,0],[0,1,0]),r=o.identity(),b=o.multiply(i,o.multiply(n,r));e.queue.writeBuffer(c,0,b)}m(t),f();let a=e.createTexture({label:"Depth Texture",size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const d=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:h}),entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:h}),entryPoint:"fs_main",targets:[{format:v}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),x=e.createBindGroup({layout:d.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]});function p(){m(t)&&(f(),a.destroy(),a=e.createTexture({label:"Depth Texture",size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}));const i=e.createCommandEncoder(),n=g.getCurrentTexture().createView(),r=i.beginRenderPass({colorAttachments:[{view:n,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:a.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});r.setPipeline(d),r.setBindGroup(0,x),r.setVertexBuffer(0,u),r.draw(36),r.end(),e.queue.submit([i.finish()])}p(),window.addEventListener("resize",p)}w().catch(console.error);
