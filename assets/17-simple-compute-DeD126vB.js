import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */async function m(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const r=await navigator.gpu.requestAdapter();if(!r)throw new Error("No appropriate GPUAdapter found.");const e=await r.requestDevice(),g=document.getElementById("output"),u=64,t=new Float32Array(u);for(let a=0;a<u;a++)t[a]=a;g.innerHTML=`<strong>Input:</strong><br/>${t.join(" ")}<br/><br/>Computing...`;const i=e.createBuffer({label:"Work Buffer",size:t.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(i,0,t);const o=e.createBuffer({label:"Staging Buffer",size:t.byteLength,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),c=e.createShaderModule({label:"Doubling Shader",code:`
      @group(0) @binding(0)
      var<storage, read_write> data : array<f32>;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) global_id : vec3u) {
        if (global_id.x >= arrayLength(&data)) {
          return;
        }
        data[global_id.x] = data[global_id.x] * 2.0;
      }
    `}),p=e.createComputePipeline({label:"Compute Pipeline",layout:"auto",compute:{module:c,entryPoint:"main"}}),d=e.createBindGroup({label:"Compute Bind Group",layout:p.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i}}]}),s=e.createCommandEncoder(),n=s.beginComputePass();n.setPipeline(p),n.setBindGroup(0,d);const f=Math.ceil(u/64);n.dispatchWorkgroups(f),n.end(),s.copyBufferToBuffer(i,0,o,0,t.byteLength),e.queue.submit([s.finish()]),await o.mapAsync(GPUMapMode.READ);const l=o.getMappedRange(),b=new Float32Array(l.slice(0));o.unmap(),g.innerHTML=`<strong>Input:</strong><br/>${t.join(" ")}<br/><br/><strong>Output:</strong><br/>${b.join(" ")}`}m().catch(r=>{console.error(r),document.getElementById("output").innerHTML="<strong>Error:</strong> "+r.message});
