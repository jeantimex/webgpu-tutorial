import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as L}from"./webgpu-util-BApOR-AX.js";import{m as g}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as T}from"./lil-gui.esm-CNIGZg2U.js";const E=`
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
`;function V(o,e,m,P,h,a,x){const v=[],d=[],w=[],f=[];for(let r=0;r<=m;r++){const n=[],s=r/m;for(let i=0;i<=e;i++){const p=i/e,c=-o*Math.cos(P+p*h)*Math.sin(a+s*x),t=o*Math.cos(a+s*x),M=o*Math.sin(P+p*h)*Math.sin(a+s*x);v.push(c,t,M),n.push(v.length/3-1)}f.push(n)}for(let r=0;r<m;r++)for(let n=0;n<e;n++){const s=f[r][n+1],i=f[r][n],p=f[r+1][n],c=f[r+1][n+1];d.push(i,s),d.push(i,p),d.push(i,c),r===m-1&&d.push(p,c),n===e-1&&d.push(s,c),(r!==m-1||a+x<Math.PI-1e-4)&&w.push(i,p,c),(r!==0||a>1e-4)&&w.push(i,c,s)}return{positions:new Float32Array(v),indicesLine:new Uint16Array(d),indicesTri:new Uint16Array(w)}}async function O(){const o=document.querySelector("#webgpu-canvas"),{device:e,context:m,canvasFormat:P}=await L(o),h=e.createShaderModule({code:E}),a=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),x=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[a]}),vertex:{module:h,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:h,entryPoint:"fs_wireframe",targets:[{format:P}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),v=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[a]}),vertex:{module:h,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:h,entryPoint:"fs_solid",targets:[{format:P,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"zero",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!1,depthCompare:"less",format:"depth24plus"}}),d=1e5,w=6e5,f=e.createBuffer({size:d*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),r=e.createBuffer({size:w*2,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),n=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s=o.width/o.height,i=g.perspective(2*Math.PI/5,s,.1,100),p=e.createTexture({size:[o.width,o.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),c=e.createBindGroup({layout:a,entries:[{binding:0,resource:{buffer:n}}]}),t={radius:1.5,widthSegments:32,heightSegments:16,phiStart:0,phiLength:2,thetaStart:0,thetaLength:1,wireframe:!0};let M=0;function u(){const b=V(t.radius,t.widthSegments,t.heightSegments,t.phiStart*Math.PI,t.phiLength*Math.PI,t.thetaStart*Math.PI,t.thetaLength*Math.PI);e.queue.writeBuffer(f,0,b.positions);const U=t.wireframe?b.indicesLine:b.indicesTri;e.queue.writeBuffer(r,0,U),M=U.length}const l=new T({container:document.getElementById("gui-container"),title:"Sphere Settings"});l.add(t,"radius",.1,3).onChange(u),l.add(t,"widthSegments",3,64,1).onChange(u),l.add(t,"heightSegments",2,32,1).onChange(u),l.add(t,"phiStart",0,2).name("phiStart (x PI)").onChange(u),l.add(t,"phiLength",0,2).name("phiLength (x PI)").onChange(u),l.add(t,"thetaStart",0,1).name("thetaStart (x PI)").onChange(u),l.add(t,"thetaLength",0,1).name("thetaLength (x PI)").onChange(u),l.add(t,"wireframe").name("Wireframe").onChange(u),u();let B=0;function G(){B+=.005;const b=g.lookAt([0,0,5],[0,0,0],[0,1,0]),U=g.multiply(g.rotationY(B),g.rotationX(B*.5)),S=g.multiply(i,g.multiply(b,U));e.queue.writeBuffer(n,0,S);const C=e.createCommandEncoder(),I=m.getCurrentTexture().createView(),y=C.beginRenderPass({colorAttachments:[{view:I,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:p.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});y.setPipeline(t.wireframe?x:v),y.setBindGroup(0,c),y.setVertexBuffer(0,f),y.setIndexBuffer(r,"uint16"),y.drawIndexed(M),y.end(),e.queue.submit([C.finish()]),requestAnimationFrame(G)}requestAnimationFrame(G)}O().catch(console.error);
