import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as B}from"../../../canvas-util-Dbsun61p.js";import{i as g}from"../../../webgpu-util-BApOR-AX.js";async function b(){const o=document.querySelector("#webgpu-canvas"),{device:e,context:f,canvasFormat:l}=await g(o),r=new Float32Array([0,.5,-.5,-.5,.5,-.5]),a=new Float32Array([1,0,0,0,1,0,0,0,1]),n=e.createBuffer({label:"Position Buffer",size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(n,0,r);const i=e.createBuffer({label:"Color Buffer",size:a.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(i,0,a);const s=e.createShaderModule({label:"Multiple Buffers Shader",code:`
      struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) color : vec3f,
      };

      @vertex
      fn vs_main(
        @location(0) pos : vec2f,
        @location(1) color : vec3f
      ) -> VertexOutput {
        var output : VertexOutput;
        output.position = vec4f(pos, 0.0, 1.0);
        output.color = color;
        return output;
      }

      @fragment
      fn fs_main(@location(0) color : vec3f) -> @location(0) vec4f {
        return vec4f(color, 1.0);
      }
    `}),p={arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]},d={arrayStride:12,attributes:[{shaderLocation:1,offset:0,format:"float32x3"}]},m=e.createRenderPipeline({label:"Multiple Buffers Pipeline",layout:"auto",vertex:{module:s,entryPoint:"vs_main",buffers:[p,d]},fragment:{module:s,entryPoint:"fs_main",targets:[{format:l}]},primitive:{topology:"triangle-list"}});function c(){B(o);const u=e.createCommandEncoder(),v={colorAttachments:[{view:f.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},t=u.beginRenderPass(v);t.setPipeline(m),t.setVertexBuffer(0,n),t.setVertexBuffer(1,i),t.draw(3),t.end(),e.queue.submit([u.finish()])}c(),window.addEventListener("resize",c)}b().catch(o=>{console.error(o)});
