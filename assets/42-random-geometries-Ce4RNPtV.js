import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as X}from"./webgpu-util-BApOR-AX.js";import{v as N,m as B}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as Y}from"./lil-gui.esm-CNIGZg2U.js";function j(){const n=new Float32Array([-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,.5,.5,-.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,-.5,.5,.5,.5,.5,.5,.5,.5,-.5,-.5,.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,.5,-.5,.5,-.5,-.5,.5,.5,-.5,.5,.5,-.5,-.5,.5,.5,-.5,.5,.5,.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,-.5]),t=new Float32Array([0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0]),f=new Uint16Array([0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23]);return{positions:n,normals:t,indices:f}}function k(n=.5,t=16,f=12){const s=[],v=[],m=[];for(let o=0;o<=f;o++){const e=o/f*Math.PI;for(let a=0;a<=t;a++){const c=a/t*2*Math.PI,i=-n*Math.cos(c)*Math.sin(e),h=n*Math.cos(e),x=n*Math.sin(c)*Math.sin(e);s.push(i,h,x),v.push(i/n,h/n,x/n)}}for(let o=0;o<f;o++)for(let r=0;r<t;r++){const e=o*(t+1)+r+1,a=o*(t+1)+r,u=(o+1)*(t+1)+r,c=(o+1)*(t+1)+r+1;o!==0&&m.push(a,u,c),o!==f-1&&m.push(a,c,e)}return{positions:new Float32Array(s),normals:new Float32Array(v),indices:new Uint16Array(m)}}function D(n=.5,t=.5,f=1,s=16){const v=[],m=[],o=[],r=(t-n)/f;for(let e=0;e<=1;e++){const a=e,u=a*(t-n)+n;for(let c=0;c<=s;c++){const h=c/s*2*Math.PI,x=Math.sin(h),P=Math.cos(h);v.push(u*x,-a*f+f/2,u*P),m.push(x,r,P)}}for(let e=0;e<s;e++){const a=e,u=e+1,c=e+s+1,i=e+s+2;o.push(a,c,i),o.push(a,i,u)}return{positions:new Float32Array(v),normals:new Float32Array(m),indices:new Uint16Array(o)}}function _(n=.4,t=.15,f=8,s=16){const v=[],m=[],o=[];for(let r=0;r<=f;r++)for(let e=0;e<=s;e++){const a=e/s*Math.PI*2,u=r/f*Math.PI*2,c=(n+t*Math.cos(u))*Math.cos(a),i=(n+t*Math.cos(u))*Math.sin(a),h=t*Math.sin(u);v.push(c,i,h);const x=n*Math.cos(a),P=n*Math.sin(a),G=N.normalize([c-x,i-P,h]);m.push(G[0],G[1],G[2])}for(let r=0;r<f;r++)for(let e=0;e<s;e++){const a=(s+1)*r+e,u=(s+1)*(r+1)+e,c=(s+1)*(r+1)+e+1,i=(s+1)*r+e+1;o.push(a,u,i),o.push(u,c,i)}return{positions:new Float32Array(v),normals:new Float32Array(m),indices:new Uint16Array(o)}}const q=`
struct Uniforms {
  viewProjectionMatrix : mat4x4f,
  lightDir : vec3f,
}
@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct InstanceInput {
  @location(2) modelMatrix0 : vec4f,
  @location(3) modelMatrix1 : vec4f,
  @location(4) modelMatrix2 : vec4f,
  @location(5) modelMatrix3 : vec4f,
  @location(6) color : vec4f,
}

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) normal : vec3f,
  @location(1) color : vec4f,
}

@vertex
fn vs_main(
  @location(0) position : vec3f,
  @location(1) normal : vec3f,
  instance : InstanceInput,
) -> VertexOutput {
  let modelMatrix = mat4x4f(
    instance.modelMatrix0,
    instance.modelMatrix1,
    instance.modelMatrix2,
    instance.modelMatrix3
  );

  var out : VertexOutput;
  out.position = uniforms.viewProjectionMatrix * modelMatrix * vec4f(position, 1.0);
  out.normal = (modelMatrix * vec4f(normal, 0.0)).xyz;
  out.color = instance.color;
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let N = normalize(in.normal);
  let L = normalize(uniforms.lightDir);
  let light = max(dot(N, L), 0.0) + 0.2; 
  return vec4f(in.color.rgb * light, 1.0);
}
`;async function W(){const n=document.querySelector("#webgpu-canvas"),{device:t,context:f,canvasFormat:s}=await X(n),m=[j(),k(),D(.5,.5,1,16),D(0,.5,1,16),_(),_(.3,.1,6,12)].map(l=>{const y=t.createBuffer({size:l.positions.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(y,0,l.positions);const U=t.createBuffer({size:l.normals.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(U,0,l.normals);const M=t.createBuffer({size:l.indices.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});return t.queue.writeBuffer(M,0,l.indices),{vertexBuffer:y,normalBuffer:U,indexBuffer:M,indexCount:l.indices.length}}),o=t.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),r=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),e=t.createBindGroup({layout:r,entries:[{binding:0,resource:{buffer:o}}]}),a=N.normalize([1,2,1]);t.queue.writeBuffer(o,64,a);const u=t.createRenderPipeline({layout:t.createPipelineLayout({bindGroupLayouts:[r]}),vertex:{module:t.createShaderModule({code:q}),entryPoint:"vs_main",buffers:[{arrayStride:12,stepMode:"vertex",attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:12,stepMode:"vertex",attributes:[{shaderLocation:1,offset:0,format:"float32x3"}]},{arrayStride:80,stepMode:"instance",attributes:[{shaderLocation:2,offset:0,format:"float32x4"},{shaderLocation:3,offset:16,format:"float32x4"},{shaderLocation:4,offset:32,format:"float32x4"},{shaderLocation:5,offset:48,format:"float32x4"},{shaderLocation:6,offset:64,format:"float32x4"}]}]},fragment:{module:t.createShaderModule({code:q}),entryPoint:"fs_main",targets:[{format:s}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),c=t.createTexture({size:[n.width,n.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),i=1e6,h=t.createBuffer({size:i*80,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),x={count:1e3};function P(){const l=new Float32Array(i*20),y=100,U=Math.floor(i/6);let M=0;const d=B.create();for(let w=0;w<6;w++)for(let I=0;I<U;I++){const L=(Math.random()-.5)*y*2,T=(Math.random()-.5)*y*2,O=(Math.random()-.5)*y*2,b=(Math.random()*1.5+1)*5,C=Math.random()*Math.PI,V=Math.random()*Math.PI;B.identity(d),B.translate(d,[L,T,O],d),B.rotateX(d,C,d),B.rotateY(d,V,d),B.scale(d,[b,b,b],d);for(let p=0;p<16;p++)l[M+p]=d[p];l[M+16]=Math.random(),l[M+17]=Math.random(),l[M+18]=Math.random(),l[M+19]=1,M+=20}t.queue.writeBuffer(h,0,l)}P(),new Y({container:document.getElementById("gui-container")}).add(x,"count",[1,10,100,1e3,1e4,1e5,1e6]).name("Object Count");function z(){const l=Number(x.count),y=Math.floor(i/6),U=n.width/n.height,M=B.perspective(2*Math.PI/5,U,.1,500),d=Date.now()/5e3,w=250,I=Math.sin(d)*w,L=Math.sin(d*.5)*w*.5,T=Math.cos(d)*w,O=B.lookAt([I,L,T],[0,0,0],[0,1,0]),b=B.multiply(M,O);t.queue.writeBuffer(o,0,b);const C=t.createCommandEncoder(),V=f.getCurrentTexture().createView(),p=C.beginRenderPass({colorAttachments:[{view:V,clearValue:{r:.1,g:.1,b:.15,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:c.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});p.setPipeline(u),p.setBindGroup(0,e);let F=l;for(let A=0;A<6;A++){const E=m[A];let g=Math.ceil(F/(6-A));if(g>y&&(g=y),g>0){p.setVertexBuffer(0,E.vertexBuffer),p.setVertexBuffer(1,E.normalBuffer);const R=A*y*80;p.setVertexBuffer(2,h,R,g*80),p.setIndexBuffer(E.indexBuffer,"uint16"),p.drawIndexed(E.indexCount,g),F-=g}}p.end(),t.queue.submit([C.finish()]),requestAnimationFrame(z)}requestAnimationFrame(z)}W().catch(console.error);
