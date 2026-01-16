import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{r as ne}from"../../../canvas-util-6cCf-wah.js";import{m as B,a as oe}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";import{G as ie}from"../../../lil-gui.esm-CNIGZg2U.js";const ae=`
struct Uniforms {
  worldViewProjectionMatrix: mat4x4f,
  worldMatrix: mat4x4f,
  color: vec4f,
};

struct Vertex {
  @location(0) position: vec4f,
  @location(1) normal: vec3f,
};

struct VSOut {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
};

@group(0) @binding(0) var<uniform> uni: Uniforms;

@vertex fn vs(vin: Vertex) -> VSOut {
  var vOut: VSOut;
  vOut.position = uni.worldViewProjectionMatrix * vin.position;
  vOut.normal = (uni.worldMatrix * vec4f(vin.normal, 0)).xyz;
  return vOut;
}

@fragment fn fs(vin: VSOut) -> @location(0) vec4f {
  let lightDirection = normalize(vec3f(4, 10, 6));
  let light = dot(normalize(vin.normal), lightDirection) * 0.5 + 0.5;
  return vec4f(uni.color.rgb * light, uni.color.a);
}
`,se=`
struct Uniforms {
  worldViewProjectionMatrix: mat4x4f,
  worldMatrix: mat4x4f,
  color: vec4f,
};

struct LineUniforms {
  stride: u32,
  thickness: f32,
  alphaThreshold: f32,
};

struct VSOut {
  @builtin(position) position: vec4f,
};

@group(0) @binding(0) var<uniform> uni: Uniforms;
@group(0) @binding(1) var<storage, read> positions: array<f32>;
@group(0) @binding(2) var<storage, read> indices: array<u32>;
@group(0) @binding(3) var<uniform> line: LineUniforms;

@vertex fn vsIndexedU32(@builtin(vertex_index) vNdx: u32) -> VSOut {
  let triNdx = vNdx / 6;
  let vertNdx = (vNdx % 2 + vNdx / 2) % 3;
  let index = indices[triNdx * 3 + vertNdx];

  let pNdx = index * line.stride;
  let position = vec4f(positions[pNdx], positions[pNdx + 1], positions[pNdx + 2], 1);

  var vOut: VSOut;
  vOut.position = uni.worldViewProjectionMatrix * position;
  return vOut;
}

@fragment fn fs() -> @location(0) vec4f {
  return uni.color + vec4f(0.5);
}

struct BarycentricCoordinateBasedVSOutput {
  @builtin(position) position: vec4f,
  @location(0) barycenticCoord: vec3f,
};

@vertex fn vsIndexedU32BarycentricCoordinateBasedLines(
  @builtin(vertex_index) vNdx: u32
) -> BarycentricCoordinateBasedVSOutput {
  let vertNdx = vNdx % 3;
  let index = indices[vNdx];

  let pNdx = index * line.stride;
  let position = vec4f(positions[pNdx], positions[pNdx + 1], positions[pNdx + 2], 1);

  var vsOut: BarycentricCoordinateBasedVSOutput;
  vsOut.position = uni.worldViewProjectionMatrix * position;

  vsOut.barycenticCoord = vec3f(0);
  vsOut.barycenticCoord[vertNdx] = 1.0;
  return vsOut;
}

fn edgeFactor(bary: vec3f) -> f32 {
  let d = fwidth(bary);
  let a3 = smoothstep(vec3f(0.0), d * line.thickness, bary);
  return min(min(a3.x, a3.y), a3.z);
}

@fragment fn fsBarycentricCoordinateBasedLines(
  v: BarycentricCoordinateBasedVSOutput
) -> @location(0) vec4f {
  let a = 1.0 - edgeFactor(v.barycenticCoord);
  if (a < line.alphaThreshold) {
    discard;
  }

  return vec4((uni.color.rgb + 0.5) * a, a);
}
`,a={barycentricCoordinatesBased:!1,thickness:2,alphaThreshold:.5,animate:!0,lines:!0,depthBias:1,depthBiasSlopeScale:.5,models:!0},u={radius:35,tube:12,radialSegments:16,tubularSegments:32,arc:2};function _(t,e,d){const s=t.createBuffer({size:e.byteLength,usage:d});return t.queue.writeBuffer(s,0,e),s}function Y(t,e,d,s,m){const l=[],r=[],y=[];for(let o=0;o<=d;o++)for(let n=0;n<=s;n++){const i=n/s*m,h=o/d*Math.PI*2,g=(t+e*Math.cos(h))*Math.cos(i),f=(t+e*Math.cos(h))*Math.sin(i),P=e*Math.sin(h);l.push(g,f,P);const T=t*Math.cos(i),L=t*Math.sin(i),S=g-T,C=f-L,A=P,U=Math.sqrt(S*S+C*C+A*A)||1;r.push(S/U,C/U,A/U)}for(let o=0;o<d;o++)for(let n=0;n<s;n++){const i=(s+1)*o+n,h=(s+1)*(o+1)+n,g=(s+1)*(o+1)+n+1,f=(s+1)*o+n+1;y.push(i,h,f),y.push(h,g,f)}const x=l.length/3,p=new Float32Array(x*6);for(let o=0;o<x;o++){const n=o*3,i=o*6;p[i]=l[n],p[i+1]=l[n+1],p[i+2]=l[n+2],p[i+3]=r[n],p[i+4]=r[n+1],p[i+5]=r[n+2]}return{vertices:p,indices:new Uint32Array(y)}}function X(t,{vertices:e,indices:d}){const s=_(t,e,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),m=_(t,d,GPUBufferUsage.INDEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);return{vertexBuffer:s,indexBuffer:m,indexFormat:"uint32",vertexCount:d.length}}function q(t,e){return t===void 0?(e=1,t=0):e===void 0&&(e=t,t=0),Math.random()*(e-t)+t}function ue(){return[q(),q(),q(),1]}async function de(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const t=await navigator.gpu.requestAdapter({featureLevel:"compatibility"});if(!t)throw new Error("No appropriate GPUAdapter found.");if(t.limits.maxStorageBuffersInVertexStage<2)throw new Error("maxStorageBuffersInVertexStage limit is too low.");const e=await t.requestDevice({requiredLimits:{maxStorageBuffersInVertexStage:2}}),d=document.querySelector("#webgpu-canvas"),s=d.getContext("webgpu");if(!s)throw new Error("WebGPU context not found.");const m=navigator.gpu.getPreferredCanvasFormat();s.configure({device:e,format:m});const l="depth24plus";let r=X(e,Y(u.radius,u.tube,u.radialSegments,u.tubularSegments,u.arc*Math.PI));const y=e.createShaderModule({code:ae}),x=e.createShaderModule({code:se}),p=e.createBindGroupLayout({label:"lit bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]});let o;function n(){o=e.createRenderPipeline({label:"lit pipeline",layout:e.createPipelineLayout({bindGroupLayouts:[p]}),vertex:{module:y,buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:y,targets:[{format:m}]},primitive:{cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",depthBias:a.depthBias,depthBiasSlopeScale:a.depthBiasSlopeScale,format:l}})}n();const i=e.createRenderPipeline({label:"wireframe pipeline",layout:"auto",vertex:{module:x,entryPoint:"vsIndexedU32"},fragment:{module:x,entryPoint:"fs",targets:[{format:m}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:l}}),h=e.createRenderPipeline({label:"barycentric coordinates based wireframe pipeline",layout:"auto",vertex:{module:x,entryPoint:"vsIndexedU32BarycentricCoordinateBasedLines"},fragment:{module:x,entryPoint:"fsBarycentricCoordinateBasedLines",targets:[{format:m,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:l}}),g=new Float32Array(36),f=e.createBuffer({size:g.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),P=0,T=16,L=32,S=g.subarray(P,P+16),C=g.subarray(T,T+16);g.subarray(L,L+4).set(ue());const U=e.createBindGroup({layout:p,entries:[{binding:0,resource:{buffer:f}}]}),G=new Float32Array(4),H=new Uint32Array(G.buffer),O=e.createBuffer({size:G.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});H[0]=6;let W=e.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:f}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:O}}]}),z=e.createBindGroup({layout:h.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:f}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:O}}]});const I={label:"torus wireframe render pass",colorAttachments:[{view:void 0,clearValue:[.3,.3,.3,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:void 0,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},c=new ie({container:document.getElementById("gui-container"),title:"Wireframe Settings"});c.add(u,"radius",5,80).onChange(V),c.add(u,"tube",1,30).onChange(V),c.add(u,"radialSegments",3,64,1).onChange(V),c.add(u,"tubularSegments",3,100,1).onChange(V),c.add(u,"arc",0,2).name("arc (x PI)").onChange(V),c.add(a,"barycentricCoordinatesBased").onChange(D),c.add(a,"lines"),c.add(a,"models"),c.add(a,"animate");const E=[];function D(){E.forEach(M=>M.destroy()),E.length=0,a.barycentricCoordinatesBased?E.push(c.add(a,"thickness",0,10).onChange(F),c.add(a,"alphaThreshold",0,1).onChange(F)):E.push(c.add(a,"depthBias",-3,3,1).onChange(n),c.add(a,"depthBiasSlopeScale",-1,1,.05).onChange(n))}D();function F(){G[1]=a.thickness,G[2]=a.alphaThreshold,e.queue.writeBuffer(O,0,G)}F();function V(){const M=X(e,Y(u.radius,u.tube,u.radialSegments,u.tubularSegments,u.arc*Math.PI));r.vertexBuffer.destroy(),r.indexBuffer.destroy(),r=M,W=e.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:f}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:O}}]}),z=e.createBindGroup({layout:h.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:f}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:O}}]})}let b,R=0;function j(M){a.animate&&(R=M*.001),ne(d);const N=s.getCurrentTexture();I.colorAttachments[0].view=N.createView(),(!b||b.width!==N.width||b.height!==N.height)&&(b&&b.destroy(),b=e.createTexture({size:[N.width,N.height],format:l,usage:GPUTextureUsage.RENDER_ATTACHMENT})),I.depthStencilAttachment.view=b.createView();const J=60*Math.PI/180,K=d.width/d.height,Q=B.perspective(J,K,.1,1e3),Z=B.lookAt([0,0,120],[0,0,0],[0,1,0]),$=B.multiply(Q,Z),k=e.createCommandEncoder(),v=k.beginRenderPass(I);v.setPipeline(o);const w=B.identity();if(B.rotateY(w,R*.7,w),B.rotateX(w,R*.35,w),B.multiply($,w,S),oe.fromMat4(w,C),e.queue.writeBuffer(f,0,g),a.models&&(v.setVertexBuffer(0,r.vertexBuffer),v.setIndexBuffer(r.indexBuffer,r.indexFormat),v.setBindGroup(0,U),v.drawIndexed(r.vertexCount)),a.lines){const[ee,te,re]=a.barycentricCoordinatesBased?[1,1,h]:[0,2,i];v.setPipeline(re),v.setBindGroup(0,ee===0?W:z),v.draw(r.vertexCount*te)}v.end(),e.queue.submit([k.finish()]),requestAnimationFrame(j)}requestAnimationFrame(j)}de().catch(console.error);
