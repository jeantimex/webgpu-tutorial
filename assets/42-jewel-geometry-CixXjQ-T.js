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
`;function S(c,t,m){const d=[],l=[],u=[];for(let o=0;o<=m;o++){const r=[],a=o/m;for(let i=0;i<=t;i++){const f=i/t,e=-c*Math.cos(f*Math.PI*2)*Math.sin(a*Math.PI),p=c*Math.cos(a*Math.PI),n=c*Math.sin(f*Math.PI*2)*Math.sin(a*Math.PI);l.push([e,p,n]),r.push(l.length-1)}u.push(r)}function w(o,r,a){const i=l[o],f=l[r],e=l[a],p=.8+Math.random()*.2,n=.4+Math.random()*.6,s=n,g=n*(1-p),v=n*(1-p);d.push(...i,1,0,0,s,g,v),d.push(...f,0,1,0,s,g,v),d.push(...e,0,0,1,s,g,v)}for(let o=0;o<m;o++)for(let r=0;r<t;r++){const a=u[o][r+1],i=u[o][r],f=u[o+1][r],e=u[o+1][r+1];o!==0&&w(a,i,e),o!==m-1&&w(i,f,e)}return{vertices:new Float32Array(d),vertexCount:d.length/9}}async function V(){const c=document.querySelector("#webgpu-canvas"),{device:t,context:m,canvasFormat:d}=await B(c),l=t.createShaderModule({code:O}),u=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),w=t.createRenderPipeline({layout:t.createPipelineLayout({bindGroupLayouts:[u]}),vertex:{module:l,entryPoint:"vs_main",buffers:[{arrayStride:36,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"float32x3"}]}]},fragment:{module:l,entryPoint:"fs_main",targets:[{format:d,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},primitive:{topology:"triangle-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),r=t.createBuffer({size:5e4*36,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),a=t.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),i=t.createTexture({size:[c.width,c.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),f=t.createBindGroup({layout:u,entries:[{binding:0,resource:{buffer:a}}]}),e={radius:1.5,widthSegments:7,heightSegments:5,showWireframe:!0,lineWidth:1.5,fillOpacity:.8};let p=0;function n(){const x=S(e.radius,e.widthSegments,e.heightSegments);t.queue.writeBuffer(r,0,x.vertices),p=x.vertexCount}const s=new U({container:document.getElementById("gui-container"),title:"Jewel Settings"});s.add(e,"radius",.5,3).onChange(n),s.add(e,"widthSegments",3,20,1).onChange(n),s.add(e,"heightSegments",2,20,1).onChange(n),s.add(e,"showWireframe"),s.add(e,"lineWidth",.5,5),s.add(e,"fillOpacity",0,1),n();const g=c.width/c.height,v=h.perspective(2*Math.PI/5,g,.1,100);let b=0;function M(){b+=.005;const x=h.lookAt([0,0,5],[0,0,0],[0,1,0]),A=h.multiply(h.rotationY(b),h.rotationX(b*.5)),C=h.multiply(v,h.multiply(x,A));t.queue.writeBuffer(a,0,C),t.queue.writeBuffer(a,64,new Float32Array([e.lineWidth,e.fillOpacity,e.showWireframe?1:0]));const P=t.createCommandEncoder(),G=m.getCurrentTexture().createView(),y=P.beginRenderPass({colorAttachments:[{view:G,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:i.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});y.setPipeline(w),y.setBindGroup(0,f),y.setVertexBuffer(0,r),y.draw(p),y.end(),t.queue.submit([P.finish()]),requestAnimationFrame(M)}requestAnimationFrame(M)}V().catch(console.error);
