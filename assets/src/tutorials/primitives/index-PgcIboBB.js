import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as f}from"../../../canvas-util-BFZcuyXb.js";import{i as g}from"../../../webgpu-util-BApOR-AX.js";import{G as x}from"../../../lil-gui.esm-CNIGZg2U.js";const P=`@vertex
fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4f {
  var pos = array<vec2f, 6>(
    vec2f( 0.0,  0.5),
    vec2f(-0.5,  0.0),
    vec2f(-0.5, -0.5),
    vec2f( 0.0, -0.5),
    vec2f( 0.5, -0.5),
    vec2f( 0.5,  0.0)
  );
  return vec4f(pos[VertexIndex], 0.0, 1.0);
}
`,b=`@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(0.0, 1.0, 0.0, 1.0);
}
`;async function w(){const n=document.querySelector("#webgpu-canvas"),{device:t,context:l,canvasFormat:d}=await g(n),m=t.createShaderModule({label:"Primitives Vertex Shader",code:P}),u=t.createShaderModule({label:"Primitives Fragment Shader",code:b}),v=["point-list","line-list","line-strip","triangle-list","triangle-strip"],r={topology:"triangle-list"},s=e=>{const o={topology:e};return(e==="line-strip"||e==="triangle-strip")&&(o.stripIndexFormat="uint32"),t.createRenderPipeline({label:`${e} Pipeline`,layout:"auto",vertex:{module:m,entryPoint:"vs_main"},fragment:{module:u,entryPoint:"fs_main",targets:[{format:d}]},primitive:o})};let c=s(r.topology);new x({title:"Primitives",container:document.getElementById("gui-container")}).add(r,"topology",v).name("Topology").onChange(()=>{c=s(r.topology),i()});function i(){f(n);const e=t.createCommandEncoder(),p={colorAttachments:[{view:l.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},a=e.beginRenderPass(p);a.setPipeline(c),a.draw(6),a.end(),t.queue.submit([e.finish()])}i(),window.addEventListener("resize",i)}w().catch(n=>{console.error(n)});
