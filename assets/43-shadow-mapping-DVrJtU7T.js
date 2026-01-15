import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as K}from"./webgpu-util-BApOR-AX.js";import{m as i,v as z}from"./wgpu-matrix.module-Cf1N7Xmi.js";const Q=`
struct Uniforms {
  viewProjectionMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  color : vec4f,
}

struct LightUniforms {
  ambientColor : vec4f,
  dirLightDirection : vec4f,
  dirLightColor : vec4f,
  lightViewProjectionMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var<uniform> lightUniforms : LightUniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) normal : vec3f,
  @location(1) shadowPos : vec3f,
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) normal : vec3f
) -> VertexOutput {
  var out : VertexOutput;
  let worldPos = uniforms.modelMatrix * vec4f(pos, 1.0);
  out.position = uniforms.viewProjectionMatrix * worldPos;
  
  // Transform normal to world space (using 3x3 part of model matrix for uniform scaling)
  // For non-uniform scaling, we'd need the inverse-transpose of the model matrix.
  // Since we are only doing uniform scaling here, using the model matrix is roughly okay 
  // if we normalize, but correct way is to use a normal matrix. 
  // For this tutorial's simplicity with uniform scaling, we'll use the model matrix.
  out.normal = (uniforms.modelMatrix * vec4f(normal, 0.0)).xyz;
  let posFromLight = lightUniforms.lightViewProjectionMatrix * worldPos;
  let ndc = posFromLight.xyz / posFromLight.w;
  out.shadowPos = vec3f(
    ndc.xy * vec2f(0.5, -0.5) + vec2f(0.5, 0.5),
    ndc.z
  );
  
  return out;
}

@group(0) @binding(2) var shadowMap : texture_depth_2d;
@group(0) @binding(3) var shadowSampler : sampler_comparison;

const shadowMapSize : f32 = 2048.0;

fn computeShadow(shadowPos : vec3f, normal : vec3f, lightDir : vec3f) -> f32 {
  let uv = shadowPos.xy;
  let depth = shadowPos.z;
  let inBounds = select(0.0, 1.0,
    uv.x >= 0.0 && uv.x <= 1.0 &&
    uv.y >= 0.0 && uv.y <= 1.0 &&
    depth >= 0.0 && depth <= 1.0
  );
  let uvClamped = clamp(uv, vec2f(0.0, 0.0), vec2f(1.0, 1.0));
  let depthClamped = clamp(depth, 0.0, 1.0);
  let bias = max(0.004 * (1.0 - dot(normal, lightDir)), 0.001);
  let texelSize = 1.0 / shadowMapSize;

  var visibility = 0.0;
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let offset = vec2f(vec2(x, y)) * texelSize;
      visibility += textureSampleCompare(
        shadowMap,
        shadowSampler,
        uvClamped + offset,
        depthClamped - bias
      );
    }
  }
  visibility = visibility / 9.0;
  return mix(1.0, visibility, inBounds);
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let N = normalize(in.normal);
  
  // Ambient
  let ambient = lightUniforms.ambientColor.rgb * 0.3; // 0.3 strength
  
  // Directional
  let L = normalize(-lightUniforms.dirLightDirection.xyz);
  let diff = max(dot(N, L), 0.0);
  let diffuse = diff * lightUniforms.dirLightColor.rgb;

  let shadow = computeShadow(in.shadowPos, N, L);
  
  // Combine
  let lighting = ambient + diffuse * shadow;
  let finalColor = uniforms.color.rgb * lighting;
  
  return vec4f(finalColor, uniforms.color.a);
}
`,$=`
struct Uniforms {
  viewProjectionMatrix : mat4x4f,
  modelMatrix : mat4x4f,
  color : vec4f,
}

struct LightUniforms {
  ambientColor : vec4f,
  dirLightDirection : vec4f,
  dirLightColor : vec4f,
  lightViewProjectionMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var<uniform> lightUniforms : LightUniforms;

@vertex
fn vs_shadow(@location(0) pos : vec3f) -> @builtin(position) vec4f {
  return lightUniforms.lightViewProjectionMatrix * uniforms.modelMatrix * vec4f(pos, 1.0);
}
`;function ee(){const o=[-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,.5,.5,.5,.5,.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,.5,-.5,.5,-.5,-.5,.5,.5,-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,-.5],e=[0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0],n=[0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23];return{positions:new Float32Array(o),normals:new Float32Array(e),indices:new Uint16Array(n)}}function te(o=10,e=10){const n=o/2,u=e/2,m=[-n,0,-u,n,0,-u,n,0,u,-n,0,u],g=[0,1,0,0,1,0,0,1,0,0,1,0],l=[0,2,1,0,3,2];return{positions:new Float32Array(m),normals:new Float32Array(g),indices:new Uint16Array(l)}}async function re(){const o=document.querySelector("#webgpu-canvas"),{device:e,context:n,canvasFormat:u}=await K(o),m=e.createShaderModule({code:Q}),g=e.createShaderModule({code:$}),l=e.createBuffer({size:112,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),c=new Float32Array(28);c.set([1,1,1,1],0),c.set([1,1,1,1],8),e.queue.writeBuffer(l,0,c);const h=256,D=h*2,a=e.createBuffer({size:D,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),U=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform",hasDynamicOffset:!0,minBindingSize:144}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"comparison"}}]}),S=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform",hasDynamicOffset:!0,minBindingSize:144}},{binding:1,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),F=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[S]}),vertex:{module:g,entryPoint:"vs_shadow",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth32float",depthBias:1,depthBiasSlopeScale:2,depthBiasClamp:0}}),O=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[U]}),vertex:{module:m,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:12,attributes:[{shaderLocation:1,offset:0,format:"float32x3"}]}]},fragment:{module:m,entryPoint:"fs_main",targets:[{format:u}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),s=ee(),f=te(20,20),x=e.createBuffer({size:f.positions.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(x,0,f.positions);const G=e.createBuffer({size:f.normals.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(G,0,f.normals);const w=e.createBuffer({size:f.indices.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(w,0,f.indices);const v=e.createBuffer({size:s.positions.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(v,0,s.positions);const M=e.createBuffer({size:s.normals.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(M,0,s.normals);const b=e.createBuffer({size:s.indices.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(b,0,s.indices);const R=e.createTexture({size:[o.width,o.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),T=2048,E=e.createTexture({size:[T,T],format:"depth32float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}).createView(),_=e.createSampler({compare:"less",magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}),L=e.createBindGroup({layout:S,entries:[{binding:0,resource:{buffer:a,size:144}},{binding:1,resource:{buffer:l}}]}),C=e.createBindGroup({layout:U,entries:[{binding:0,resource:{buffer:a,size:144}},{binding:1,resource:{buffer:l}},{binding:2,resource:E},{binding:3,resource:_}]}),N=o.width/o.height,I=i.perspective(2*Math.PI/5,N,.1,100),q=i.lookAt([5,5,5],[0,0,0],[0,1,0]),V=i.multiply(I,q),j=i.identity(),d=i.identity();i.translate(d,[0,1,0],d),i.scale(d,[2,2,2],d);const X=[.6,.6,.6,1],Y=[1,.2,.2,1];let y=0;function A(){y+=.01;const p=z.normalize([Math.cos(y),-1,Math.sin(y)]),k=z.scale(p,-10),W=i.lookAt(k,[0,0,0],[0,1,0]),H=i.ortho(-12,12,-12,12,.1,30),Z=i.multiply(H,W);c.set([p[0],p[1],p[2],0],4),c.set(Z,12),e.queue.writeBuffer(l,0,c),e.queue.writeBuffer(a,0,V),e.queue.writeBuffer(a,64,j),e.queue.writeBuffer(a,128,new Float32Array(X));const B=h;e.queue.writeBuffer(a,B,V),e.queue.writeBuffer(a,B+64,d),e.queue.writeBuffer(a,B+128,new Float32Array(Y));const P=e.createCommandEncoder(),J=n.getCurrentTexture().createView(),r=P.beginRenderPass({colorAttachments:[],depthStencilAttachment:{view:E,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});r.setPipeline(F),r.setBindGroup(0,L,[0]),r.setVertexBuffer(0,x),r.setIndexBuffer(w,"uint16"),r.drawIndexed(f.indices.length),r.setBindGroup(0,L,[h]),r.setVertexBuffer(0,v),r.setIndexBuffer(b,"uint16"),r.drawIndexed(s.indices.length),r.end();const t=P.beginRenderPass({colorAttachments:[{view:J,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:R.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});t.setPipeline(O),t.setBindGroup(0,C,[0]),t.setVertexBuffer(0,x),t.setVertexBuffer(1,G),t.setIndexBuffer(w,"uint16"),t.drawIndexed(f.indices.length),t.setBindGroup(0,C,[h]),t.setVertexBuffer(0,v),t.setVertexBuffer(1,M),t.setIndexBuffer(b,"uint16"),t.drawIndexed(s.indices.length),t.end(),e.queue.submit([P.finish()]),requestAnimationFrame(A)}requestAnimationFrame(A)}re().catch(console.error);
