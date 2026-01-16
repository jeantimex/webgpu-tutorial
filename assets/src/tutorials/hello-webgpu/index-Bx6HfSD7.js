import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as m}from"../../../canvas-util-Dbsun61p.js";import{i as u}from"../../../webgpu-util-BApOR-AX.js";const v=`@vertex
fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4f {
  var pos = array<vec2f, 3>(
    vec2f(0.0, 0.5),
    vec2f(-0.5, -0.5),
    vec2f(0.5, -0.5)
  );
  return vec4f(pos[VertexIndex], 0.0, 1.0);
}
`,f=`@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0);
}
`;async function p(){const n=document.querySelector("#webgpu-canvas"),{device:e,context:o,canvasFormat:i}=await u(n),c=e.createShaderModule({label:"Red Triangle Vertex Shader",code:v}),s=e.createShaderModule({label:"Red Triangle Fragment Shader",code:f}),d=e.createRenderPipeline({label:"Red Triangle Pipeline",layout:"auto",vertex:{module:c,entryPoint:"vs_main"},fragment:{module:s,entryPoint:"fs_main",targets:[{format:i}]},primitive:{topology:"triangle-list"}});function r(){m(n);const a=e.createCommandEncoder(),l={colorAttachments:[{view:o.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},t=a.beginRenderPass(l);t.setPipeline(d),t.draw(3),t.end(),e.queue.submit([a.finish()])}r(),window.addEventListener("resize",r)}p().catch(n=>{console.error(n)});
