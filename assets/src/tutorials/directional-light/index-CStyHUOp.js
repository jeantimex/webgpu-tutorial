import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{i as S}from"../../../webgpu-util-BApOR-AX.js";import{m as r,a as u,v as T}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";import{G as C}from"../../../lil-gui.esm-CNIGZg2U.js";const B=`
struct Uniforms {
  mvpMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  normalMatrix : mat3x3f,
  lightDirIntensity : vec4f,
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
  out.normal = uniforms.normalMatrix * normal;
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let N = normalize(in.normal);
  let L = normalize(uniforms.lightDirIntensity.xyz);
  
  // Diffuse only
  let diffuse = max(dot(N, L), 0.0) * max(uniforms.lightDirIntensity.w, 0.0);
  
  let baseColor = vec3f(1.0, 0.0, 0.0); // Red
  return vec4f(baseColor * diffuse, 1.0);
}
`;async function I(){const a=document.querySelector("#webgpu-canvas"),{device:e,context:D,canvasFormat:w}=await S(a),d=new Float32Array([-.5,-.5,.5,0,0,1,.5,-.5,.5,0,0,1,.5,.5,.5,0,0,1,-.5,.5,.5,0,0,1,.5,-.5,.5,1,0,0,.5,-.5,-.5,1,0,0,.5,.5,-.5,1,0,0,.5,.5,.5,1,0,0,.5,-.5,-.5,0,0,-1,-.5,-.5,-.5,0,0,-1,-.5,.5,-.5,0,0,-1,.5,.5,-.5,0,0,-1,-.5,-.5,-.5,-1,0,0,-.5,-.5,.5,-1,0,0,-.5,.5,.5,-1,0,0,-.5,.5,-.5,-1,0,0,-.5,.5,.5,0,1,0,.5,.5,.5,0,1,0,.5,.5,-.5,0,1,0,-.5,.5,-.5,0,1,0,-.5,-.5,-.5,0,-1,0,.5,-.5,-.5,0,-1,0,.5,-.5,.5,0,-1,0,-.5,-.5,.5,0,-1,0]),f=new Uint16Array([0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20]),p=e.createBuffer({size:d.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(p,0,d);const g=e.createBuffer({size:f.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(g,0,f);const o=e.createBuffer({size:192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),U=a.width/a.height,b=r.perspective(2*Math.PI/5,U,.1,100),M=e.createTexture({size:[a.width,a.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),h=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:B}),entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:B}),entryPoint:"fs_main",targets:[{format:w}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),P=e.createBindGroup({layout:h.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:o}}]}),t={lightDirX:1,lightDirY:1,lightDirZ:1,intensity:1,animate:!0},s=new C({container:document.getElementById("gui-container")});s.add(t,"lightDirX",-1,1).name("Light Dir X"),s.add(t,"lightDirY",-1,1).name("Light Dir Y"),s.add(t,"lightDirZ",-1,1).name("Light Dir Z"),s.add(t,"intensity",0,2).name("Intensity"),s.add(t,"animate").name("Animate");let c=0;const i=u.create(),x=new Float32Array(12);function v(){t.animate&&(c+=.01);const m=r.multiply(r.rotationY(c),r.rotationX(c*.5)),G=r.lookAt([2.5,2.5,2.5],[0,0,0],[0,1,0]),A=r.multiply(b,r.multiply(G,m));u.fromMat4(m,i),u.invert(i,i),u.transpose(i,i),x.set(i),e.queue.writeBuffer(o,0,A),e.queue.writeBuffer(o,64,m),e.queue.writeBuffer(o,128,x);const l=T.normalize([t.lightDirX,t.lightDirY,t.lightDirZ]);e.queue.writeBuffer(o,176,new Float32Array([l[0],l[1],l[2],t.intensity]));const y=e.createCommandEncoder(),O=D.getCurrentTexture().createView(),n=y.beginRenderPass({colorAttachments:[{view:O,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:M.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});n.setPipeline(h),n.setBindGroup(0,P),n.setVertexBuffer(0,p),n.setIndexBuffer(g,"uint16"),n.drawIndexed(f.length),n.end(),e.queue.submit([y.finish()]),requestAnimationFrame(v)}requestAnimationFrame(v)}I().catch(console.error);
