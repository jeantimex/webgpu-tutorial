import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{v as G,m as O,a as oe}from"./wgpu-matrix.module-Cf1N7Xmi.js";import{G as ie}from"./lil-gui.esm-CNIGZg2U.js";const ae=`
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
`,u={barycentricCoordinatesBased:!1,thickness:2,alphaThreshold:.5,animate:!0,lines:!0,depthBias:1,depthBiasSlopeScale:.5,models:!0},s={radius:20,tube:6,tubularSegments:96,radialSegments:8,p:2,q:3};function X(i,e,f){const c=i.createBuffer({size:e.byteLength,usage:f});return i.queue.writeBuffer(c,0,e),c}function K(i,e,f,c,m,V){const r=[],P=[],B=[];function T(t){const n=Math.cos(t),o=Math.sin(t),d=V/m*t,g=Math.cos(d),b=i*(2+g)*.5*n,l=i*(2+g)*.5*o,v=i*Math.sin(d)*.5;return[b,l,v]}for(let t=0;t<=f;t++){const n=t/f*m*Math.PI*2,o=T(n),d=T(n+.01),g=G.normalize(G.sub(d,o)),b=G.normalize(G.add(o,d)),l=G.normalize(G.cross(g,b)),v=G.cross(l,g);for(let E=0;E<=c;E++){const z=E/c*Math.PI*2,y=-e*Math.cos(z),p=e*Math.sin(z),R=o[0]+(y*v[0]+p*l[0]),C=o[1]+(y*v[1]+p*l[1]),q=o[2]+(y*v[2]+p*l[2]);r.push(R,C,q);const M=y*v[0]+p*l[0],S=y*v[1]+p*l[1],a=y*v[2]+p*l[2],w=Math.sqrt(M*M+S*S+a*a)||1;P.push(M/w,S/w,a/w)}}for(let t=0;t<f;t++)for(let n=0;n<c;n++){const o=(c+1)*t+n,d=(c+1)*(t+1)+n,g=(c+1)*(t+1)+n+1,b=(c+1)*t+n+1;B.push(o,d,b),B.push(d,g,b)}const A=r.length/3,h=new Float32Array(A*6);for(let t=0;t<A;t++){const n=t*3,o=t*6;h[o]=r[n],h[o+1]=r[n+1],h[o+2]=r[n+2],h[o+3]=P[n],h[o+4]=P[n+1],h[o+5]=P[n+2]}return{vertices:h,indices:new Uint32Array(B)}}function H(i,{vertices:e,indices:f}){const c=X(i,e,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),m=X(i,f,GPUBufferUsage.INDEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);return{vertexBuffer:c,indexBuffer:m,indexFormat:"uint32",vertexCount:f.length}}function j(i,e){return i===void 0?(e=1,i=0):e===void 0&&(e=i,i=0),Math.random()*(e-i)+i}function ue(){return[j(),j(),j(),1]}async function ce(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const i=await navigator.gpu.requestAdapter({featureLevel:"compatibility"});if(!i)throw new Error("No appropriate GPUAdapter found.");if(i.limits.maxStorageBuffersInVertexStage<2)throw new Error("maxStorageBuffersInVertexStage limit is too low.");const e=await i.requestDevice({requiredLimits:{maxStorageBuffersInVertexStage:2}}),f=document.querySelector("#webgpu-canvas"),c=f.getContext("webgpu");if(!c)throw new Error("WebGPU context not found.");const m=navigator.gpu.getPreferredCanvasFormat();c.configure({device:e,format:m});const V="depth24plus";let r=H(e,K(s.radius,s.tube,s.tubularSegments,s.radialSegments,s.p,s.q));const P=e.createShaderModule({code:ae}),B=e.createShaderModule({code:se}),T=e.createBindGroupLayout({label:"lit bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]});let A;function h(){A=e.createRenderPipeline({label:"lit pipeline",layout:e.createPipelineLayout({bindGroupLayouts:[T]}),vertex:{module:P,buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:P,targets:[{format:m}]},primitive:{cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",depthBias:u.depthBias,depthBiasSlopeScale:u.depthBiasSlopeScale,format:V}})}h();const t=e.createRenderPipeline({label:"wireframe pipeline",layout:"auto",vertex:{module:B,entryPoint:"vsIndexedU32"},fragment:{module:B,entryPoint:"fs",targets:[{format:m}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:V}}),n=e.createRenderPipeline({label:"barycentric coordinates based wireframe pipeline",layout:"auto",vertex:{module:B,entryPoint:"vsIndexedU32BarycentricCoordinateBasedLines"},fragment:{module:B,entryPoint:"fsBarycentricCoordinateBasedLines",targets:[{format:m,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:V}}),o=new Float32Array(36),d=e.createBuffer({size:o.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=0,b=16,l=32,v=o.subarray(g,g+16),E=o.subarray(b,b+16);o.subarray(l,l+4).set(ue());const y=e.createBindGroup({layout:T,entries:[{binding:0,resource:{buffer:d}}]}),p=new Float32Array(4),R=new Uint32Array(p.buffer),C=e.createBuffer({size:p.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});R[0]=6;let q=e.createBindGroup({layout:t.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:d}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:C}}]}),M=e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:d}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:C}}]});const S={label:"torus knot wireframe render pass",colorAttachments:[{view:void 0,clearValue:[.3,.3,.3,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:void 0,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},a=new ie({container:document.getElementById("gui-container"),title:"Wireframe Settings"});a.add(s,"radius",5,40).onChange(N),a.add(s,"tube",1,20).onChange(N),a.add(s,"tubularSegments",8,200,1).onChange(N),a.add(s,"radialSegments",3,32,1).onChange(N),a.add(s,"p",1,10,1).name("P (Winds)").onChange(N),a.add(s,"q",1,10,1).name("Q (Loops)").onChange(N),a.add(u,"barycentricCoordinatesBased").onChange(D),a.add(u,"lines"),a.add(u,"models"),a.add(u,"animate");const w=[];function D(){w.forEach(F=>F.destroy()),w.length=0,u.barycentricCoordinatesBased?w.push(a.add(u,"thickness",0,10).onChange(W),a.add(u,"alphaThreshold",0,1).onChange(W)):w.push(a.add(u,"depthBias",-3,3,1).onChange(h),a.add(u,"depthBiasSlopeScale",-1,1,.05).onChange(h))}D();function W(){p[1]=u.thickness,p[2]=u.alphaThreshold,e.queue.writeBuffer(C,0,p)}W();function N(){const F=H(e,K(s.radius,s.tube,s.tubularSegments,s.radialSegments,s.p,s.q));r.vertexBuffer.destroy(),r.indexBuffer.destroy(),r=F,q=e.createBindGroup({layout:t.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:d}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:C}}]}),M=e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:d}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:C}}]})}let U,k=0;function _(F){u.animate&&(k=F*.001);const I=c.getCurrentTexture();S.colorAttachments[0].view=I.createView(),(!U||U.width!==I.width||U.height!==I.height)&&(U&&U.destroy(),U=e.createTexture({size:[I.width,I.height],format:V,usage:GPUTextureUsage.RENDER_ATTACHMENT})),S.depthStencilAttachment.view=U.createView();const Q=60*Math.PI/180,J=f.width/f.height,Z=O.perspective(Q,J,.1,1e3),$=O.lookAt([0,0,120],[0,0,0],[0,1,0]),ee=O.multiply(Z,$),Y=e.createCommandEncoder(),x=Y.beginRenderPass(S);x.setPipeline(A);const L=O.identity();if(O.rotateY(L,k*.7,L),O.rotateX(L,k*.35,L),O.multiply(ee,L,v),oe.fromMat4(L,E),e.queue.writeBuffer(d,0,o),u.models&&(x.setVertexBuffer(0,r.vertexBuffer),x.setIndexBuffer(r.indexBuffer,r.indexFormat),x.setBindGroup(0,y),x.drawIndexed(r.vertexCount)),u.lines){const[te,re,ne]=u.barycentricCoordinatesBased?[1,1,n]:[0,2,t];x.setPipeline(ne),x.setBindGroup(0,te===0?q:M),x.draw(r.vertexCount*re)}x.end(),e.queue.submit([Y.finish()]),requestAnimationFrame(_)}requestAnimationFrame(_)}ce().catch(console.error);
