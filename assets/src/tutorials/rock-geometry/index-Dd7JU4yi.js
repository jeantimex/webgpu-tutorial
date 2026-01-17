import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as oe}from"../../../canvas-util-BFZcuyXb.js";import{v as I,m as C,a as ie}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";import{G as ae}from"../../../lil-gui.esm-CNIGZg2U.js";const se=`struct Uniforms {
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
`,ce=`@fragment fn fs(vin: VSOut) -> @location(0) vec4f {
  let lightDirection = normalize(vec3f(4, 10, 6));
  let light = dot(normalize(vin.normal), lightDirection) * 0.5 + 0.5;
  return vec4f(uni.color.rgb * light, uni.color.a);
}
`,de=`struct Uniforms {
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
`,ue=`${se}
${ce}`,fe=de,a={barycentricCoordinatesBased:!1,thickness:2,alphaThreshold:.5,animate:!0,lines:!0,depthBias:1,depthBiasSlopeScale:.5,models:!0},h={radius:20,widthSegments:16,heightSegments:12,randomness:.15};function X(o,t,c){const m=o.createBuffer({size:t.byteLength,usage:c});return o.queue.writeBuffer(m,0,t),m}function $(o,t,c,m){const i=[],f=[],r=[];let U=12345;const G=()=>(U=U*1103515245+12345&2147483647,U/2147483647);for(let e=0;e<=c;e++){const n=[],l=e/c*Math.PI;for(let g=0;g<=t;g++){const V=g/t*Math.PI*2,w=Math.sin(l),s=o*(1+(G()-.5)*2*m*w),R=-s*Math.cos(V)*Math.sin(l),S=s*Math.cos(l),T=s*Math.sin(V)*Math.sin(l);f.push([R,S,T]),n.push(f.length-1)}r.push(n)}for(let e=0;e<c;e++)for(let n=0;n<t;n++){const d=r[e][n+1],l=r[e][n],g=r[e+1][n],B=r[e+1][n+1];e!==0&&i.push(d,l,B),e!==c-1&&i.push(l,g,B)}const L=new Float32Array(f.length*3);f.forEach((e,n)=>{L.set(e,n*3)});const x=new Float32Array(i.length*3),v=new Float32Array(i.length*3),y=new Uint32Array(i.length);for(let e=0;e<i.length;e+=3){const n=i[e],d=i[e+1],l=i[e+2],g=f[n],B=f[d],V=f[l],w=I.normalize(I.cross(I.subtract(B,g),I.subtract(V,g))),s=e*3;v.set(g,s),v.set(B,s+3),v.set(V,s+6),x.set(w,s),x.set(w,s+3),x.set(w,s+6),y[e]=e,y[e+1]=e+1,y[e+2]=e+2}const O=i.length,u=new Float32Array(O*6);for(let e=0;e<O;e++){const n=e*6,d=e*3;u[n]=v[d],u[n+1]=v[d+1],u[n+2]=v[d+2],u[n+3]=x[d],u[n+4]=x[d+1],u[n+5]=x[d+2]}return{vertices:u,indices:y}}function H(o,{vertices:t,indices:c}){const m=X(o,t,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),i=X(o,c,GPUBufferUsage.INDEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);return{vertexBuffer:m,indexBuffer:i,indexFormat:"uint32",vertexCount:c.length}}function z(o,t){return o===void 0?(t=1,o=0):t===void 0&&(t=o,o=0),Math.random()*(t-o)+o}function le(){return[z(),z(),z(),1]}async function pe(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const o=await navigator.gpu.requestAdapter({featureLevel:"compatibility"});if(!o)throw new Error("No appropriate GPUAdapter found.");if(o.limits.maxStorageBuffersInVertexStage<2)throw new Error("maxStorageBuffersInVertexStage limit is too low.");const t=await o.requestDevice({requiredLimits:{maxStorageBuffersInVertexStage:2}}),c=document.querySelector("#webgpu-canvas"),m=c.getContext("webgpu");if(!m)throw new Error("WebGPU context not found.");const i=navigator.gpu.getPreferredCanvasFormat();m.configure({device:t,format:i});const f="depth24plus";let r=H(t,$(h.radius,h.widthSegments,h.heightSegments,h.randomness));const U=t.createShaderModule({code:ue}),G=t.createShaderModule({code:fe}),L=t.createBindGroupLayout({label:"lit bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]});let x;function v(){x=t.createRenderPipeline({label:"lit pipeline",layout:t.createPipelineLayout({bindGroupLayouts:[L]}),vertex:{module:U,buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:U,targets:[{format:i}]},primitive:{cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",depthBias:a.depthBias,depthBiasSlopeScale:a.depthBiasSlopeScale,format:f}})}v();const y=t.createRenderPipeline({label:"wireframe pipeline",layout:"auto",vertex:{module:G,entryPoint:"vsIndexedU32"},fragment:{module:G,entryPoint:"fs",targets:[{format:i}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:f}}),O=t.createRenderPipeline({label:"barycentric coordinates based wireframe pipeline",layout:"auto",vertex:{module:G,entryPoint:"vsIndexedU32BarycentricCoordinateBasedLines"},fragment:{module:G,entryPoint:"fsBarycentricCoordinateBasedLines",targets:[{format:i,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:f}}),u=new Float32Array(36),e=t.createBuffer({size:u.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),n=0,d=16,l=32,g=u.subarray(n,n+16),B=u.subarray(d,d+16);u.subarray(l,l+4).set(le());const w=t.createBindGroup({layout:L,entries:[{binding:0,resource:{buffer:e}}]}),s=new Float32Array(4),R=new Uint32Array(s.buffer),S=t.createBuffer({size:s.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});R[0]=6;let T=t.createBindGroup({layout:y.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:S}}]}),D=t.createBindGroup({layout:O.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:S}}]});const W={label:"rock wireframe render pass",colorAttachments:[{view:void 0,clearValue:[.3,.3,.3,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:void 0,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},p=new ae({container:document.getElementById("gui-container"),title:"Wireframe Settings"});p.add(h,"radius",5,40).onChange(E),p.add(h,"widthSegments",3,32,1).onChange(E),p.add(h,"heightSegments",2,32,1).onChange(E),p.add(h,"randomness",0,1).name("Randomness").onChange(E),p.add(a,"barycentricCoordinatesBased").onChange(j),p.add(a,"lines"),p.add(a,"models"),p.add(a,"animate");const F=[];function j(){F.forEach(N=>N.destroy()),F.length=0,a.barycentricCoordinatesBased?F.push(p.add(a,"thickness",0,10).onChange(k),p.add(a,"alphaThreshold",0,1).onChange(k)):F.push(p.add(a,"depthBias",-3,3,1).onChange(v),p.add(a,"depthBiasSlopeScale",-1,1,.05).onChange(v))}j();function k(){s[1]=a.thickness,s[2]=a.alphaThreshold,t.queue.writeBuffer(S,0,s)}k();function E(){const N=H(t,$(h.radius,h.widthSegments,h.heightSegments,h.randomness));r.vertexBuffer.destroy(),r.indexBuffer.destroy(),r=N,T=t.createBindGroup({layout:y.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:S}}]}),D=t.createBindGroup({layout:O.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:1,resource:{buffer:r.vertexBuffer}},{binding:2,resource:{buffer:r.indexBuffer}},{binding:3,resource:{buffer:S}}]})}let P,q=0;function _(N){a.animate&&(q=N*.001),oe(c);const A=m.getCurrentTexture();W.colorAttachments[0].view=A.createView(),(!P||P.width!==A.width||P.height!==A.height)&&(P&&P.destroy(),P=t.createTexture({size:[A.width,A.height],format:f,usage:GPUTextureUsage.RENDER_ATTACHMENT})),W.depthStencilAttachment.view=P.createView();const J=60*Math.PI/180,K=c.width/c.height,Q=C.perspective(J,K,.1,1e3),Z=C.lookAt([0,0,90],[0,0,0],[0,1,0]),ee=C.multiply(Q,Z),Y=t.createCommandEncoder(),b=Y.beginRenderPass(W);b.setPipeline(x);const M=C.identity();if(C.rotateY(M,q*.7,M),C.rotateX(M,q*.35,M),C.multiply(ee,M,g),ie.fromMat4(M,B),t.queue.writeBuffer(e,0,u),a.models&&(b.setVertexBuffer(0,r.vertexBuffer),b.setIndexBuffer(r.indexBuffer,r.indexFormat),b.setBindGroup(0,w),b.drawIndexed(r.vertexCount)),a.lines){const[te,ne,re]=a.barycentricCoordinatesBased?[1,1,O]:[0,2,y];b.setPipeline(re),b.setBindGroup(0,te===0?T:D),b.draw(r.vertexCount*ne)}b.end(),t.queue.submit([Y.finish()]),requestAnimationFrame(_)}requestAnimationFrame(_)}pe().catch(console.error);
