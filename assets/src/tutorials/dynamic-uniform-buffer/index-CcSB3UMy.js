import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as G}from"../../../canvas-util-BFZcuyXb.js";import{i as w}from"../../../webgpu-util-BApOR-AX.js";const L=`@vertex
fn vs_main(
  @builtin(instance_index) instanceIdx : u32,
  @location(0) pos : vec3f
) -> @builtin(position) vec4f {
  // Shift x-position based on instance index so we can see them separate
  let xOffset = (f32(instanceIdx) - 2.0) * 0.5;
  return vec4f(pos.x + xOffset, pos.y, pos.z, 1.0);
}
`,D=`struct Uniforms {
  color : vec4f,
};

// Group 0, Binding 0, with dynamic offset
@group(0) @binding(0) var<uniform> global : Uniforms;

@fragment
fn fs_main() -> @location(0) vec4f {
  return global.color;
}
`;async function O(){const o=document.querySelector("#webgpu-canvas"),{device:e,context:P,canvasFormat:c}=await w(o),u=new Float32Array([0,.5,0,-.5,-.5,0,.5,-.5,0]),m=e.createBuffer({label:"Vertex Buffer",size:u.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(m,0,u);const l=e.limits.minUniformBufferOffsetAlignment,a=5,d=16,s=Math.ceil(d/l)*l,p=a*s,g=e.createBuffer({label:"Dynamic Uniform Buffer",size:p,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),i=new Float32Array(p/4);for(let r=0;r<a;r++){const h=Math.random(),f=Math.random(),n=Math.random(),t=r*s/4;i[t+0]=h,i[t+1]=f,i[t+2]=n,i[t+3]=1}e.queue.writeBuffer(g,0,i);const y=e.createShaderModule({label:"Dynamic Uniform Vertex Shader",code:L}),b=e.createShaderModule({label:"Dynamic Uniform Fragment Shader",code:D});e.createRenderPipeline({label:"Dynamic Uniform Pipeline",layout:"auto",vertex:{module:y,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:b,entryPoint:"fs_main",targets:[{format:c}]},primitive:{topology:"triangle-list"}});const v=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT|GPUShaderStage.VERTEX,buffer:{type:"uniform",hasDynamicOffset:!0}}]}),S=e.createRenderPipeline({label:"Dynamic Pipeline",layout:e.createPipelineLayout({bindGroupLayouts:[v]}),vertex:{module:y,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:b,entryPoint:"fs_main",targets:[{format:c}]},primitive:{topology:"triangle-list"}}),U=e.createBindGroup({layout:v,entries:[{binding:0,resource:{buffer:g,offset:0,size:d}}]});function x(){G(o);const r=e.createCommandEncoder(),f={colorAttachments:[{view:P.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},n=r.beginRenderPass(f);n.setPipeline(S),n.setVertexBuffer(0,m);for(let t=0;t<a;t++){const B=t*s;n.setBindGroup(0,U,[B]),n.draw(3,1,0,t)}n.end(),e.queue.submit([r.finish()])}x(),window.addEventListener("resize",x)}O().catch(o=>{console.error(o)});
