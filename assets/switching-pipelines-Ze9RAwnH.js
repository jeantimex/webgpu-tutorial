import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as m}from"./webgpu-util-BApOR-AX.js";async function g(){const o=document.querySelector("#webgpu-canvas"),{device:e,context:c,canvasFormat:n}=await m(o),a=new Float32Array([-.5,.5,0,-.9,-.5,0,-.1,-.5,0,.5,.5,0,.1,-.5,0,.9,-.5,0]),i=e.createBuffer({label:"Vertex Buffer",size:a.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(i,0,a);const r=e.createShaderModule({label:"Multi-Material Shader",code:`
      struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) localPos : vec3f,
      };

      @vertex
      fn vs_main(@location(0) pos : vec3f) -> VertexOutput {
        var output : VertexOutput;
        output.position = vec4f(pos, 1.0);
        output.localPos = pos; // Pass local position to fragment for gradient
        return output;
      }

      // --- Fragment Shader 1: Solid Color ---
      @fragment
      fn fs_solid() -> @location(0) vec4f {
        return vec4f(1.0, 0.5, 0.0, 1.0); // Solid Orange
      }

      // --- Fragment Shader 2: Gradient ---
      @fragment
      fn fs_gradient(in : VertexOutput) -> @location(0) vec4f {
        // Calculate color based on Y position
        // Map Y from [-0.5, 0.5] to [0.0, 1.0]
        let t = in.localPos.y + 0.5;
        return vec4f(0.0, t, 1.0 - t, 1.0); // Blue to Green gradient
      }
    `}),s={arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},u=e.createRenderPipeline({label:"Solid Pipeline",layout:"auto",vertex:{module:r,entryPoint:"vs_main",buffers:[s]},fragment:{module:r,entryPoint:"fs_solid",targets:[{format:n}]},primitive:{topology:"triangle-list"}}),f=e.createRenderPipeline({label:"Gradient Pipeline",layout:"auto",vertex:{module:r,entryPoint:"vs_main",buffers:[s]},fragment:{module:r,entryPoint:"fs_gradient",targets:[{format:n}]},primitive:{topology:"triangle-list"}});function d(){const l=e.createCommandEncoder(),p={colorAttachments:[{view:c.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},t=l.beginRenderPass(p);t.setVertexBuffer(0,i),t.setPipeline(u),t.draw(3,1,0,0),t.setPipeline(f),t.draw(3,1,3,0),t.end(),e.queue.submit([l.finish()])}d()}g().catch(o=>{console.error(o)});
