import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{i as B}from"../../../webgpu-util-BApOR-AX.js";async function b(){const n=document.querySelector("#webgpu-canvas"),{device:e,context:m,canvasFormat:d}=await B(n),c=new Float32Array([0,.1,.5,-.1,-.1,.5,.1,-.1,.5]),i=e.createBuffer({label:"Geometry Buffer",size:c.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(i,0,c);const s=10,f=6,t=new Float32Array(s*f);for(let r=0;r<s;r++){const o=r*f;t[o+0]=Math.random()*1.6-.8,t[o+1]=Math.random()*1.6-.8,t[o+2]=Math.random(),t[o+3]=Math.random(),t[o+4]=Math.random(),t[o+5]=1}const u=e.createBuffer({label:"Instance Buffer",size:t.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(u,0,t);const l=e.createShaderModule({label:"Simplified Instancing Shader",code:`
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
    `}),p=e.createRenderPipeline({label:"Simplified Instancing Pipeline",layout:"auto",vertex:{module:l,entryPoint:"vs_main",buffers:[{arrayStride:12,stepMode:"vertex",attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:24,stepMode:"instance",attributes:[{shaderLocation:1,offset:0,format:"float32x2"},{shaderLocation:2,offset:8,format:"float32x4"}]}]},fragment:{module:l,entryPoint:"fs_main",targets:[{format:d}]},primitive:{topology:"triangle-list"}});function v(){const r=e.createCommandEncoder(),g={colorAttachments:[{view:m.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},a=r.beginRenderPass(g);a.setPipeline(p),a.setVertexBuffer(0,i),a.setVertexBuffer(1,u),a.draw(3,s),a.end(),e.queue.submit([r.finish()])}v()}b().catch(n=>{console.error(n)});
