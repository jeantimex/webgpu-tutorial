import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as N}from"./webgpu-util-BApOR-AX.js";import{m as A,v as I}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as E}from"./lil-gui.esm-CNIGZg2U.js";const R=`
struct Uniforms {
  worldViewProjectionMatrix : mat4x4f,
  worldMatrix : mat4x4f,
  color : vec4f,
}

struct LineUniforms {
  thickness : f32,
  alphaThreshold : f32,
}

@group(0) @binding(0) var<uniform> uni : Uniforms;
@group(0) @binding(1) var<uniform> line : LineUniforms;
@group(0) @binding(2) var<storage, read> positions : array<f32>;
@group(0) @binding(3) var<storage, read> normals : array<f32>;
@group(0) @binding(4) var<storage, read> indices : array<u32>;

struct VSOutput {
  @builtin(position) position : vec4f,
  @location(0) barycentricCoord : vec3f,
  @location(1) normal : vec3f,
}

@vertex
fn vs_main(@builtin(vertex_index) vNdx : u32) -> VSOutput {
  // Compute which vertex within the triangle (0, 1, or 2)
  let vertNdx = vNdx % 3;

  // Get the actual vertex index from the index buffer
  let index = indices[vNdx];

  // Read position (3 floats per vertex)
  let pNdx = index * 3;
  let position = vec4f(positions[pNdx], positions[pNdx + 1], positions[pNdx + 2], 1.0);
  let normal = vec3f(normals[pNdx], normals[pNdx + 1], normals[pNdx + 2]);

  var vsOut : VSOutput;
  vsOut.position = uni.worldViewProjectionMatrix * position;
  vsOut.normal = (uni.worldMatrix * vec4f(normal, 0.0)).xyz;

  // Assign barycentric coordinate based on vertex index within triangle
  vsOut.barycentricCoord = vec3f(0.0);
  if (vertNdx == 0u) {
    vsOut.barycentricCoord.x = 1.0;
  } else if (vertNdx == 1u) {
    vsOut.barycentricCoord.y = 1.0;
  } else {
    vsOut.barycentricCoord.z = 1.0;
  }

  return vsOut;
}

fn edgeFactor(bary : vec3f) -> f32 {
  let d = fwidth(bary);
  let a3 = smoothstep(vec3f(0.0), d * line.thickness, bary);
  return min(min(a3.x, a3.y), a3.z);
}

@fragment
fn fs_main(v : VSOutput) -> @location(0) vec4f {
  // Lighting
  let lightDirection = normalize(vec3f(4.0, 10.0, 6.0));
  let light = dot(normalize(v.normal), lightDirection) * 0.5 + 0.5;
  let litColor = uni.color.rgb * light;

  // Wireframe edge factor
  let edge = 1.0 - edgeFactor(v.barycentricCoord);

  // Blend white wireframe over lit color
  let wireColor = vec3f(1.0, 1.0, 1.0);
  let finalColor = mix(litColor, wireColor, edge);

  // Alpha: solid where there's either fill or wireframe
  let a = max(edge, 1.0 - line.alphaThreshold);
  if (a < line.alphaThreshold) {
    discard;
  }

  return vec4f(finalColor, 1.0);
}
`;function q(){const f=[],n=[],l=[],a=[{dir:[0,0,1],up:[0,1,0],right:[1,0,0]},{dir:[0,0,-1],up:[0,1,0],right:[-1,0,0]},{dir:[0,1,0],up:[0,0,-1],right:[1,0,0]},{dir:[0,-1,0],up:[0,0,1],right:[1,0,0]},{dir:[1,0,0],up:[0,1,0],right:[0,0,-1]},{dir:[-1,0,0],up:[0,1,0],right:[0,0,1]}];for(const h of a){const d=f.length/3,c=h.dir,e=h.up,r=h.right;for(let s=0;s<2;s++)for(let t=0;t<2;t++){const o=c[0]*.5+(t*2-1)*r[0]*.5+(s*2-1)*e[0]*.5,i=c[1]*.5+(t*2-1)*r[1]*.5+(s*2-1)*e[1]*.5,u=c[2]*.5+(t*2-1)*r[2]*.5+(s*2-1)*e[2]*.5;f.push(o,i,u),n.push(c[0],c[1],c[2])}l.push(d,d+2,d+1),l.push(d+1,d+2,d+3)}return{positions:new Float32Array(f),normals:new Float32Array(n),indices:new Uint32Array(l),indexCount:l.length}}function j(f=.5,n=16,l=12){const a=[],h=[],d=[];for(let c=0;c<=l;c++){const r=c/l*Math.PI;for(let s=0;s<=n;s++){const o=s/n*Math.PI*2,i=-Math.sin(r)*Math.cos(o),u=Math.cos(r),p=Math.sin(r)*Math.sin(o);a.push(i*f,u*f,p*f),h.push(i,u,p)}}for(let c=0;c<l;c++)for(let e=0;e<n;e++){const r=c*(n+1)+e,s=r+n+1,t=r+1,o=s+1;c!==0&&d.push(r,s,t),c!==l-1&&d.push(t,s,o)}return{positions:new Float32Array(a),normals:new Float32Array(h),indices:new Uint32Array(d),indexCount:d.length}}function V(f=.5,n=5,l=3){const a=[],h=[],d=[],c=[];for(let e=0;e<=l;e++){const s=e/l*Math.PI;for(let t=0;t<=n;t++){const i=t/n*Math.PI*2,u=-Math.sin(s)*Math.cos(i),p=Math.cos(s),m=Math.sin(s)*Math.sin(i);c.push([u*f,p*f,m*f])}}for(let e=0;e<l;e++)for(let r=0;r<n;r++){const s=e*(n+1)+r,t=s+n+1,o=s+1,i=t+1;if(e!==0){const u=c[s],p=c[t],m=c[o],x=T(u,p,m),M=a.length/3;a.push(...u,...p,...m),h.push(...x,...x,...x),d.push(M,M+1,M+2)}if(e!==l-1){const u=c[o],p=c[t],m=c[i],x=T(u,p,m),M=a.length/3;a.push(...u,...p,...m),h.push(...x,...x,...x),d.push(M,M+1,M+2)}}return{positions:new Float32Array(a),normals:new Float32Array(h),indices:new Uint32Array(d),indexCount:d.length}}function L(f=.5,n=16,l=12,a=.15){const h=[],d=[],c=[],e=[];let r=12345;const s=()=>(r=r*1103515245+12345&2147483647,r/2147483647);for(let t=0;t<=l;t++){const i=t/l*Math.PI;for(let u=0;u<=n;u++){const m=u/n*Math.PI*2,x=-Math.sin(i)*Math.cos(m),M=Math.cos(i),v=Math.sin(i)*Math.sin(m),g=Math.sin(i),y=f*(1+(s()-.5)*2*a*g);e.push([x*y,M*y,v*y])}}for(let t=0;t<l;t++)for(let o=0;o<n;o++){const i=t*(n+1)+o,u=i+n+1,p=i+1,m=u+1;if(t!==0){const x=e[i],M=e[u],v=e[p],g=T(x,M,v),y=h.length/3;h.push(...x,...M,...v),d.push(...g,...g,...g),c.push(y,y+1,y+2)}if(t!==l-1){const x=e[p],M=e[u],v=e[m],g=T(x,M,v),y=h.length/3;h.push(...x,...M,...v),d.push(...g,...g,...g),c.push(y,y+1,y+2)}}return{positions:new Float32Array(h),normals:new Float32Array(d),indices:new Uint32Array(c),indexCount:c.length}}function T(f,n,l){const a=n[0]-f[0],h=n[1]-f[1],d=n[2]-f[2],c=l[0]-f[0],e=l[1]-f[1],r=l[2]-f[2],s=h*r-d*e,t=d*c-a*r,o=a*e-h*c,i=Math.sqrt(s*s+t*t+o*o);return[s/i,t/i,o/i]}function _(f=.5,n=.5,l=1,a=16){const h=[],d=[],c=[],e=l/2;for(let r=0;r<=1;r++){const s=r===0?f:n,t=r===0?e:-e;for(let o=0;o<=a;o++){const i=o/a*Math.PI*2,u=Math.sin(i),p=Math.cos(i);h.push(s*u,t,s*p),d.push(u,0,p)}}for(let r=0;r<a;r++){const s=r,t=r+a+1,o=r+1,i=t+1;c.push(s,t,o,o,t,i)}if(f>0){const r=h.length/3;h.push(0,e,0),d.push(0,1,0);const s=h.length/3;for(let t=0;t<=a;t++){const o=t/a*Math.PI*2;h.push(f*Math.sin(o),e,f*Math.cos(o)),d.push(0,1,0)}for(let t=0;t<a;t++)c.push(r,s+t,s+t+1)}if(n>0){const r=h.length/3;h.push(0,-e,0),d.push(0,-1,0);const s=h.length/3;for(let t=0;t<=a;t++){const o=t/a*Math.PI*2;h.push(n*Math.sin(o),-e,n*Math.cos(o)),d.push(0,-1,0)}for(let t=0;t<a;t++)c.push(r,s+t+1,s+t)}return{positions:new Float32Array(h),normals:new Float32Array(d),indices:new Uint32Array(c),indexCount:c.length}}function k(f=.5,n=1,l=16){const a=[],h=[],d=[],c=n/2,e=f/n;for(let t=0;t<=l;t++){const o=t/l*Math.PI*2;a.push(0,c,0);const i=Math.sin(o),u=Math.cos(o),p=Math.sqrt(1+e*e);h.push(i/p,e/p,u/p)}for(let t=0;t<=l;t++){const o=t/l*Math.PI*2,i=Math.sin(o),u=Math.cos(o);a.push(f*i,-c,f*u);const p=Math.sqrt(1+e*e);h.push(i/p,e/p,u/p)}for(let t=0;t<l;t++){const o=t,i=l+1+t,u=i+1;d.push(o,u,i)}const r=a.length/3;a.push(0,-c,0),h.push(0,-1,0);const s=a.length/3;for(let t=0;t<=l;t++){const o=t/l*Math.PI*2;a.push(f*Math.sin(o),-c,f*Math.cos(o)),h.push(0,-1,0)}for(let t=0;t<l;t++)d.push(r,s+t+1,s+t);return{positions:new Float32Array(a),normals:new Float32Array(h),indices:new Uint32Array(d),indexCount:d.length}}function D(f=.4,n=.15,l=8,a=16){const h=[],d=[],c=[];for(let e=0;e<=l;e++)for(let r=0;r<=a;r++){const s=r/a*Math.PI*2,t=e/l*Math.PI*2,o=(f+n*Math.cos(t))*Math.cos(s),i=(f+n*Math.cos(t))*Math.sin(s),u=n*Math.sin(t);h.push(o,i,u);const p=f*Math.cos(s),m=f*Math.sin(s),x=o-p,M=i-m,v=u,g=Math.sqrt(x*x+M*M+v*v);d.push(x/g,M/g,v/g)}for(let e=0;e<l;e++)for(let r=0;r<a;r++){const s=e*(a+1)+r,t=(e+1)*(a+1)+r,o=s+1,i=t+1;c.push(s,t,o,o,t,i)}return{positions:new Float32Array(h),normals:new Float32Array(d),indices:new Uint32Array(c),indexCount:c.length}}function Y(f=.4,n=.1,l=64,a=8,h=2,d=3){const c=[],e=[],r=[];function s(t){const o=Math.cos(t),i=Math.sin(t),u=d/h*t,p=Math.cos(u);return[f*(2+p)*.5*o,f*(2+p)*.5*i,f*Math.sin(u)*.5]}for(let t=0;t<=l;t++){const o=t/l*h*Math.PI*2,i=s(o),u=s(o+.01),p=I.normalize(I.sub(u,i)),m=I.normalize(I.add(i,u)),x=I.normalize(I.cross(p,m)),M=I.cross(x,p);for(let v=0;v<=a;v++){const g=v/a*Math.PI*2,y=-n*Math.cos(g),P=n*Math.sin(g),G=i[0]+y*M[0]+P*x[0],C=i[1]+y*M[1]+P*x[1],O=i[2]+y*M[2]+P*x[2];c.push(G,C,O);const B=y*M[0]+P*x[0],F=y*M[1]+P*x[1],w=y*M[2]+P*x[2],b=Math.sqrt(B*B+F*F+w*w);e.push(B/b,F/b,w/b)}}for(let t=0;t<l;t++)for(let o=0;o<a;o++){const i=t*(a+1)+o,u=(t+1)*(a+1)+o,p=i+1,m=u+1;r.push(i,u,p,p,u,m)}return{positions:new Float32Array(c),normals:new Float32Array(e),indices:new Uint32Array(r),indexCount:r.length}}async function X(){const f=document.querySelector("#webgpu-canvas"),{device:n,context:l,canvasFormat:a}=await N(f),h=n.createShaderModule({code:R}),d=[q(),j(.5,16,12),V(.5,5,3),L(.5,16,12,.15),_(.5,.5,1,16),k(.5,1,16),D(.4,.15,8,16),Y(.4,.1,64,8,2,3)],c=d.map(y=>{const P=n.createBuffer({size:y.positions.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});n.queue.writeBuffer(P,0,y.positions);const G=n.createBuffer({size:y.normals.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});n.queue.writeBuffer(G,0,y.normals);const C=n.createBuffer({size:y.indices.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});return n.queue.writeBuffer(C,0,y.indices),{positionBuffer:P,normalBuffer:G,indexBuffer:C,indexCount:y.indexCount}}),e=n.createBuffer({size:8,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),r=n.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:3,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:4,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]}),s=n.createRenderPipeline({layout:n.createPipelineLayout({bindGroupLayouts:[r]}),vertex:{module:h,entryPoint:"vs_main"},fragment:{module:h,entryPoint:"fs_main",targets:[{format:a,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),t=n.createTexture({size:[f.width,f.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});let o=[];function i(y){const G=[(Math.random()-.5)*30*2,(Math.random()-.5)*30*2,(Math.random()-.5)*30*2],C=[Math.random()*Math.PI*2,Math.random()*Math.PI*2,Math.random()*Math.PI*2],O=9+Math.random()*12,B=[Math.random(),Math.random(),Math.random(),1],F=n.createBuffer({size:144,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),w=c[y],b=n.createBindGroup({layout:r,entries:[{binding:0,resource:{buffer:F}},{binding:1,resource:{buffer:e}},{binding:2,resource:{buffer:w.positionBuffer}},{binding:3,resource:{buffer:w.normalBuffer}},{binding:4,resource:{buffer:w.indexBuffer}}]});return{geometryIndex:y,position:G,rotation:C,scale:O,color:B,uniformBuffer:F,bindGroup:b}}function u(y){o.forEach(P=>P.uniformBuffer.destroy()),o=[];for(let P=0;P<y;P++){const G=Math.floor(Math.random()*d.length);o.push(i(G))}}const p={count:10,thickness:.5,regenerate:()=>u(p.count)};u(p.count);const m=new E({container:document.getElementById("gui-container")});m.add(p,"count",[1,10,1e3,1e4,1e5,1e6]).name("Object Count").onChange(()=>u(p.count)),m.add(p,"thickness",.5,5).name("Line Thickness"),m.add(p,"regenerate").name("Regenerate");const x=f.width/f.height,M=A.perspective(2*Math.PI/5,x,.1,500);let v=0;function g(){v+=.01,n.queue.writeBuffer(e,0,new Float32Array([p.thickness,.5]));const y=80,P=Math.sin(v*.5)*y,G=Math.cos(v*.5)*y,C=A.lookAt([P,30,G],[0,0,0],[0,1,0]),O=A.multiply(M,C);for(const b of o){const U=A.identity();A.translate(U,b.position,U),A.rotateX(U,b.rotation[0]+v,U),A.rotateY(U,b.rotation[1]+v*.7,U),A.rotateZ(U,b.rotation[2]+v*.3,U),A.scale(U,[b.scale,b.scale,b.scale],U);const z=A.multiply(O,U);n.queue.writeBuffer(b.uniformBuffer,0,z),n.queue.writeBuffer(b.uniformBuffer,64,U),n.queue.writeBuffer(b.uniformBuffer,128,new Float32Array(b.color))}const B=n.createCommandEncoder(),F=l.getCurrentTexture().createView(),w=B.beginRenderPass({colorAttachments:[{view:F,clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:t.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});w.setPipeline(s);for(const b of o)w.setBindGroup(0,b.bindGroup),w.draw(c[b.geometryIndex].indexCount);w.end(),n.queue.submit([B.finish()]),requestAnimationFrame(g)}requestAnimationFrame(g)}X().catch(console.error);
