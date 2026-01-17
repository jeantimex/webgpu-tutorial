import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as re}from"../../../canvas-util-BFZcuyXb.js";import{m as L,a as oe}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";import{G as ie}from"../../../lil-gui.esm-CNIGZg2U.js";const ae=`struct Uniforms {
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
`,ue=`${ae}
${se}`,ce=de,d={barycentricCoordinatesBased:!1,thickness:2,alphaThreshold:.5,animate:!0,lines:!0,depthBias:1,depthBiasSlopeScale:.5,models:!0},t={radiusTop:20,radiusBottom:20,height:40,radialSegments:32,heightSegments:4,openEnded:!1,thetaStart:0,thetaLength:2};function Y(o,e,l){const u=o.createBuffer({size:e.byteLength,usage:l});return o.queue.writeBuffer(u,0,e),u}function X(o,e,l,u,h,T,a,I){const c=[],b=[],C=[],B=[],O=l/2,A=(e-o)/l;for(let r=0;r<=h;r++){const n=[],s=r/h,m=s*(e-o)+o;for(let w=0;w<=u;w++){const p=w/u*I+a,v=Math.sin(p),x=Math.cos(p);c.push(m*v,-s*l+O,m*x);const U=v,N=x,V=A,i=Math.sqrt(U*U+V*V+N*N);b.push(U/i,V/i,N/i),n.push(c.length/3-1)}B.push(n)}for(let r=0;r<u;r++)for(let n=0;n<h;n++){const s=B[n][r],m=B[n+1][r],w=B[n+1][r+1],f=B[n][r+1];C.push(s,m,f),C.push(m,w,f)}function P(r){const n=r?o:e;if(n<=0)return;const s=r?1:-1,m=c.length/3;c.push(0,O*s,0),b.push(0,s,0);const w=c.length/3;for(let f=0;f<=u;f++){const v=f/u*I+a,x=Math.cos(v),U=Math.sin(v);c.push(n*U,O*s,n*x),b.push(0,s,0)}for(let f=0;f<u;f++){const p=w+f,v=w+f+1;r?C.push(m,p,v):C.push(m,v,p)}}T||(P(!0),P(!1));const y=c.length/3,g=new Float32Array(y*6);for(let r=0;r<y;r++){const n=r*3,s=r*6;g[s]=c[n],g[s+1]=c[n+1],g[s+2]=c[n+2],g[s+3]=b[n],g[s+4]=b[n+1],g[s+5]=b[n+2]}return{vertices:g,indices:new Uint32Array(C)}}function H(o,{vertices:e,indices:l}){const u=Y(o,e,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),h=Y(o,l,GPUBufferUsage.INDEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);return{vertexBuffer:u,indexBuffer:h,indexFormat:"uint32",vertexCount:l.length}}function k(o,e){return o===void 0?(e=1,o=0):e===void 0&&(e=o,o=0),Math.random()*(e-o)+o}function fe(){return[k(),k(),k(),1]}async function le(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const o=await navigator.gpu.requestAdapter({featureLevel:"compatibility"});if(!o)throw new Error("No appropriate GPUAdapter found.");if(o.limits.maxStorageBuffersInVertexStage<2)throw new Error("maxStorageBuffersInVertexStage limit is too low.");const e=await o.requestDevice({requiredLimits:{maxStorageBuffersInVertexStage:2}}),l=document.querySelector("#webgpu-canvas"),u=l.getContext("webgpu");if(!u)throw new Error("WebGPU context not found.");const h=navigator.gpu.getPreferredCanvasFormat();u.configure({device:e,format:h});const T="depth24plus";let a=H(e,X(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart*Math.PI,t.thetaLength*Math.PI));const I=e.createShaderModule({code:ue}),c=e.createShaderModule({code:ce}),b=e.createBindGroupLayout({label:"lit bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]});let C;function B(){C=e.createRenderPipeline({label:"lit pipeline",layout:e.createPipelineLayout({bindGroupLayouts:[b]}),vertex:{module:I,buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:I,targets:[{format:h}]},primitive:{cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",depthBias:d.depthBias,depthBiasSlopeScale:d.depthBiasSlopeScale,format:T}})}B();const O=e.createRenderPipeline({label:"wireframe pipeline",layout:"auto",vertex:{module:c,entryPoint:"vsIndexedU32"},fragment:{module:c,entryPoint:"fs",targets:[{format:h}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:T}}),A=e.createRenderPipeline({label:"barycentric coordinates based wireframe pipeline",layout:"auto",vertex:{module:c,entryPoint:"vsIndexedU32BarycentricCoordinateBasedLines"},fragment:{module:c,entryPoint:"fsBarycentricCoordinateBasedLines",targets:[{format:h,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:T}}),P=new Float32Array(36),y=e.createBuffer({size:P.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=0,r=16,n=32,s=P.subarray(g,g+16),m=P.subarray(r,r+16);P.subarray(n,n+4).set(fe());const f=e.createBindGroup({layout:b,entries:[{binding:0,resource:{buffer:y}}]}),p=new Float32Array(4),v=new Uint32Array(p.buffer),x=e.createBuffer({size:p.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});v[0]=6;let U=e.createBindGroup({layout:O.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:y}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:x}}]}),N=e.createBindGroup({layout:A.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:y}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:x}}]});const V={label:"cylinder wireframe render pass",colorAttachments:[{view:void 0,clearValue:[.3,.3,.3,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:void 0,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},i=new ie({container:document.getElementById("gui-container"),title:"Wireframe Settings"});i.add(t,"radiusTop",0,40).onChange(G),i.add(t,"radiusBottom",0,40).onChange(G),i.add(t,"height",5,80).onChange(G),i.add(t,"radialSegments",3,64,1).onChange(G),i.add(t,"heightSegments",1,32,1).onChange(G),i.add(t,"openEnded").onChange(G),i.add(t,"thetaStart",0,2).name("thetaStart (x PI)").onChange(G),i.add(t,"thetaLength",0,2).name("thetaLength (x PI)").onChange(G),i.add(d,"barycentricCoordinatesBased").onChange(z),i.add(d,"lines"),i.add(d,"models"),i.add(d,"animate");const R=[];function z(){R.forEach(F=>F.destroy()),R.length=0,d.barycentricCoordinatesBased?R.push(i.add(d,"thickness",0,10).onChange(q),i.add(d,"alphaThreshold",0,1).onChange(q)):R.push(i.add(d,"depthBias",-3,3,1).onChange(B),i.add(d,"depthBiasSlopeScale",-1,1,.05).onChange(B))}z();function q(){p[1]=d.thickness,p[2]=d.alphaThreshold,e.queue.writeBuffer(x,0,p)}q();function G(){const F=H(e,X(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart*Math.PI,t.thetaLength*Math.PI));a.vertexBuffer.destroy(),a.indexBuffer.destroy(),a=F,U=e.createBindGroup({layout:O.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:y}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:x}}]}),N=e.createBindGroup({layout:A.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:y}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:x}}]})}let M,D=0;function j(F){d.animate&&(D=F*.001),re(l);const W=u.getCurrentTexture();V.colorAttachments[0].view=W.createView(),(!M||M.width!==W.width||M.height!==W.height)&&(M&&M.destroy(),M=e.createTexture({size:[W.width,W.height],format:T,usage:GPUTextureUsage.RENDER_ATTACHMENT})),V.depthStencilAttachment.view=M.createView();const $=60*Math.PI/180,J=l.width/l.height,K=L.perspective($,J,.1,1e3),Q=L.lookAt([0,0,90],[0,0,0],[0,1,0]),Z=L.multiply(K,Q),_=e.createCommandEncoder(),S=_.beginRenderPass(V);S.setPipeline(C);const E=L.identity();if(L.rotateY(E,D*.7,E),L.rotateX(E,D*.35,E),L.multiply(Z,E,s),oe.fromMat4(E,m),e.queue.writeBuffer(y,0,P),d.models&&(S.setVertexBuffer(0,a.vertexBuffer),S.setIndexBuffer(a.indexBuffer,a.indexFormat),S.setBindGroup(0,f),S.drawIndexed(a.vertexCount)),d.lines){const[ee,te,ne]=d.barycentricCoordinatesBased?[1,1,A]:[0,2,O];S.setPipeline(ne),S.setBindGroup(0,ee===0?U:N),S.draw(a.vertexCount*te)}S.end(),e.queue.submit([_.finish()]),requestAnimationFrame(j)}requestAnimationFrame(j)}le().catch(console.error);
