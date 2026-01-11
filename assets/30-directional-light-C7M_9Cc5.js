import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as M}from"./webgpu-util-BApOR-AX.js";import{m as t,v as G}from"./wgpu-matrix.module-BcnFMekQ.js";const p=`
struct Uniforms {
  mvpMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  lightDir : vec3f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) normal : vec3f,
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) normal : vec3f,
) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  
  // Transform normal to world space
  out.normal = (uniforms.modelMatrix * vec4f(normal, 0.0)).xyz;
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let N = normalize(in.normal);
  let L = normalize(uniforms.lightDir);
  
  // Diffuse only
  let diffuse = max(dot(N, L), 0.0);
  
  let baseColor = vec3f(1.0, 0.0, 0.0); // Red
  return vec4f(baseColor * diffuse, 1.0);
}
`;async function O(){const o=document.querySelector("#webgpu-canvas"),{device:e,context:g,canvasFormat:x}=await M(o),u=new Float32Array([-.5,-.5,.5,-.577,-.577,.577,.5,-.5,.5,.577,-.577,.577,.5,.5,.5,.577,.577,.577,-.5,.5,.5,-.577,.577,.577,-.5,-.5,-.5,-.577,-.577,-.577,.5,-.5,-.5,.577,-.577,-.577,.5,.5,-.5,.577,.577,-.577,-.5,.5,-.5,-.577,.577,-.577]),i=new Uint16Array([0,1,2,2,3,0,1,5,6,6,2,1,5,4,7,7,6,5,4,0,3,3,7,4,3,2,6,6,7,3,4,5,1,1,0,4]),s=e.createBuffer({size:u.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(s,0,u);const f=e.createBuffer({size:i.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(f,0,i);const a=e.createBuffer({size:144,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),h=o.width/o.height,v=t.perspective(2*Math.PI/5,h,.1,100),B=e.createTexture({size:[o.width,o.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),c=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:p}),entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:p}),entryPoint:"fs_main",targets:[{format:x}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),w=e.createBindGroup({layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:a}}]});let n=0;const U=G.normalize([1,1,1]);function l(){n+=.01;const m=t.multiply(t.rotationY(n),t.rotationX(n*.5)),b=t.lookAt([2.5,2.5,2.5],[0,0,0],[0,1,0]),y=t.multiply(v,t.multiply(b,m));e.queue.writeBuffer(a,0,y),e.queue.writeBuffer(a,64,m),e.queue.writeBuffer(a,128,U);const d=e.createCommandEncoder(),P=g.getCurrentTexture().createView(),r=d.beginRenderPass({colorAttachments:[{view:P,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:B.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});r.setPipeline(c),r.setBindGroup(0,w),r.setVertexBuffer(0,s),r.setIndexBuffer(f,"uint16"),r.drawIndexed(i.length),r.end(),e.queue.submit([d.finish()]),requestAnimationFrame(l)}requestAnimationFrame(l)}O().catch(console.error);
