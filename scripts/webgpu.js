export async function initGpu(canvas, hdr) {
    const gpu = {};

    if (!navigator.gpu) {
        console.log("im sorry bro i think yo browser doesn't support webgpu. you live in the past buddy");
    }

    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();

    const ctx = canvas.getContext("webgpu");

    await fetch("shaders/tracing.wgsl").then((response) => {
        if (!response.ok) {
            console.log("response not ok bruv; status: " + response.status);
        }
        return response.text();
    }).then((text) => {
        console.log("got shader !!!");
        gpu.shaderContent = text;
    }).catch((error) => {
        console.log("response error ded ded: " + error.message);
    });

    gpu.presentationFormat = hdr ? "rgba16float" : navigator.gpu.getPreferredCanvasFormat();
    ctx.configure({
        device,
        format: gpu.presentationFormat,
        toneMapping: {
            mode: hdr ? "extended" : "standard"
        }
    });

    gpu.shader = device.createShaderModule({
        label: "ray tracing",
        code: gpu.shaderContent,
    });

    gpu.ctx = ctx;
    gpu.device = device;

    return gpu
}