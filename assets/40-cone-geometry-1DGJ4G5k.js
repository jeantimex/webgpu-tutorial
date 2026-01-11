import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as E}from"./webgpu-util-BApOR-AX.js";import{m}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as I}from"./lil-gui.esm-CNIGZg2U.js";const L=`
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
fn fs_wireframe() -> @location(0) vec4f {
  return vec4f(1.0, 1.0, 1.0, 1.0); // White lines
}

@fragment
fn fs_solid() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 0.5); // Transparent Red
}
`;function V(u=1,n=2,p=32,g=1,x=!1,y=0,B=Math.PI*2){const v=[],c=[],P=[];let h=0;const f=[],w=n/2,C=0,U=u;for(let o=0;o<=g;o++){const e=[],a=o/g,t=a*(U-C)+C;for(let r=0;r<=p;r++){const l=r/p*B+y,d=Math.sin(l),s=Math.cos(l);v.push(t*d,-a*n+w,t*s),e.push(h++)}f.push(e)}for(let o=0;o<p;o++)for(let e=0;e<g;e++){const a=f[e][o],t=f[e+1][o],r=f[e+1][o+1],i=f[e][o+1];c.push(a,t),c.push(t,r),e===0&&c.push(a,i),c.push(i,r),c.push(a,r),e!==0&&P.push(a,t,i),P.push(t,r,i)}!x&&U>0&&M();function M(){const o=h,e=-1;v.push(0,w*e,0),h++;const a=o;for(let t=0;t<=p;t++){const i=t/p*B+y,l=Math.cos(i),d=Math.sin(i);v.push(u*d,w*e,u*l);const s=h++;c.push(a,s),t>0&&c.push(s-1,s),t>0&&P.push(a,s,s-1)}}return{positions:new Float32Array(v),indicesLine:new Uint16Array(c),indicesTri:new Uint16Array(P)}}async function A(){const u=document.querySelector("#webgpu-canvas"),{device:n,context:p,canvasFormat:g}=await E(u),x=n.createShaderModule({code:L}),y=n.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),B=n.createRenderPipeline({layout:n.createPipelineLayout({bindGroupLayouts:[y]}),vertex:{module:x,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:x,entryPoint:"fs_wireframe",targets:[{format:g}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),v=n.createRenderPipeline({layout:n.createPipelineLayout({bindGroupLayouts:[y]}),vertex:{module:x,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:x,entryPoint:"fs_solid",targets:[{format:g,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"zero",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!1,depthCompare:"less",format:"depth24plus"}}),c=1e5,P=6e5,h=n.createBuffer({size:c*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),f=n.createBuffer({size:P*2,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),w=n.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),C=u.width/u.height,U=m.perspective(2*Math.PI/5,C,.1,100),M=n.createTexture({size:[u.width,u.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),o=n.createBindGroup({layout:y,entries:[{binding:0,resource:{buffer:w}}]}),e={radius:1,height:2,radialSegments:32,heightSegments:4,openEnded:!1,thetaStart:0,thetaLength:2,wireframe:!0};let a=0;function t(){const d=V(e.radius,e.height,Math.floor(e.radialSegments),Math.floor(e.heightSegments),e.openEnded,e.thetaStart*Math.PI,e.thetaLength*Math.PI);n.queue.writeBuffer(h,0,d.positions);const s=e.wireframe?d.indicesLine:d.indicesTri;n.queue.writeBuffer(f,0,s),a=s.length}const r=new I({container:document.getElementById("gui-container"),title:"Cone Settings"});r.add(e,"radius",0,3).onChange(t),r.add(e,"height",.1,5).onChange(t),r.add(e,"radialSegments",3,64,1).onChange(t),r.add(e,"heightSegments",1,32,1).onChange(t),r.add(e,"openEnded").onChange(t),r.add(e,"thetaStart",0,2).name("thetaStart (x PI)").onChange(t),r.add(e,"thetaLength",0,2).name("thetaLength (x PI)").onChange(t),r.add(e,"wireframe").name("Wireframe").onChange(t),t();let i=0;function l(){i+=.005;const d=m.lookAt([4,4,4],[0,0,0],[0,1,0]),s=m.multiply(m.rotationY(i),m.rotationX(i*.5)),G=m.multiply(U,m.multiply(d,s));n.queue.writeBuffer(w,0,G);const T=n.createCommandEncoder(),S=p.getCurrentTexture().createView(),b=T.beginRenderPass({colorAttachments:[{view:S,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:M.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});b.setPipeline(e.wireframe?B:v),b.setBindGroup(0,o),b.setVertexBuffer(0,h),b.setIndexBuffer(f,"uint16"),b.drawIndexed(a),b.end(),n.queue.submit([T.finish()]),requestAnimationFrame(l)}requestAnimationFrame(l)}A().catch(console.error);
