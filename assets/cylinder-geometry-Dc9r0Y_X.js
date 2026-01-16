import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{m as L,a as ne}from"./wgpu-matrix.module-Cf1N7Xmi.js";import{G as oe}from"./lil-gui.esm-CNIGZg2U.js";const ie=`
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
`,ae=`
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
`,d={barycentricCoordinatesBased:!1,thickness:2,alphaThreshold:.5,animate:!0,lines:!0,depthBias:1,depthBiasSlopeScale:.5,models:!0},t={radiusTop:20,radiusBottom:20,height:40,radialSegments:32,heightSegments:4,openEnded:!1,thetaStart:0,thetaLength:2};function Y(o,e,l){const u=o.createBuffer({size:e.byteLength,usage:l});return o.queue.writeBuffer(u,0,e),u}function X(o,e,l,u,h,N,a,I){const c=[],b=[],C=[],B=[],O=l/2,A=(e-o)/l;for(let n=0;n<=h;n++){const r=[],s=n/h,m=s*(e-o)+o;for(let w=0;w<=u;w++){const p=w/u*I+a,v=Math.sin(p),x=Math.cos(p);c.push(m*v,-s*l+O,m*x);const U=v,T=x,V=A,i=Math.sqrt(U*U+V*V+T*T);b.push(U/i,V/i,T/i),r.push(c.length/3-1)}B.push(r)}for(let n=0;n<u;n++)for(let r=0;r<h;r++){const s=B[r][n],m=B[r+1][n],w=B[r+1][n+1],f=B[r][n+1];C.push(s,m,f),C.push(m,w,f)}function P(n){const r=n?o:e;if(r<=0)return;const s=n?1:-1,m=c.length/3;c.push(0,O*s,0),b.push(0,s,0);const w=c.length/3;for(let f=0;f<=u;f++){const v=f/u*I+a,x=Math.cos(v),U=Math.sin(v);c.push(r*U,O*s,r*x),b.push(0,s,0)}for(let f=0;f<u;f++){const p=w+f,v=w+f+1;n?C.push(m,p,v):C.push(m,v,p)}}N||(P(!0),P(!1));const y=c.length/3,g=new Float32Array(y*6);for(let n=0;n<y;n++){const r=n*3,s=n*6;g[s]=c[r],g[s+1]=c[r+1],g[s+2]=c[r+2],g[s+3]=b[r],g[s+4]=b[r+1],g[s+5]=b[r+2]}return{vertices:g,indices:new Uint32Array(C)}}function H(o,{vertices:e,indices:l}){const u=Y(o,e,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),h=Y(o,l,GPUBufferUsage.INDEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);return{vertexBuffer:u,indexBuffer:h,indexFormat:"uint32",vertexCount:l.length}}function D(o,e){return o===void 0?(e=1,o=0):e===void 0&&(e=o,o=0),Math.random()*(e-o)+o}function se(){return[D(),D(),D(),1]}async function de(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const o=await navigator.gpu.requestAdapter({featureLevel:"compatibility"});if(!o)throw new Error("No appropriate GPUAdapter found.");if(o.limits.maxStorageBuffersInVertexStage<2)throw new Error("maxStorageBuffersInVertexStage limit is too low.");const e=await o.requestDevice({requiredLimits:{maxStorageBuffersInVertexStage:2}}),l=document.querySelector("#webgpu-canvas"),u=l.getContext("webgpu");if(!u)throw new Error("WebGPU context not found.");const h=navigator.gpu.getPreferredCanvasFormat();u.configure({device:e,format:h});const N="depth24plus";let a=H(e,X(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart*Math.PI,t.thetaLength*Math.PI));const I=e.createShaderModule({code:ie}),c=e.createShaderModule({code:ae}),b=e.createBindGroupLayout({label:"lit bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]});let C;function B(){C=e.createRenderPipeline({label:"lit pipeline",layout:e.createPipelineLayout({bindGroupLayouts:[b]}),vertex:{module:I,buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:I,targets:[{format:h}]},primitive:{cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",depthBias:d.depthBias,depthBiasSlopeScale:d.depthBiasSlopeScale,format:N}})}B();const O=e.createRenderPipeline({label:"wireframe pipeline",layout:"auto",vertex:{module:c,entryPoint:"vsIndexedU32"},fragment:{module:c,entryPoint:"fs",targets:[{format:h}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:N}}),A=e.createRenderPipeline({label:"barycentric coordinates based wireframe pipeline",layout:"auto",vertex:{module:c,entryPoint:"vsIndexedU32BarycentricCoordinateBasedLines"},fragment:{module:c,entryPoint:"fsBarycentricCoordinateBasedLines",targets:[{format:h,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:N}}),P=new Float32Array(36),y=e.createBuffer({size:P.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=0,n=16,r=32,s=P.subarray(g,g+16),m=P.subarray(n,n+16);P.subarray(r,r+4).set(se());const f=e.createBindGroup({layout:b,entries:[{binding:0,resource:{buffer:y}}]}),p=new Float32Array(4),v=new Uint32Array(p.buffer),x=e.createBuffer({size:p.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});v[0]=6;let U=e.createBindGroup({layout:O.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:y}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:x}}]}),T=e.createBindGroup({layout:A.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:y}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:x}}]});const V={label:"cylinder wireframe render pass",colorAttachments:[{view:void 0,clearValue:[.3,.3,.3,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:void 0,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},i=new oe({container:document.getElementById("gui-container"),title:"Wireframe Settings"});i.add(t,"radiusTop",0,40).onChange(G),i.add(t,"radiusBottom",0,40).onChange(G),i.add(t,"height",5,80).onChange(G),i.add(t,"radialSegments",3,64,1).onChange(G),i.add(t,"heightSegments",1,32,1).onChange(G),i.add(t,"openEnded").onChange(G),i.add(t,"thetaStart",0,2).name("thetaStart (x PI)").onChange(G),i.add(t,"thetaLength",0,2).name("thetaLength (x PI)").onChange(G),i.add(d,"barycentricCoordinatesBased").onChange(j),i.add(d,"lines"),i.add(d,"models"),i.add(d,"animate");const q=[];function j(){q.forEach(F=>F.destroy()),q.length=0,d.barycentricCoordinatesBased?q.push(i.add(d,"thickness",0,10).onChange(W),i.add(d,"alphaThreshold",0,1).onChange(W)):q.push(i.add(d,"depthBias",-3,3,1).onChange(B),i.add(d,"depthBiasSlopeScale",-1,1,.05).onChange(B))}j();function W(){p[1]=d.thickness,p[2]=d.alphaThreshold,e.queue.writeBuffer(x,0,p)}W();function G(){const F=H(e,X(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart*Math.PI,t.thetaLength*Math.PI));a.vertexBuffer.destroy(),a.indexBuffer.destroy(),a=F,U=e.createBindGroup({layout:O.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:y}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:x}}]}),T=e.createBindGroup({layout:A.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:y}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:x}}]})}let M,k=0;function z(F){d.animate&&(k=F*.001);const R=u.getCurrentTexture();V.colorAttachments[0].view=R.createView(),(!M||M.width!==R.width||M.height!==R.height)&&(M&&M.destroy(),M=e.createTexture({size:[R.width,R.height],format:N,usage:GPUTextureUsage.RENDER_ATTACHMENT})),V.depthStencilAttachment.view=M.createView();const J=60*Math.PI/180,K=l.width/l.height,Q=L.perspective(J,K,.1,1e3),Z=L.lookAt([0,0,90],[0,0,0],[0,1,0]),$=L.multiply(Q,Z),_=e.createCommandEncoder(),S=_.beginRenderPass(V);S.setPipeline(C);const E=L.identity();if(L.rotateY(E,k*.7,E),L.rotateX(E,k*.35,E),L.multiply($,E,s),ne.fromMat4(E,m),e.queue.writeBuffer(y,0,P),d.models&&(S.setVertexBuffer(0,a.vertexBuffer),S.setIndexBuffer(a.indexBuffer,a.indexFormat),S.setBindGroup(0,f),S.drawIndexed(a.vertexCount)),d.lines){const[ee,te,re]=d.barycentricCoordinatesBased?[1,1,A]:[0,2,O];S.setPipeline(re),S.setBindGroup(0,ee===0?U:T),S.draw(a.vertexCount*te)}S.end(),e.queue.submit([_.finish()]),requestAnimationFrame(z)}requestAnimationFrame(z)}de().catch(console.error);
