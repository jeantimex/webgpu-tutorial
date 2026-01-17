import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as m}from"../../../canvas-util-BFZcuyXb.js";import{i as w}from"../../../webgpu-util-BApOR-AX.js";import{m as n}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";const P=`struct Uniforms {
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
`,U=`@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0);
}
`,y=P,B=U;async function S(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:h,canvasFormat:g}=await w(t),s=new Float32Array([-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,.5,-.5,.5,-.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,-.5,-.5,.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,-.5,-.5,.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,.5,-.5,.5,-.5,-.5,-.5,-.5]),u=e.createBuffer({label:"Cube Vertex Buffer",size:s.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(u,0,s);const c=e.createBuffer({label:"Uniform Buffer",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});function f(){const p=t.width/t.height,o=n.perspective(2*Math.PI/5,p,.1,100),i=n.lookAt([2,2,2],[0,0,0],[0,1,0]),r=n.identity(),T=n.multiply(o,n.multiply(i,r));e.queue.writeBuffer(c,0,T)}m(t),f();let a=e.createTexture({label:"Depth Texture",size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const x=e.createShaderModule({label:"Hello Cube Vertex Shader",code:y}),v=e.createShaderModule({label:"Hello Cube Fragment Shader",code:B}),d=e.createRenderPipeline({layout:"auto",vertex:{module:x,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:v,entryPoint:"fs_main",targets:[{format:g}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),b=e.createBindGroup({layout:d.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]});function l(){m(t)&&(f(),a.destroy(),a=e.createTexture({label:"Depth Texture",size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}));const o=e.createCommandEncoder(),i=h.getCurrentTexture().createView(),r=o.beginRenderPass({colorAttachments:[{view:i,clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:a.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});r.setPipeline(d),r.setBindGroup(0,b),r.setVertexBuffer(0,u),r.draw(36),r.end(),e.queue.submit([o.finish()])}l(),window.addEventListener("resize",l)}S().catch(console.error);
