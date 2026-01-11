import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as G}from"./webgpu-util-BApOR-AX.js";import{m as p}from"./wgpu-matrix.module-BcnFMekQ.js";import{G as b}from"./lil-gui.esm-CNIGZg2U.js";const w=`
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
`;function T(a,t,h,B,g,x,v){const m=[],i=[],c=[];for(let n=0;n<=h;n++){const r=[],d=n/h;for(let s=0;s<=t;s++){const e=s/t,f=-a*Math.cos(B+e*g)*Math.sin(x+d*v),o=a*Math.cos(x+d*v),u=a*Math.sin(B+e*g)*Math.sin(x+d*v);m.push(f,o,u),r.push(m.length/3-1)}c.push(r)}for(let n=0;n<h;n++)for(let r=0;r<t;r++){const d=c[n][r+1],s=c[n][r],e=c[n+1][r],f=c[n+1][r+1];i.push(s,d),i.push(s,e),i.push(s,f),n===h-1&&i.push(e,f),r===t-1&&i.push(d,f)}return{positions:new Float32Array(m),indices:new Uint16Array(i)}}async function O(){const a=document.querySelector("#webgpu-canvas"),{device:t,context:h,canvasFormat:B}=await G(a),g=t.createRenderPipeline({layout:"auto",vertex:{module:t.createShaderModule({code:w}),entryPoint:"vs_main",buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:t.createShaderModule({code:w}),entryPoint:"fs_main",targets:[{format:B}]},primitive:{topology:"line-list"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),x=1e5,v=3e5,m=t.createBuffer({size:x*12,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),i=t.createBuffer({size:v*2,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c=t.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),n=a.width/a.height,r=p.perspective(2*Math.PI/5,n,.1,100),d=t.createTexture({size:[a.width,a.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),s=t.createBindGroup({layout:g.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]}),e={radius:1.5,widthSegments:32,heightSegments:16,phiStart:0,phiLength:2,thetaStart:0,thetaLength:1};let f=0;function o(){const P=T(e.radius,e.widthSegments,e.heightSegments,e.phiStart*Math.PI,e.phiLength*Math.PI,e.thetaStart*Math.PI,e.thetaLength*Math.PI);t.queue.writeBuffer(m,0,P.positions),t.queue.writeBuffer(i,0,P.indices),f=P.indices.length}const u=new b({container:document.getElementById("gui-container"),title:"Sphere Settings"});u.add(e,"radius",.1,3).onChange(o),u.add(e,"widthSegments",3,64,1).onChange(o),u.add(e,"heightSegments",2,32,1).onChange(o),u.add(e,"phiStart",0,2).name("phiStart (x PI)").onChange(o),u.add(e,"phiLength",0,2).name("phiLength (x PI)").onChange(o),u.add(e,"thetaStart",0,1).name("thetaStart (x PI)").onChange(o),u.add(e,"thetaLength",0,1).name("thetaLength (x PI)").onChange(o),o();let M=0;function U(){M+=.005;const P=p.lookAt([0,0,5],[0,0,0],[0,1,0]),S=p.multiply(p.rotationY(M),p.rotationX(M*.5)),C=p.multiply(r,p.multiply(P,S));t.queue.writeBuffer(c,0,C);const y=t.createCommandEncoder(),I=h.getCurrentTexture().createView(),l=y.beginRenderPass({colorAttachments:[{view:I,clearValue:{r:.1,g:.1,b:.1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:d.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});l.setPipeline(g),l.setBindGroup(0,s),l.setVertexBuffer(0,m),l.setIndexBuffer(i,"uint16"),l.drawIndexed(f),l.end(),t.queue.submit([y.finish()]),requestAnimationFrame(U)}requestAnimationFrame(U)}O().catch(console.error);
