import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as ne}from"../../../canvas-util-BGxJIWTK.js";import{v as L,m as C,a as oe}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";import{G as ie}from"../../../lil-gui.esm-CNIGZg2U.js";const ae=`
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
`,s={barycentricCoordinatesBased:!1,thickness:2,alphaThreshold:.5,animate:!0,lines:!0,depthBias:1,depthBiasSlopeScale:.5,models:!0},x={radius:20,widthSegments:7,heightSegments:5};function k(n,e,u){const i=n.createBuffer({size:e.byteLength,usage:u});return n.queue.writeBuffer(i,0,e),i}function _(n,e,u){const i=[],d=[],g=[];for(let t=0;t<=u;t++){const r=[],o=t/u;for(let c=0;c<=e;c++){const p=c/e,v=-n*Math.cos(p*Math.PI*2)*Math.sin(o*Math.PI),w=n*Math.cos(o*Math.PI),S=n*Math.sin(p*Math.PI*2)*Math.sin(o*Math.PI);d.push([v,w,S]),r.push(d.length-1)}g.push(r)}for(let t=0;t<u;t++)for(let r=0;r<e;r++){const o=g[t][r+1],c=g[t][r],p=g[t+1][r],v=g[t+1][r+1];t!==0&&i.push(o,c,v),t!==u-1&&i.push(c,p,v)}const a=new Float32Array(d.length*3);d.forEach((t,r)=>{a.set(t,r*3)});const m=new Float32Array(i.length*3),f=new Float32Array(i.length*3),B=new Uint32Array(i.length);for(let t=0;t<i.length;t+=3){const r=i[t],o=i[t+1],c=i[t+2],p=d[r],v=d[o],w=d[c],S=L.normalize(L.cross(L.subtract(v,p),L.subtract(w,p))),y=t*3;f.set(p,y),f.set(v,y+3),f.set(w,y+6),m.set(S,y),m.set(S,y+3),m.set(S,y+6),B[t]=t,B[t+1]=t+1,B[t+2]=t+2}const G=i.length,l=new Float32Array(G*6);for(let t=0;t<G;t++){const r=t*6,o=t*3;l[r]=f[o],l[r+1]=f[o+1],l[r+2]=f[o+2],l[r+3]=m[o],l[r+4]=m[o+1],l[r+5]=m[o+2]}return{vertices:l,indices:B}}function Y(n,{vertices:e,indices:u}){const i=k(n,e,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),d=k(n,u,GPUBufferUsage.INDEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);return{vertexBuffer:i,indexBuffer:d,indexFormat:"uint32",vertexCount:u.length}}function R(n,e){return n===void 0?(e=1,n=0):e===void 0&&(e=n,n=0),Math.random()*(e-n)+n}function ce(){return[R(),R(),R(),1]}async function ue(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const n=await navigator.gpu.requestAdapter({featureLevel:"compatibility"});if(!n)throw new Error("No appropriate GPUAdapter found.");if(n.limits.maxStorageBuffersInVertexStage<2)throw new Error("maxStorageBuffersInVertexStage limit is too low.");const e=await n.requestDevice({requiredLimits:{maxStorageBuffersInVertexStage:2}}),u=document.querySelector("#webgpu-canvas"),i=u.getContext("webgpu");if(!i)throw new Error("WebGPU context not found.");const d=navigator.gpu.getPreferredCanvasFormat();i.configure({device:e,format:d});const g="depth24plus";let a=Y(e,_(x.radius,x.widthSegments,x.heightSegments));const m=e.createShaderModule({code:ae}),f=e.createShaderModule({code:se}),B=e.createBindGroupLayout({label:"lit bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]});let G;function l(){G=e.createRenderPipeline({label:"lit pipeline",layout:e.createPipelineLayout({bindGroupLayouts:[B]}),vertex:{module:m,buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:m,targets:[{format:d}]},primitive:{cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",depthBias:s.depthBias,depthBiasSlopeScale:s.depthBiasSlopeScale,format:g}})}l();const t=e.createRenderPipeline({label:"wireframe pipeline",layout:"auto",vertex:{module:f,entryPoint:"vsIndexedU32"},fragment:{module:f,entryPoint:"fs",targets:[{format:d}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:g}}),r=e.createRenderPipeline({label:"barycentric coordinates based wireframe pipeline",layout:"auto",vertex:{module:f,entryPoint:"vsIndexedU32BarycentricCoordinateBasedLines"},fragment:{module:f,entryPoint:"fsBarycentricCoordinateBasedLines",targets:[{format:d,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:g}}),o=new Float32Array(36),c=e.createBuffer({size:o.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),p=0,v=16,w=32,S=o.subarray(p,p+16),y=o.subarray(v,v+16);o.subarray(w,w+4).set(ce());const X=e.createBindGroup({layout:B,entries:[{binding:0,resource:{buffer:c}}]}),O=new Float32Array(4),J=new Uint32Array(O.buffer),V=e.createBuffer({size:O.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});J[0]=6;let W=e.createBindGroup({layout:t.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:V}}]}),q=e.createBindGroup({layout:r.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:V}}]});const T={label:"jewel wireframe render pass",colorAttachments:[{view:void 0,clearValue:[.3,.3,.3,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:void 0,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},h=new ie({container:document.getElementById("gui-container"),title:"Wireframe Settings"});h.add(x,"radius",5,40).onChange(E),h.add(x,"widthSegments",3,24,1).onChange(E),h.add(x,"heightSegments",2,24,1).onChange(E),h.add(s,"barycentricCoordinatesBased").onChange(z),h.add(s,"lines"),h.add(s,"models"),h.add(s,"animate");const A=[];function z(){A.forEach(M=>M.destroy()),A.length=0,s.barycentricCoordinatesBased?A.push(h.add(s,"thickness",0,10).onChange(I),h.add(s,"alphaThreshold",0,1).onChange(I)):A.push(h.add(s,"depthBias",-3,3,1).onChange(l),h.add(s,"depthBiasSlopeScale",-1,1,.05).onChange(l))}z();function I(){O[1]=s.thickness,O[2]=s.alphaThreshold,e.queue.writeBuffer(V,0,O)}I();function E(){const M=Y(e,_(x.radius,x.widthSegments,x.heightSegments));a.vertexBuffer.destroy(),a.indexBuffer.destroy(),a=M,W=e.createBindGroup({layout:t.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:V}}]}),q=e.createBindGroup({layout:r.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:V}}]})}let P,F=0;function D(M){s.animate&&(F=M*.001),ne(u);const N=i.getCurrentTexture();T.colorAttachments[0].view=N.createView(),(!P||P.width!==N.width||P.height!==N.height)&&(P&&P.destroy(),P=e.createTexture({size:[N.width,N.height],format:g,usage:GPUTextureUsage.RENDER_ATTACHMENT})),T.depthStencilAttachment.view=P.createView();const H=60*Math.PI/180,K=u.width/u.height,Q=C.perspective(H,K,.1,1e3),Z=C.lookAt([0,0,90],[0,0,0],[0,1,0]),$=C.multiply(Q,Z),j=e.createCommandEncoder(),b=j.beginRenderPass(T);b.setPipeline(G);const U=C.identity();if(C.rotateY(U,F*.7,U),C.rotateX(U,F*.35,U),C.multiply($,U,S),oe.fromMat4(U,y),e.queue.writeBuffer(c,0,o),s.models&&(b.setVertexBuffer(0,a.vertexBuffer),b.setIndexBuffer(a.indexBuffer,a.indexFormat),b.setBindGroup(0,X),b.drawIndexed(a.vertexCount)),s.lines){const[ee,te,re]=s.barycentricCoordinatesBased?[1,1,r]:[0,2,t];b.setPipeline(re),b.setBindGroup(0,ee===0?W:q),b.draw(a.vertexCount*te)}b.end(),e.queue.submit([j.finish()]),requestAnimationFrame(D)}requestAnimationFrame(D)}ue().catch(console.error);
