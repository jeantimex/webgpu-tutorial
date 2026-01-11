import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as E}from"./webgpu-util-BApOR-AX.js";import{m as y}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as I}from"./lil-gui.esm-CNIGZg2U.js";const L=`
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
`;function V(s=1,r=1,B=2,f=32,p=1,v=!1,U=0,M=Math.PI*2){const P=[],c=[],h=[];let m=0;const l=[],C=B/2;for(let o=0;o<=p;o++){const a=[],e=o/p,i=e*(r-s)+s;for(let t=0;t<=f;t++){const g=t/f*M+U,x=Math.sin(g),u=Math.cos(g);P.push(i*x,-e*B+C,i*u),a.push(m++)}l.push(a)}for(let o=0;o<f;o++)for(let a=0;a<p;a++){const e=l[a][o],i=l[a+1][o],t=l[a+1][o+1],n=l[a][o+1];c.push(e,i),c.push(i,t),c.push(e,n),c.push(n,t),c.push(e,t),h.push(e,i,n),h.push(i,t,n)}!v&&s>0&&G(!0),!v&&r>0&&G(!1);function G(o){const a=m,e=o?s:r,i=o?1:-1;P.push(0,C*i,0),m++;const t=a;for(let n=0;n<=f;n++){const x=n/f*M+U,u=Math.cos(x),w=Math.sin(x);P.push(e*w,C*i,e*u);const d=m++;c.push(t,d),n>0&&c.push(d-1,d),n>0&&(o?h.push(t,d-1,d):h.push(t,d,d-1))}}return{positions:new Float32Array(P),indicesLine:new Uint16Array(c),indicesTri:new Uint16Array(h)}}async function A(){const s=document.querySelector("#webgpu-canvas"),{device:r,context:B,canvasFormat:f}=await E(s),p=r.createShaderModule({code:L}),v=r.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),U=r.createRenderPipeline({layout:r.createPipelineLayout({bindGroupLayouts:[v]}),vertex:{module:p,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:p,entryPoint:"fs_wireframe",targets:[{format:f}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),M=r.createRenderPipeline({layout:r.createPipelineLayout({bindGroupLayouts:[v]}),vertex:{module:p,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:p,entryPoint:"fs_solid",targets:[{format:f,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"zero",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!1,depthCompare:"less",format:"depth24plus"}}),P=1e5,c=6e5,h=r.createBuffer({size:P*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),m=r.createBuffer({size:c*2,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),l=r.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),C=s.width/s.height,G=y.perspective(2*Math.PI/5,C,.1,100),o=r.createTexture({size:[s.width,s.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),a=r.createBindGroup({layout:v,entries:[{binding:0,resource:{buffer:l}}]}),e={radiusTop:1,radiusBottom:1,height:2,radialSegments:32,heightSegments:4,openEnded:!1,thetaStart:0,thetaLength:2,wireframe:!0};let i=0;function t(){const u=V(e.radiusTop,e.radiusBottom,e.height,Math.floor(e.radialSegments),Math.floor(e.heightSegments),e.openEnded,e.thetaStart*Math.PI,e.thetaLength*Math.PI);r.queue.writeBuffer(h,0,u.positions);const w=e.wireframe?u.indicesLine:u.indicesTri;r.queue.writeBuffer(m,0,w),i=w.length}const n=new I({container:document.getElementById("gui-container"),title:"Cylinder Settings"});n.add(e,"radiusTop",0,3).onChange(t),n.add(e,"radiusBottom",0,3).onChange(t),n.add(e,"height",.1,5).onChange(t),n.add(e,"radialSegments",3,64,1).onChange(t),n.add(e,"heightSegments",1,32,1).onChange(t),n.add(e,"openEnded").onChange(t),n.add(e,"thetaStart",0,2).name("thetaStart (x PI)").onChange(t),n.add(e,"thetaLength",0,2).name("thetaLength (x PI)").onChange(t),n.add(e,"wireframe").name("Wireframe").onChange(t),t();let g=0;function x(){g+=.005;const u=y.lookAt([4,4,4],[0,0,0],[0,1,0]),w=y.multiply(y.rotationY(g),y.rotationX(g*.5)),d=y.multiply(G,y.multiply(u,w));r.queue.writeBuffer(l,0,d);const T=r.createCommandEncoder(),S=B.getCurrentTexture().createView(),b=T.beginRenderPass({colorAttachments:[{view:S,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:o.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});b.setPipeline(e.wireframe?U:M),b.setBindGroup(0,a),b.setVertexBuffer(0,h),b.setIndexBuffer(m,"uint16"),b.drawIndexed(i),b.end(),r.queue.submit([T.finish()]),requestAnimationFrame(x)}requestAnimationFrame(x)}A().catch(console.error);
