import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as B}from"./webgpu-util-BApOR-AX.js";import{m as p}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as U}from"./lil-gui.esm-CNIGZg2U.js";const M=`
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
}

@vertex
fn vs_main(
  @location(0) pos : vec3f,
  @location(1) barycentric : vec3f
) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  out.barycentric = barycentric;
  return out;
}

// Edge detection using barycentric coordinates
fn edgeFactor(bary : vec3f, width : f32) -> f32 {
  let d = fwidth(bary);
  let a3 = smoothstep(vec3f(0.0), d * width, bary);
  return min(min(a3.x, a3.y), a3.z);
}

@fragment
fn fs_main(@location(0) bary : vec3f) -> @location(0) vec4f {
  let edge = 1.0 - edgeFactor(bary, uniforms.lineWidth);

  // Wireframe color (white) and fill color (red)
  let wireColor = vec3f(1.0, 1.0, 1.0);
  let fillColor = vec3f(1.0, 0.2, 0.2);

  // Calculate wireframe alpha (only if wireframe is enabled)
  let wireAlpha = edge * uniforms.showWireframe;

  // Composite: wireframe over fill using "over" operator
  let fillAlpha = uniforms.fillOpacity * (1.0 - wireAlpha);
  let totalAlpha = wireAlpha + fillAlpha;

  if (totalAlpha < 0.01) {
    discard;
  }

  // Premultiplied alpha blend
  let color = (wireColor * wireAlpha + fillColor * fillAlpha) / totalAlpha;

  return vec4f(color, totalAlpha);
}
`;function O(s=1,t=1,g=1,y=1){const c=[],f=[],w=s/2,P=t/2,h=Math.floor(g),d=Math.floor(y),u=h+1,v=d+1,b=s/h,x=t/d;for(let o=0;o<v;o++){const r=o*x-P;for(let i=0;i<u;i++){const a=i*b-w;f.push([a,-r,0])}}function e(o,r,i){const a=f[o],l=f[r],n=f[i];c.push(a[0],a[1],a[2],1,0,0),c.push(l[0],l[1],l[2],0,1,0),c.push(n[0],n[1],n[2],0,0,1)}for(let o=0;o<d;o++)for(let r=0;r<h;r++){const i=r+u*o,a=r+u*(o+1),l=r+1+u*(o+1),n=r+1+u*o;e(i,a,n),e(a,l,n)}return{vertices:new Float32Array(c),vertexCount:c.length/6}}async function W(){const s=document.querySelector("#webgpu-canvas"),{device:t,context:g,canvasFormat:y}=await B(s),c=t.createShaderModule({code:M}),f=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),w=t.createRenderPipeline({layout:t.createPipelineLayout({bindGroupLayouts:[f]}),vertex:{module:c,entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:c,entryPoint:"fs_main",targets:[{format:y,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),h=t.createBuffer({size:1e5*24,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),d=t.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),u=s.width/s.height,v=p.perspective(2*Math.PI/5,u,.1,100),b=t.createTexture({size:[s.width,s.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),x=t.createBindGroup({layout:f,entries:[{binding:0,resource:{buffer:d}}]}),e={width:2,height:2,widthSegments:4,heightSegments:4,showWireframe:!0,lineWidth:1.5,fillOpacity:.3};let o=0;function r(){const n=O(e.width,e.height,e.widthSegments,e.heightSegments);t.queue.writeBuffer(h,0,n.vertices),o=n.vertexCount}const i=new U({container:document.getElementById("gui-container"),title:"Plane Settings"});i.add(e,"width",.1,5).onChange(r),i.add(e,"height",.1,5).onChange(r),i.add(e,"widthSegments",1,50,1).onChange(r),i.add(e,"heightSegments",1,50,1).onChange(r),i.add(e,"showWireframe").name("Show Wireframe"),i.add(e,"lineWidth",.5,5).name("Line Width"),i.add(e,"fillOpacity",0,1).name("Fill Opacity"),r();let a=0;function l(){a+=.005;const n=p.multiply(p.rotationX(-Math.PI/4),p.rotationZ(a)),C=p.lookAt([0,0,5],[0,0,0],[0,1,0]),S=p.multiply(v,p.multiply(C,n));t.queue.writeBuffer(d,0,S),t.queue.writeBuffer(d,64,new Float32Array([e.lineWidth,e.fillOpacity,e.showWireframe?1:0]));const A=t.createCommandEncoder(),G=g.getCurrentTexture().createView(),m=A.beginRenderPass({colorAttachments:[{view:G,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:b.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});m.setPipeline(w),m.setBindGroup(0,x),m.setVertexBuffer(0,h),m.draw(o),m.end(),t.queue.submit([A.finish()]),requestAnimationFrame(l)}requestAnimationFrame(l)}W().catch(console.error);
