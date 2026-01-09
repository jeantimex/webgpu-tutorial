import"./common-BNB2xREb.js";import{i as g}from"./webgpu-util-BApOR-AX.js";async function p(){const r=document.querySelector("#webgpu-canvas"),{device:e,context:f,canvasFormat:u}=await g(r),a=new Float32Array([-.5,.5,0,-.9,-.5,0,-.1,-.5,0]),n=e.createBuffer({label:"Triangle Buffer",size:a.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(n,0,a);const o=new Float32Array([.1,.5,0,.1,-.5,0,.9,-.5,0,.1,.5,0,.9,-.5,0,.9,.5,0]),s=e.createBuffer({label:"Square Buffer",size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(s,0,o);const i=e.createShaderModule({label:"Basic Shader",code:`
      @vertex
      fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
        return vec4f(pos, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(0.0, 1.0, 0.5, 1.0); // Teal color
      }
    `}),l=e.createRenderPipeline({label:"Basic Pipeline",layout:"auto",vertex:{module:i,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:i,entryPoint:"fs_main",targets:[{format:u}]},primitive:{topology:"triangle-list"}});function d(){const c=e.createCommandEncoder(),m={colorAttachments:[{view:f.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},t=c.beginRenderPass(m);t.setPipeline(l),t.setVertexBuffer(0,n),t.draw(3),t.setVertexBuffer(0,s),t.draw(6),t.end(),e.queue.submit([c.finish()])}d()}p().catch(r=>{console.error(r)});
