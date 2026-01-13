import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as B}from"./webgpu-util-BApOR-AX.js";import{m as p}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as S}from"./lil-gui.esm-CNIGZg2U.js";const T=`
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
`;function U(l=1,a=1,b=2,f=32,m=1,y=!1,C=0,M=Math.PI*2){const d=[],s=[],h=[];function g(e,n,r){const t=s[e],i=s[n],o=s[r];d.push(t[0],t[1],t[2],1,0,0),d.push(i[0],i[1],i[2],0,1,0),d.push(o[0],o[1],o[2],0,0,1)}const v=b/2;for(let e=0;e<=m;e++){const n=[],r=e/m,t=r*(a-l)+l;for(let i=0;i<=f;i++){const c=i/f*M+C,u=Math.sin(c),x=Math.cos(c);s.push([t*u,-r*b+v,t*x]),n.push(s.length-1)}h.push(n)}for(let e=0;e<f;e++)for(let n=0;n<m;n++){const r=h[n][e],t=h[n+1][e],i=h[n+1][e+1],o=h[n][e+1];g(r,t,o),g(t,i,o)}!y&&l>0&&P(!0),!y&&a>0&&P(!1);function P(e){const n=e?l:a,r=e?1:-1,t=s.length;s.push([0,v*r,0]);const i=s.length;for(let o=0;o<=f;o++){const u=o/f*M+C,x=Math.cos(u),A=Math.sin(u);s.push([n*A,v*r,n*x])}for(let o=0;o<f;o++){const c=i+o,u=i+o+1;e?g(t,c,u):g(t,u,c)}}return{vertices:new Float32Array(d),vertexCount:d.length/6}}async function O(){const l=document.querySelector("#webgpu-canvas"),{device:a,context:b,canvasFormat:f}=await B(l),m=a.createShaderModule({code:T}),y=a.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),C=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[y]}),vertex:{module:m,entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:m,entryPoint:"fs_main",targets:[{format:f,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),d=a.createBuffer({size:1e5*24,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),s=a.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),h=l.width/l.height,g=p.perspective(2*Math.PI/5,h,.1,100),v=a.createTexture({size:[l.width,l.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),P=a.createBindGroup({layout:y,entries:[{binding:0,resource:{buffer:s}}]}),e={radiusTop:1,radiusBottom:1,height:2,radialSegments:32,heightSegments:4,openEnded:!1,thetaStart:0,thetaLength:2,showWireframe:!0,lineWidth:1.5,fillOpacity:.3};let n=0;function r(){const c=U(e.radiusTop,e.radiusBottom,e.height,Math.floor(e.radialSegments),Math.floor(e.heightSegments),e.openEnded,e.thetaStart*Math.PI,e.thetaLength*Math.PI);a.queue.writeBuffer(d,0,c.vertices),n=c.vertexCount}const t=new S({container:document.getElementById("gui-container"),title:"Cylinder Settings"});t.add(e,"radiusTop",0,3).onChange(r),t.add(e,"radiusBottom",0,3).onChange(r),t.add(e,"height",.1,5).onChange(r),t.add(e,"radialSegments",3,64,1).onChange(r),t.add(e,"heightSegments",1,32,1).onChange(r),t.add(e,"openEnded").onChange(r),t.add(e,"thetaStart",0,2).name("thetaStart (x PI)").onChange(r),t.add(e,"thetaLength",0,2).name("thetaLength (x PI)").onChange(r),t.add(e,"showWireframe").name("Show Wireframe"),t.add(e,"lineWidth",.5,5).name("Line Width"),t.add(e,"fillOpacity",0,1).name("Fill Opacity"),r();let i=0;function o(){i+=.005;const c=p.lookAt([4,4,4],[0,0,0],[0,1,0]),u=p.multiply(p.rotationY(i),p.rotationX(i*.5)),x=p.multiply(g,p.multiply(c,u));a.queue.writeBuffer(s,0,x),a.queue.writeBuffer(s,64,new Float32Array([e.lineWidth,e.fillOpacity,e.showWireframe?1:0]));const A=a.createCommandEncoder(),G=b.getCurrentTexture().createView(),w=A.beginRenderPass({colorAttachments:[{view:G,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:v.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});w.setPipeline(C),w.setBindGroup(0,P),w.setVertexBuffer(0,d),w.draw(n),w.end(),a.queue.submit([A.finish()]),requestAnimationFrame(o)}requestAnimationFrame(o)}O().catch(console.error);
