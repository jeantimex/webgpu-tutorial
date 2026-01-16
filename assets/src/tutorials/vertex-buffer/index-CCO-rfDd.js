import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{i as m}from"../../../webgpu-util-BApOR-AX.js";async function p(){const r=document.querySelector("#webgpu-canvas"),{device:e,context:s,canvasFormat:c}=await m(r),n=new Float32Array([0,.5,-.5,-.5,.5,-.5]),o=e.createBuffer({label:"Triangle Vertex Buffer",size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(o,0,n);const a=e.createShaderModule({label:"Vertex Buffer Shader",code:`
      @vertex
      fn vs_main(@location(0) position : vec2f) -> @builtin(position) vec4f {
        return vec4f(position, 0.0, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0);
      }
    `}),f={arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]},u=e.createRenderPipeline({label:"Vertex Buffer Pipeline",layout:"auto",vertex:{module:a,entryPoint:"vs_main",buffers:[f]},fragment:{module:a,entryPoint:"fs_main",targets:[{format:c}]},primitive:{topology:"triangle-list"}});function l(){const i=e.createCommandEncoder(),d={colorAttachments:[{view:s.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},t=i.beginRenderPass(d);t.setPipeline(u),t.setVertexBuffer(0,o),t.draw(3),t.end(),e.queue.submit([i.finish()])}l()}p().catch(r=>{console.error(r)});
