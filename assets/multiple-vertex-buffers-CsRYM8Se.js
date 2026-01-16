import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as B}from"./webgpu-util-BApOR-AX.js";async function g(){const o=document.querySelector("#webgpu-canvas"),{device:e,context:u,canvasFormat:f}=await B(o),r=new Float32Array([0,.5,-.5,-.5,.5,-.5]),a=new Float32Array([1,0,0,0,1,0,0,0,1]),n=e.createBuffer({label:"Position Buffer",size:r.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(n,0,r);const i=e.createBuffer({label:"Color Buffer",size:a.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(i,0,a);const s=e.createShaderModule({label:"Multiple Buffers Shader",code:`
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
    `}),l={arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]},p={arrayStride:12,attributes:[{shaderLocation:1,offset:0,format:"float32x3"}]},d=e.createRenderPipeline({label:"Multiple Buffers Pipeline",layout:"auto",vertex:{module:s,entryPoint:"vs_main",buffers:[l,p]},fragment:{module:s,entryPoint:"fs_main",targets:[{format:f}]},primitive:{topology:"triangle-list"}});function m(){const c=e.createCommandEncoder(),v={colorAttachments:[{view:u.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},t=c.beginRenderPass(v);t.setPipeline(d),t.setVertexBuffer(0,n),t.setVertexBuffer(1,i),t.draw(3),t.end(),e.queue.submit([c.finish()])}m()}g().catch(o=>{console.error(o)});
