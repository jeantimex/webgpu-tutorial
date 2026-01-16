import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{i as v}from"../../../webgpu-util-BApOR-AX.js";import{G as f}from"../../../lil-gui.esm-CNIGZg2U.js";async function g(){const n=document.querySelector("#webgpu-canvas"),{device:t,context:d,canvasFormat:m}=await v(n),a=t.createShaderModule({label:"Primitives Shader",code:`
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
    `}),p=["point-list","line-list","line-strip","triangle-list","triangle-strip"],i={topology:"triangle-list"},s=e=>{const r={topology:e};return(e==="line-strip"||e==="triangle-strip")&&(r.stripIndexFormat="uint32"),t.createRenderPipeline({label:`${e} Pipeline`,layout:"auto",vertex:{module:a,entryPoint:"vs_main"},fragment:{module:a,entryPoint:"fs_main",targets:[{format:m}]},primitive:r})};let c=s(i.topology);new f({title:"Primitives"}).add(i,"topology",p).name("Topology").onChange(()=>{c=s(i.topology),l()});function l(){const e=t.createCommandEncoder(),u={colorAttachments:[{view:d.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},o=e.beginRenderPass(u);o.setPipeline(c),o.draw(6),o.end(),t.queue.submit([e.finish()])}l()}g().catch(n=>{console.error(n)});
