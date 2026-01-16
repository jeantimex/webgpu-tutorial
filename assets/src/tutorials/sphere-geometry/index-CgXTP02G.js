import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as re}from"../../../canvas-util-BGxJIWTK.js";import{m as g,a as ie}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";import{G as ne}from"../../../lil-gui.esm-CNIGZg2U.js";import{c as oe}from"../../../sphere-DhNzdBoi.js";const ae=`
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
`,i={barycentricCoordinatesBased:!1,thickness:2,alphaThreshold:.5,animate:!0,lines:!0,depthBias:1,depthBiasSlopeScale:.5,models:!0},d={radius:20,widthSegments:32,heightSegments:16};function D(r,e,n){const o=r.createBuffer({size:e.byteLength,usage:n});return r.queue.writeBuffer(o,0,e),o}function k(r,e=32,n=16){const{vertices:o,indices:u}=oe(r,e,n),c=o.length/8,t=new Float32Array(c*6);for(let f=0;f<c;++f){const l=f*8,w=f*6;t.set(o.subarray(l,l+6),w)}return{vertices:t,indices:new Uint32Array(u)}}function z(r,{vertices:e,indices:n}){const o=D(r,e,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),u=D(r,n,GPUBufferUsage.INDEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);return{vertexBuffer:o,indexBuffer:u,indexFormat:"uint32",vertexCount:n.length}}function M(r,e){return r===void 0?(e=1,r=0):e===void 0&&(e=r,r=0),Math.random()*(e-r)+r}function de(){return[M(),M(),M(),1]}async function ue(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const r=await navigator.gpu.requestAdapter({featureLevel:"compatibility"});if(!r)throw new Error("No appropriate GPUAdapter found.");if(r.limits.maxStorageBuffersInVertexStage<2)throw new Error("maxStorageBuffersInVertexStage limit is too low.");const e=await r.requestDevice({requiredLimits:{maxStorageBuffersInVertexStage:2}}),n=document.querySelector("#webgpu-canvas"),o=n.getContext("webgpu");if(!o)throw new Error("WebGPU context not found.");const u=navigator.gpu.getPreferredCanvasFormat();o.configure({device:e,format:u});const c="depth24plus";let t=z(e,k(d.radius,d.widthSegments,d.heightSegments));const f=e.createShaderModule({code:ae}),l=e.createShaderModule({code:se}),w=e.createBindGroupLayout({label:"lit bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]});let L;function U(){L=e.createRenderPipeline({label:"lit pipeline",layout:e.createPipelineLayout({bindGroupLayouts:[w]}),vertex:{module:f,buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:f,targets:[{format:u}]},primitive:{cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",depthBias:i.depthBias,depthBiasSlopeScale:i.depthBiasSlopeScale,format:c}})}U();const C=e.createRenderPipeline({label:"wireframe pipeline",layout:"auto",vertex:{module:l,entryPoint:"vsIndexedU32"},fragment:{module:l,entryPoint:"fs",targets:[{format:u}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:c}}),P=e.createRenderPipeline({label:"barycentric coordinates based wireframe pipeline",layout:"auto",vertex:{module:l,entryPoint:"vsIndexedU32BarycentricCoordinateBasedLines"},fragment:{module:l,entryPoint:"fsBarycentricCoordinateBasedLines",targets:[{format:u,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:c}}),v=new Float32Array(36),h=e.createBuffer({size:v.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),T=0,A=16,E=32,j=v.subarray(T,T+16),_=v.subarray(A,A+16);v.subarray(E,E+4).set(de());const Y=e.createBindGroup({layout:w,entries:[{binding:0,resource:{buffer:h}}]}),x=new Float32Array(4),X=new Uint32Array(x.buffer),b=e.createBuffer({size:x.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});X[0]=6;let F=e.createBindGroup({layout:C.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:h}},{binding:1,resource:{buffer:t.vertexBuffer}},{binding:2,resource:{buffer:t.indexBuffer}},{binding:3,resource:{buffer:b}}]}),I=e.createBindGroup({layout:P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:h}},{binding:1,resource:{buffer:t.vertexBuffer}},{binding:2,resource:{buffer:t.indexBuffer}},{binding:3,resource:{buffer:b}}]});const G={label:"sphere wireframe render pass",colorAttachments:[{view:void 0,clearValue:[.3,.3,.3,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:void 0,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},a=new ne({container:document.getElementById("gui-container"),title:"Wireframe Settings"});a.add(d,"radius",5,40).onChange(O),a.add(d,"widthSegments",3,64,1).onChange(O),a.add(d,"heightSegments",2,64,1).onChange(O),a.add(i,"barycentricCoordinatesBased").onChange(R),a.add(i,"lines"),a.add(i,"models"),a.add(i,"animate");const S=[];function R(){S.forEach(B=>B.destroy()),S.length=0,i.barycentricCoordinatesBased?S.push(a.add(i,"thickness",0,10).onChange(V),a.add(i,"alphaThreshold",0,1).onChange(V)):S.push(a.add(i,"depthBias",-3,3,1).onChange(U),a.add(i,"depthBiasSlopeScale",-1,1,.05).onChange(U))}R();function V(){x[1]=i.thickness,x[2]=i.alphaThreshold,e.queue.writeBuffer(b,0,x)}V();function O(){const B=z(e,k(d.radius,d.widthSegments,d.heightSegments));t.vertexBuffer.destroy(),t.indexBuffer.destroy(),t=B,F=e.createBindGroup({layout:C.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:h}},{binding:1,resource:{buffer:t.vertexBuffer}},{binding:2,resource:{buffer:t.indexBuffer}},{binding:3,resource:{buffer:b}}]}),I=e.createBindGroup({layout:P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:h}},{binding:1,resource:{buffer:t.vertexBuffer}},{binding:2,resource:{buffer:t.indexBuffer}},{binding:3,resource:{buffer:b}}]})}let p,N=0;function W(B){i.animate&&(N=B*.001),re(n);const y=o.getCurrentTexture();G.colorAttachments[0].view=y.createView(),(!p||p.width!==y.width||p.height!==y.height)&&(p&&p.destroy(),p=e.createTexture({size:[y.width,y.height],format:c,usage:GPUTextureUsage.RENDER_ATTACHMENT})),G.depthStencilAttachment.view=p.createView();const H=60*Math.PI/180,J=n.width/n.height,K=g.perspective(H,J,.1,1e3),Q=g.lookAt([0,0,80],[0,0,0],[0,1,0]),Z=g.multiply(K,Q),q=e.createCommandEncoder(),s=q.beginRenderPass(G);s.setPipeline(L);const m=g.identity();if(g.rotateY(m,N*.7,m),g.rotateX(m,N*.35,m),g.multiply(Z,m,j),ie.fromMat4(m,_),e.queue.writeBuffer(h,0,v),i.models&&(s.setVertexBuffer(0,t.vertexBuffer),s.setIndexBuffer(t.indexBuffer,t.indexFormat),s.setBindGroup(0,Y),s.drawIndexed(t.vertexCount)),i.lines){const[$,ee,te]=i.barycentricCoordinatesBased?[1,1,P]:[0,2,C];s.setPipeline(te),s.setBindGroup(0,$===0?F:I),s.draw(t.vertexCount*ee)}s.end(),e.queue.submit([q.finish()]),requestAnimationFrame(W)}requestAnimationFrame(W)}ue().catch(console.error);
