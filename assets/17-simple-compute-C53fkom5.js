import"./common-BNB2xREb.js";async function m(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const o=await navigator.gpu.requestAdapter();if(!o)throw new Error("No appropriate GPUAdapter found.");const e=await o.requestDevice(),p=document.getElementById("output"),u=64,t=new Float32Array(u);for(let n=0;n<u;n++)t[n]=n;p.innerText=`Input: ${t.join(", ")}

Computing...`;const i=e.createBuffer({label:"Work Buffer",size:t.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(i,0,t);const a=e.createBuffer({label:"Staging Buffer",size:t.byteLength,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),d=e.createShaderModule({label:"Doubling Shader",code:`
      @group(0) @binding(0)
      var<storage, read_write> data : array<f32>;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) global_id : vec3u) {
        // Ensure we don't go out of bounds
        if (global_id.x >= arrayLength(&data)) {
          return;
        }
        
        // The Operation: Double the value
        data[global_id.x] = data[global_id.x] * 2.0;
      }
    `}),c=e.createComputePipeline({label:"Compute Pipeline",layout:"auto",compute:{module:d,entryPoint:"main"}}),g=e.createBindGroup({label:"Compute Bind Group",layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i}}]}),s=e.createCommandEncoder(),r=s.beginComputePass();r.setPipeline(c),r.setBindGroup(0,g);const f=Math.ceil(u/64);r.dispatchWorkgroups(f),r.end(),s.copyBufferToBuffer(i,0,a,0,t.byteLength),e.queue.submit([s.finish()]),await a.mapAsync(GPUMapMode.READ);const b=a.getMappedRange(),l=new Float32Array(b.slice(0));a.unmap(),console.log("Input:",t),console.log("Output:",l),p.innerText+=`

Output: ${l.join(", ")}`}m().catch(o=>{console.error(o),document.getElementById("output").innerText="Error: "+o.message});
