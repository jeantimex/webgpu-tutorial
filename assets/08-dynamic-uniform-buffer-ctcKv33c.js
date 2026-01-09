import"./common-BNB2xREb.js";import{i as G}from"./webgpu-util-BApOR-AX.js";async function S(){const a=document.querySelector("#webgpu-canvas"),{device:e,context:P,canvasFormat:u}=await G(a),l=new Float32Array([0,.5,0,-.5,-.5,0,.5,-.5,0]),m=e.createBuffer({label:"Vertex Buffer",size:l.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(m,0,l);const d=e.limits.minUniformBufferOffsetAlignment,s=5,p=16,f=Math.ceil(p/d)*d,g=s*f,y=e.createBuffer({label:"Dynamic Uniform Buffer",size:g,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),i=new Float32Array(g/4);for(let r=0;r<s;r++){const v=Math.random(),c=Math.random(),n=Math.random(),t=r*f/4;i[t+0]=v,i[t+1]=c,i[t+2]=n,i[t+3]=1}e.queue.writeBuffer(y,0,i);const o=e.createShaderModule({label:"Dynamic Uniform Shader",code:`
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
    `});e.createRenderPipeline({label:"Dynamic Uniform Pipeline",layout:"auto",vertex:{module:o,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:o,entryPoint:"fs_main",targets:[{format:u}]},primitive:{topology:"triangle-list"}});const b=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT|GPUShaderStage.VERTEX,buffer:{type:"uniform",hasDynamicOffset:!0}}]}),h=e.createRenderPipeline({label:"Dynamic Pipeline",layout:e.createPipelineLayout({bindGroupLayouts:[b]}),vertex:{module:o,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:o,entryPoint:"fs_main",targets:[{format:u}]},primitive:{topology:"triangle-list"}}),x=e.createBindGroup({layout:b,entries:[{binding:0,resource:{buffer:y,offset:0,size:p}}]});function B(){const r=e.createCommandEncoder(),c={colorAttachments:[{view:P.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},n=r.beginRenderPass(c);n.setPipeline(h),n.setVertexBuffer(0,m);for(let t=0;t<s;t++){const U=t*f;n.setBindGroup(0,x,[U]),n.draw(3,1,0,t)}n.end(),e.queue.submit([r.finish()])}B()}S().catch(a=>{console.error(a)});
