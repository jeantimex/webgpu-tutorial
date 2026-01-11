import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as S}from"./webgpu-util-BApOR-AX.js";import{m as f}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as I}from"./lil-gui.esm-CNIGZg2U.js";const L=`
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
`;function V(s=1,e=.4,v=8,n=6,p=Math.PI*2){const l=[],m=[],x=[];for(let r=0;r<=v;r++)for(let o=0;o<=n;o++){const i=o/n*p,a=r/v*Math.PI*2,c=(s+e*Math.cos(a))*Math.cos(i),u=(s+e*Math.cos(a))*Math.sin(i),w=e*Math.sin(a);l.push(c,u,w)}for(let r=0;r<v;r++)for(let o=0;o<n;o++){const i=(n+1)*r+o,a=(n+1)*(r+1)+o,c=(n+1)*(r+1)+o+1,u=(n+1)*r+o+1;m.push(i,a),m.push(i,u),m.push(i,c),x.push(i,a,u),x.push(a,c,u)}return{positions:new Float32Array(l),indicesLine:new Uint16Array(m),indicesTri:new Uint16Array(x)}}async function O(){const s=document.querySelector("#webgpu-canvas"),{device:e,context:v,canvasFormat:n}=await S(s),p=e.createShaderModule({code:L}),l=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),m=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[l]}),vertex:{module:p,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:p,entryPoint:"fs_wireframe",targets:[{format:n}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),x=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[l]}),vertex:{module:p,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:p,entryPoint:"fs_solid",targets:[{format:n,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"zero",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!1,depthCompare:"less",format:"depth24plus"}}),r=1e5,o=6e5,i=e.createBuffer({size:r*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),a=e.createBuffer({size:o*2,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),u=s.width/s.height,w=f.perspective(2*Math.PI/5,u,.1,100),G=e.createTexture({size:[s.width,s.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),T=e.createBindGroup({layout:l,entries:[{binding:0,resource:{buffer:c}}]}),t={radius:1,tube:.4,radialSegments:16,tubularSegments:32,arc:2,wireframe:!0};let M=0;function d(){const y=V(t.radius,t.tube,Math.floor(t.radialSegments),Math.floor(t.tubularSegments),t.arc*Math.PI);e.queue.writeBuffer(i,0,y.positions);const P=t.wireframe?y.indicesLine:y.indicesTri;e.queue.writeBuffer(a,0,P),M=P.length}const h=new I({container:document.getElementById("gui-container"),title:"Torus Settings"});h.add(t,"radius",.1,3).onChange(d),h.add(t,"tube",.1,3).onChange(d),h.add(t,"radialSegments",2,64,1).onChange(d),h.add(t,"tubularSegments",3,100,1).onChange(d),h.add(t,"arc",0,2).name("arc (x PI)").onChange(d),h.add(t,"wireframe").name("Wireframe").onChange(d),d();let b=0;function U(){b+=.005;const y=f.lookAt([0,0,5],[0,0,0],[0,1,0]),P=f.multiply(f.rotationY(b),f.rotationX(b*.5)),C=f.multiply(w,f.multiply(y,P));e.queue.writeBuffer(c,0,C);const B=e.createCommandEncoder(),E=v.getCurrentTexture().createView(),g=B.beginRenderPass({colorAttachments:[{view:E,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:G.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});g.setPipeline(t.wireframe?m:x),g.setBindGroup(0,T),g.setVertexBuffer(0,i),g.setIndexBuffer(a,"uint16"),g.drawIndexed(M),g.end(),e.queue.submit([B.finish()]),requestAnimationFrame(U)}requestAnimationFrame(U)}O().catch(console.error);
