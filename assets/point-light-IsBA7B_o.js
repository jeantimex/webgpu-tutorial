import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as S}from"./webgpu-util-BApOR-AX.js";import{m as r,a as u}from"./wgpu-matrix.module-Cf1N7Xmi.js";import{G as A}from"./lil-gui.esm-CNIGZg2U.js";const v=`
struct Uniforms {
  mvpMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  normalMatrix : mat3x3f,
  lightPosIntensity : vec4f, // Position.xyz + intensity
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
  out.normal = uniforms.normalMatrix * normal;
  
  // Transform position to world space
  out.worldPos = (uniforms.modelMatrix * vec4f(pos, 1.0)).xyz;
  
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let N = normalize(in.normal);
  
  // Calculate direction FROM surface TO light
  let L = normalize(uniforms.lightPosIntensity.xyz - in.worldPos);
  
  // Diffuse term
  let diffuse = max(dot(N, L), 0.0);
  
  let baseColor = vec3f(1.0, 0.0, 0.0); // Red
  
  // Simple ambient to see the back
  let ambient = 0.1;
  
  let lighting = min(diffuse * max(uniforms.lightPosIntensity.w, 0.0) + ambient, 1.0);
  
  return vec4f(baseColor * lighting, 1.0);
}
`;async function C(){const n=document.querySelector("#webgpu-canvas"),{device:e,context:y,canvasFormat:w}=await S(n),m=new Float32Array([-.5,-.5,.5,0,0,1,.5,-.5,.5,0,0,1,.5,.5,.5,0,0,1,-.5,.5,.5,0,0,1,.5,-.5,.5,1,0,0,.5,-.5,-.5,1,0,0,.5,.5,-.5,1,0,0,.5,.5,.5,1,0,0,.5,-.5,-.5,0,0,-1,-.5,-.5,-.5,0,0,-1,-.5,.5,-.5,0,0,-1,.5,.5,-.5,0,0,-1,-.5,-.5,-.5,-1,0,0,-.5,-.5,.5,-1,0,0,-.5,.5,.5,-1,0,0,-.5,.5,-.5,-1,0,0,-.5,.5,.5,0,1,0,.5,.5,.5,0,1,0,.5,.5,-.5,0,1,0,-.5,.5,-.5,0,1,0,-.5,-.5,-.5,0,-1,0,.5,-.5,-.5,0,-1,0,.5,-.5,.5,0,-1,0,-.5,-.5,.5,0,-1,0]),f=new Uint16Array([0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20]),d=e.createBuffer({size:m.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(d,0,m);const p=e.createBuffer({size:f.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(p,0,f);const a=e.createBuffer({size:192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),B=n.width/n.height,b=r.perspective(2*Math.PI/5,B,.1,100),M=e.createTexture({size:[n.width,n.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),g=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:v}),entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:v}),entryPoint:"fs_main",targets:[{format:w}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),U=e.createBindGroup({layout:g.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:a}}]}),t={lightPosX:2,lightPosY:2,lightPosZ:2,intensity:1,animate:!0},s=new A({container:document.getElementById("gui-container")});s.add(t,"lightPosX",-5,5).name("Light Pos X"),s.add(t,"lightPosY",-5,5).name("Light Pos Y"),s.add(t,"lightPosZ",-5,5).name("Light Pos Z"),s.add(t,"intensity",0,2).name("Intensity"),s.add(t,"animate").name("Animate");let l=0;const o=u.create(),h=new Float32Array(12);function x(){t.animate&&(l+=.01);const c=r.multiply(r.rotationY(l),r.rotationX(l*.5)),G=r.lookAt([2.5,2.5,2.5],[0,0,0],[0,1,0]),O=r.multiply(b,r.multiply(G,c));u.fromMat4(c,o),u.invert(o,o),u.transpose(o,o),h.set(o),e.queue.writeBuffer(a,0,O),e.queue.writeBuffer(a,64,c),e.queue.writeBuffer(a,128,h),e.queue.writeBuffer(a,176,new Float32Array([t.lightPosX,t.lightPosY,t.lightPosZ,t.intensity]));const P=e.createCommandEncoder(),T=y.getCurrentTexture().createView(),i=P.beginRenderPass({colorAttachments:[{view:T,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:M.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});i.setPipeline(g),i.setBindGroup(0,U),i.setVertexBuffer(0,d),i.setIndexBuffer(p,"uint16"),i.drawIndexed(f.length),i.end(),e.queue.submit([P.finish()]),requestAnimationFrame(x)}requestAnimationFrame(x)}C().catch(console.error);
