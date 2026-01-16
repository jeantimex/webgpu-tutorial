import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as ne}from"../../../canvas-util-BGxJIWTK.js";import{m as O,a as oe}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";import{G as ie}from"../../../lil-gui.esm-CNIGZg2U.js";const ae=`
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
`,o={barycentricCoordinatesBased:!1,thickness:2,alphaThreshold:.5,animate:!0,lines:!0,depthBias:1,depthBiasSlopeScale:.5,models:!0},n={width:40,height:40,depth:40,widthSegments:2,heightSegments:2,depthSegments:2};function H(t,e,i){const d=t.createBuffer({size:e.byteLength,usage:i});return t.queue.writeBuffer(d,0,e),d}function Y(t,e,i,d,h,x){const r=[],P=[],S=[];function b(v,c,s,C,R,L,M,k,T,W,A){const U=L/T,z=M/W,G=L/2,q=M/2,D=k/2,B=T+1,a=W+1,y=r.length/3;for(let u=0;u<a;u++){const f=u*z-q;for(let l=0;l<B;l++){const p=l*U-G,g=[0,0,0];g[v]=p*C,g[c]=f*R,g[s]=D,r.push(g[0],g[1],g[2]),P.push(A[0],A[1],A[2])}}for(let u=0;u<W;u++)for(let f=0;f<T;f++){const l=y+f+B*u,p=y+f+B*(u+1),g=y+(f+1)+B*(u+1),E=y+(f+1)+B*u;S.push(l,p,E),S.push(p,g,E)}}b(2,1,0,-1,-1,i,e,t,x,h,[1,0,0]),b(2,1,0,1,-1,i,e,-t,x,h,[-1,0,0]),b(0,2,1,1,1,t,i,e,d,x,[0,1,0]),b(0,2,1,1,-1,t,i,-e,d,x,[0,-1,0]),b(0,1,2,1,-1,t,e,i,d,h,[0,0,1]),b(0,1,2,-1,-1,t,e,-i,d,h,[0,0,-1]);const N=r.length/3,m=new Float32Array(N*6);for(let v=0;v<N;v++){const c=v*3,s=v*6;m[s]=r[c],m[s+1]=r[c+1],m[s+2]=r[c+2],m[s+3]=P[c],m[s+4]=P[c+1],m[s+5]=P[c+2]}return{vertices:m,indices:new Uint32Array(S)}}function X(t,{vertices:e,indices:i}){const d=H(t,e,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),h=H(t,i,GPUBufferUsage.INDEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);return{vertexBuffer:d,indexBuffer:h,indexFormat:"uint32",vertexCount:i.length}}function j(t,e){return t===void 0?(e=1,t=0):e===void 0&&(e=t,t=0),Math.random()*(e-t)+t}function de(){return[j(),j(),j(),1]}async function ue(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const t=await navigator.gpu.requestAdapter({featureLevel:"compatibility"});if(!t)throw new Error("No appropriate GPUAdapter found.");if(t.limits.maxStorageBuffersInVertexStage<2)throw new Error("maxStorageBuffersInVertexStage limit is too low.");const e=await t.requestDevice({requiredLimits:{maxStorageBuffersInVertexStage:2}}),i=document.querySelector("#webgpu-canvas"),d=i.getContext("webgpu");if(!d)throw new Error("WebGPU context not found.");const h=navigator.gpu.getPreferredCanvasFormat();d.configure({device:e,format:h});const x="depth24plus";let r=X(e,Y(n.width,n.height,n.depth,n.widthSegments,n.heightSegments,n.depthSegments));const P=e.createShaderModule({code:ae}),S=e.createShaderModule({code:se}),b=e.createBindGroupLayout({label:"lit bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]});let N;function m(){N=e.createRenderPipeline({label:"lit pipeline",layout:e.createPipelineLayout({bindGroupLayouts:[b]}),vertex:{module:P,buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:P,targets:[{format:h}]},primitive:{cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",depthBias:o.depthBias,depthBiasSlopeScale:o.depthBiasSlopeScale,format:x}})}m();const v=e.createRenderPipeline({label:"wireframe pipeline",layout:"auto",vertex:{module:S,entryPoint:"vsIndexedU32"},fragment:{module:S,entryPoint:"fs",targets:[{format:h}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:x}}),c=e.createRenderPipeline({label:"barycentric coordinates based wireframe pipeline",layout:"auto",vertex:{module:S,entryPoint:"vsIndexedU32BarycentricCoordinateBasedLines"},fragment:{module:S,entryPoint:"fsBarycentricCoordinateBasedLines",targets:[{format:h,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:x}}),s=new Float32Array(36),C=e.createBuffer({size:s.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),R=0,L=16,M=32,k=s.subarray(R,R+16),T=s.subarray(L,L+16);s.subarray(M,M+4).set(de());const A=e.createBindGroup({layout:b,entries:[{binding:0,resource:{buffer:C}}]}),U=new Float32Array(4),z=new Uint32Array(U.buffer),G=e.createBuffer({size:U.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});z[0]=6;let q=e.createBindGroup({layout:v.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:C}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:G}}]}),D=e.createBindGroup({layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:C}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:G}}]});const B={label:"box wireframe render pass",colorAttachments:[{view:void 0,clearValue:[.3,.3,.3,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:void 0,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},a=new ie({container:document.getElementById("gui-container"),title:"Wireframe Settings"});a.add(n,"width",5,60).onChange(l),a.add(n,"height",5,60).onChange(l),a.add(n,"depth",5,60).onChange(l),a.add(n,"widthSegments",1,20,1).onChange(l),a.add(n,"heightSegments",1,20,1).onChange(l),a.add(n,"depthSegments",1,20,1).onChange(l),a.add(o,"barycentricCoordinatesBased").onChange(u),a.add(o,"lines"),a.add(o,"models"),a.add(o,"animate");const y=[];function u(){y.forEach(F=>F.destroy()),y.length=0,o.barycentricCoordinatesBased?y.push(a.add(o,"thickness",0,10).onChange(f),a.add(o,"alphaThreshold",0,1).onChange(f)):y.push(a.add(o,"depthBias",-3,3,1).onChange(m),a.add(o,"depthBiasSlopeScale",-1,1,.05).onChange(m))}u();function f(){U[1]=o.thickness,U[2]=o.alphaThreshold,e.queue.writeBuffer(G,0,U)}f();function l(){const F=X(e,Y(n.width,n.height,n.depth,n.widthSegments,n.heightSegments,n.depthSegments));r.vertexBuffer.destroy(),r.indexBuffer.destroy(),r=F,q=e.createBindGroup({layout:v.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:C}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:G}}]}),D=e.createBindGroup({layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:C}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:G}}]})}let p,g=0;function E(F){o.animate&&(g=F*.001),ne(i);const I=d.getCurrentTexture();B.colorAttachments[0].view=I.createView(),(!p||p.width!==I.width||p.height!==I.height)&&(p&&p.destroy(),p=e.createTexture({size:[I.width,I.height],format:x,usage:GPUTextureUsage.RENDER_ATTACHMENT})),B.depthStencilAttachment.view=p.createView();const J=60*Math.PI/180,K=i.width/i.height,Q=O.perspective(J,K,.1,1e3),Z=O.lookAt([0,0,80],[0,0,0],[0,1,0]),$=O.multiply(Q,Z),_=e.createCommandEncoder(),w=_.beginRenderPass(B);w.setPipeline(N);const V=O.identity();if(O.rotateY(V,g*.7,V),O.rotateX(V,g*.35,V),O.multiply($,V,k),oe.fromMat4(V,T),e.queue.writeBuffer(C,0,s),o.models&&(w.setVertexBuffer(0,r.vertexBuffer),w.setIndexBuffer(r.indexBuffer,r.indexFormat),w.setBindGroup(0,A),w.drawIndexed(r.vertexCount)),o.lines){const[ee,te,re]=o.barycentricCoordinatesBased?[1,1,c]:[0,2,v];w.setPipeline(re),w.setBindGroup(0,ee===0?q:D),w.draw(r.vertexCount*te)}w.end(),e.queue.submit([_.finish()]),requestAnimationFrame(E)}requestAnimationFrame(E)}ue().catch(console.error);
