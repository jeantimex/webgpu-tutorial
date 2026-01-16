import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as ne}from"../../../canvas-util-6cCf-wah.js";import{m as L,a as oe}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";import{G as ie}from"../../../lil-gui.esm-CNIGZg2U.js";const ae=`
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
`,u={barycentricCoordinatesBased:!1,thickness:2,alphaThreshold:.5,animate:!0,lines:!0,depthBias:1,depthBiasSlopeScale:.5,models:!0},n={radius:20,height:40,radialSegments:32,heightSegments:4,openEnded:!1,thetaStart:0,thetaLength:2};function Y(o,e,d){const f=o.createBuffer({size:e.byteLength,usage:d});return o.queue.writeBuffer(f,0,e),f}function X(o,e,d,f,b,w,a){const c=[],l=[],S=[],B=[],C=e/2,T=0,P=o,U=P/e;for(let i=0;i<=f;i++){const t=[],r=i/f,g=r*(P-T)+T;for(let p=0;p<=d;p++){const m=p/d*a+w,R=Math.sin(m),y=Math.cos(m);c.push(g*R,-r*e+C,g*y);const N=R,E=y,O=U,s=Math.sqrt(N*N+O*O+E*E);l.push(N/s,O/s,E/s),t.push(c.length/3-1)}B.push(t)}for(let i=0;i<d;i++)for(let t=0;t<f;t++){const r=B[t][i],g=B[t+1][i],p=B[t+1][i+1],G=B[t][i+1];t!==0&&S.push(r,g,G),S.push(g,p,G)}if(!b&&P>0){const i=c.length/3;c.push(0,-C,0),l.push(0,-1,0);const t=c.length/3;for(let r=0;r<=d;r++){const p=r/d*a+w,G=Math.sin(p),m=Math.cos(p);c.push(o*G,-C,o*m),l.push(0,-1,0)}for(let r=0;r<d;r++){const g=t+r,p=t+r+1;S.push(i,p,g)}}const v=c.length/3,h=new Float32Array(v*6);for(let i=0;i<v;i++){const t=i*3,r=i*6;h[r]=c[t],h[r+1]=c[t+1],h[r+2]=c[t+2],h[r+3]=l[t],h[r+4]=l[t+1],h[r+5]=l[t+2]}return{vertices:h,indices:new Uint32Array(S)}}function H(o,{vertices:e,indices:d}){const f=Y(o,e,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),b=Y(o,d,GPUBufferUsage.INDEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);return{vertexBuffer:f,indexBuffer:b,indexFormat:"uint32",vertexCount:d.length}}function k(o,e){return o===void 0?(e=1,o=0):e===void 0&&(e=o,o=0),Math.random()*(e-o)+o}function ue(){return[k(),k(),k(),1]}async function de(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const o=await navigator.gpu.requestAdapter({featureLevel:"compatibility"});if(!o)throw new Error("No appropriate GPUAdapter found.");if(o.limits.maxStorageBuffersInVertexStage<2)throw new Error("maxStorageBuffersInVertexStage limit is too low.");const e=await o.requestDevice({requiredLimits:{maxStorageBuffersInVertexStage:2}}),d=document.querySelector("#webgpu-canvas"),f=d.getContext("webgpu");if(!f)throw new Error("WebGPU context not found.");const b=navigator.gpu.getPreferredCanvasFormat();f.configure({device:e,format:b});const w="depth24plus";let a=H(e,X(n.radius,n.height,n.radialSegments,n.heightSegments,n.openEnded,n.thetaStart*Math.PI,n.thetaLength*Math.PI));const c=e.createShaderModule({code:ae}),l=e.createShaderModule({code:se}),S=e.createBindGroupLayout({label:"lit bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]});let B;function C(){B=e.createRenderPipeline({label:"lit pipeline",layout:e.createPipelineLayout({bindGroupLayouts:[S]}),vertex:{module:c,buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:c,targets:[{format:b}]},primitive:{cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",depthBias:u.depthBias,depthBiasSlopeScale:u.depthBiasSlopeScale,format:w}})}C();const T=e.createRenderPipeline({label:"wireframe pipeline",layout:"auto",vertex:{module:l,entryPoint:"vsIndexedU32"},fragment:{module:l,entryPoint:"fs",targets:[{format:b}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:w}}),P=e.createRenderPipeline({label:"barycentric coordinates based wireframe pipeline",layout:"auto",vertex:{module:l,entryPoint:"vsIndexedU32BarycentricCoordinateBasedLines"},fragment:{module:l,entryPoint:"fsBarycentricCoordinateBasedLines",targets:[{format:b,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:w}}),U=new Float32Array(36),v=e.createBuffer({size:U.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),h=0,i=16,t=32,r=U.subarray(h,h+16),g=U.subarray(i,i+16);U.subarray(t,t+4).set(ue());const G=e.createBindGroup({layout:S,entries:[{binding:0,resource:{buffer:v}}]}),m=new Float32Array(4),R=new Uint32Array(m.buffer),y=e.createBuffer({size:m.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});R[0]=6;let N=e.createBindGroup({layout:T.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:v}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:y}}]}),E=e.createBindGroup({layout:P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:v}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:y}}]});const O={label:"cone wireframe render pass",colorAttachments:[{view:void 0,clearValue:[.3,.3,.3,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:void 0,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},s=new ie({container:document.getElementById("gui-container"),title:"Wireframe Settings"});s.add(n,"radius",0,40).onChange(V),s.add(n,"height",5,80).onChange(V),s.add(n,"radialSegments",3,64,1).onChange(V),s.add(n,"heightSegments",1,32,1).onChange(V),s.add(n,"openEnded").onChange(V),s.add(n,"thetaStart",0,2).name("thetaStart (x PI)").onChange(V),s.add(n,"thetaLength",0,2).name("thetaLength (x PI)").onChange(V),s.add(u,"barycentricCoordinatesBased").onChange(z),s.add(u,"lines"),s.add(u,"models"),s.add(u,"animate");const q=[];function z(){q.forEach(A=>A.destroy()),q.length=0,u.barycentricCoordinatesBased?q.push(s.add(u,"thickness",0,10).onChange(W),s.add(u,"alphaThreshold",0,1).onChange(W)):q.push(s.add(u,"depthBias",-3,3,1).onChange(C),s.add(u,"depthBiasSlopeScale",-1,1,.05).onChange(C))}z();function W(){m[1]=u.thickness,m[2]=u.alphaThreshold,e.queue.writeBuffer(y,0,m)}W();function V(){const A=H(e,X(n.radius,n.height,n.radialSegments,n.heightSegments,n.openEnded,n.thetaStart*Math.PI,n.thetaLength*Math.PI));a.vertexBuffer.destroy(),a.indexBuffer.destroy(),a=A,N=e.createBindGroup({layout:T.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:v}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:y}}]}),E=e.createBindGroup({layout:P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:v}},{binding:1,resource:{buffer:a.vertexBuffer}},{binding:2,resource:{buffer:a.indexBuffer}},{binding:3,resource:{buffer:y}}]})}let M,D=0;function j(A){u.animate&&(D=A*.001),ne(d);const F=f.getCurrentTexture();O.colorAttachments[0].view=F.createView(),(!M||M.width!==F.width||M.height!==F.height)&&(M&&M.destroy(),M=e.createTexture({size:[F.width,F.height],format:w,usage:GPUTextureUsage.RENDER_ATTACHMENT})),O.depthStencilAttachment.view=M.createView();const J=60*Math.PI/180,K=d.width/d.height,Q=L.perspective(J,K,.1,1e3),Z=L.lookAt([0,0,90],[0,0,0],[0,1,0]),$=L.multiply(Q,Z),_=e.createCommandEncoder(),x=_.beginRenderPass(O);x.setPipeline(B);const I=L.identity();if(L.rotateY(I,D*.7,I),L.rotateX(I,D*.35,I),L.multiply($,I,r),oe.fromMat4(I,g),e.queue.writeBuffer(v,0,U),u.models&&(x.setVertexBuffer(0,a.vertexBuffer),x.setIndexBuffer(a.indexBuffer,a.indexFormat),x.setBindGroup(0,G),x.drawIndexed(a.vertexCount)),u.lines){const[ee,te,re]=u.barycentricCoordinatesBased?[1,1,P]:[0,2,T];x.setPipeline(re),x.setBindGroup(0,ee===0?N:E),x.draw(a.vertexCount*te)}x.end(),e.queue.submit([_.finish()]),requestAnimationFrame(j)}requestAnimationFrame(j)}de().catch(console.error);
