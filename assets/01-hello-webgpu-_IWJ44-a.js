(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))o(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const a of t.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&o(a)}).observe(document,{childList:!0,subtree:!0});function i(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function o(e){if(e.ep)return;e.ep=!0;const t=i(e);fetch(e.href,t)}})();async function d(n){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const r=await navigator.gpu.requestAdapter();if(!r)throw new Error("No appropriate GPUAdapter found.");const i=await r.requestDevice(),o=n.getContext("webgpu");if(!o)throw new Error("WebGPU context not found.");const e=navigator.gpu.getPreferredCanvasFormat();return o.configure({device:i,format:e}),{device:i,context:o,canvasFormat:e,adapter:r}}async function l(){const n=document.querySelector("#webgpu-canvas"),{device:r,context:i,canvasFormat:o}=await d(n),e=r.createShaderModule({label:"Red Triangle Shader",code:`
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
    `}),t=r.createRenderPipeline({label:"Red Triangle Pipeline",layout:"auto",vertex:{module:e,entryPoint:"vs_main"},fragment:{module:e,entryPoint:"fs_main",targets:[{format:o}]},primitive:{topology:"triangle-list"}});function a(){const s=r.createCommandEncoder(),u={colorAttachments:[{view:i.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},c=s.beginRenderPass(u);c.setPipeline(t),c.draw(3),c.end(),r.queue.submit([s.finish()])}a()}l().catch(n=>{console.error(n)});
