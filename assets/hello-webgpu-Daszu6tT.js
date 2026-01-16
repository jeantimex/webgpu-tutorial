import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as u}from"./webgpu-util-BApOR-AX.js";const m=`@vertex
fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4f {
  var pos = array<vec2f, 3>(
    vec2f(0.0, 0.5),
    vec2f(-0.5, -0.5),
    vec2f(0.5, -0.5)
  );
  return vec4f(pos[VertexIndex], 0.0, 1.0);
}
`,v=`@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0);
}
`;async function f(){const n=document.querySelector("#webgpu-canvas"),{device:e,context:a,canvasFormat:o}=await u(n),i=e.createShaderModule({label:"Red Triangle Vertex Shader",code:m}),c=e.createShaderModule({label:"Red Triangle Fragment Shader",code:v}),s=e.createRenderPipeline({label:"Red Triangle Pipeline",layout:"auto",vertex:{module:i,entryPoint:"vs_main"},fragment:{module:c,entryPoint:"fs_main",targets:[{format:o}]},primitive:{topology:"triangle-list"}});function l(){const r=e.createCommandEncoder(),d={colorAttachments:[{view:a.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},t=r.beginRenderPass(d);t.setPipeline(s),t.draw(3),t.end(),e.queue.submit([r.finish()])}l()}f().catch(n=>{console.error(n)});
