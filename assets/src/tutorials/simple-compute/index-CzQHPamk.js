import"../../../modulepreload-polyfill-B5Qt9EMX.js";const m=`@group(0) @binding(0)
var<storage, read_write> data : array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id : vec3u) {
  if (global_id.x >= arrayLength(&data)) {
    return;
  }
  data[global_id.x] = data[global_id.x] * 2.0;
}
`;async function B(){if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const n=await navigator.gpu.requestAdapter();if(!n)throw new Error("No appropriate GPUAdapter found.");const e=await n.requestDevice(),g=document.getElementById("output"),u=64,t=new Float32Array(u);for(let a=0;a<u;a++)t[a]=a;g.innerHTML=`<strong>Input:</strong><br/>${t.join(" ")}<br/><br/>Computing...`;const i=e.createBuffer({label:"Work Buffer",size:t.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(i,0,t);const r=e.createBuffer({label:"Staging Buffer",size:t.byteLength,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),c=e.createShaderModule({label:"Doubling Shader",code:m}),p=e.createComputePipeline({label:"Compute Pipeline",layout:"auto",compute:{module:c,entryPoint:"main"}}),d=e.createBindGroup({label:"Compute Bind Group",layout:p.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i}}]}),s=e.createCommandEncoder(),o=s.beginComputePass();o.setPipeline(p),o.setBindGroup(0,d);const f=Math.ceil(u/64);o.dispatchWorkgroups(f),o.end(),s.copyBufferToBuffer(i,0,r,0,t.byteLength),e.queue.submit([s.finish()]),await r.mapAsync(GPUMapMode.READ);const l=r.getMappedRange(),b=new Float32Array(l.slice(0));r.unmap(),g.innerHTML=`<strong>Input:</strong><br/>${t.join(" ")}<br/><br/><strong>Output:</strong><br/>${b.join(" ")}`}B().catch(n=>{console.error(n),document.getElementById("output").innerHTML="<strong>Error:</strong> "+n.message});
