import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as re}from"../../../canvas-util-BFZcuyXb.js";import{v as L,m as C,a as oe}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";import{G as ie}from"../../../lil-gui.esm-CNIGZg2U.js";const ae=`struct Uniforms {
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
`,se=`@fragment fn fs(vin: VSOut) -> @location(0) vec4f {
  let lightDirection = normalize(vec3f(4, 10, 6));
  let light = dot(normalize(vin.normal), lightDirection) * 0.5 + 0.5;
  return vec4f(uni.color.rgb * light, uni.color.a);
}
`,ce=`struct Uniforms {
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
`,ue=`${ae}
${se}`,de=ce,s={barycentricCoordinatesBased:!1,thickness:2,alphaThreshold:.5,animate:!0,lines:!0,depthBias:1,depthBiasSlopeScale:.5,models:!0},b={radius:20,widthSegments:7,heightSegments:5};function k(r,e,u){const i=r.createBuffer({size:e.byteLength,usage:u});return r.queue.writeBuffer(i,0,e),i}function _(r,e,u){const i=[],d=[],g=[];for(let t=0;t<=u;t++){const n=[],o=t/u;for(let c=0;c<=e;c++){const p=c/e,m=-r*Math.cos(p*Math.PI*2)*Math.sin(o*Math.PI),w=r*Math.cos(o*Math.PI),S=r*Math.sin(p*Math.PI*2)*Math.sin(o*Math.PI);d.push([m,w,S]),n.push(d.length-1)}g.push(n)}for(let t=0;t<u;t++)for(let n=0;n<e;n++){const o=g[t][n+1],c=g[t][n],p=g[t+1][n],m=g[t+1][n+1];t!==0&&i.push(o,c,m),t!==u-1&&i.push(c,p,m)}const a=new Float32Array(d.length*3);d.forEach((t,n)=>{a.set(t,n*3)});const v=new Float32Array(i.length*3),f=new Float32Array(i.length*3),B=new Uint32Array(i.length);for(let t=0;t<i.length;t+=3){const n=i[t],o=i[t+1],c=i[t+2],p=d[n],m=d[o],w=d[c],S=L.normalize(L.cross(L.subtract(m,p),L.subtract(w,p))),y=t*3;f.set(p,y),f.set(m,y+3),f.set(w,y+6),v.set(S,y),v.set(S,y+3),v.set(S,y+6),B[t]=t,B[t+1]=t+1,B[t+2]=t+2}const G=i.length,l=new Float32Array(G*6);for(let t=0;t<G;t++){const n=t*6,o=t*3;l[n]=f[o],l[n+1]=f[o+1],l[n+2]=f[o+2],l[n+3]=v[o],l[n+4]=v[o+1],l[n+5]=v[o+2]}return{vertices:l,indices:B}}function Y(r,{vertices:e,indices:u}){const i=k(r,e,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),d=k(r,u,GPUBufferUsage.INDEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);return{vertexBuffer:i,indexBuffer:d,indexFormat:"uint32",vertexCount:u.length}}function W(r,e){return r===void 0?(e=1,r=0):e===void 0&&(e=r,r=0),Math.random()*(e-r)+r}function fe(){return[W(),W(),W(),1]}async function le(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const r=await navigator.gpu.requestAdapter({featureLevel:"compatibility"});if(!r)throw new Error("No appropriate GPUAdapter found.");if(r.limits.maxStorageBuffersInVertexStage<2)throw new Error("maxStorageBuffersInVertexStage limit is too low.");const e=await r.requestDevice({requiredLimits:{maxStorageBuffersInVertexStage:2}}),u=document.querySelector("#webgpu-canvas"),i=u.getContext("webgpu");if(!i)throw new Error("WebGPU context not found.");const d=navigator.gpu.getPreferredCanvasFormat();i.configure({device:e,format:d});const g="depth24plus";let a=Y(e,_(b.radius,b.widthSegments,b.heightSegments));const v=e.createShaderModule({code:ue}),f=e.createShaderModule({code:de}),B=e.createBindGroupLayout({label:"lit bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]});let G;function l(){G=e.createRenderPipeline({label:"lit pipeline",layout:e.createPipelineLayout({bindGroupLayouts:[B]}),vertex:{module:v,buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:v,targets:[{format:d}]},primitive:{cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",depthBias:s.depthBias,depthBiasSlopeScale:s.depthBiasSlopeScale,format:g}})}l();const t=e.createRenderPipeline({label:"wireframe pipeline",layout:"auto",vertex:{module:f,entryPoint:"vsIndexedU32"},fragment:{module:f,entryPoint:"fs",targets:[{format:d}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:g}}),n=e.createRenderPipeline({label:"barycentric coordinates based wireframe pipeline",layout:"auto",vertex:{module:f,entryPoint:"vsIndexedU32BarycentricCoordinateBasedLines"},fragment:{module:f,entryPoint:"fsBarycentricCoordinateBasedLines",targets:[{format:d,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:g}}),o=new Float32Array(36),c=e.createBuffer({size:o.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),p=0,m=16,w=32,S=o.subarray(p,p+16),y=o.subarray(m,m+16);o.subarray(w,w+4).set(fe());const X=e.createBindGroup({layout:B,entries:[{binding:0,resource:{buffer:c}}]}),O=new Float32Array(4),J=new Uint32Array(O.buffer),V=e.createBuffer({size:O.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});J[0]=6;let R=e.createBindGroup({layout:t.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:V}}]}),q=e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:V}}]});const T={label:"jewel wireframe render pass",colorAttachments:[{view:void 0,clearValue:[.3,.3,.3,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:void 0,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},h=new ie({container:document.getElementById("gui-container"),title:"Wireframe Settings"});h.add(b,"radius",5,40).onChange(I),h.add(b,"widthSegments",3,24,1).onChange(I),h.add(b,"heightSegments",2,24,1).onChange(I),h.add(s,"barycentricCoordinatesBased").onChange(z),h.add(s,"lines"),h.add(s,"models"),h.add(s,"animate");const A=[];function z(){A.forEach(M=>M.destroy()),A.length=0,s.barycentricCoordinatesBased?A.push(h.add(s,"thickness",0,10).onChange(F),h.add(s,"alphaThreshold",0,1).onChange(F)):A.push(h.add(s,"depthBias",-3,3,1).onChange(l),h.add(s,"depthBiasSlopeScale",-1,1,.05).onChange(l))}z();function F(){O[1]=s.thickness,O[2]=s.alphaThreshold,e.queue.writeBuffer(V,0,O)}F();function I(){const M=Y(e,_(b.radius,b.widthSegments,b.heightSegments));a.vertexBuffer.destroy(),a.indexBuffer.destroy(),a=M,R=e.createBindGroup({layout:t.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:V}}]}),q=e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:V}}]})}let P,E=0;function D(M){s.animate&&(E=M*.001),re(u);const N=i.getCurrentTexture();T.colorAttachments[0].view=N.createView(),(!P||P.width!==N.width||P.height!==N.height)&&(P&&P.destroy(),P=e.createTexture({size:[N.width,N.height],format:g,usage:GPUTextureUsage.RENDER_ATTACHMENT})),T.depthStencilAttachment.view=P.createView();const $=60*Math.PI/180,H=u.width/u.height,K=C.perspective($,H,.1,1e3),Q=C.lookAt([0,0,90],[0,0,0],[0,1,0]),Z=C.multiply(K,Q),j=e.createCommandEncoder(),x=j.beginRenderPass(T);x.setPipeline(G);const U=C.identity();if(C.rotateY(U,E*.7,U),C.rotateX(U,E*.35,U),C.multiply(Z,U,S),oe.fromMat4(U,y),e.queue.writeBuffer(c,0,o),s.models&&(x.setVertexBuffer(0,a.vertexBuffer),x.setIndexBuffer(a.indexBuffer,a.indexFormat),x.setBindGroup(0,X),x.drawIndexed(a.vertexCount)),s.lines){const[ee,te,ne]=s.barycentricCoordinatesBased?[1,1,n]:[0,2,t];x.setPipeline(ne),x.setBindGroup(0,ee===0?R:q),x.draw(a.vertexCount*te)}x.end(),e.queue.submit([j.finish()]),requestAnimationFrame(D)}requestAnimationFrame(D)}le().catch(console.error);
