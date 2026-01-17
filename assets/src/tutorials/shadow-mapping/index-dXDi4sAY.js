import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as J}from"../../../canvas-util-BFZcuyXb.js";import{i as K}from"../../../webgpu-util-BApOR-AX.js";import{m as i,v as D}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";const Q=`struct Uniforms {
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

  // For non-uniform scaling, we'd need the inverse-transpose of the model matrix.
  out.normal = (uniforms.modelMatrix * vec4f(normal, 0.0)).xyz;
  let posFromLight = lightUniforms.lightViewProjectionMatrix * worldPos;
  let ndc = posFromLight.xyz / posFromLight.w;
  out.shadowPos = vec3f(
    ndc.xy * vec2f(0.5, -0.5) + vec2f(0.5, 0.5),
    ndc.z
  );

  return out;
}
`,ee=`@group(0) @binding(2) var shadowMap : texture_depth_2d;
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

  let ambient = lightUniforms.ambientColor.rgb * 0.3;
  let L = normalize(-lightUniforms.dirLightDirection.xyz);
  let diff = max(dot(N, L), 0.0);
  let diffuse = diff * lightUniforms.dirLightColor.rgb;

  let shadow = computeShadow(in.shadowPos, N, L);
  let lighting = ambient + diffuse * shadow;
  let finalColor = uniforms.color.rgb * lighting;

  return vec4f(finalColor, uniforms.color.a);
}
`,te=`struct Uniforms {
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
`,ne=`${Q}
${ee}`,re=te;function ie(){const t=[-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,.5,.5,.5,.5,.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,.5,-.5,.5,-.5,-.5,.5,.5,-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,-.5],e=[0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0],o=[0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23];return{positions:new Float32Array(t),normals:new Float32Array(e),indices:new Uint16Array(o)}}function oe(t=10,e=10){const o=t/2,u=e/2,m=[-o,0,-u,o,0,-u,o,0,u,-o,0,u],g=[0,1,0,0,1,0,0,1,0,0,1,0],c=[0,2,1,0,3,2];return{positions:new Float32Array(m),normals:new Float32Array(g),indices:new Uint16Array(c)}}async function ae(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:o,canvasFormat:u}=await K(t),m=e.createShaderModule({code:ne}),g=e.createShaderModule({code:re}),c=e.createBuffer({size:112,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),l=new Float32Array(28);l.set([1,1,1,1],0),l.set([1,1,1,1],8),e.queue.writeBuffer(c,0,l);const p=256,R=p*2,a=e.createBuffer({size:R,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),S=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform",hasDynamicOffset:!0,minBindingSize:144}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"comparison"}}]}),G=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform",hasDynamicOffset:!0,minBindingSize:144}},{binding:1,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),F=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[G]}),vertex:{module:g,entryPoint:"vs_shadow",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth32float",depthBias:1,depthBiasSlopeScale:2,depthBiasClamp:0}}),N=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[S]}),vertex:{module:m,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:12,attributes:[{shaderLocation:1,offset:0,format:"float32x3"}]}]},fragment:{module:m,entryPoint:"fs_main",targets:[{format:u}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),s=ie(),f=oe(20,20),x=e.createBuffer({size:f.positions.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(x,0,f.positions);const M=e.createBuffer({size:f.normals.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(M,0,f.normals);const v=e.createBuffer({size:f.indices.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(v,0,f.indices);const w=e.createBuffer({size:s.positions.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(w,0,s.positions);const T=e.createBuffer({size:s.normals.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(T,0,s.normals);const b=e.createBuffer({size:s.indices.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(b,0,s.indices);let B=e.createTexture({size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const E=2048,L=e.createTexture({size:[E,E],format:"depth32float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}).createView(),O=e.createSampler({compare:"less",magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}),C=e.createBindGroup({layout:G,entries:[{binding:0,resource:{buffer:a,size:144}},{binding:1,resource:{buffer:c}}]}),V=e.createBindGroup({layout:S,entries:[{binding:0,resource:{buffer:a,size:144}},{binding:1,resource:{buffer:c}},{binding:2,resource:L},{binding:3,resource:O}]}),_=i.lookAt([5,5,5],[0,0,0],[0,1,0]),I=i.identity(),d=i.identity();i.translate(d,[0,1,0],d),i.scale(d,[2,2,2],d);const q=[.6,.6,.6,1],j=[1,.2,.2,1];let P=0;function z(){J(t)&&(B.destroy(),B=e.createTexture({size:[t.width,t.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}));const X=t.width/t.height,Y=i.perspective(2*Math.PI/5,X,.1,100),A=i.multiply(Y,_);P+=.01;const h=D.normalize([Math.cos(P),-1,Math.sin(P)]),W=D.scale(h,-10),H=i.lookAt(W,[0,0,0],[0,1,0]),k=i.ortho(-12,12,-12,12,.1,30),$=i.multiply(k,H);l.set([h[0],h[1],h[2],0],4),l.set($,12),e.queue.writeBuffer(c,0,l),e.queue.writeBuffer(a,0,A),e.queue.writeBuffer(a,64,I),e.queue.writeBuffer(a,128,new Float32Array(q));const y=p;e.queue.writeBuffer(a,y,A),e.queue.writeBuffer(a,y+64,d),e.queue.writeBuffer(a,y+128,new Float32Array(j));const U=e.createCommandEncoder(),Z=o.getCurrentTexture().createView(),r=U.beginRenderPass({colorAttachments:[],depthStencilAttachment:{view:L,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});r.setPipeline(F),r.setBindGroup(0,C,[0]),r.setVertexBuffer(0,x),r.setIndexBuffer(v,"uint16"),r.drawIndexed(f.indices.length),r.setBindGroup(0,C,[p]),r.setVertexBuffer(0,w),r.setIndexBuffer(b,"uint16"),r.drawIndexed(s.indices.length),r.end();const n=U.beginRenderPass({colorAttachments:[{view:Z,clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:B.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});n.setPipeline(N),n.setBindGroup(0,V,[0]),n.setVertexBuffer(0,x),n.setVertexBuffer(1,M),n.setIndexBuffer(v,"uint16"),n.drawIndexed(f.indices.length),n.setBindGroup(0,V,[p]),n.setVertexBuffer(0,w),n.setVertexBuffer(1,T),n.setIndexBuffer(b,"uint16"),n.drawIndexed(s.indices.length),n.end(),e.queue.submit([U.finish()]),requestAnimationFrame(z)}requestAnimationFrame(z)}ae().catch(console.error);
