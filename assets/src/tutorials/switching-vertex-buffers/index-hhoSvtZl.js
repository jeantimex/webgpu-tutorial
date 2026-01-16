import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as g}from"../../../canvas-util-Dbsun61p.js";import{i as p}from"../../../webgpu-util-BApOR-AX.js";async function v(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:u,canvasFormat:l}=await p(t),a=new Float32Array([-.5,.5,0,-.9,-.5,0,-.1,-.5,0]),n=e.createBuffer({label:"Triangle Buffer",size:a.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(n,0,a);const o=new Float32Array([.1,.5,0,.1,-.5,0,.9,-.5,0,.1,.5,0,.9,-.5,0,.9,.5,0]),s=e.createBuffer({label:"Square Buffer",size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(s,0,o);const i=e.createShaderModule({label:"Basic Shader",code:`
      @vertex
      fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
        return vec4f(pos, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(0.0, 1.0, 0.5, 1.0); // Teal color
      }
    `}),d=e.createRenderPipeline({label:"Basic Pipeline",layout:"auto",vertex:{module:i,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:i,entryPoint:"fs_main",targets:[{format:l}]},primitive:{topology:"triangle-list"}});function c(){g(t);const f=e.createCommandEncoder(),m={colorAttachments:[{view:u.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},r=f.beginRenderPass(m);r.setPipeline(d),r.setVertexBuffer(0,n),r.draw(3),r.setVertexBuffer(0,s),r.draw(6),r.end(),e.queue.submit([f.finish()])}c(),window.addEventListener("resize",c)}v().catch(t=>{console.error(t)});
