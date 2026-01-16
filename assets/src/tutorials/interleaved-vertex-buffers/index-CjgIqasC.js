import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{r as p}from"../../../canvas-util-6cCf-wah.js";import{i as v}from"../../../webgpu-util-BApOR-AX.js";async function m(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:s,canvasFormat:u}=await v(t),o=new Float32Array([0,.5,1,0,0,-.5,-.5,0,1,0,.5,-.5,0,0,1]),a=e.createBuffer({label:"Interleaved Vertex Buffer",size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(a,0,o);const n=e.createShaderModule({label:"Interleaved Buffer Shader",code:`
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
    `}),f={arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x3"}]},l=e.createRenderPipeline({label:"Interleaved Buffer Pipeline",layout:"auto",vertex:{module:n,entryPoint:"vs_main",buffers:[f]},fragment:{module:n,entryPoint:"fs_main",targets:[{format:u}]},primitive:{topology:"triangle-list"}});function i(){p(t);const c=e.createCommandEncoder(),d={colorAttachments:[{view:s.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},r=c.beginRenderPass(d);r.setPipeline(l),r.setVertexBuffer(0,a),r.draw(3),r.end(),e.queue.submit([c.finish()])}i(),window.addEventListener("resize",i)}m().catch(t=>{console.error(t)});
