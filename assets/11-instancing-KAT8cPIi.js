import{i as w}from"./webgpu-util-GTOb4j6a.js";import{m as f}from"./wgpu-matrix.module-B3j5r4YA.js";async function U(){const a=document.querySelector("#webgpu-canvas"),{device:e,context:v,canvasFormat:b}=await w(a),l=new Float32Array([0,.1,.5,-.1,-.1,.5,.1,-.1,.5]),d=e.createBuffer({label:"Vertex Buffer",size:l.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(d,0,l);const s=10,c=20,x=c*4,B=s*x,m=e.createBuffer({label:"Instance Data Buffer",size:B,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),h=a.width/a.height,n=new Float32Array(s*c);for(let r=0;r<s;r++){const o=f.translation([0,0,0]);f.scale(o,[1/h,1,1],o);const u=Math.random()*1.6-.8,t=Math.random()*1.6-.8;f.translate(o,[u,t,0],o);const i=r*c;n.set(o,i+0),n[i+16]=Math.random(),n[i+17]=Math.random(),n[i+18]=Math.random(),n[i+19]=1}e.queue.writeBuffer(m,0,n);const p=e.createShaderModule({label:"Instancing Shader",code:`
      struct Instance {
        matrix : mat4x4f,
        color : vec4f,
      };

      struct Uniforms {
        instances : array<Instance, ${s}>,
      };

      @group(0) @binding(0) var<uniform> global : Uniforms;

      struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) color : vec4f,
      };

      @vertex
      fn vs_main(
        @builtin(instance_index) instanceIdx : u32,
        @location(0) pos : vec3f
      ) -> VertexOutput {
        // Pick the instance data
        let inst = global.instances[instanceIdx];
        
        var output : VertexOutput;
        output.position = inst.matrix * vec4f(pos, 1.0);
        output.color = inst.color;
        
        return output;
      }

      @fragment
      fn fs_main(@location(0) color : vec4f) -> @location(0) vec4f {
        return color;
      }
    `}),g=e.createRenderPipeline({label:"Instancing Pipeline",layout:"auto",vertex:{module:p,entryPoint:"vs_main",buffers:[{arrayStride:12,stepMode:"vertex",attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:p,entryPoint:"fs_main",targets:[{format:b}]},primitive:{topology:"triangle-list"}}),y=e.createBindGroup({layout:g.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:m}}]});function P(){const r=e.createCommandEncoder(),u={colorAttachments:[{view:v.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}]},t=r.beginRenderPass(u);t.setPipeline(g),t.setVertexBuffer(0,d),t.setBindGroup(0,y),t.draw(3,s),t.end(),e.queue.submit([r.finish()])}P()}U().catch(a=>{console.error(a)});
