import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as B}from"../../../canvas-util-BFZcuyXb.js";import{i as _}from"../../../webgpu-util-BApOR-AX.js";const P=`struct Instance {
  color : vec4f,
  offset : vec2f,
  // Implicit padding of 8 bytes here to reach 32-byte stride
};

struct Uniforms {
  instances : array<Instance, __INSTANCE_COUNT__>,
};

@group(0) @binding(0) var<uniform> global : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
};

@vertex
fn vs_main(
  @builtin(instance_index) instanceIdx : u32,
  @location(0) pos : vec3f
) -> VertexOutput {
  // Pick the instance data
  let inst = global.instances[instanceIdx];
  
  var output : VertexOutput;
  // Apply offset to position
  output.position = vec4f(pos.xy + inst.offset, pos.z, 1.0);
  output.color = inst.color;
  
  return output;
}
`,S=`@fragment
fn fs_main(@location(0) color : vec4f) -> @location(0) vec4f {
  return color;
}
`;async function I(){const s=document.querySelector("#webgpu-canvas"),{device:e,context:p,canvasFormat:m}=await _(s),c=new Float32Array([0,.1,.5,-.1,-.1,.5,.1,-.1,.5]),u=e.createBuffer({label:"Vertex Buffer",size:c.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(u,0,c);const o=10,i=8,g=o*i*4,f=e.createBuffer({label:"Instance Data Buffer",size:g,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),t=new Float32Array(o*i);for(let r=0;r<o;r++){const n=r*i;t[n+0]=Math.random(),t[n+1]=Math.random(),t[n+2]=Math.random(),t[n+3]=1,t[n+4]=Math.random()*1.6-.8,t[n+5]=Math.random()*1.6-.8,t[n+6]=0,t[n+7]=0}e.queue.writeBuffer(f,0,t);const v=P.replace(/__INSTANCE_COUNT__/g,String(o)),b=e.createShaderModule({label:"Instancing Vertex Shader",code:v}),x=e.createShaderModule({label:"Instancing Fragment Shader",code:S}),l=e.createRenderPipeline({label:"Instancing Pipeline",layout:"auto",vertex:{module:b,entryPoint:"vs_main",buffers:[{arrayStride:12,stepMode:"vertex",attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:x,entryPoint:"fs_main",targets:[{format:m}]},primitive:{topology:"triangle-list"}}),y=e.createBindGroup({layout:l.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:f}}]});function d(){B(s);const r=e.createCommandEncoder(),h={colorAttachments:[{view:p.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},a=r.beginRenderPass(h);a.setPipeline(l),a.setVertexBuffer(0,u),a.setBindGroup(0,y),a.draw(3,o),a.end(),e.queue.submit([r.finish()])}d(),window.addEventListener("resize",d)}I().catch(s=>{console.error(s)});
