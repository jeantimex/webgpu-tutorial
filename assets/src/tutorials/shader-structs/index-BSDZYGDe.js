import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as m}from"../../../canvas-util-BFZcuyXb.js";import{i as v}from"../../../webgpu-util-BApOR-AX.js";const h=`// Define the structure of the input data coming from the Vertex Buffer
struct VertexInput {
  @location(0) position : vec2f,
  @location(1) color : vec3f,
};

// Define the structure of the output data going to the Fragment Shader
struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec3f,
};

@vertex
fn vs_main(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  // We can access input fields using dot notation
  output.position = vec4f(input.position, 0.0, 1.0);
  output.color = input.color;
  return output;
}
`,g=`// Define the structure of the output data going to the Fragment Shader
struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec3f,
};

// We receive the interpolated VertexOutput here
@fragment
fn fs_main(input : VertexOutput) -> @location(0) vec4f {
  return vec4f(input.color, 1.0);
}
`;async function x(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:u,canvasFormat:c}=await v(t),r=new Float32Array([0,.5,1,0,0,-.5,-.5,0,1,0,.5,-.5,0,0,1]),o=e.createBuffer({label:"Interleaved Vertex Buffer",size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(o,0,r);const s=e.createShaderModule({label:"Shader Structs Vertex Shader",code:h}),f=e.createShaderModule({label:"Shader Structs Fragment Shader",code:g}),l={arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x3"}]},p=e.createRenderPipeline({label:"Shader Structs Pipeline",layout:"auto",vertex:{module:s,entryPoint:"vs_main",buffers:[l]},fragment:{module:f,entryPoint:"fs_main",targets:[{format:c}]},primitive:{topology:"triangle-list"}});function a(){m(t);const i=e.createCommandEncoder(),d={colorAttachments:[{view:u.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},n=i.beginRenderPass(d);n.setPipeline(p),n.setVertexBuffer(0,o),n.draw(3),n.end(),e.queue.submit([i.finish()])}a(),window.addEventListener("resize",a)}x().catch(t=>{console.error(t)});
