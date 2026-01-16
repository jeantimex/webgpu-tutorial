import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as x}from"../../../canvas-util-BGxJIWTK.js";import{i as v}from"../../../webgpu-util-BApOR-AX.js";async function g(){const r=document.querySelector("#webgpu-canvas"),{device:e,context:f,canvasFormat:l}=await v(r),o=new Float32Array([-.5,.5,1,0,0,-.5,-.5,0,1,0,.5,-.5,0,0,1,.5,.5,1,1,0]),n=new Uint16Array([0,1,2,0,2,3]),i=e.createBuffer({label:"Vertex Buffer",size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(i,0,o);const a=e.createBuffer({label:"Index Buffer",size:n.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(a,0,n);const u=e.createShaderModule({label:"Index Buffer Shader",code:`
      struct VertexInput {
        @location(0) position : vec2f,
        @location(1) color : vec3f,
      };

      struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) color : vec3f,
      };

      @vertex
      fn vs_main(input : VertexInput) -> VertexOutput {
        var output : VertexOutput;
        output.position = vec4f(input.position, 0.0, 1.0);
        output.color = input.color;
        return output;
      }

      @fragment
      fn fs_main(input : VertexOutput) -> @location(0) vec4f {
        return vec4f(input.color, 1.0);
      }
    `}),d={arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x3"}]},p=e.createRenderPipeline({label:"Index Buffer Pipeline",layout:"auto",vertex:{module:u,entryPoint:"vs_main",buffers:[d]},fragment:{module:u,entryPoint:"fs_main",targets:[{format:l}]},primitive:{topology:"triangle-list",cullMode:"back"}});function s(){x(r);const c=e.createCommandEncoder(),m={colorAttachments:[{view:f.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},t=c.beginRenderPass(m);t.setPipeline(p),t.setVertexBuffer(0,i),t.setIndexBuffer(a,"uint16"),t.drawIndexed(6),t.end(),e.queue.submit([c.finish()])}s(),window.addEventListener("resize",s)}g().catch(r=>{console.error(r)});
