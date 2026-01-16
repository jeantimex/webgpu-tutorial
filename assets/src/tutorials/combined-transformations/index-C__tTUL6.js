import"../../../modulepreload-polyfill-B5Qt9EMX.js";import{r as v}from"../../../canvas-util-Dbsun61p.js";import{i as B}from"../../../webgpu-util-BApOR-AX.js";import{m as a}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";async function x(){const n=document.querySelector("#webgpu-canvas"),{device:e,context:m,canvasFormat:d}=await B(n),i=new Float32Array([0,.5,.5,-.5,-.5,.5,.5,-.5,.5]),s=e.createBuffer({label:"Vertex Buffer",size:i.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(s,0,i);const f=e.createBuffer({label:"Uniform Matrix Buffer",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),r=a.create();function p(){a.identity(r),a.translate(r,[.2,0,0],r);const o=Math.PI/2;a.rotateZ(r,o,r),a.scale(r,[.5,.5,1],r),e.queue.writeBuffer(f,0,r)}p();const c=e.createShaderModule({label:"Transformation Shader",code:`
      struct Uniforms {
        modelMatrix : mat4x4f,
      };

      @group(0) @binding(0) var<uniform> global : Uniforms;

      @vertex
      fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
        return global.modelMatrix * vec4f(pos, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0); // Red
      }
    `}),u=e.createRenderPipeline({label:"Combined Transformation Pipeline",layout:"auto",vertex:{module:c,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:c,entryPoint:"fs_main",targets:[{format:d}]},primitive:{topology:"triangle-list"}}),g=e.createBindGroup({layout:u.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:f}}]});function l(){v(n);const o=e.createCommandEncoder(),b={colorAttachments:[{view:m.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},t=o.beginRenderPass(b);t.setPipeline(u),t.setVertexBuffer(0,s),t.setBindGroup(0,g),t.draw(3),t.end(),e.queue.submit([o.finish()])}l(),window.addEventListener("resize",l)}x().catch(n=>{console.error(n)});
