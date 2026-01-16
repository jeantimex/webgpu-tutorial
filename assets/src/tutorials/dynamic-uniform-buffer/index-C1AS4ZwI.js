import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{r as S}from"../../../canvas-util-6cCf-wah.js";import{i as w}from"../../../webgpu-util-BApOR-AX.js";async function G(){const o=document.querySelector("#webgpu-canvas"),{device:e,context:h,canvasFormat:u}=await w(o),m=new Float32Array([0,.5,0,-.5,-.5,0,.5,-.5,0]),l=e.createBuffer({label:"Vertex Buffer",size:m.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(l,0,m);const d=e.limits.minUniformBufferOffsetAlignment,s=5,p=16,f=Math.ceil(p/d)*d,y=s*f,g=e.createBuffer({label:"Dynamic Uniform Buffer",size:y,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),i=new Float32Array(y/4);for(let r=0;r<s;r++){const P=Math.random(),c=Math.random(),n=Math.random(),t=r*f/4;i[t+0]=P,i[t+1]=c,i[t+2]=n,i[t+3]=1}e.queue.writeBuffer(g,0,i);const a=e.createShaderModule({label:"Dynamic Uniform Shader",code:`
      struct Uniforms {
        color : vec4f,
      };

      // Group 0, Binding 0, with dynamic offset
      @group(0) @binding(0) var<uniform> global : Uniforms;

      @vertex
      fn vs_main(
        @builtin(instance_index) instanceIdx : u32,
        @location(0) pos : vec3f
      ) -> @builtin(position) vec4f {
        // Shift x-position based on instance index so we can see them separate
        let xOffset = (f32(instanceIdx) - 2.0) * 0.5;
        return vec4f(pos.x + xOffset, pos.y, pos.z, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return global.color;
      }
    `});e.createRenderPipeline({label:"Dynamic Uniform Pipeline",layout:"auto",vertex:{module:a,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:a,entryPoint:"fs_main",targets:[{format:u}]},primitive:{topology:"triangle-list"}});const b=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT|GPUShaderStage.VERTEX,buffer:{type:"uniform",hasDynamicOffset:!0}}]}),x=e.createRenderPipeline({label:"Dynamic Pipeline",layout:e.createPipelineLayout({bindGroupLayouts:[b]}),vertex:{module:a,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:a,entryPoint:"fs_main",targets:[{format:u}]},primitive:{topology:"triangle-list"}}),B=e.createBindGroup({layout:b,entries:[{binding:0,resource:{buffer:g,offset:0,size:p}}]});function v(){S(o);const r=e.createCommandEncoder(),c={colorAttachments:[{view:h.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},n=r.beginRenderPass(c);n.setPipeline(x),n.setVertexBuffer(0,l);for(let t=0;t<s;t++){const U=t*f;n.setBindGroup(0,B,[U]),n.draw(3,1,0,t)}n.end(),e.queue.submit([r.finish()])}v(),window.addEventListener("resize",v)}G().catch(o=>{console.error(o)});
