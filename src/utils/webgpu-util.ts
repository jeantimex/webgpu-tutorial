export async function initWebGPU(canvas: HTMLCanvasElement) {
  if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
  }

  const adapter: GPUAdapter | null = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
  }

  const device: GPUDevice = await adapter.requestDevice();

  const context: GPUCanvasContext | null = canvas.getContext("webgpu");

  if (!context) {
    throw new Error("WebGPU context not found.");
  }

  const canvasFormat: GPUTextureFormat =
    navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: canvasFormat,
  });

  return { device, context, canvasFormat, adapter };
}
