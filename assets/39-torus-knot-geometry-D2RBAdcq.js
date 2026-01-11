import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as S}from"./webgpu-util-BApOR-AX.js";import{m as g,v}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as O}from"./lil-gui.esm-CNIGZg2U.js";const V=`
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
`;function _(f=1,t=.4,w=64,c=8,l=2,M=3){const U=[],y=[],B=[];function G(o){const n=Math.cos(o),r=Math.sin(o),i=M/l*o,u=Math.cos(i),d=f*(2+u)*.5*n,p=f*(2+u)*.5*r,e=f*Math.sin(i)*.5;return[d,p,e]}for(let o=0;o<=w;o++){const n=o/w*l*Math.PI*2,r=G(n),i=G(n+.01),u=v.normalize(v.sub(i,r)),d=v.normalize(v.add(r,i)),p=v.normalize(v.cross(u,d)),e=v.cross(p,u);for(let x=0;x<=c;x++){const a=x/c*Math.PI*2,s=-t*Math.cos(a),m=t*Math.sin(a),C=r[0]+(s*e[0]+m*p[0]),h=r[1]+(s*e[1]+m*p[1]),P=r[2]+(s*e[2]+m*p[2]);U.push(C,h,P)}}for(let o=0;o<w;o++)for(let n=0;n<c;n++){const r=(c+1)*o+n,i=(c+1)*(o+1)+n,u=(c+1)*(o+1)+n+1,d=(c+1)*o+n+1;y.push(r,i),y.push(r,d),y.push(r,u),B.push(r,i,d),B.push(i,u,d)}return{positions:new Float32Array(U),indicesLine:new Uint16Array(y),indicesTri:new Uint16Array(B)}}async function q(){const f=document.querySelector("#webgpu-canvas"),{device:t,context:w,canvasFormat:c}=await S(f),l=t.createShaderModule({code:V}),M=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),U=t.createRenderPipeline({layout:t.createPipelineLayout({bindGroupLayouts:[M]}),vertex:{module:l,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:l,entryPoint:"fs_wireframe",targets:[{format:c}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),y=t.createRenderPipeline({layout:t.createPipelineLayout({bindGroupLayouts:[M]}),vertex:{module:l,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:l,entryPoint:"fs_solid",targets:[{format:c,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"zero",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!1,depthCompare:"less",format:"depth24plus"}}),B=1e5,G=6e5,o=t.createBuffer({size:B*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),n=t.createBuffer({size:G*2,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),r=t.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),i=f.width/f.height,u=g.perspective(2*Math.PI/5,i,.1,100),d=t.createTexture({size:[f.width,f.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),p=t.createBindGroup({layout:M,entries:[{binding:0,resource:{buffer:r}}]}),e={radius:1,tube:.3,tubularSegments:64,radialSegments:8,p:2,q:3,wireframe:!0};let x=0;function a(){const h=_(e.radius,e.tube,Math.floor(e.tubularSegments),Math.floor(e.radialSegments),Math.floor(e.p),Math.floor(e.q));t.queue.writeBuffer(o,0,h.positions);const P=e.wireframe?h.indicesLine:h.indicesTri;t.queue.writeBuffer(n,0,P),x=P.length}const s=new O({container:document.getElementById("gui-container"),title:"Knot Settings"});s.add(e,"radius",.1,3).onChange(a),s.add(e,"tube",.1,3).onChange(a),s.add(e,"tubularSegments",3,200,1).onChange(a),s.add(e,"radialSegments",3,32,1).onChange(a),s.add(e,"p",1,10,1).name("P (Winds)").onChange(a),s.add(e,"q",1,10,1).name("Q (Loops)").onChange(a),s.add(e,"wireframe").name("Wireframe").onChange(a),a();let m=0;function C(){m+=.005;const h=g.lookAt([0,0,5],[0,0,0],[0,1,0]),P=g.multiply(g.rotationY(m),g.rotationX(m*.5)),E=g.multiply(u,g.multiply(h,P));t.queue.writeBuffer(r,0,E);const T=t.createCommandEncoder(),L=w.getCurrentTexture().createView(),b=T.beginRenderPass({colorAttachments:[{view:L,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:d.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});b.setPipeline(e.wireframe?U:y),b.setBindGroup(0,p),b.setVertexBuffer(0,o),b.setIndexBuffer(n,"uint16"),b.drawIndexed(x),b.end(),t.queue.submit([T.finish()]),requestAnimationFrame(C)}requestAnimationFrame(C)}q().catch(console.error);
