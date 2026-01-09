import"./common-BNB2xREb.js";import{i as d}from"./webgpu-util-BApOR-AX.js";async function u(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:o,canvasFormat:i}=await d(t),r=e.createShaderModule({label:"Red Triangle Shader",code:`
      @vertex
      fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4f {
        var pos = array<vec2f, 3>(
          vec2f(0.0, 0.5),
          vec2f(-0.5, -0.5),
          vec2f(0.5, -0.5)
        );
        return vec4f(pos[VertexIndex], 0.0, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0);
      }
    `}),c=e.createRenderPipeline({label:"Red Triangle Pipeline",layout:"auto",vertex:{module:r,entryPoint:"vs_main"},fragment:{module:r,entryPoint:"fs_main",targets:[{format:i}]},primitive:{topology:"triangle-list"}});function s(){const a=e.createCommandEncoder(),l={colorAttachments:[{view:o.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},n=a.beginRenderPass(l);n.setPipeline(c),n.draw(3),n.end(),e.queue.submit([a.finish()])}s()}u().catch(t=>{console.error(t)});
