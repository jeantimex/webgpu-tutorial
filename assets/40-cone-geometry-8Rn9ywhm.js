import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as I}from"./webgpu-util-BApOR-AX.js";import{m as l}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as S}from"./lil-gui.esm-CNIGZg2U.js";const T=`
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
`;function b(u=1,t=2,f=32,v=1,C=!1,M=0,U=Math.PI*2){const h=[],i=[];let p=0;const m=[],P=t/2,y=0,w=u;for(let r=0;r<=v;r++){const e=[],o=r/v,a=o*(w-y)+y;for(let c=0;c<=f;c++){const g=c/f*U+M,B=Math.sin(g),d=Math.cos(g);h.push(a*B,-o*t+P,a*d),e.push(p++)}m.push(e)}for(let r=0;r<f;r++)for(let e=0;e<v;e++){const o=m[e][r],a=m[e+1][r],c=m[e+1][r+1],s=m[e][r+1];i.push(o,a),i.push(a,c),i.push(o,s),i.push(s,c),i.push(o,c)}!C&&w>0&&n();function n(){const r=p,e=-1;h.push(0,P*e,0),p++;const o=r;for(let a=0;a<=f;a++){const s=a/f*U+M,g=Math.cos(s),B=Math.sin(s);h.push(u*B,P*e,u*g);const d=p++;i.push(o,d),a>0&&i.push(d-1,d)}}return{positions:new Float32Array(h),indices:new Uint16Array(i)}}async function E(){const u=document.querySelector("#webgpu-canvas"),{device:t,context:f,canvasFormat:v}=await I(u),C=t.createRenderPipeline({layout:"auto",vertex:{module:t.createShaderModule({code:T}),entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:t.createShaderModule({code:T}),entryPoint:"fs_main",targets:[{format:v}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),M=1e5,U=2e5,h=t.createBuffer({size:M*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),i=t.createBuffer({size:U*2,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),p=t.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),m=u.width/u.height,P=l.perspective(2*Math.PI/5,m,.1,100),y=t.createTexture({size:[u.width,u.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),w=t.createBindGroup({layout:C.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:p}}]}),n={radius:1,height:2,radialSegments:32,heightSegments:4,openEnded:!1,thetaStart:0,thetaLength:2};let r=0;function e(){const s=b(n.radius,n.height,Math.floor(n.radialSegments),Math.floor(n.heightSegments),n.openEnded,n.thetaStart*Math.PI,n.thetaLength*Math.PI);t.queue.writeBuffer(h,0,s.positions),t.queue.writeBuffer(i,0,s.indices),r=s.indices.length}const o=new S({container:document.getElementById("gui-container"),title:"Cone Settings"});o.add(n,"radius",0,3).onChange(e),o.add(n,"height",.1,5).onChange(e),o.add(n,"radialSegments",3,64,1).onChange(e),o.add(n,"heightSegments",1,32,1).onChange(e),o.add(n,"openEnded").onChange(e),o.add(n,"thetaStart",0,2).name("thetaStart (x PI)").onChange(e),o.add(n,"thetaLength",0,2).name("thetaLength (x PI)").onChange(e),e();let a=0;function c(){a+=.005;const s=l.lookAt([4,4,4],[0,0,0],[0,1,0]),g=l.multiply(l.rotationY(a),l.rotationX(a*.5)),B=l.multiply(P,l.multiply(s,g));t.queue.writeBuffer(p,0,B);const d=t.createCommandEncoder(),G=f.getCurrentTexture().createView(),x=d.beginRenderPass({colorAttachments:[{view:G,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:y.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});x.setPipeline(C),x.setBindGroup(0,w),x.setVertexBuffer(0,h),x.setIndexBuffer(i,"uint16"),x.drawIndexed(r),x.end(),t.queue.submit([d.finish()]),requestAnimationFrame(c)}requestAnimationFrame(c)}E().catch(console.error);
