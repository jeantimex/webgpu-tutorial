import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as V}from"./webgpu-util-BApOR-AX.js";import{m as c}from"./wgpu-matrix.module-BcnFMekQ.js";function F(n){const s=[],x=[],t=[],e=[],f=[],P=n.split(`
`),l=new Map;let p=0;for(const B of P){const o=B.trim().split(/\s+/);if(o.length===0)continue;const r=o[0];if(r==="v")e.push(parseFloat(o[1]),parseFloat(o[2]),parseFloat(o[3]));else if(r==="vn")f.push(parseFloat(o[1]),parseFloat(o[2]),parseFloat(o[3]));else if(r==="f"){const m=o.slice(1);for(let d=1;d<m.length-1;d++){const b=m[0],w=m[d],U=m[d+1];[b,w,U].forEach(a=>{if(l.has(a))t.push(l.get(a));else{const[y,h,g]=a.split("/"),v=parseInt(y)-1,i=g?parseInt(g)-1:-1;s.push(e[v*3],e[v*3+1],e[v*3+2]),i>=0?x.push(f[i*3],f[i*3+1],f[i*3+2]):x.push(0,1,0),l.set(a,p),t.push(p),p++}})}}}return{positions:new Float32Array(s),normals:new Float32Array(x),indices:new Uint16Array(t)}}const C=`
struct Uniforms {
  mvpMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  cameraPos : vec3f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) normal : vec3f,
  @location(1) worldPos : vec3f,
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) normal : vec3f,
) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  out.normal = (uniforms.modelMatrix * vec4f(normal, 0.0)).xyz;
  out.worldPos = (uniforms.modelMatrix * vec4f(pos, 1.0)).xyz;
  return out;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let N = normalize(in.normal);
  let V = normalize(uniforms.cameraPos - in.worldPos);
  
  // Hardcoded Lights for simplicity
  let sunDir = normalize(vec3f(0.5, 1.0, 0.5));
  let sunColor = vec3f(1.0, 0.9, 0.8);
  
  // Ambient
  let ambient = vec3f(0.1, 0.1, 0.1);
  
  // Diffuse
  let diff = max(dot(N, sunDir), 0.0);
  let diffuse = diff * sunColor;
  
  // Specular (Phong)
  let R = reflect(-sunDir, N);
  let spec = pow(max(dot(V, R), 0.0), 32.0);
  let specular = spec * sunColor;
  
  // Teal Material
  let materialColor = vec3f(0.0, 0.6, 0.6);
  
  let finalColor = (ambient + diffuse) * materialColor + specular;
  return vec4f(finalColor, 1.0);
}
`;async function O(){const n=document.querySelector("#webgpu-canvas"),s=document.getElementById("loading"),x="https://raw.githubusercontent.com/alecjacobson/common-3d-test-models/master/data/teapot.obj";let t;try{const g=await(await fetch(x)).text();t=F(g),s&&(s.style.display="none")}catch(h){console.error("Failed to load OBJ",h),s&&(s.innerText="Failed to load model.");return}const{device:e,context:f,canvasFormat:P}=await V(n),l=e.createBuffer({size:t.positions.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(l,0,t.positions);const p=e.createBuffer({size:t.normals.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(p,0,t.normals);const B=e.createBuffer({size:t.indices.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(B,0,t.indices);const r=e.createBuffer({size:144,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),m=n.width/n.height,d=c.perspective(2*Math.PI/5,m,.1,100),b=e.createTexture({size:[n.width,n.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),w=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:C}),entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:12,attributes:[{shaderLocation:1,offset:0,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:C}),entryPoint:"fs_main",targets:[{format:P}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),U=e.createBindGroup({layout:w.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r}}]});let a=0;function y(){a+=.01;const h=c.multiply(c.rotationY(a),c.scaling([.2,.2,.2])),g=c.lookAt([2,2,2],[0,0,0],[0,1,0]),v=c.multiply(d,c.multiply(g,h));e.queue.writeBuffer(r,0,v),e.queue.writeBuffer(r,64,h),e.queue.writeBuffer(r,128,new Float32Array([2,2,2]));const i=e.createCommandEncoder(),M=f.getCurrentTexture().createView(),u=i.beginRenderPass({colorAttachments:[{view:M,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:b.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});u.setPipeline(w),u.setBindGroup(0,U),u.setVertexBuffer(0,l),u.setVertexBuffer(1,p),u.setIndexBuffer(B,"uint16"),u.drawIndexed(t.indices.length),u.end(),e.queue.submit([i.finish()]),requestAnimationFrame(y)}requestAnimationFrame(y)}O().catch(console.error);
