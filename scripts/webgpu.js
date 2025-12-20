export async function initGpu(canvas, hdr) {
    const gpu = {};

    if (!navigator.gpu) {
        console.log("im sorry bro i think yo browser doesn't support webgpu. you live in the past buddy");
    }

    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();

    const ctx = canvas.getContext("webgpu");

    // get render shader thing
    await fetch("shaders/shader.wgsl").then((response) => {
        if (!response.ok) {
            console.log("response not ok bruv; status: " + response.status);
        }
        return response.text();
    }).then((text) => {
        console.log("got vertex + fragment shader !!!");
        gpu.shaderContent = text;
    }).catch((error) => {
        console.log("response error ded ded: " + error.message);
    });

    // get compute shader
    await fetch("shaders/tracing.wgsl").then((response) => {
        if (!response.ok) {
            console.log("response not ok bruv; status: " + response.status);
        }
        return response.text();
    }).then((text) => {
        console.log("got compute shader !!!");
        gpu.computeShaderContent = text;
    }).catch((error) => {
        console.log("response error ded ded: " + error.message);
    });

    const format = "rgba8unorm";
    //const format = navigator.gpu.getPreferredCanvasFormat();
    gpu.presentationFormat = hdr ? "rgba16float" : format;
    ctx.configure({
        device,
        format: gpu.presentationFormat,
        toneMapping: {
            mode: hdr ? "extended" : "standard"
        },
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
    });

    gpu.shader = device.createShaderModule({
        label: "ray tracing vertex + fragment shader",
        code: gpu.shaderContent,
    });

    gpu.computeShader = device.createShaderModule({
        label: "ray tracing compute shader",
        code: gpu.computeShaderContent,
    });

    gpu.ctx = ctx;
    gpu.device = device;

    return gpu
}