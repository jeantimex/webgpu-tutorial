import{i as v}from"./webgpu-util-GTOb4j6a.js";import{m as n}from"./wgpu-matrix.module-B3j5r4YA.js";async function B(){const o=document.querySelector("#webgpu-canvas"),{device:e,context:l,canvasFormat:m}=await v(o),i=new Float32Array([0,.5,.5,-.5,-.5,.5,.5,-.5,.5]),s=e.createBuffer({label:"Vertex Buffer",size:i.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(s,0,i);const f=e.createBuffer({label:"Uniform Matrix Buffer",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),t=n.create();function d(){n.identity(t),n.translate(t,[.2,0,0],t);const a=Math.PI/2;n.rotateZ(t,a,t),n.scale(t,[.5,.5,1],t),e.queue.writeBuffer(f,0,t)}d();const c=e.createShaderModule({label:"Transformation Shader",code:`
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
    `}),u=e.createRenderPipeline({label:"Combined Transformation Pipeline",layout:"auto",vertex:{module:c,entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:c,entryPoint:"fs_main",targets:[{format:m}]},primitive:{topology:"triangle-list"}}),g=e.createBindGroup({layout:u.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:f}}]});function p(){const a=e.createCommandEncoder(),b={colorAttachments:[{view:l.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},r=a.beginRenderPass(b);r.setPipeline(u),r.setVertexBuffer(0,s),r.setBindGroup(0,g),r.draw(3),r.end(),e.queue.submit([a.finish()])}p()}B().catch(o=>{console.error(o)});
