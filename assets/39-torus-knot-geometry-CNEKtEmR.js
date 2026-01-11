import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as O}from"./webgpu-util-BApOR-AX.js";import{m,v as l}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as q}from"./lil-gui.esm-CNIGZg2U.js";const G=`
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
`;function V(i=1,e=.4,M=64,p=8,P=2,b=3){const U=[],h=[];function B(t){const r=Math.cos(t),s=Math.sin(t),c=b/P*t,u=Math.cos(c),o=i*(2+u)*.5*r,f=i*(2+u)*.5*s,n=i*Math.sin(c)*.5;return[o,f,n]}for(let t=0;t<=M;t++){const r=t/M*P*Math.PI*2,s=B(r),c=B(r+.01),u=l.normalize(l.sub(c,s)),o=l.normalize(l.add(s,c)),f=l.normalize(l.cross(u,o)),n=l.cross(f,u);for(let a=0;a<=p;a++){const g=a/p*Math.PI*2,x=-e*Math.cos(g),d=e*Math.sin(g),w=s[0]+(x*n[0]+d*f[0]),C=s[1]+(x*n[1]+d*f[1]),y=s[2]+(x*n[2]+d*f[2]);U.push(w,C,y)}}for(let t=0;t<M;t++)for(let r=0;r<p;r++){const s=(p+1)*t+r,c=(p+1)*(t+1)+r,u=(p+1)*t+r+1;h.push(s,c),h.push(s,u)}return{positions:new Float32Array(U),indices:new Uint16Array(h)}}async function E(){const i=document.querySelector("#webgpu-canvas"),{device:e,context:M,canvasFormat:p}=await O(i),P=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:G}),entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:G}),entryPoint:"fs_main",targets:[{format:p}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),b=1e5,U=2e5,h=e.createBuffer({size:b*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),B=e.createBuffer({size:U*2,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),t=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),r=i.width/i.height,s=m.perspective(2*Math.PI/5,r,.1,100),c=e.createTexture({size:[i.width,i.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),u=e.createBindGroup({layout:P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}}]}),o={radius:1,tube:.3,tubularSegments:64,radialSegments:8,p:2,q:3};let f=0;function n(){const d=V(o.radius,o.tube,Math.floor(o.tubularSegments),Math.floor(o.radialSegments),Math.floor(o.p),Math.floor(o.q));e.queue.writeBuffer(h,0,d.positions),e.queue.writeBuffer(B,0,d.indices),f=d.indices.length}const a=new q({container:document.getElementById("gui-container"),title:"Knot Settings"});a.add(o,"radius",.1,3).onChange(n),a.add(o,"tube",.1,3).onChange(n),a.add(o,"tubularSegments",3,200,1).onChange(n),a.add(o,"radialSegments",3,32,1).onChange(n),a.add(o,"p",1,10,1).name("P (Winds)").onChange(n),a.add(o,"q",1,10,1).name("Q (Loops)").onChange(n),n();let g=0;function x(){g+=.005;const d=m.lookAt([0,0,5],[0,0,0],[0,1,0]),w=m.multiply(m.rotationY(g),m.rotationX(g*.5)),C=m.multiply(s,m.multiply(d,w));e.queue.writeBuffer(t,0,C);const y=e.createCommandEncoder(),T=M.getCurrentTexture().createView(),v=y.beginRenderPass({colorAttachments:[{view:T,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:c.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});v.setPipeline(P),v.setBindGroup(0,u),v.setVertexBuffer(0,h),v.setIndexBuffer(B,"uint16"),v.drawIndexed(f),v.end(),e.queue.submit([y.finish()]),requestAnimationFrame(x)}requestAnimationFrame(x)}E().catch(console.error);
