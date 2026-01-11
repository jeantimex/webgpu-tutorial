import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as T}from"./webgpu-util-BApOR-AX.js";import{m as c}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as I}from"./lil-gui.esm-CNIGZg2U.js";const y=`
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
  return vec4f(1.0, 1.0, 1.0, 1.0); // White lines
}
`;function O(n=1,e=.4,d=8,a=6,g=Math.PI*2){const x=[],p=[];for(let t=0;t<=d;t++)for(let r=0;r<=a;r++){const i=r/a*g,s=t/d*Math.PI*2,m=(n+e*Math.cos(s))*Math.cos(i),v=(n+e*Math.cos(s))*Math.sin(i),P=e*Math.sin(s);x.push(m,v,P)}for(let t=0;t<d;t++)for(let r=0;r<a;r++){const i=(a+1)*t+r,s=(a+1)*(t+1)+r,m=(a+1)*t+r+1;p.push(i,s),p.push(i,m)}return{positions:new Float32Array(x),indices:new Uint16Array(p)}}async function V(){const n=document.querySelector("#webgpu-canvas"),{device:e,context:d,canvasFormat:a}=await T(n),g=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:y}),entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:y}),entryPoint:"fs_main",targets:[{format:a}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),x=1e5,p=2e5,t=e.createBuffer({size:x*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),r=e.createBuffer({size:p*2,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),i=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s=n.width/n.height,m=c.perspective(2*Math.PI/5,s,.1,100),v=e.createTexture({size:[n.width,n.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),P=e.createBindGroup({layout:g.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i}}]}),o={radius:1,tube:.4,radialSegments:16,tubularSegments:32,arc:2};let M=0;function u(){const h=O(o.radius,o.tube,Math.floor(o.radialSegments),Math.floor(o.tubularSegments),o.arc*Math.PI);e.queue.writeBuffer(t,0,h.positions),e.queue.writeBuffer(r,0,h.indices),M=h.indices.length}const l=new I({container:document.getElementById("gui-container"),title:"Torus Settings"});l.add(o,"radius",.1,3).onChange(u),l.add(o,"tube",.1,3).onChange(u),l.add(o,"radialSegments",2,64,1).onChange(u),l.add(o,"tubularSegments",3,100,1).onChange(u),l.add(o,"arc",0,2).name("arc (x PI)").onChange(u),u();let B=0;function U(){B+=.005;const h=c.lookAt([0,0,5],[0,0,0],[0,1,0]),C=c.multiply(c.rotationY(B),c.rotationX(B*.5)),G=c.multiply(m,c.multiply(h,C));e.queue.writeBuffer(i,0,G);const w=e.createCommandEncoder(),b=d.getCurrentTexture().createView(),f=w.beginRenderPass({colorAttachments:[{view:b,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:v.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});f.setPipeline(g),f.setBindGroup(0,P),f.setVertexBuffer(0,t),f.setIndexBuffer(r,"uint16"),f.drawIndexed(M),f.end(),e.queue.submit([w.finish()]),requestAnimationFrame(U)}requestAnimationFrame(U)}V().catch(console.error);
