import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as _}from"./webgpu-util-BApOR-AX.js";import{m as x}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as q}from"./lil-gui.esm-CNIGZg2U.js";const I=`
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
`;function R(n=1,e=1,f=1,v=1,l=1,B=1){const U=[],i=[];function s(P,M,O,S,T,t,y,c,o,d){const C=t/o,m=y/d,V=t/2,E=y/2,b=c/2,h=o+1,p=d+1,w=U.length/3;for(let r=0;r<p;r++){const u=r*m-E;for(let g=0;g<h;g++){const G=g*C-V,a=[0,0,0];a[P]=G*S,a[M]=u*T,a[O]=b,U.push(a[0],a[1],a[2])}}for(let r=0;r<d;r++)for(let u=0;u<o;u++){const g=w+u+h*r,G=w+u+h*(r+1),a=w+(u+1)+h*(r+1),A=w+(u+1)+h*r;i.push(g,A),i.push(g,G),i.push(g,a),r===d-1&&i.push(G,a),u===o-1&&i.push(A,a)}}return s(2,1,0,-1,-1,f,e,n,B,l),s(2,1,0,1,-1,f,e,-n,B,l),s(0,2,1,1,1,n,f,e,v,B),s(0,2,1,1,-1,n,f,-e,v,B),s(0,1,2,1,-1,n,e,f,v,l),s(0,1,2,-1,-1,n,e,-f,v,l),{positions:new Float32Array(U),indices:new Uint16Array(i)}}async function D(){const n=document.querySelector("#webgpu-canvas"),{device:e,context:f,canvasFormat:v}=await _(n),l=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:I}),entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:I}),entryPoint:"fs_main",targets:[{format:v}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),B=1e5,U=2e5,i=e.createBuffer({size:B*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),s=e.createBuffer({size:U*2,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),P=e.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),M=n.width/n.height,O=x.perspective(2*Math.PI/5,M,.1,100),S=e.createTexture({size:[n.width,n.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),T=e.createBindGroup({layout:l.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:P}}]}),t={width:1.5,height:1.5,depth:1.5,widthSegments:2,heightSegments:2,depthSegments:2};let y=0;function c(){const m=R(t.width,t.height,t.depth,Math.floor(t.widthSegments),Math.floor(t.heightSegments),Math.floor(t.depthSegments));e.queue.writeBuffer(i,0,m.positions),e.queue.writeBuffer(s,0,m.indices),y=m.indices.length}const o=new q({container:document.getElementById("gui-container"),title:"Box Settings"});o.add(t,"width",.1,3).onChange(c),o.add(t,"height",.1,3).onChange(c),o.add(t,"depth",.1,3).onChange(c),o.add(t,"widthSegments",1,10,1).onChange(c),o.add(t,"heightSegments",1,10,1).onChange(c),o.add(t,"depthSegments",1,10,1).onChange(c),c();let d=0;function C(){d+=.005;const m=x.lookAt([3,3,3],[0,0,0],[0,1,0]),V=x.multiply(x.rotationY(d),x.rotationX(d*.5)),E=x.multiply(O,x.multiply(m,V));e.queue.writeBuffer(P,0,E);const b=e.createCommandEncoder(),h=f.getCurrentTexture().createView(),p=b.beginRenderPass({colorAttachments:[{view:h,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:S.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});p.setPipeline(l),p.setBindGroup(0,T),p.setVertexBuffer(0,i),p.setIndexBuffer(s,"uint16"),p.drawIndexed(y),p.end(),e.queue.submit([b.finish()]),requestAnimationFrame(C)}requestAnimationFrame(C)}D().catch(console.error);
