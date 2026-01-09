import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as d}from"./webgpu-util-BApOR-AX.js";async function m(){const r=document.querySelector("#webgpu-canvas"),{device:e,context:u,canvasFormat:c}=await d(r),o=new Float32Array([0,.5,1,0,0,-.5,-.5,0,1,0,.5,-.5,0,0,1]),n=e.createBuffer({label:"Interleaved Vertex Buffer",size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(n,0,o);const a=e.createShaderModule({label:"Shader Structs",code:`
      // Define the structure of the input data coming from the Vertex Buffer
      struct VertexInput {
        @location(0) position : vec2f,
        @location(1) color : vec3f,
      };

      // Define the structure of the output data going to the Fragment Shader
      struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) color : vec3f,
      };

      @vertex
      fn vs_main(input : VertexInput) -> VertexOutput {
        var output : VertexOutput;
        // We can access input fields using dot notation
        output.position = vec4f(input.position, 0.0, 1.0);
        output.color = input.color;
        return output;
      }

      @fragment
      fn fs_main(input : VertexOutput) -> @location(0) vec4f {
        // We receive the interpolated VertexOutput here
        return vec4f(input.color, 1.0);
      }
    `}),s={arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x3"}]},f=e.createRenderPipeline({label:"Shader Structs Pipeline",layout:"auto",vertex:{module:a,entryPoint:"vs_main",buffers:[s]},fragment:{module:a,entryPoint:"fs_main",targets:[{format:c}]},primitive:{topology:"triangle-list"}});function l(){const i=e.createCommandEncoder(),p={colorAttachments:[{view:u.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},t=i.beginRenderPass(p);t.setPipeline(f),t.setVertexBuffer(0,n),t.draw(3),t.end(),e.queue.submit([i.finish()])}l()}m().catch(r=>{console.error(r)});
