import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as b}from"./webgpu-util-BApOR-AX.js";async function P(){const t=document.querySelector("#webgpu-canvas"),{device:n,context:u,canvasFormat:m}=await b(t),a=n.createShaderModule({label:"Primitives Shader",code:`
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
    `}),p=["point-list","line-list","line-strip","triangle-list","triangle-strip"].map(e=>{const i={topology:e};return(e==="line-strip"||e==="triangle-strip")&&(i.stripIndexFormat="uint32"),n.createRenderPipeline({label:`${e} Pipeline`,layout:"auto",vertex:{module:a,entryPoint:"vs_main"},fragment:{module:a,entryPoint:"fs_main",targets:[{format:m}]},primitive:i})});function v(){const e=n.createCommandEncoder(),h={colorAttachments:[{view:u.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},r=e.beginRenderPass(h),o=3,s=t.width/o,c=t.height/2;p.forEach((x,l)=>{const g=l%o,w=Math.floor(l/o),f=g*s,d=w*c;r.setViewport(f,d,s,c,0,1),r.setScissorRect(Math.floor(f),Math.floor(d),Math.floor(s),Math.floor(c)),r.setPipeline(x),r.draw(6)}),r.end(),n.queue.submit([e.finish()])}v()}P().catch(t=>{console.error(t)});
