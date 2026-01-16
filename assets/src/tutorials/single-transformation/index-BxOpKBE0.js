import"../../../modulepreload-polyfill-B5Qt9EMX.js";/* empty css                      */import{i as g}from"../../../webgpu-util-BApOR-AX.js";import{m as b}from"../../../wgpu-matrix.module-Cf1N7Xmi.js";async function v(){const r=document.querySelector("#webgpu-canvas"),{device:e,context:u,canvasFormat:c}=await g(r),o=new Float32Array([0,.5,.5,-.5,-.5,.5,.5,-.5,.5]),n=e.createBuffer({label:"Vertex Buffer",size:o.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(n,0,o);const l=b.translation([.5,0,0]),a=e.createBuffer({label:"Uniform Matrix Buffer",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(a,0,l);const i=e.createShaderModule({label:"Transformation Shader",code:`
      struct Uniforms {
        modelMatrix : mat4x4f,
      };

      @group(0) @binding(0) var<uniform> global : Uniforms;

      @vertex
      fn vs_main(@location(0) pos : vec3f) -> @builtin(position) vec4f {
        // Multiply the position by the matrix
        // Note: W component is 1.0 for points
        return global.modelMatrix * vec4f(pos, 1.0);
      }

      @fragment
      fn fs_main() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0); // Red
      }
    `}),s=e.createRenderPipeline({label:"Transformation Pipeline",layout:"auto",vertex:{module:i,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:i,entryPoint:"fs_main",targets:[{format:c}]},primitive:{topology:"triangle-list"}}),m=e.createBindGroup({layout:s.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:a}}]});function d(){const f=e.createCommandEncoder(),p={colorAttachments:[{view:u.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},t=f.beginRenderPass(p);t.setPipeline(s),t.setVertexBuffer(0,n),t.setBindGroup(0,m),t.draw(3),t.end(),e.queue.submit([f.finish()])}d()}v().catch(r=>{console.error(r)});
