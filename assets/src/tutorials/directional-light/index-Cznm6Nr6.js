import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as U}from"../../../canvas-util-BFZcuyXb.js";import{i as C}from"../../../webgpu-util-BApOR-AX.js";import{a as u,m as r,v as E}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";import{G as O}from"../../../lil-gui.esm-CNIGZg2U.js";const V=`struct Uniforms {
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
`,I=`struct Uniforms {
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

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let N = normalize(in.normal);
  let L = normalize(uniforms.lightDirIntensity.xyz);
  
  // Diffuse only
  let diffuse = max(dot(N, L), 0.0) * max(uniforms.lightDirIntensity.w, 0.0);
  
  let baseColor = vec3f(1.0, 0.0, 0.0); // Red
  return vec4f(baseColor * diffuse, 1.0);
}
`,q=V,R=I;async function _(){const n=document.querySelector("#webgpu-canvas"),{device:e,context:b,canvasFormat:P}=await C(n),g=new Float32Array([-.5,-.5,.5,0,0,1,.5,-.5,.5,0,0,1,.5,.5,.5,0,0,1,-.5,.5,.5,0,0,1,.5,-.5,.5,1,0,0,.5,-.5,-.5,1,0,0,.5,.5,-.5,1,0,0,.5,.5,.5,1,0,0,.5,-.5,-.5,0,0,-1,-.5,-.5,-.5,0,0,-1,-.5,.5,-.5,0,0,-1,.5,.5,-.5,0,0,-1,-.5,-.5,-.5,-1,0,0,-.5,-.5,.5,-1,0,0,-.5,.5,.5,-1,0,0,-.5,.5,-.5,-1,0,0,-.5,.5,.5,0,1,0,.5,.5,.5,0,1,0,.5,.5,-.5,0,1,0,-.5,.5,-.5,0,1,0,-.5,-.5,-.5,0,-1,0,.5,-.5,-.5,0,-1,0,.5,-.5,.5,0,-1,0,-.5,-.5,.5,0,-1,0]),f=new Uint16Array([0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20]),p=e.createBuffer({size:g.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(p,0,g);const h=e.createBuffer({size:f.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(h,0,f);const o=e.createBuffer({size:192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});function x(){const w=n.width/n.height;return r.perspective(2*Math.PI/5,w,.1,100)}U(n);let v=x(),c=e.createTexture({size:[n.width,n.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const S=e.createShaderModule({label:"Directional Light Vertex Shader",code:q}),T=e.createShaderModule({label:"Directional Light Fragment Shader",code:R}),y=e.createRenderPipeline({layout:"auto",vertex:{module:S,entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:T,entryPoint:"fs_main",targets:[{format:P}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),G=e.createBindGroup({layout:y.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:o}}]}),t={lightDirX:1,lightDirY:1,lightDirZ:1,intensity:1,animate:!0},s=new O({container:document.getElementById("gui-container")});s.add(t,"lightDirX",-1,1).name("Light Dir X"),s.add(t,"lightDirY",-1,1).name("Light Dir Y"),s.add(t,"lightDirZ",-1,1).name("Light Dir Z"),s.add(t,"intensity",0,2).name("Intensity"),s.add(t,"animate").name("Animate");let m=0;const i=u.create(),D=new Float32Array(12);function B(){U(n)&&(v=x(),c.destroy(),c=e.createTexture({size:[n.width,n.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT})),t.animate&&(m+=.01);const l=r.multiply(r.rotationY(m),r.rotationX(m*.5)),z=r.lookAt([2.5,2.5,2.5],[0,0,0],[0,1,0]),L=r.multiply(v,r.multiply(z,l));u.fromMat4(l,i),u.invert(i,i),u.transpose(i,i),D.set(i),e.queue.writeBuffer(o,0,L),e.queue.writeBuffer(o,64,l),e.queue.writeBuffer(o,128,D);const d=E.normalize([t.lightDirX,t.lightDirY,t.lightDirZ]);e.queue.writeBuffer(o,176,new Float32Array([d[0],d[1],d[2],t.intensity]));const M=e.createCommandEncoder(),A=b.getCurrentTexture().createView(),a=M.beginRenderPass({colorAttachments:[{view:A,clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:c.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});a.setPipeline(y),a.setBindGroup(0,G),a.setVertexBuffer(0,p),a.setIndexBuffer(h,"uint16"),a.drawIndexed(f.length),a.end(),e.queue.submit([M.finish()]),requestAnimationFrame(B)}requestAnimationFrame(B)}_().catch(console.error);
