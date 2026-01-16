import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as y}from"../../../canvas-util-BGxJIWTK.js";import{i as B}from"../../../webgpu-util-BApOR-AX.js";async function b(){const n=document.querySelector("#webgpu-canvas"),{device:e,context:d,canvasFormat:p}=await B(n),i=new Float32Array([0,.1,.5,-.1,-.1,.5,.1,-.1,.5]),c=e.createBuffer({label:"Geometry Buffer",size:i.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(c,0,i);const s=10,f=6,t=new Float32Array(s*f);for(let o=0;o<s;o++){const r=o*f;t[r+0]=Math.random()*1.6-.8,t[r+1]=Math.random()*1.6-.8,t[r+2]=Math.random(),t[r+3]=Math.random(),t[r+4]=Math.random(),t[r+5]=1}const u=e.createBuffer({label:"Instance Buffer",size:t.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(u,0,t);const l=e.createShaderModule({label:"Simplified Instancing Shader",code:`
      struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) color : vec4f,
      };

      @vertex
      fn vs_main(
        @location(0) pos : vec3f,         // From Geometry Buffer
        @location(1) offset : vec2f,      // From Instance Buffer
        @location(2) color : vec4f        // From Instance Buffer
      ) -> VertexOutput {
        var output : VertexOutput;
        output.position = vec4f(pos.xy + offset, pos.z, 1.0);
        output.color = color;
        return output;
      }

      @fragment
      fn fs_main(@location(0) color : vec4f) -> @location(0) vec4f {
        return color;
      }
    `}),v=e.createRenderPipeline({label:"Simplified Instancing Pipeline",layout:"auto",vertex:{module:l,entryPoint:"vs_main",buffers:[{arrayStride:12,stepMode:"vertex",attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:24,stepMode:"instance",attributes:[{shaderLocation:1,offset:0,format:"float32x2"},{shaderLocation:2,offset:8,format:"float32x4"}]}]},fragment:{module:l,entryPoint:"fs_main",targets:[{format:p}]},primitive:{topology:"triangle-list"}});function m(){y(n);const o=e.createCommandEncoder(),g={colorAttachments:[{view:d.getCurrentTexture().createView(),clearValue:{r:.3,g:.3,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},a=o.beginRenderPass(g);a.setPipeline(v),a.setVertexBuffer(0,c),a.setVertexBuffer(1,u),a.draw(3,s),a.end(),e.queue.submit([o.finish()])}m(),window.addEventListener("resize",m)}b().catch(n=>{console.error(n)});
