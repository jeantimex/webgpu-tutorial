import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as m}from"../../../canvas-util-BGxJIWTK.js";import{i as v}from"../../../webgpu-util-BApOR-AX.js";async function p(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:c,canvasFormat:f}=await v(t),n=new Float32Array([0,.5,-.5,-.5,.5,-.5]),o=e.createBuffer({label:"Triangle Vertex Buffer",size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(o,0,n);const a=e.createShaderModule({label:"Vertex Buffer Shader",code:`
      @vertex
      fn vs_main(@location(0) position : vec2f) -> @builtin(position) vec4f {
        return vec4f(position, 0.0, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0);
      }
    `}),u={arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]},l=e.createRenderPipeline({label:"Vertex Buffer Pipeline",layout:"auto",vertex:{module:a,entryPoint:"vs_main",buffers:[u]},fragment:{module:a,entryPoint:"fs_main",targets:[{format:f}]},primitive:{topology:"triangle-list"}});function i(){m(t);const s=e.createCommandEncoder(),d={colorAttachments:[{view:c.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},r=s.beginRenderPass(d);r.setPipeline(l),r.setVertexBuffer(0,o),r.draw(3),r.end(),e.queue.submit([s.finish()])}i(),window.addEventListener("resize",i)}p().catch(t=>{console.error(t)});
