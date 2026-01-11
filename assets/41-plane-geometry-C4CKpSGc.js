import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as E}from"./webgpu-util-BApOR-AX.js";import{m as p}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as L}from"./lil-gui.esm-CNIGZg2U.js";const V=`
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
`;function O(c=1,e=1,w=1,y=1){const d=[],o=[],h=[],P=c/2,b=e/2,l=Math.floor(w),f=Math.floor(y),u=l+1,x=f+1,U=c/l,B=e/f;for(let r=0;r<x;r++){const n=r*B-b;for(let t=0;t<u;t++){const a=t*U-P;d.push(a,-n,0)}}for(let r=0;r<f;r++)for(let n=0;n<l;n++){const t=n+u*r,a=n+u*(r+1),s=n+1+u*(r+1),i=n+1+u*r;o.push(t,a),o.push(t,i),o.push(a,i),n===l-1&&o.push(i,s),r===f-1&&o.push(a,s),h.push(t,a,i),h.push(a,s,i)}return{positions:new Float32Array(d),indicesLine:new Uint16Array(o),indicesTri:new Uint16Array(h)}}async function _(){const c=document.querySelector("#webgpu-canvas"),{device:e,context:w,canvasFormat:y}=await E(c),d=e.createShaderModule({code:V}),o=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),h=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[o]}),vertex:{module:d,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:d,entryPoint:"fs_wireframe",targets:[{format:y}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),P=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[o]}),vertex:{module:d,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:d,entryPoint:"fs_solid",targets:[{format:y,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"zero",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),b=1e4,l=6e4,f=e.createBuffer({size:b*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),u=e.createBuffer({size:l*2,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),x=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),U=c.width/c.height,B=p.perspective(2*Math.PI/5,U,.1,100),r=e.createTexture({size:[c.width,c.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),n=e.createBindGroup({layout:o,entries:[{binding:0,resource:{buffer:x}}]}),t={width:2,height:2,widthSegments:4,heightSegments:4,wireframe:!0};let a=0;function s(){const g=O(t.width,t.height,t.widthSegments,t.heightSegments);e.queue.writeBuffer(f,0,g.positions);const v=t.wireframe?g.indicesLine:g.indicesTri;e.queue.writeBuffer(u,0,v),a=v.length}const i=new L({container:document.getElementById("gui-container"),title:"Plane Settings"});i.add(t,"width",.1,5).onChange(s),i.add(t,"height",.1,5).onChange(s),i.add(t,"widthSegments",1,50,1).onChange(s),i.add(t,"heightSegments",1,50,1).onChange(s),i.add(t,"wireframe").name("Wireframe").onChange(s),s();let S=0;function G(){S+=.005;const g=p.multiply(p.rotationX(-Math.PI/4),p.rotationZ(S)),v=p.lookAt([0,0,5],[0,0,0],[0,1,0]),T=p.multiply(B,p.multiply(v,g));e.queue.writeBuffer(x,0,T);const C=e.createCommandEncoder(),M=w.getCurrentTexture().createView(),m=C.beginRenderPass({colorAttachments:[{view:M,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:r.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});m.setPipeline(t.wireframe?h:P),m.setBindGroup(0,n),m.setVertexBuffer(0,f),m.setIndexBuffer(u,"uint16"),m.drawIndexed(a),m.end(),e.queue.submit([C.finish()]),requestAnimationFrame(G)}requestAnimationFrame(G)}_().catch(console.error);
