import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{v as I,m as C,a as oe}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";import{G as ie}from"../../../lil-gui.esm-CNIGZg2U.js";const ae=`
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
`,a={barycentricCoordinatesBased:!1,thickness:2,alphaThreshold:.5,animate:!0,lines:!0,depthBias:1,depthBiasSlopeScale:.5,models:!0},h={radius:20,widthSegments:16,heightSegments:12,randomness:.15};function X(o,t,d){const m=o.createBuffer({size:t.byteLength,usage:d});return o.queue.writeBuffer(m,0,t),m}function H(o,t,d,m){const i=[],f=[],n=[];let U=12345;const G=()=>(U=U*1103515245+12345&2147483647,U/2147483647);for(let e=0;e<=d;e++){const r=[],l=e/d*Math.PI;for(let g=0;g<=t;g++){const V=g/t*Math.PI*2,w=Math.sin(l),s=o*(1+(G()-.5)*2*m*w),R=-s*Math.cos(V)*Math.sin(l),S=s*Math.cos(l),T=s*Math.sin(V)*Math.sin(l);f.push([R,S,T]),r.push(f.length-1)}n.push(r)}for(let e=0;e<d;e++)for(let r=0;r<t;r++){const c=n[e][r+1],l=n[e][r],g=n[e+1][r],y=n[e+1][r+1];e!==0&&i.push(c,l,y),e!==d-1&&i.push(l,g,y)}const L=new Float32Array(f.length*3);f.forEach((e,r)=>{L.set(e,r*3)});const b=new Float32Array(i.length*3),v=new Float32Array(i.length*3),B=new Uint32Array(i.length);for(let e=0;e<i.length;e+=3){const r=i[e],c=i[e+1],l=i[e+2],g=f[r],y=f[c],V=f[l],w=I.normalize(I.cross(I.subtract(y,g),I.subtract(V,g))),s=e*3;v.set(g,s),v.set(y,s+3),v.set(V,s+6),b.set(w,s),b.set(w,s+3),b.set(w,s+6),B[e]=e,B[e+1]=e+1,B[e+2]=e+2}const O=i.length,u=new Float32Array(O*6);for(let e=0;e<O;e++){const r=e*6,c=e*3;u[r]=v[c],u[r+1]=v[c+1],u[r+2]=v[c+2],u[r+3]=b[c],u[r+4]=b[c+1],u[r+5]=b[c+2]}return{vertices:u,indices:B}}function J(o,{vertices:t,indices:d}){const m=X(o,t,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),i=X(o,d,GPUBufferUsage.INDEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);return{vertexBuffer:m,indexBuffer:i,indexFormat:"uint32",vertexCount:d.length}}function D(o,t){return o===void 0?(t=1,o=0):t===void 0&&(t=o,o=0),Math.random()*(t-o)+o}function ce(){return[D(),D(),D(),1]}async function de(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const o=await navigator.gpu.requestAdapter({featureLevel:"compatibility"});if(!o)throw new Error("No appropriate GPUAdapter found.");if(o.limits.maxStorageBuffersInVertexStage<2)throw new Error("maxStorageBuffersInVertexStage limit is too low.");const t=await o.requestDevice({requiredLimits:{maxStorageBuffersInVertexStage:2}}),d=document.querySelector("#webgpu-canvas"),m=d.getContext("webgpu");if(!m)throw new Error("WebGPU context not found.");const i=navigator.gpu.getPreferredCanvasFormat();m.configure({device:t,format:i});const f="depth24plus";let n=J(t,H(h.radius,h.widthSegments,h.heightSegments,h.randomness));const U=t.createShaderModule({code:ae}),G=t.createShaderModule({code:se}),L=t.createBindGroupLayout({label:"lit bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]});let b;function v(){b=t.createRenderPipeline({label:"lit pipeline",layout:t.createPipelineLayout({bindGroupLayouts:[L]}),vertex:{module:U,buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:U,targets:[{format:i}]},primitive:{cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",depthBias:a.depthBias,depthBiasSlopeScale:a.depthBiasSlopeScale,format:f}})}v();const B=t.createRenderPipeline({label:"wireframe pipeline",layout:"auto",vertex:{module:G,entryPoint:"vsIndexedU32"},fragment:{module:G,entryPoint:"fs",targets:[{format:i}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:f}}),O=t.createRenderPipeline({label:"barycentric coordinates based wireframe pipeline",layout:"auto",vertex:{module:G,entryPoint:"vsIndexedU32BarycentricCoordinateBasedLines"},fragment:{module:G,entryPoint:"fsBarycentricCoordinateBasedLines",targets:[{format:i,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:f}}),u=new Float32Array(36),e=t.createBuffer({size:u.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),r=0,c=16,l=32,g=u.subarray(r,r+16),y=u.subarray(c,c+16);u.subarray(l,l+4).set(ce());const w=t.createBindGroup({layout:L,entries:[{binding:0,resource:{buffer:e}}]}),s=new Float32Array(4),R=new Uint32Array(s.buffer),S=t.createBuffer({size:s.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});R[0]=6;let T=t.createBindGroup({layout:B.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:1,resource:{buffer:n.vertexBuffer}},{binding:2,resource:{buffer:n.indexBuffer}},{binding:3,resource:{buffer:S}}]}),z=t.createBindGroup({layout:O.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:1,resource:{buffer:n.vertexBuffer}},{binding:2,resource:{buffer:n.indexBuffer}},{binding:3,resource:{buffer:S}}]});const k={label:"rock wireframe render pass",colorAttachments:[{view:void 0,clearValue:[.3,.3,.3,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:void 0,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},p=new ie({container:document.getElementById("gui-container"),title:"Wireframe Settings"});p.add(h,"radius",5,40).onChange(E),p.add(h,"widthSegments",3,32,1).onChange(E),p.add(h,"heightSegments",2,32,1).onChange(E),p.add(h,"randomness",0,1).name("Randomness").onChange(E),p.add(a,"barycentricCoordinatesBased").onChange(j),p.add(a,"lines"),p.add(a,"models"),p.add(a,"animate");const F=[];function j(){F.forEach(N=>N.destroy()),F.length=0,a.barycentricCoordinatesBased?F.push(p.add(a,"thickness",0,10).onChange(W),p.add(a,"alphaThreshold",0,1).onChange(W)):F.push(p.add(a,"depthBias",-3,3,1).onChange(v),p.add(a,"depthBiasSlopeScale",-1,1,.05).onChange(v))}j();function W(){s[1]=a.thickness,s[2]=a.alphaThreshold,t.queue.writeBuffer(S,0,s)}W();function E(){const N=J(t,H(h.radius,h.widthSegments,h.heightSegments,h.randomness));n.vertexBuffer.destroy(),n.indexBuffer.destroy(),n=N,T=t.createBindGroup({layout:B.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:1,resource:{buffer:n.vertexBuffer}},{binding:2,resource:{buffer:n.indexBuffer}},{binding:3,resource:{buffer:S}}]}),z=t.createBindGroup({layout:O.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:1,resource:{buffer:n.vertexBuffer}},{binding:2,resource:{buffer:n.indexBuffer}},{binding:3,resource:{buffer:S}}]})}let P,q=0;function _(N){a.animate&&(q=N*.001);const A=m.getCurrentTexture();k.colorAttachments[0].view=A.createView(),(!P||P.width!==A.width||P.height!==A.height)&&(P&&P.destroy(),P=t.createTexture({size:[A.width,A.height],format:f,usage:GPUTextureUsage.RENDER_ATTACHMENT})),k.depthStencilAttachment.view=P.createView();const K=60*Math.PI/180,Q=d.width/d.height,Z=C.perspective(K,Q,.1,1e3),$=C.lookAt([0,0,90],[0,0,0],[0,1,0]),ee=C.multiply(Z,$),Y=t.createCommandEncoder(),x=Y.beginRenderPass(k);x.setPipeline(b);const M=C.identity();if(C.rotateY(M,q*.7,M),C.rotateX(M,q*.35,M),C.multiply(ee,M,g),oe.fromMat4(M,y),t.queue.writeBuffer(e,0,u),a.models&&(x.setVertexBuffer(0,n.vertexBuffer),x.setIndexBuffer(n.indexBuffer,n.indexFormat),x.setBindGroup(0,w),x.drawIndexed(n.vertexCount)),a.lines){const[te,re,ne]=a.barycentricCoordinatesBased?[1,1,O]:[0,2,B];x.setPipeline(ne),x.setBindGroup(0,te===0?T:z),x.draw(n.vertexCount*re)}x.end(),t.queue.submit([Y.finish()]),requestAnimationFrame(_)}requestAnimationFrame(_)}de().catch(console.error);
