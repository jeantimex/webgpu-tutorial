import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as g}from"./webgpu-util-BApOR-AX.js";async function b(){const t=document.querySelector("#webgpu-canvas"),{device:e,context:c,canvasFormat:l}=await g(t),o=new Float32Array([0,.5,-.5,-.5,.5,-.5]),n=e.createBuffer({label:"Vertex Buffer",size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(n,0,o);const i=new Float32Array([0,.5,.5,1]),a=e.createBuffer({label:"Uniform Color Buffer",size:i.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(a,0,i);const f=e.createShaderModule({label:"Uniform Shader",code:`
      // Define the structure of our uniform
      struct Uniforms {
        color : vec4f,
      };

      // Declare the uniform variable
      // Group 0, Binding 0
      @group(0) @binding(0) var<uniform> global : Uniforms;

      @vertex
      fn vs_main(@location(0) pos : vec2f) -> @builtin(position) vec4f {
        return vec4f(pos, 0.0, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        // Return the color from the uniform buffer
        return global.color;
      }
    `}),u=e.createRenderPipeline({label:"Uniform Pipeline",layout:"auto",vertex:{module:f,entryPoint:"vs_main",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},fragment:{module:f,entryPoint:"fs_main",targets:[{format:l}]},primitive:{topology:"triangle-list"}}),m=e.createBindGroup({label:"Uniform Bind Group",layout:u.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:a}}]});function d(){const s=e.createCommandEncoder(),p={colorAttachments:[{view:c.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},r=s.beginRenderPass(p);r.setPipeline(u),r.setVertexBuffer(0,n),r.setBindGroup(0,m),r.draw(3),r.end(),e.queue.submit([s.finish()])}d()}b().catch(t=>{console.error(t)});
