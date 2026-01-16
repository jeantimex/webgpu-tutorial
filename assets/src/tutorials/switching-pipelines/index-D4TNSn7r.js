import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as m}from"../../../canvas-util-BGxJIWTK.js";import{i as g}from"../../../webgpu-util-BApOR-AX.js";async function v(){const r=document.querySelector("#webgpu-canvas"),{device:e,context:u,canvasFormat:n}=await g(r),a=new Float32Array([-.5,.5,0,-.9,-.5,0,-.1,-.5,0,.5,.5,0,.1,-.5,0,.9,-.5,0]),i=e.createBuffer({label:"Vertex Buffer",size:a.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(i,0,a);const o=e.createShaderModule({label:"Multi-Material Shader",code:`
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
    `}),s={arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},f=e.createRenderPipeline({label:"Solid Pipeline",layout:"auto",vertex:{module:o,entryPoint:"vs_main",buffers:[s]},fragment:{module:o,entryPoint:"fs_solid",targets:[{format:n}]},primitive:{topology:"triangle-list"}}),d=e.createRenderPipeline({label:"Gradient Pipeline",layout:"auto",vertex:{module:o,entryPoint:"vs_main",buffers:[s]},fragment:{module:o,entryPoint:"fs_gradient",targets:[{format:n}]},primitive:{topology:"triangle-list"}});function l(){m(r);const c=e.createCommandEncoder(),p={colorAttachments:[{view:u.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},t=c.beginRenderPass(p);t.setVertexBuffer(0,i),t.setPipeline(f),t.draw(3,1,0,0),t.setPipeline(d),t.draw(3,1,3,0),t.end(),e.queue.submit([c.finish()])}l(),window.addEventListener("resize",l)}v().catch(r=>{console.error(r)});
