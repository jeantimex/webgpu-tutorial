import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as M}from"./webgpu-util-BApOR-AX.js";import{m as t}from"./wgpu-matrix.module-BcnFMekQ.js";const p=`
struct Uniforms {
  mvpMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  lightPos : vec3f, // Position, not direction!
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) normal : vec3f,
  @location(1) worldPos : vec3f, // Needed to calculate light direction per-pixel
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
  
  // Transform position to world space
  out.worldPos = (uniforms.modelMatrix * vec4f(pos, 1.0)).xyz;
  
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let N = normalize(in.normal);
  
  // Calculate direction FROM surface TO light
  let L = normalize(uniforms.lightPos - in.worldPos);
  
  // Diffuse term
  let diffuse = max(dot(N, L), 0.0);
  
  let baseColor = vec3f(1.0, 0.0, 0.0); // Red
  
  // Simple ambient to see the back
  let ambient = 0.1;
  
  let lighting = min(diffuse + ambient, 1.0);
  
  return vec4f(baseColor * lighting, 1.0);
}
`;async function O(){const o=document.querySelector("#webgpu-canvas"),{device:e,context:g,canvasFormat:h}=await M(o),s=new Float32Array([-.5,-.5,.5,-.577,-.577,.577,.5,-.5,.5,.577,-.577,.577,.5,.5,.5,.577,.577,.577,-.5,.5,.5,-.577,.577,.577,-.5,-.5,-.5,-.577,-.577,-.577,.5,-.5,-.5,.577,-.577,-.577,.5,.5,-.5,.577,.577,-.577,-.5,.5,-.5,-.577,.577,-.577]),n=new Uint16Array([0,1,2,2,3,0,1,5,6,6,2,1,5,4,7,7,6,5,4,0,3,3,7,4,3,2,6,6,7,3,4,5,1,1,0,4]),u=e.createBuffer({size:s.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(u,0,s);const f=e.createBuffer({size:n.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(f,0,n);const i=e.createBuffer({size:144,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),x=o.width/o.height,v=t.perspective(2*Math.PI/5,x,.1,100),P=e.createTexture({size:[o.width,o.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),c=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:p}),entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:p}),entryPoint:"fs_main",targets:[{format:h}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),w=e.createBindGroup({layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i}}]});let a=0;function l(){a+=.01;const m=t.multiply(t.rotationY(a),t.rotationX(a*.5)),B=t.lookAt([2.5,2.5,2.5],[0,0,0],[0,1,0]),b=t.multiply(v,t.multiply(B,m)),y=[2,2,2];e.queue.writeBuffer(i,0,b),e.queue.writeBuffer(i,64,m),e.queue.writeBuffer(i,128,new Float32Array(y));const d=e.createCommandEncoder(),U=g.getCurrentTexture().createView(),r=d.beginRenderPass({colorAttachments:[{view:U,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:P.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});r.setPipeline(c),r.setBindGroup(0,w),r.setVertexBuffer(0,u),r.setIndexBuffer(f,"uint16"),r.drawIndexed(n.length),r.end(),e.queue.submit([d.finish()]),requestAnimationFrame(l)}requestAnimationFrame(l)}O().catch(console.error);
