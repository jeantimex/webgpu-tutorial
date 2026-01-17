import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as B}from"../../../canvas-util-BFZcuyXb.js";import{i as b}from"../../../webgpu-util-BApOR-AX.js";const h=`struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
};

@vertex
fn vs_main(
  @location(0) pos : vec3f,         // From Geometry Buffer
  @location(1) offset : vec2f,      // From Instance Buffer
  @location(2) color : vec4f        // From Instance Buffer
) -> VertexOutput {
  var output : VertexOutput;
  output.position = vec4f(pos.xy + offset, pos.z, 1.0);
  output.color = color;
  return output;
}
`,y=`@fragment
fn fs_main(@location(0) color : vec4f) -> @location(0) vec4f {
  return color;
}
`;async function P(){const a=document.querySelector("#webgpu-canvas"),{device:e,context:d,canvasFormat:m}=await b(a),c=new Float32Array([0,.1,.5,-.1,-.1,.5,.1,-.1,.5]),f=e.createBuffer({label:"Geometry Buffer",size:c.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(f,0,c);const s=10,i=6,t=new Float32Array(s*i);for(let n=0;n<s;n++){const r=n*i;t[r+0]=Math.random()*1.6-.8,t[r+1]=Math.random()*1.6-.8,t[r+2]=Math.random(),t[r+3]=Math.random(),t[r+4]=Math.random(),t[r+5]=1}const u=e.createBuffer({label:"Instance Buffer",size:t.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(u,0,t);const p=e.createShaderModule({label:"Instanced Vertex Buffer Vertex Shader",code:h}),v=e.createShaderModule({label:"Instanced Vertex Buffer Fragment Shader",code:y}),g=e.createRenderPipeline({label:"Simplified Instancing Pipeline",layout:"auto",vertex:{module:p,entryPoint:"vs_main",buffers:[{arrayStride:12,stepMode:"vertex",attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:24,stepMode:"instance",attributes:[{shaderLocation:1,offset:0,format:"float32x2"},{shaderLocation:2,offset:8,format:"float32x4"}]}]},fragment:{module:v,entryPoint:"fs_main",targets:[{format:m}]},primitive:{topology:"triangle-list"}});function l(){B(a);const n=e.createCommandEncoder(),x={colorAttachments:[{view:d.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},o=n.beginRenderPass(x);o.setPipeline(g),o.setVertexBuffer(0,f),o.setVertexBuffer(1,u),o.draw(3,s),o.end(),e.queue.submit([n.finish()])}l(),window.addEventListener("resize",l)}P().catch(a=>{console.error(a)});
