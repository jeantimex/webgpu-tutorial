import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as G}from"./webgpu-util-BApOR-AX.js";import{m as t}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as I}from"./lil-gui.esm-CNIGZg2U.js";const p=`
struct Uniforms {
  mvpMatrix : mat4x4f,
  ambientIntensity : f32,
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
  let baseColor = vec3f(1.0, 0.0, 0.0); // Red
  
  // Ambient Light: Uniform brightness everywhere
  let lighting = baseColor * uniforms.ambientIntensity;
  
  return vec4f(lighting, 1.0);
}
`;async function A(){const n=document.querySelector("#webgpu-canvas"),{device:e,context:g,canvasFormat:h}=await G(n),s=new Float32Array([-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,-.5,-.5,.5,-.5]),i=new Uint16Array([0,1,2,2,3,0,1,5,6,6,2,1,5,4,7,7,6,5,4,0,3,3,7,4,3,2,6,6,7,3,4,5,1,1,0,4]),u=e.createBuffer({size:s.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(u,0,s);const f=e.createBuffer({size:i.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(f,0,i);const o=e.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),v=n.width/n.height,b=t.perspective(2*Math.PI/5,v,.1,100),x=e.createTexture({size:[n.width,n.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),c=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:p}),entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:p}),entryPoint:"fs_main",targets:[{format:h}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),y=e.createBindGroup({layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:o}}]}),m={ambientIntensity:.5};new I({container:document.getElementById("gui-container")}).add(m,"ambientIntensity",0,1).name("Ambient Intensity");let a=0;function d(){a+=.01;const B=t.multiply(t.rotationY(a),t.rotationX(a*.5)),U=t.lookAt([2.5,2.5,2.5],[0,0,0],[0,1,0]),w=t.multiply(b,t.multiply(U,B));e.queue.writeBuffer(o,0,w),e.queue.writeBuffer(o,64,new Float32Array([m.ambientIntensity]));const l=e.createCommandEncoder(),P=g.getCurrentTexture().createView(),r=l.beginRenderPass({colorAttachments:[{view:P,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:x.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});r.setPipeline(c),r.setBindGroup(0,y),r.setVertexBuffer(0,u),r.setIndexBuffer(f,"uint16"),r.drawIndexed(i.length),r.end(),e.queue.submit([l.finish()]),requestAnimationFrame(d)}requestAnimationFrame(d)}A().catch(console.error);
