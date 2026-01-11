import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as E}from"./webgpu-util-BApOR-AX.js";import{m}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as L}from"./lil-gui.esm-CNIGZg2U.js";const V=`
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
  return vec4f(1.0, 0.0, 0.0, 1.0); // Solid Red
}
`;function O(u=1,e=1,w=1,y=1){const f=[],o=[],h=[],P=u/2,b=e/2,p=Math.floor(w),d=Math.floor(y),c=p+1,x=d+1,S=u/p,U=e/d;for(let r=0;r<x;r++){const i=r*U-b;for(let t=0;t<c;t++){const a=t*S-P;f.push(a,-i,0)}}for(let r=0;r<d;r++)for(let i=0;i<p;i++){const t=i+c*r,a=i+c*(r+1),s=i+1+c*(r+1),n=i+1+c*r;o.push(t,a),o.push(t,n),o.push(a,n),i===p-1&&o.push(n,s),r===d-1&&o.push(a,s),h.push(t,a,n),h.push(a,s,n)}return{positions:new Float32Array(f),indicesLine:new Uint16Array(o),indicesTri:new Uint16Array(h)}}async function _(){const u=document.querySelector("#webgpu-canvas"),{device:e,context:w,canvasFormat:y}=await E(u),f=e.createShaderModule({code:V}),o=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),h=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[o]}),vertex:{module:f,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:f,entryPoint:"fs_wireframe",targets:[{format:y}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),P=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[o]}),vertex:{module:f,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:f,entryPoint:"fs_solid",targets:[{format:y}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),b=1e4,p=6e4,d=e.createBuffer({size:b*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c=e.createBuffer({size:p*2,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),x=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),S=u.width/u.height,U=m.perspective(2*Math.PI/5,S,.1,100),r=e.createTexture({size:[u.width,u.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),i=e.createBindGroup({layout:o,entries:[{binding:0,resource:{buffer:x}}]}),t={width:2,height:2,widthSegments:4,heightSegments:4,wireframe:!0};let a=0;function s(){const g=O(t.width,t.height,t.widthSegments,t.heightSegments);e.queue.writeBuffer(d,0,g.positions);const v=t.wireframe?g.indicesLine:g.indicesTri;e.queue.writeBuffer(c,0,v),a=v.length}const n=new L({container:document.getElementById("gui-container"),title:"Plane Settings"});n.add(t,"width",.1,5).onChange(s),n.add(t,"height",.1,5).onChange(s),n.add(t,"widthSegments",1,50,1).onChange(s),n.add(t,"heightSegments",1,50,1).onChange(s),n.add(t,"wireframe").name("Wireframe").onChange(s),s();let B=0;function G(){B+=.005;const g=m.multiply(m.rotationX(-Math.PI/4),m.rotationZ(B)),v=m.lookAt([0,0,5],[0,0,0],[0,1,0]),M=m.multiply(U,m.multiply(v,g));e.queue.writeBuffer(x,0,M);const C=e.createCommandEncoder(),T=w.getCurrentTexture().createView(),l=C.beginRenderPass({colorAttachments:[{view:T,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:r.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});l.setPipeline(t.wireframe?h:P),l.setBindGroup(0,i),l.setVertexBuffer(0,d),l.setIndexBuffer(c,"uint16"),l.drawIndexed(a),l.end(),e.queue.submit([C.finish()]),requestAnimationFrame(G)}requestAnimationFrame(G)}_().catch(console.error);
