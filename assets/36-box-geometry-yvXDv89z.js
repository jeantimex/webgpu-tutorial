import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as A}from"./webgpu-util-BApOR-AX.js";import{m as y}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as F}from"./lil-gui.esm-CNIGZg2U.js";const I=`
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
`;function R(o=1,e=1,u=1,m=1,a=1,f=1){const B=[],d=[],w=[];function l(G,C,T,O,_,M,S,r,h,n){const s=M/h,U=S/n,E=M/2,g=S/2,v=r/2,x=h+1,L=n+1,b=B.length/3;for(let t=0;t<L;t++){const c=t*U-g;for(let p=0;p<x;p++){const P=p*s-E,i=[0,0,0];i[G]=P*O,i[C]=c*_,i[T]=v,B.push(i[0],i[1],i[2])}}for(let t=0;t<n;t++)for(let c=0;c<h;c++){const p=b+c+x*t,P=b+c+x*(t+1),i=b+(c+1)+x*(t+1),V=b+(c+1)+x*t;d.push(p,V),d.push(p,P),d.push(p,i),t===n-1&&d.push(P,i),c===h-1&&d.push(V,i),w.push(p,P,V),w.push(P,i,V)}}return l(2,1,0,-1,-1,u,e,o,f,a),l(2,1,0,1,-1,u,e,-o,f,a),l(0,2,1,1,1,o,u,e,m,f),l(0,2,1,1,-1,o,u,-e,m,f),l(0,1,2,1,-1,o,e,u,m,a),l(0,1,2,-1,-1,o,e,-u,m,a),{positions:new Float32Array(B),indicesLine:new Uint16Array(d),indicesTri:new Uint16Array(w)}}async function q(){const o=document.querySelector("#webgpu-canvas"),{device:e,context:u,canvasFormat:m}=await A(o),a=e.createShaderModule({code:I}),f=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),B=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[f]}),vertex:{module:a,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:a,entryPoint:"fs_wireframe",targets:[{format:m}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),d=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[f]}),vertex:{module:a,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:a,entryPoint:"fs_solid",targets:[{format:m,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"zero",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!1,depthCompare:"less",format:"depth24plus"}}),w=1e5,l=6e5,G=e.createBuffer({size:w*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),C=e.createBuffer({size:l*2,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),T=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),O=o.width/o.height,_=y.perspective(2*Math.PI/5,O,.1,100),M=e.createTexture({size:[o.width,o.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),S=e.createBindGroup({layout:f,entries:[{binding:0,resource:{buffer:T}}]}),r={width:1.5,height:1.5,depth:1.5,widthSegments:2,heightSegments:2,depthSegments:2,wireframe:!0};let h=0;function n(){const g=R(r.width,r.height,r.depth,Math.floor(r.widthSegments),Math.floor(r.heightSegments),Math.floor(r.depthSegments));e.queue.writeBuffer(G,0,g.positions);const v=r.wireframe?g.indicesLine:g.indicesTri;e.queue.writeBuffer(C,0,v),h=v.length}const s=new F({container:document.getElementById("gui-container"),title:"Box Settings"});s.add(r,"width",.1,3).onChange(n),s.add(r,"height",.1,3).onChange(n),s.add(r,"depth",.1,3).onChange(n),s.add(r,"widthSegments",1,10,1).onChange(n),s.add(r,"heightSegments",1,10,1).onChange(n),s.add(r,"depthSegments",1,10,1).onChange(n),s.add(r,"wireframe").name("Wireframe").onChange(n),n();let U=0;function E(){U+=.005;const g=y.lookAt([3,3,3],[0,0,0],[0,1,0]),v=y.multiply(y.rotationY(U),y.rotationX(U*.5)),x=y.multiply(_,y.multiply(g,v));e.queue.writeBuffer(T,0,x);const L=e.createCommandEncoder(),b=u.getCurrentTexture().createView(),t=L.beginRenderPass({colorAttachments:[{view:b,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:M.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});t.setPipeline(r.wireframe?B:d),t.setBindGroup(0,S),t.setVertexBuffer(0,G),t.setIndexBuffer(C,"uint16"),t.drawIndexed(h),t.end(),e.queue.submit([L.finish()]),requestAnimationFrame(E)}requestAnimationFrame(E)}q().catch(console.error);
