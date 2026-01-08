import{i as m}from"./webgpu-util-GTOb4j6a.js";async function v(){const r=document.querySelector("#webgpu-canvas"),{device:e,context:s,canvasFormat:f}=await m(r),o=new Float32Array([-.5,.5,1,0,0,-.5,-.5,0,1,0,.5,-.5,0,0,1,.5,.5,1,1,0]),n=new Uint16Array([0,1,2,0,2,3]),a=e.createBuffer({label:"Vertex Buffer",size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(a,0,o);const u=e.createBuffer({label:"Index Buffer",size:n.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(u,0,n);const i=e.createShaderModule({label:"Index Buffer Shader",code:`
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
    `}),l={arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x3"}]},d=e.createRenderPipeline({label:"Index Buffer Pipeline",layout:"auto",vertex:{module:i,entryPoint:"vs_main",buffers:[l]},fragment:{module:i,entryPoint:"fs_main",targets:[{format:f}]},primitive:{topology:"triangle-list",cullMode:"back"}});function p(){const c=e.createCommandEncoder(),x={colorAttachments:[{view:s.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},t=c.beginRenderPass(x);t.setPipeline(d),t.setVertexBuffer(0,a),t.setIndexBuffer(u,"uint16"),t.drawIndexed(6),t.end(),e.queue.submit([c.finish()])}p()}v().catch(r=>{console.error(r)});
