import{i as B}from"./webgpu-util-GTOb4j6a.js";import{m as r}from"./wgpu-matrix.module-B3j5r4YA.js";async function x(){const a=document.querySelector("#webgpu-canvas"),{device:t,context:d,canvasFormat:m}=await B(a),i=new Float32Array([0,.5,.5,-.5,-.5,.5,.5,-.5,.5]),s=t.createBuffer({label:"Vertex Buffer",size:i.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(s,0,i);const c=t.createBuffer({label:"Uniform Matrix Buffer",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),e=r.create();function p(){r.identity(e);const o=a.width/a.height;r.scale(e,[1/o,1,1],e),r.translate(e,[.2,0,0],e);const l=Math.PI/2;r.rotateZ(e,l,e),r.scale(e,[.5,.5,1],e),t.queue.writeBuffer(c,0,e)}p();const f=t.createShaderModule({label:"Transformation Shader",code:`
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
    `}),u=t.createRenderPipeline({label:"Aspect Ratio Pipeline",layout:"auto",vertex:{module:f,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:f,entryPoint:"fs_main",targets:[{format:m}]},primitive:{topology:"triangle-list"}}),g=t.createBindGroup({layout:u.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]});function b(){const o=t.createCommandEncoder(),v={colorAttachments:[{view:d.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},n=o.beginRenderPass(v);n.setPipeline(u),n.setVertexBuffer(0,s),n.setBindGroup(0,g),n.draw(3),n.end(),t.queue.submit([o.finish()])}b()}x().catch(a=>{console.error(a)});
