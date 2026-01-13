import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as B}from"./webgpu-util-BApOR-AX.js";import{m as h}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as U}from"./lil-gui.esm-CNIGZg2U.js";const O=`
struct Uniforms {
  mvpMatrix : mat4x4f,
  lineWidth : f32,
  fillOpacity : f32,
  showWireframe : f32,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) barycentric : vec3f,
  @location(1) color : vec3f,
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) barycentric : vec3f,
  @location(2) color : vec3f,
) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  out.barycentric = barycentric;
  out.color = color;
  return out;
}

fn edgeFactor(bary : vec3f, width : f32) -> f32 {
  let d = fwidth(bary);
  let a3 = smoothstep(vec3f(0.0), d * width, bary);
  return min(min(a3.x, a3.y), a3.z);
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4f {
  let edge = 1.0 - edgeFactor(in.barycentric, uniforms.lineWidth);

  let wireColor = vec3f(1.0, 1.0, 1.0);
  let fillColor = in.color;

  let wireAlpha = edge * uniforms.showWireframe;
  let fillAlpha = uniforms.fillOpacity * (1.0 - wireAlpha);
  let totalAlpha = wireAlpha + fillAlpha;

  if (totalAlpha < 0.01) {
    discard;
  }

  let color = (wireColor * wireAlpha + fillColor * fillAlpha) / totalAlpha;
  return vec4f(color, totalAlpha);
}
`;function F(d,t,g,M=.2){const c=[],l=[],p=[];let x=12345;const b=()=>(x=x*1103515245+12345&2147483647,x/2147483647);for(let o=0;o<=g;o++){const r=[],i=o/g*Math.PI;for(let a=0;a<=t;a++){const u=a/t*Math.PI*2,m=Math.sin(i),s=d*(1+(b()-.5)*2*M*m),f=-s*Math.cos(u)*Math.sin(i),y=s*Math.cos(i),A=s*Math.sin(u)*Math.sin(i);l.push([f,y,A]),r.push(l.length-1)}p.push(r)}function v(o,r,e){const i=l[o],a=l[r],n=l[e],u=.3+Math.random()*.4,m=u+Math.random()*.1,s=u,f=u-Math.random()*.05;c.push(...i,1,0,0,m,s,f),c.push(...a,0,1,0,m,s,f),c.push(...n,0,0,1,m,s,f)}for(let o=0;o<g;o++)for(let r=0;r<t;r++){const e=p[o][r+1],i=p[o][r],a=p[o+1][r],n=p[o+1][r+1];o!==0&&v(e,i,n),o!==g-1&&v(i,a,n)}return{vertices:new Float32Array(c),vertexCount:c.length/9}}async function S(){const d=document.querySelector("#webgpu-canvas"),{device:t,context:g,canvasFormat:M}=await B(d),c=t.createShaderModule({code:O}),l=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),p=t.createRenderPipeline({layout:t.createPipelineLayout({bindGroupLayouts:[l]}),vertex:{module:c,entryPoint:"vs_main",buffers:[{arrayStride:36,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"float32x3"}]}]},fragment:{module:c,entryPoint:"fs_main",targets:[{format:M,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),b=t.createBuffer({size:5e4*36,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),v=t.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),o=t.createTexture({size:[d.width,d.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),r=t.createBindGroup({layout:l,entries:[{binding:0,resource:{buffer:v}}]}),e={radius:1.5,widthSegments:16,heightSegments:12,randomness:.15,showWireframe:!0,lineWidth:1.5,fillOpacity:.8};let i=0;function a(){const y=F(e.radius,e.widthSegments,e.heightSegments,e.randomness);t.queue.writeBuffer(b,0,y.vertices),i=y.vertexCount}const n=new U({container:document.getElementById("gui-container"),title:"Rock Settings"});n.add(e,"radius",.5,3).onChange(a),n.add(e,"widthSegments",3,32,1).onChange(a),n.add(e,"heightSegments",2,32,1).onChange(a),n.add(e,"randomness",0,1).name("Randomness").onChange(a),n.add(e,"showWireframe"),n.add(e,"lineWidth",.5,5),n.add(e,"fillOpacity",0,1),a();const u=d.width/d.height,m=h.perspective(2*Math.PI/5,u,.1,100);let s=0;function f(){s+=.005;const y=h.lookAt([0,0,5],[0,0,0],[0,1,0]),A=h.multiply(h.rotationY(s),h.rotationX(s*.5)),C=h.multiply(m,h.multiply(y,A));t.queue.writeBuffer(v,0,C),t.queue.writeBuffer(v,64,new Float32Array([e.lineWidth,e.fillOpacity,e.showWireframe?1:0]));const P=t.createCommandEncoder(),G=g.getCurrentTexture().createView(),w=P.beginRenderPass({colorAttachments:[{view:G,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:o.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});w.setPipeline(p),w.setBindGroup(0,r),w.setVertexBuffer(0,b),w.draw(i),w.end(),t.queue.submit([P.finish()]),requestAnimationFrame(f)}requestAnimationFrame(f)}S().catch(console.error);
