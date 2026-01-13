import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as q}from"./webgpu-util-BApOR-AX.js";import{m as g}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as _}from"./lil-gui.esm-CNIGZg2U.js";const I=`
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
  // Final = Wire * wireAlpha + Fill * fillAlpha * (1 - wireAlpha)
  let fillAlpha = uniforms.fillOpacity * (1.0 - wireAlpha);
  let totalAlpha = wireAlpha + fillAlpha;

  if (totalAlpha < 0.01) {
    discard;
  }

  // Premultiplied alpha blend
  let color = (wireColor * wireAlpha + fillColor * fillAlpha) / totalAlpha;

  return vec4f(color, totalAlpha);
}
`;function z(o=1,t=1,l=1,y=1,f=1,u=1){const a=[],d=[];function n(A,F,M,O,W,e,C,s,r,p){const B=e/r,v=C/p,S=e/2,E=C/2,G=s/2,m=r+1,h=p+1,U=d.length;for(let i=0;i<h;i++){const c=i*v-E;for(let P=0;P<m;P++){const V=P*B-S,w=[0,0,0];w[A]=V*O,w[F]=c*W,w[M]=G,d.push(w)}}for(let i=0;i<p;i++)for(let c=0;c<r;c++){const P=U+c+m*i,V=U+c+m*(i+1),w=U+(c+1)+m*(i+1),R=U+(c+1)+m*i,T=d[P],x=d[V],b=d[R];a.push(T[0],T[1],T[2],1,0,0),a.push(x[0],x[1],x[2],0,1,0),a.push(b[0],b[1],b[2],0,0,1);const L=d[w];a.push(x[0],x[1],x[2],1,0,0),a.push(L[0],L[1],L[2],0,1,0),a.push(b[0],b[1],b[2],0,0,1)}}return n(2,1,0,-1,-1,l,t,o,u,f),n(2,1,0,1,-1,l,t,-o,u,f),n(0,2,1,1,1,o,l,t,y,u),n(0,2,1,1,-1,o,l,-t,y,u),n(0,1,2,1,-1,o,t,l,y,f),n(0,1,2,-1,-1,o,t,-l,y,f),{vertices:new Float32Array(a),vertexCount:a.length/6}}async function D(){const o=document.querySelector("#webgpu-canvas"),{device:t,context:l,canvasFormat:y}=await q(o),f=t.createShaderModule({code:I}),u=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),a=t.createRenderPipeline({layout:t.createPipelineLayout({bindGroupLayouts:[u]}),vertex:{module:f,entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:f,entryPoint:"fs_main",targets:[{format:y,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),n=t.createBuffer({size:1e5*24,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),A=t.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),F=o.width/o.height,M=g.perspective(2*Math.PI/5,F,.1,100),O=t.createTexture({size:[o.width,o.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),W=t.createBindGroup({layout:u,entries:[{binding:0,resource:{buffer:A}}]}),e={width:1.5,height:1.5,depth:1.5,widthSegments:2,heightSegments:2,depthSegments:2,showWireframe:!0,lineWidth:1.5,fillOpacity:.3};let C=0;function s(){const v=z(e.width,e.height,e.depth,Math.floor(e.widthSegments),Math.floor(e.heightSegments),Math.floor(e.depthSegments));t.queue.writeBuffer(n,0,v.vertices),C=v.vertexCount}const r=new _({container:document.getElementById("gui-container"),title:"Box Settings"});r.add(e,"width",.1,3).onChange(s),r.add(e,"height",.1,3).onChange(s),r.add(e,"depth",.1,3).onChange(s),r.add(e,"widthSegments",1,10,1).onChange(s),r.add(e,"heightSegments",1,10,1).onChange(s),r.add(e,"depthSegments",1,10,1).onChange(s),r.add(e,"showWireframe").name("Show Wireframe"),r.add(e,"lineWidth",.5,5).name("Line Width"),r.add(e,"fillOpacity",0,1).name("Fill Opacity"),s();let p=0;function B(){p+=.005;const v=g.lookAt([3,3,3],[0,0,0],[0,1,0]),S=g.multiply(g.rotationY(p),g.rotationX(p*.5)),E=g.multiply(M,g.multiply(v,S));t.queue.writeBuffer(A,0,E),t.queue.writeBuffer(A,64,new Float32Array([e.lineWidth,e.fillOpacity,e.showWireframe?1:0]));const G=t.createCommandEncoder(),m=l.getCurrentTexture().createView(),h=G.beginRenderPass({colorAttachments:[{view:m,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:O.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});h.setPipeline(a),h.setBindGroup(0,W),h.setVertexBuffer(0,n),h.draw(C),h.end(),t.queue.submit([G.finish()]),requestAnimationFrame(B)}requestAnimationFrame(B)}D().catch(console.error);
