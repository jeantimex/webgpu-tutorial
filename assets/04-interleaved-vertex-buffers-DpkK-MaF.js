import{i as p}from"./webgpu-util-GTOb4j6a.js";async function v(){const r=document.querySelector("#webgpu-canvas"),{device:e,context:i,canvasFormat:s}=await p(r),o=new Float32Array([0,.5,1,0,0,-.5,-.5,0,1,0,.5,-.5,0,0,1]),n=e.createBuffer({label:"Interleaved Vertex Buffer",size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(n,0,o);const a=e.createShaderModule({label:"Interleaved Buffer Shader",code:`
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
    `}),u={arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x3"}]},f=e.createRenderPipeline({label:"Interleaved Buffer Pipeline",layout:"auto",vertex:{module:a,entryPoint:"vs_main",buffers:[u]},fragment:{module:a,entryPoint:"fs_main",targets:[{format:s}]},primitive:{topology:"triangle-list"}});function l(){const c=e.createCommandEncoder(),d={colorAttachments:[{view:i.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},t=c.beginRenderPass(d);t.setPipeline(f),t.setVertexBuffer(0,n),t.draw(3),t.end(),e.queue.submit([c.finish()])}l()}v().catch(r=>{console.error(r)});
