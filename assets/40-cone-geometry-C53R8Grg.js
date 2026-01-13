import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as B}from"./webgpu-util-BApOR-AX.js";import{m as d}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as T}from"./lil-gui.esm-CNIGZg2U.js";const S=`
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
`;function U(l=1,n=2,f=32,m=1,b=!1,g=0,C=Math.PI*2){const h=[],c=[],u=[],y=n/2,P=0,A=l;function v(i,e,r){const o=c[i],s=c[e],a=c[r];h.push(o[0],o[1],o[2],1,0,0),h.push(s[0],s[1],s[2],0,1,0),h.push(a[0],a[1],a[2],0,0,1)}for(let i=0;i<=m;i++){const e=[],r=i/m,o=r*(A-P)+P;for(let s=0;s<=f;s++){const p=s/f*C+g,x=Math.sin(p),M=Math.cos(p);c.push([o*x,-r*n+y,o*M]),e.push(c.length-1)}u.push(e)}for(let i=0;i<f;i++)for(let e=0;e<m;e++){const r=u[e][i],o=u[e+1][i],s=u[e+1][i+1],a=u[e][i+1];e!==0&&v(r,o,a),v(o,s,a)}!b&&A>0&&t();function t(){const e=c.length;c.push([0,y*-1,0]);const r=c.length;for(let o=0;o<=f;o++){const a=o/f*C+g,p=Math.cos(a),x=Math.sin(a);c.push([l*x,y*-1,l*p])}for(let o=0;o<f;o++){const s=r+o,a=r+o+1;v(e,a,s)}}return{vertices:new Float32Array(h),vertexCount:h.length/6}}async function E(){const l=document.querySelector("#webgpu-canvas"),{device:n,context:f,canvasFormat:m}=await B(l),b=n.createShaderModule({code:S}),g=n.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),C=n.createRenderPipeline({layout:n.createPipelineLayout({bindGroupLayouts:[g]}),vertex:{module:b,entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:b,entryPoint:"fs_main",targets:[{format:m,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),c=n.createBuffer({size:1e5*24,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),u=n.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),y=l.width/l.height,P=d.perspective(2*Math.PI/5,y,.1,100),A=n.createTexture({size:[l.width,l.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),v=n.createBindGroup({layout:g,entries:[{binding:0,resource:{buffer:u}}]}),t={radius:1,height:2,radialSegments:32,heightSegments:4,openEnded:!1,thetaStart:0,thetaLength:2,showWireframe:!0,lineWidth:1.5,fillOpacity:.3};let i=0;function e(){const a=U(t.radius,t.height,Math.floor(t.radialSegments),Math.floor(t.heightSegments),t.openEnded,t.thetaStart*Math.PI,t.thetaLength*Math.PI);n.queue.writeBuffer(c,0,a.vertices),i=a.vertexCount}const r=new T({container:document.getElementById("gui-container"),title:"Cone Settings"});r.add(t,"radius",0,3).onChange(e),r.add(t,"height",.1,5).onChange(e),r.add(t,"radialSegments",3,64,1).onChange(e),r.add(t,"heightSegments",1,32,1).onChange(e),r.add(t,"openEnded").onChange(e),r.add(t,"thetaStart",0,2).name("thetaStart (x PI)").onChange(e),r.add(t,"thetaLength",0,2).name("thetaLength (x PI)").onChange(e),r.add(t,"showWireframe").name("Show Wireframe"),r.add(t,"lineWidth",.5,5).name("Line Width"),r.add(t,"fillOpacity",0,1).name("Fill Opacity"),e();let o=0;function s(){o+=.005;const a=d.lookAt([4,4,4],[0,0,0],[0,1,0]),p=d.multiply(d.rotationY(o),d.rotationX(o*.5)),x=d.multiply(P,d.multiply(a,p));n.queue.writeBuffer(u,0,x),n.queue.writeBuffer(u,64,new Float32Array([t.lineWidth,t.fillOpacity,t.showWireframe?1:0]));const M=n.createCommandEncoder(),G=f.getCurrentTexture().createView(),w=M.beginRenderPass({colorAttachments:[{view:G,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:A.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});w.setPipeline(C),w.setBindGroup(0,v),w.setVertexBuffer(0,c),w.draw(i),w.end(),n.queue.submit([M.finish()]),requestAnimationFrame(s)}requestAnimationFrame(s)}E().catch(console.error);
