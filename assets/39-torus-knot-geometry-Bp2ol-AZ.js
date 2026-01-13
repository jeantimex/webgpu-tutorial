import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as O}from"./webgpu-util-BApOR-AX.js";import{m,v as h}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as U}from"./lil-gui.esm-CNIGZg2U.js";const W=`
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
`;function T(l=1,o=.4,v=64,u=8,y=2,C=3){const d=[],b=[];function w(t){const r=Math.cos(t),s=Math.sin(t),n=C/y*t,e=Math.cos(n),c=l*(2+e)*.5*r,i=l*(2+e)*.5*s,a=l*Math.sin(n)*.5;return[c,i,a]}for(let t=0;t<=v;t++){const r=t/v*y*Math.PI*2,s=w(r),n=w(r+.01),e=h.normalize(h.sub(n,s)),c=h.normalize(h.add(s,n)),i=h.normalize(h.cross(e,c)),a=h.cross(i,e);for(let p=0;p<=u;p++){const x=p/u*Math.PI*2,f=-o*Math.cos(x),M=o*Math.sin(x),G=s[0]+(f*a[0]+M*i[0]),A=s[1]+(f*a[1]+M*i[1]),B=s[2]+(f*a[2]+M*i[2]);b.push([G,A,B])}}function g(t,r,s){const n=b[t],e=b[r],c=b[s];d.push(n[0],n[1],n[2],1,0,0),d.push(e[0],e[1],e[2],0,1,0),d.push(c[0],c[1],c[2],0,0,1)}for(let t=0;t<v;t++)for(let r=0;r<u;r++){const s=(u+1)*t+r,n=(u+1)*(t+1)+r,e=(u+1)*(t+1)+r+1,c=(u+1)*t+r+1;g(s,n,c),g(n,e,c)}return{vertices:new Float32Array(d),vertexCount:d.length/6}}async function F(){const l=document.querySelector("#webgpu-canvas"),{device:o,context:v,canvasFormat:u}=await O(l),y=o.createShaderModule({code:W}),C=o.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),d=o.createRenderPipeline({layout:o.createPipelineLayout({bindGroupLayouts:[C]}),vertex:{module:y,entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:y,entryPoint:"fs_main",targets:[{format:u,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),w=o.createBuffer({size:2e5*24,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),g=o.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),t=l.width/l.height,r=m.perspective(2*Math.PI/5,t,.1,100),s=o.createTexture({size:[l.width,l.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),n=o.createBindGroup({layout:C,entries:[{binding:0,resource:{buffer:g}}]}),e={radius:1,tube:.3,tubularSegments:64,radialSegments:8,p:2,q:3,showWireframe:!0,lineWidth:1.5,fillOpacity:.3};let c=0;function i(){const f=T(e.radius,e.tube,Math.floor(e.tubularSegments),Math.floor(e.radialSegments),Math.floor(e.p),Math.floor(e.q));o.queue.writeBuffer(w,0,f.vertices),c=f.vertexCount}const a=new U({container:document.getElementById("gui-container"),title:"Knot Settings"});a.add(e,"radius",.1,3).onChange(i),a.add(e,"tube",.1,3).onChange(i),a.add(e,"tubularSegments",3,200,1).onChange(i),a.add(e,"radialSegments",3,32,1).onChange(i),a.add(e,"p",1,10,1).name("P (Winds)").onChange(i),a.add(e,"q",1,10,1).name("Q (Loops)").onChange(i),a.add(e,"showWireframe").name("Show Wireframe"),a.add(e,"lineWidth",.5,5).name("Line Width"),a.add(e,"fillOpacity",0,1).name("Fill Opacity"),i();let p=0;function x(){p+=.005;const f=m.lookAt([0,0,5],[0,0,0],[0,1,0]),M=m.multiply(m.rotationY(p),m.rotationX(p*.5)),G=m.multiply(r,m.multiply(f,M));o.queue.writeBuffer(g,0,G),o.queue.writeBuffer(g,64,new Float32Array([e.lineWidth,e.fillOpacity,e.showWireframe?1:0]));const A=o.createCommandEncoder(),B=v.getCurrentTexture().createView(),P=A.beginRenderPass({colorAttachments:[{view:B,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:s.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});P.setPipeline(d),P.setBindGroup(0,n),P.setVertexBuffer(0,w),P.draw(c),P.end(),o.queue.submit([A.finish()]),requestAnimationFrame(x)}requestAnimationFrame(x)}F().catch(console.error);
