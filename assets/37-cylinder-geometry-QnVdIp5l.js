import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as S}from"./webgpu-util-BApOR-AX.js";import{m as p}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as T}from"./lil-gui.esm-CNIGZg2U.js";const I=`
struct Uniforms {
  mvpMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) position : vec4f,
}

@vertex
fn vs_main(@location(0) pos : vec3f) -> VertexOutput {
  var out : VertexOutput;
  out.position = uniforms.mvpMatrix * vec4f(pos, 1.0);
  return out;
}

@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(1.0, 1.0, 1.0, 1.0); // White lines
}
`;function b(c=1,n=1,C=2,d=32,l=1,M=!1,U=0,v=Math.PI*2){const f=[],s=[];let m=0;const h=[],P=C/2;for(let e=0;e<=l;e++){const r=[],t=e/l,o=t*(n-c)+c;for(let a=0;a<=d;a++){const u=a/d*v+U,g=Math.sin(u),B=Math.cos(u);f.push(o*g,-t*C+P,o*B),r.push(m++)}h.push(r)}for(let e=0;e<d;e++)for(let r=0;r<l;r++){const t=h[r][e],o=h[r+1][e],a=h[r+1][e+1],i=h[r][e+1];s.push(t,o),s.push(o,a),s.push(t,i),s.push(i,a),s.push(t,a)}!M&&c>0&&w(!0),!M&&n>0&&w(!1);function w(e){const r=m,t=e?c:n,o=e?1:-1;f.push(0,P*o,0),m++;const a=r;for(let i=0;i<=d;i++){const g=i/d*v+U,B=Math.cos(g),G=Math.sin(g);f.push(t*G,P*o,t*B);const y=m++;s.push(a,y),i>0&&s.push(y-1,y)}}return{positions:new Float32Array(f),indices:new Uint16Array(s)}}async function E(){const c=document.querySelector("#webgpu-canvas"),{device:n,context:C,canvasFormat:d}=await S(c),l=n.createRenderPipeline({layout:"auto",vertex:{module:n.createShaderModule({code:I}),entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:n.createShaderModule({code:I}),entryPoint:"fs_main",targets:[{format:d}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),M=1e5,U=2e5,v=n.createBuffer({size:M*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),f=n.createBuffer({size:U*2,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),s=n.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),m=c.width/c.height,h=p.perspective(2*Math.PI/5,m,.1,100),P=n.createTexture({size:[c.width,c.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),w=n.createBindGroup({layout:l.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:s}}]}),e={radiusTop:1,radiusBottom:1,height:2,radialSegments:32,heightSegments:4,openEnded:!1,thetaStart:0,thetaLength:2};let r=0;function t(){const u=b(e.radiusTop,e.radiusBottom,e.height,Math.floor(e.radialSegments),Math.floor(e.heightSegments),e.openEnded,e.thetaStart*Math.PI,e.thetaLength*Math.PI);n.queue.writeBuffer(v,0,u.positions),n.queue.writeBuffer(f,0,u.indices),r=u.indices.length}const o=new T({container:document.getElementById("gui-container"),title:"Cylinder Settings"});o.add(e,"radiusTop",0,3).onChange(t),o.add(e,"radiusBottom",0,3).onChange(t),o.add(e,"height",.1,5).onChange(t),o.add(e,"radialSegments",3,64,1).onChange(t),o.add(e,"heightSegments",1,32,1).onChange(t),o.add(e,"openEnded").onChange(t),o.add(e,"thetaStart",0,2).name("thetaStart (x PI)").onChange(t),o.add(e,"thetaLength",0,2).name("thetaLength (x PI)").onChange(t),t();let a=0;function i(){a+=.005;const u=p.lookAt([4,4,4],[0,0,0],[0,1,0]),g=p.multiply(p.rotationY(a),p.rotationX(a*.5)),B=p.multiply(h,p.multiply(u,g));n.queue.writeBuffer(s,0,B);const G=n.createCommandEncoder(),y=C.getCurrentTexture().createView(),x=G.beginRenderPass({colorAttachments:[{view:y,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:P.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});x.setPipeline(l),x.setBindGroup(0,w),x.setVertexBuffer(0,v),x.setIndexBuffer(f,"uint16"),x.drawIndexed(r),x.end(),n.queue.submit([G.finish()]),requestAnimationFrame(i)}requestAnimationFrame(i)}E().catch(console.error);
