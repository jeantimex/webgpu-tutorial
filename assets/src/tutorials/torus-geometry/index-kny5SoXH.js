import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as re}from"../../../canvas-util-BFZcuyXb.js";import{m as B,a as oe}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";import{G as ie}from"../../../lil-gui.esm-CNIGZg2U.js";const ae=`struct Uniforms {
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
`,ue=`struct Uniforms {
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
`,ce=`${ae}
${se}`,de=ue,a={barycentricCoordinatesBased:!1,thickness:2,alphaThreshold:.5,animate:!0,lines:!0,depthBias:1,depthBiasSlopeScale:.5,models:!0},u={radius:35,tube:12,radialSegments:16,tubularSegments:32,arc:2};function _(t,e,c){const s=t.createBuffer({size:e.byteLength,usage:c});return t.queue.writeBuffer(s,0,e),s}function Y(t,e,c,s,v){const l=[],n=[],y=[];for(let o=0;o<=c;o++)for(let r=0;r<=s;r++){const i=r/s*v,h=o/c*Math.PI*2,g=(t+e*Math.cos(h))*Math.cos(i),f=(t+e*Math.cos(h))*Math.sin(i),S=e*Math.sin(h);l.push(g,f,S);const N=t*Math.cos(i),T=t*Math.sin(i),P=g-N,C=f-T,A=S,U=Math.sqrt(P*P+C*C+A*A)||1;n.push(P/U,C/U,A/U)}for(let o=0;o<c;o++)for(let r=0;r<s;r++){const i=(s+1)*o+r,h=(s+1)*(o+1)+r,g=(s+1)*(o+1)+r+1,f=(s+1)*o+r+1;y.push(i,h,f),y.push(h,g,f)}const x=l.length/3,p=new Float32Array(x*6);for(let o=0;o<x;o++){const r=o*3,i=o*6;p[i]=l[r],p[i+1]=l[r+1],p[i+2]=l[r+2],p[i+3]=n[r],p[i+4]=n[r+1],p[i+5]=n[r+2]}return{vertices:p,indices:new Uint32Array(y)}}function X(t,{vertices:e,indices:c}){const s=_(t,e,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),v=_(t,c,GPUBufferUsage.INDEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);return{vertexBuffer:s,indexBuffer:v,indexFormat:"uint32",vertexCount:c.length}}function R(t,e){return t===void 0?(e=1,t=0):e===void 0&&(e=t,t=0),Math.random()*(e-t)+t}function fe(){return[R(),R(),R(),1]}async function le(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const t=await navigator.gpu.requestAdapter({featureLevel:"compatibility"});if(!t)throw new Error("No appropriate GPUAdapter found.");if(t.limits.maxStorageBuffersInVertexStage<2)throw new Error("maxStorageBuffersInVertexStage limit is too low.");const e=await t.requestDevice({requiredLimits:{maxStorageBuffersInVertexStage:2}}),c=document.querySelector("#webgpu-canvas"),s=c.getContext("webgpu");if(!s)throw new Error("WebGPU context not found.");const v=navigator.gpu.getPreferredCanvasFormat();s.configure({device:e,format:v});const l="depth24plus";let n=X(e,Y(u.radius,u.tube,u.radialSegments,u.tubularSegments,u.arc*Math.PI));const y=e.createShaderModule({code:ce}),x=e.createShaderModule({code:de}),p=e.createBindGroupLayout({label:"lit bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]});let o;function r(){o=e.createRenderPipeline({label:"lit pipeline",layout:e.createPipelineLayout({bindGroupLayouts:[p]}),vertex:{module:y,buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:y,targets:[{format:v}]},primitive:{cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",depthBias:a.depthBias,depthBiasSlopeScale:a.depthBiasSlopeScale,format:l}})}r();const i=e.createRenderPipeline({label:"wireframe pipeline",layout:"auto",vertex:{module:x,entryPoint:"vsIndexedU32"},fragment:{module:x,entryPoint:"fs",targets:[{format:v}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:l}}),h=e.createRenderPipeline({label:"barycentric coordinates based wireframe pipeline",layout:"auto",vertex:{module:x,entryPoint:"vsIndexedU32BarycentricCoordinateBasedLines"},fragment:{module:x,entryPoint:"fsBarycentricCoordinateBasedLines",targets:[{format:v,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:l}}),g=new Float32Array(36),f=e.createBuffer({size:g.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),S=0,N=16,T=32,P=g.subarray(S,S+16),C=g.subarray(N,N+16);g.subarray(T,T+4).set(fe());const U=e.createBindGroup({layout:p,entries:[{binding:0,resource:{buffer:f}}]}),G=new Float32Array(4),$=new Uint32Array(G.buffer),O=e.createBuffer({size:G.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});$[0]=6;let q=e.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:f}},{binding:1,resource:{buffer:n.vertexBuffer}},{binding:2,resource:{buffer:n.indexBuffer}},{binding:3,resource:{buffer:O}}]}),z=e.createBindGroup({layout:h.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:f}},{binding:1,resource:{buffer:n.vertexBuffer}},{binding:2,resource:{buffer:n.indexBuffer}},{binding:3,resource:{buffer:O}}]});const I={label:"torus wireframe render pass",colorAttachments:[{view:void 0,clearValue:[.3,.3,.3,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:void 0,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},d=new ie({container:document.getElementById("gui-container"),title:"Wireframe Settings"});d.add(u,"radius",5,80).onChange(V),d.add(u,"tube",1,30).onChange(V),d.add(u,"radialSegments",3,64,1).onChange(V),d.add(u,"tubularSegments",3,100,1).onChange(V),d.add(u,"arc",0,2).name("arc (x PI)").onChange(V),d.add(a,"barycentricCoordinatesBased").onChange(D),d.add(a,"lines"),d.add(a,"models"),d.add(a,"animate");const E=[];function D(){E.forEach(M=>M.destroy()),E.length=0,a.barycentricCoordinatesBased?E.push(d.add(a,"thickness",0,10).onChange(F),d.add(a,"alphaThreshold",0,1).onChange(F)):E.push(d.add(a,"depthBias",-3,3,1).onChange(r),d.add(a,"depthBiasSlopeScale",-1,1,.05).onChange(r))}D();function F(){G[1]=a.thickness,G[2]=a.alphaThreshold,e.queue.writeBuffer(O,0,G)}F();function V(){const M=X(e,Y(u.radius,u.tube,u.radialSegments,u.tubularSegments,u.arc*Math.PI));n.vertexBuffer.destroy(),n.indexBuffer.destroy(),n=M,q=e.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:f}},{binding:1,resource:{buffer:n.vertexBuffer}},{binding:2,resource:{buffer:n.indexBuffer}},{binding:3,resource:{buffer:O}}]}),z=e.createBindGroup({layout:h.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:f}},{binding:1,resource:{buffer:n.vertexBuffer}},{binding:2,resource:{buffer:n.indexBuffer}},{binding:3,resource:{buffer:O}}]})}let b,W=0;function j(M){a.animate&&(W=M*.001),re(c);const L=s.getCurrentTexture();I.colorAttachments[0].view=L.createView(),(!b||b.width!==L.width||b.height!==L.height)&&(b&&b.destroy(),b=e.createTexture({size:[L.width,L.height],format:l,usage:GPUTextureUsage.RENDER_ATTACHMENT})),I.depthStencilAttachment.view=b.createView();const H=60*Math.PI/180,J=c.width/c.height,K=B.perspective(H,J,.1,1e3),Q=B.lookAt([0,0,120],[0,0,0],[0,1,0]),Z=B.multiply(K,Q),k=e.createCommandEncoder(),m=k.beginRenderPass(I);m.setPipeline(o);const w=B.identity();if(B.rotateY(w,W*.7,w),B.rotateX(w,W*.35,w),B.multiply(Z,w,P),oe.fromMat4(w,C),e.queue.writeBuffer(f,0,g),a.models&&(m.setVertexBuffer(0,n.vertexBuffer),m.setIndexBuffer(n.indexBuffer,n.indexFormat),m.setBindGroup(0,U),m.drawIndexed(n.vertexCount)),a.lines){const[ee,te,ne]=a.barycentricCoordinatesBased?[1,1,h]:[0,2,i];m.setPipeline(ne),m.setBindGroup(0,ee===0?q:z),m.draw(n.vertexCount*te)}m.end(),e.queue.submit([k.finish()]),requestAnimationFrame(j)}requestAnimationFrame(j)}le().catch(console.error);
