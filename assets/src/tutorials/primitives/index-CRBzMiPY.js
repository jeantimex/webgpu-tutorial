import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as v}from"../../../canvas-util-BGxJIWTK.js";import{i as f}from"../../../webgpu-util-BApOR-AX.js";import{G as g}from"../../../lil-gui.esm-CNIGZg2U.js";async function x(){const t=document.querySelector("#webgpu-canvas"),{device:n,context:d,canvasFormat:m}=await f(t),s=n.createShaderModule({label:"Primitives Shader",code:`
      @vertex
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

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(0.0, 1.0, 0.0, 1.0); // Green
      }
    `}),u=["point-list","line-list","line-strip","triangle-list","triangle-strip"],i={topology:"triangle-list"},c=e=>{const o={topology:e};return(e==="line-strip"||e==="triangle-strip")&&(o.stripIndexFormat="uint32"),n.createRenderPipeline({label:`${e} Pipeline`,layout:"auto",vertex:{module:s,entryPoint:"vs_main"},fragment:{module:s,entryPoint:"fs_main",targets:[{format:m}]},primitive:o})};let l=c(i.topology);new g({title:"Primitives",container:document.getElementById("gui-container")}).add(i,"topology",u).name("Topology").onChange(()=>{l=c(i.topology),r()});function r(){v(t);const e=n.createCommandEncoder(),p={colorAttachments:[{view:d.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},a=e.beginRenderPass(p);a.setPipeline(l),a.draw(6),a.end(),n.queue.submit([e.finish()])}r(),window.addEventListener("resize",r)}x().catch(t=>{console.error(t)});
