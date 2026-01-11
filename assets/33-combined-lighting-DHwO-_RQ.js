import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as S}from"./webgpu-util-BApOR-AX.js";import{m as o}from"./wgpu-matrix.module-BcnFMekQ.js";const g=`
struct Uniforms {
  mvpMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  cameraPos : vec3f, // Needed for specular
  time : f32,        // Used to animate point light
}

struct DirectionalLight {
  dir : vec3f,
  color : vec3f,
}

struct PointLight {
  pos : vec3f,
  color : vec3f,
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
  
  // Base Material Color (Red)
  let materialColor = vec3f(1.0, 0.0, 0.0);
  
  // --- 1. Ambient Light ---
  let ambientStrength = 0.1;
  let ambientColor = vec3f(1.0, 1.0, 1.0);
  let ambient = ambientColor * ambientStrength;

  // --- 2. Directional Light (Sun) ---
  let sunDir = normalize(vec3f(1.0, 1.0, 1.0));
  let sunColor = vec3f(1.0, 1.0, 0.9); // Warm light
  
  // Diffuse
  let diffDir = max(dot(N, sunDir), 0.0);
  let diffuseDir = diffDir * sunColor;
  
  // Specular (Blinn-Phong)
  let H_dir = normalize(sunDir + V);
  let specDir = pow(max(dot(N, H_dir), 0.0), 32.0); // Shininess = 32
  let specularDir = specDir * sunColor;

  // --- 3. Point Light (Orbiting Bulb) ---
  let lightRadius = 2.5;
  let pointPos = vec3f(
    sin(uniforms.time) * lightRadius, 
    1.0, 
    cos(uniforms.time) * lightRadius
  );
  let pointColor = vec3f(0.0, 0.8, 1.0); // Cyan light
  
  let L_point = normalize(pointPos - in.worldPos);
  
  // Diffuse
  let diffPoint = max(dot(N, L_point), 0.0);
  let diffusePoint = diffPoint * pointColor;
  
  // Specular
  let H_point = normalize(L_point + V);
  let specPoint = pow(max(dot(N, H_point), 0.0), 32.0);
  let specularPoint = specPoint * pointColor;

  // --- Combine Everything ---
  // Ambient + (Diffuse * Material) + Specular
  // Note: Specular is additive (white reflection), usually not tinted by material
  
  let finalColor = 
    (ambient + diffuseDir + diffusePoint) * materialColor + 
    (specularDir + specularPoint);

  return vec4f(finalColor, 1.0);
}
`;async function U(){const r=document.querySelector("#webgpu-canvas"),{device:e,context:h,canvasFormat:v}=await S(r),a=new Float32Array([-.5,-.5,.5,-.577,-.577,.577,.5,-.5,.5,.577,-.577,.577,.5,.5,.5,.577,.577,.577,-.5,.5,.5,-.577,.577,.577,-.5,-.5,-.5,-.577,-.577,-.577,.5,-.5,-.5,.577,-.577,-.577,.5,.5,-.5,.577,.577,-.577,-.5,.5,-.5,-.577,.577,-.577]),n=new Uint16Array([0,1,2,2,3,0,1,5,6,6,2,1,5,4,7,7,6,5,4,0,3,3,7,4,3,2,6,6,7,3,4,5,1,1,0,4]),s=e.createBuffer({size:a.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(s,0,a);const u=e.createBuffer({size:n.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(u,0,n);const i=e.createBuffer({size:144,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),x=r.width/r.height,P=o.perspective(2*Math.PI/5,x,.1,100),b=e.createTexture({size:[r.width,r.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),l=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:g}),entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:e.createShaderModule({code:g}),entryPoint:"fs_main",targets:[{format:v}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),B=e.createBindGroup({layout:l.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i}}]});let f=0;const c=[3,3,3];function m(w){f+=.01;const d=o.rotationY(f),C=o.lookAt(c,[0,0,0],[0,1,0]),D=o.multiply(P,o.multiply(C,d));e.queue.writeBuffer(i,0,D),e.queue.writeBuffer(i,64,d),e.queue.writeBuffer(i,128,new Float32Array([...c,w/1e3]));const p=e.createCommandEncoder(),y=h.getCurrentTexture().createView(),t=p.beginRenderPass({colorAttachments:[{view:y,clearValue:{r:.05,g:.05,b:.05,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:b.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});t.setPipeline(l),t.setBindGroup(0,B),t.setVertexBuffer(0,s),t.setIndexBuffer(u,"uint16"),t.drawIndexed(n.length),t.end(),e.queue.submit([p.finish()]),requestAnimationFrame(m)}requestAnimationFrame(m)}U().catch(console.error);
