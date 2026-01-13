import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as G}from"./webgpu-util-BApOR-AX.js";import{m as d}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as B}from"./lil-gui.esm-CNIGZg2U.js";const U=`
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
`;function O(s,t,p,w,g,u,h){const m=[],f=[],c=[];for(let a=0;a<=p;a++){const o=[],l=a/p;for(let e=0;e<=t;e++){const n=e/t,r=-s*Math.cos(w+n*g)*Math.sin(u+l*h),i=s*Math.cos(u+l*h),y=s*Math.sin(w+n*g)*Math.sin(u+l*h);f.push([r,i,y]),o.push(f.length-1)}c.push(o)}function x(a,o,l){const e=f[a],n=f[o],r=f[l];m.push(e[0],e[1],e[2],1,0,0),m.push(n[0],n[1],n[2],0,1,0),m.push(r[0],r[1],r[2],0,0,1)}for(let a=0;a<p;a++)for(let o=0;o<t;o++){const l=c[a][o+1],e=c[a][o],n=c[a+1][o],r=c[a+1][o+1];(a!==p-1||u+h<Math.PI-1e-4)&&x(e,n,r),(a!==0||u>1e-4)&&x(e,r,l)}return{vertices:new Float32Array(m),vertexCount:m.length/6}}async function W(){const s=document.querySelector("#webgpu-canvas"),{device:t,context:p,canvasFormat:w}=await G(s),g=t.createShaderModule({code:U}),u=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),h=t.createRenderPipeline({layout:t.createPipelineLayout({bindGroupLayouts:[u]}),vertex:{module:g,entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:g,entryPoint:"fs_main",targets:[{format:w,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),f=t.createBuffer({size:1e5*24,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c=t.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),x=s.width/s.height,a=d.perspective(2*Math.PI/5,x,.1,100),o=t.createTexture({size:[s.width,s.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),l=t.createBindGroup({layout:u,entries:[{binding:0,resource:{buffer:c}}]}),e={radius:1.5,widthSegments:32,heightSegments:16,phiStart:0,phiLength:2,thetaStart:0,thetaLength:1,showWireframe:!0,lineWidth:1.5,fillOpacity:.3};let n=0;function r(){const b=O(e.radius,e.widthSegments,e.heightSegments,e.phiStart*Math.PI,e.phiLength*Math.PI,e.thetaStart*Math.PI,e.thetaLength*Math.PI);t.queue.writeBuffer(f,0,b.vertices),n=b.vertexCount}const i=new B({container:document.getElementById("gui-container"),title:"Sphere Settings"});i.add(e,"radius",.1,3).onChange(r),i.add(e,"widthSegments",3,64,1).onChange(r),i.add(e,"heightSegments",2,32,1).onChange(r),i.add(e,"phiStart",0,2).name("phiStart (x PI)").onChange(r),i.add(e,"phiLength",0,2).name("phiLength (x PI)").onChange(r),i.add(e,"thetaStart",0,1).name("thetaStart (x PI)").onChange(r),i.add(e,"thetaLength",0,1).name("thetaLength (x PI)").onChange(r),i.add(e,"showWireframe").name("Show Wireframe"),i.add(e,"lineWidth",.5,5).name("Line Width"),i.add(e,"fillOpacity",0,1).name("Fill Opacity"),r();let y=0;function P(){y+=.005;const b=d.lookAt([0,0,5],[0,0,0],[0,1,0]),M=d.multiply(d.rotationY(y),d.rotationX(y*.5)),A=d.multiply(a,d.multiply(b,M));t.queue.writeBuffer(c,0,A),t.queue.writeBuffer(c,64,new Float32Array([e.lineWidth,e.fillOpacity,e.showWireframe?1:0]));const C=t.createCommandEncoder(),S=p.getCurrentTexture().createView(),v=C.beginRenderPass({colorAttachments:[{view:S,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:o.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});v.setPipeline(h),v.setBindGroup(0,l),v.setVertexBuffer(0,f),v.draw(n),v.end(),t.queue.submit([C.finish()]),requestAnimationFrame(P)}requestAnimationFrame(P)}W().catch(console.error);
