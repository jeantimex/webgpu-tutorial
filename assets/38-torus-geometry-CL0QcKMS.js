import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as B}from"./webgpu-util-BApOR-AX.js";import{m as d}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as U}from"./lil-gui.esm-CNIGZg2U.js";const O=`
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
`;function T(c=1,t=.4,h=8,n=6,v=Math.PI*2){const l=[],p=[];for(let o=0;o<=h;o++)for(let r=0;r<=n;r++){const f=r/n*v,a=o/h*Math.PI*2,s=(c+t*Math.cos(a))*Math.cos(f),i=(c+t*Math.cos(a))*Math.sin(f),e=t*Math.sin(a);p.push([s,i,e])}function w(o,r,f){const a=p[o],s=p[r],i=p[f];l.push(a[0],a[1],a[2],1,0,0),l.push(s[0],s[1],s[2],0,1,0),l.push(i[0],i[1],i[2],0,0,1)}for(let o=0;o<h;o++)for(let r=0;r<n;r++){const f=(n+1)*o+r,a=(n+1)*(o+1)+r,s=(n+1)*(o+1)+r+1,i=(n+1)*o+r+1;w(f,a,i),w(a,s,i)}return{vertices:new Float32Array(l),vertexCount:l.length/6}}async function W(){const c=document.querySelector("#webgpu-canvas"),{device:t,context:h,canvasFormat:n}=await B(c),v=t.createShaderModule({code:O}),l=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),p=t.createRenderPipeline({layout:t.createPipelineLayout({bindGroupLayouts:[l]}),vertex:{module:v,entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:v,entryPoint:"fs_main",targets:[{format:n,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),o=t.createBuffer({size:1e5*24,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),r=t.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),f=c.width/c.height,a=d.perspective(2*Math.PI/5,f,.1,100),s=t.createTexture({size:[c.width,c.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),i=t.createBindGroup({layout:l,entries:[{binding:0,resource:{buffer:r}}]}),e={radius:1,tube:.4,radialSegments:16,tubularSegments:32,arc:2,showWireframe:!0,lineWidth:1.5,fillOpacity:.3};let x=0;function m(){const y=T(e.radius,e.tube,Math.floor(e.radialSegments),Math.floor(e.tubularSegments),e.arc*Math.PI);t.queue.writeBuffer(o,0,y.vertices),x=y.vertexCount}const u=new U({container:document.getElementById("gui-container"),title:"Torus Settings"});u.add(e,"radius",.1,3).onChange(m),u.add(e,"tube",.1,3).onChange(m),u.add(e,"radialSegments",2,64,1).onChange(m),u.add(e,"tubularSegments",3,100,1).onChange(m),u.add(e,"arc",0,2).name("arc (x PI)").onChange(m),u.add(e,"showWireframe").name("Show Wireframe"),u.add(e,"lineWidth",.5,5).name("Line Width"),u.add(e,"fillOpacity",0,1).name("Fill Opacity"),m();let b=0;function P(){b+=.005;const y=d.lookAt([0,0,5],[0,0,0],[0,1,0]),M=d.multiply(d.rotationY(b),d.rotationX(b*.5)),A=d.multiply(a,d.multiply(y,M));t.queue.writeBuffer(r,0,A),t.queue.writeBuffer(r,64,new Float32Array([e.lineWidth,e.fillOpacity,e.showWireframe?1:0]));const C=t.createCommandEncoder(),G=h.getCurrentTexture().createView(),g=C.beginRenderPass({colorAttachments:[{view:G,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:s.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});g.setPipeline(p),g.setBindGroup(0,i),g.setVertexBuffer(0,o),g.draw(x),g.end(),t.queue.submit([C.finish()]),requestAnimationFrame(P)}requestAnimationFrame(P)}W().catch(console.error);
