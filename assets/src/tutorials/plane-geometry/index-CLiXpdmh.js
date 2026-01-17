import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as re}from"../../../canvas-util-BFZcuyXb.js";import{m as b,a as ie}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";import{G as oe}from"../../../lil-gui.esm-CNIGZg2U.js";const ae=`struct Uniforms {
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
${se}`,ce=de,o={barycentricCoordinatesBased:!1,thickness:2,alphaThreshold:.5,animate:!0,lines:!0,depthBias:1,depthBiasSlopeScale:.5,models:!0},u={width:60,height:60,widthSegments:10,heightSegments:10};function Y(n,e,c){const f=n.createBuffer({size:e.byteLength,usage:c});return n.queue.writeBuffer(f,0,e),f}function _(n,e,c,f){const s=[],p=[],t=[],N=n/2,B=e/2,y=Math.floor(c),w=Math.floor(f),g=y+1,P=w+1,U=n/y,v=e/w;for(let r=0;r<P;r++){const i=r*v-B;for(let a=0;a<g;a++){const S=a*U-N;s.push(S,-i,0),p.push(0,0,1)}}for(let r=0;r<w;r++)for(let i=0;i<y;i++){const a=i+g*r,S=i+g*(r+1),R=i+1+g*(r+1),M=i+1+g*r;t.push(a,S,M),t.push(S,R,M)}const h=s.length/3,l=new Float32Array(h*6);for(let r=0;r<h;r++){const i=r*3,a=r*6;l[a]=s[i],l[a+1]=s[i+1],l[a+2]=s[i+2],l[a+3]=p[i],l[a+4]=p[i+1],l[a+5]=p[i+2]}return{vertices:l,indices:new Uint32Array(t)}}function X(n,{vertices:e,indices:c}){const f=Y(n,e,GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),s=Y(n,c,GPUBufferUsage.INDEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);return{vertexBuffer:f,indexBuffer:s,indexFormat:"uint32",vertexCount:c.length}}function W(n,e){return n===void 0?(e=1,n=0):e===void 0&&(e=n,n=0),Math.random()*(e-n)+n}function fe(){return[W(),W(),W(),1]}async function le(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const n=await navigator.gpu.requestAdapter({featureLevel:"compatibility"});if(!n)throw new Error("No appropriate GPUAdapter found.");if(n.limits.maxStorageBuffersInVertexStage<2)throw new Error("maxStorageBuffersInVertexStage limit is too low.");const e=await n.requestDevice({requiredLimits:{maxStorageBuffersInVertexStage:2}}),c=document.querySelector("#webgpu-canvas"),f=c.getContext("webgpu");if(!f)throw new Error("WebGPU context not found.");const s=navigator.gpu.getPreferredCanvasFormat();f.configure({device:e,format:s});const p="depth24plus";let t=X(e,_(u.width,u.height,u.widthSegments,u.heightSegments));const N=e.createShaderModule({code:ue}),B=e.createShaderModule({code:ce}),y=e.createBindGroupLayout({label:"lit bind group layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]});let w;function g(){w=e.createRenderPipeline({label:"lit pipeline",layout:e.createPipelineLayout({bindGroupLayouts:[y]}),vertex:{module:N,buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:N,targets:[{format:s}]},primitive:{cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",depthBias:o.depthBias,depthBiasSlopeScale:o.depthBiasSlopeScale,format:p}})}g();const P=e.createRenderPipeline({label:"wireframe pipeline",layout:"auto",vertex:{module:B,entryPoint:"vsIndexedU32"},fragment:{module:B,entryPoint:"fs",targets:[{format:s}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:p}}),U=e.createRenderPipeline({label:"barycentric coordinates based wireframe pipeline",layout:"auto",vertex:{module:B,entryPoint:"vsIndexedU32BarycentricCoordinateBasedLines"},fragment:{module:B,entryPoint:"fsBarycentricCoordinateBasedLines",targets:[{format:s,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:p}}),v=new Float32Array(36),h=e.createBuffer({size:v.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),l=0,r=16,i=32,a=v.subarray(l,l+16),S=v.subarray(r,r+16);v.subarray(i,i+4).set(fe());const M=e.createBindGroup({layout:y,entries:[{binding:0,resource:{buffer:h}}]}),G=new Float32Array(4),H=new Uint32Array(G.buffer),O=e.createBuffer({size:G.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});H[0]=6;let q=e.createBindGroup({layout:P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:h}},{binding:1,resource:{buffer:t.vertexBuffer}},{binding:2,resource:{buffer:t.indexBuffer}},{binding:3,resource:{buffer:O}}]}),D=e.createBindGroup({layout:U.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:h}},{binding:1,resource:{buffer:t.vertexBuffer}},{binding:2,resource:{buffer:t.indexBuffer}},{binding:3,resource:{buffer:O}}]});const E={label:"plane wireframe render pass",colorAttachments:[{view:void 0,clearValue:[.3,.3,.3,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:void 0,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},d=new oe({container:document.getElementById("gui-container"),title:"Wireframe Settings"});d.add(u,"width",5,120).onChange(A),d.add(u,"height",5,120).onChange(A),d.add(u,"widthSegments",1,100,1).onChange(A),d.add(u,"heightSegments",1,100,1).onChange(A),d.add(o,"barycentricCoordinatesBased").onChange(k),d.add(o,"lines"),d.add(o,"models"),d.add(o,"animate");const T=[];function k(){T.forEach(V=>V.destroy()),T.length=0,o.barycentricCoordinatesBased?T.push(d.add(o,"thickness",0,10).onChange(F),d.add(o,"alphaThreshold",0,1).onChange(F)):T.push(d.add(o,"depthBias",-3,3,1).onChange(g),d.add(o,"depthBiasSlopeScale",-1,1,.05).onChange(g))}k();function F(){G[1]=o.thickness,G[2]=o.alphaThreshold,e.queue.writeBuffer(O,0,G)}F();function A(){const V=X(e,_(u.width,u.height,u.widthSegments,u.heightSegments));t.vertexBuffer.destroy(),t.indexBuffer.destroy(),t=V,q=e.createBindGroup({layout:P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:h}},{binding:1,resource:{buffer:t.vertexBuffer}},{binding:2,resource:{buffer:t.indexBuffer}},{binding:3,resource:{buffer:O}}]}),D=e.createBindGroup({layout:U.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:h}},{binding:1,resource:{buffer:t.vertexBuffer}},{binding:2,resource:{buffer:t.indexBuffer}},{binding:3,resource:{buffer:O}}]})}let x,I=0;function z(V){o.animate&&(I=V*.001),re(c);const L=f.getCurrentTexture();E.colorAttachments[0].view=L.createView(),(!x||x.width!==L.width||x.height!==L.height)&&(x&&x.destroy(),x=e.createTexture({size:[L.width,L.height],format:p,usage:GPUTextureUsage.RENDER_ATTACHMENT})),E.depthStencilAttachment.view=x.createView();const $=60*Math.PI/180,J=c.width/c.height,K=b.perspective($,J,.1,1e3),Q=b.lookAt([0,0,90],[0,0,0],[0,1,0]),Z=b.multiply(K,Q),j=e.createCommandEncoder(),m=j.beginRenderPass(E);m.setPipeline(w);const C=b.identity();if(b.rotateY(C,I*.7,C),b.rotateX(C,I*.35,C),b.multiply(Z,C,a),ie.fromMat4(C,S),e.queue.writeBuffer(h,0,v),o.models&&(m.setVertexBuffer(0,t.vertexBuffer),m.setIndexBuffer(t.indexBuffer,t.indexFormat),m.setBindGroup(0,M),m.drawIndexed(t.vertexCount)),o.lines){const[ee,te,ne]=o.barycentricCoordinatesBased?[1,1,U]:[0,2,P];m.setPipeline(ne),m.setBindGroup(0,ee===0?q:D),m.draw(t.vertexCount*te)}m.end(),e.queue.submit([j.finish()]),requestAnimationFrame(z)}requestAnimationFrame(z)}le().catch(console.error);
