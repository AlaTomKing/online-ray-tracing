import { makeShaderDataDefinitions, makeStructuredView, getSizeAndAlignmentOfUnsizedArrayElement } from './webgpu-utils-module.js';

export class Raytracer {
    objects = [];

    constructor(gpu) {
        this.ctx = gpu.ctx;
        this.device = gpu.device;
        this.shader = gpu.shader;
        this.shaderContent = gpu.shaderContent;
        this.computeShader = gpu.computeShader;
        this.computeShaderContent = gpu.computeShaderContent;
        this.presentationFormat = gpu.presentationFormat;

        this.frame = 0;
    }

    build() {
        const sphereList = [];
        const triangleList = [];
        const meshInfoList = [];

        // convert javascript classes objects to shader objects
        // that the shader can read
        this.objects.forEach((v) => {
            if (v instanceof Sphere) {
                sphereList.push(v.objectify())
            } else if (v instanceof Block) {
                const [triangles, material] = v.info();
                meshInfoList.push({
                    firstTriangleIndex: triangleList.length,
                    numTriangles: 12,
                    material,
                });
                for (let i = 0; i < 12; i++) triangleList.push(triangles[i]);
            }
        });

        const {size: sphereSize} = getSizeAndAlignmentOfUnsizedArrayElement(this.defs.storages.spheres);
        this.sphereValues = makeStructuredView(this.defs.storages.spheres, new ArrayBuffer(sphereSize * sphereList.length));
        this.sphereBuffer = this.device.createBuffer({
            label: "sphere list buffer",
            size: this.sphereValues.arrayBuffer.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.sphereValues.set(sphereList);

        const { size: triangleSize } = getSizeAndAlignmentOfUnsizedArrayElement(this.defs.storages.triangles);
        this.triangleValues = makeStructuredView(this.defs.storages.triangles, new ArrayBuffer(triangleSize * triangleList.length));
        this.triangleBuffer = this.device.createBuffer({
            label: "triangle list buffer",
            size: this.triangleValues.arrayBuffer.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.triangleValues.set(triangleList);

        const { size: meshInfoSize } = getSizeAndAlignmentOfUnsizedArrayElement(this.defs.storages.meshInfos);
        this.meshInfoValues = makeStructuredView(this.defs.storages.meshInfos, new ArrayBuffer(meshInfoSize * meshInfoList.length));
        this.meshInfoBuffer = this.device.createBuffer({
            label: "mesh info list buffer",
            size: this.meshInfoValues.arrayBuffer.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.meshInfoValues.set(meshInfoList);

        this.computeBindGroup1 = this.device.createBindGroup({
            label: "bind group 1",
            layout: this.computePipeline.getBindGroupLayout(1),
            entries: [{
                binding: 0,
                resource: { buffer: this.settingsBuffer }
            }],
        });

        this.computeBindGroup2 = this.device.createBindGroup({
            label: "bind group 2",
            layout: this.computePipeline.getBindGroupLayout(2),
            entries: [{
                binding: 0,
                resource: { buffer: this.sphereBuffer }
            }, {
                binding: 1,
                resource: { buffer: this.triangleBuffer }
            }, {
                binding: 2,
                resource: { buffer: this.meshInfoBuffer }
            }],
        });

        this.computeBindGroup3 = this.device.createBindGroup({
            label: "bind group 3",
            layout: this.computePipeline.getBindGroupLayout(3),
            entries: [{
                binding: 0,
                resource: { buffer: this.currentBuffer }
            }],
        });

        this.device.queue.writeBuffer(this.sphereBuffer, 0, this.sphereValues.arrayBuffer);
        this.device.queue.writeBuffer(this.triangleBuffer, 0, this.triangleValues.arrayBuffer);
        this.device.queue.writeBuffer(this.meshInfoBuffer, 0, this.meshInfoValues.arrayBuffer);
    }

    update(currentSettings, frame) {
        this.currentValues.set({
            camCFrame: currentSettings.camCFrame.matrix(),
            viewParams: currentSettings.viewParams.static(),
            frame: frame
        });

        this.renderFrameValues.set(frame);

        this.device.queue.writeBuffer(this.currentBuffer, 0, this.currentValues.arrayBuffer);
        this.device.queue.writeBuffer(this.renderFrameBuffer, 0, this.renderFrameValues.arrayBuffer);
    }

    setup(settings) {
        this.defs = makeShaderDataDefinitions(this.computeShaderContent);
        this.defs2 = makeShaderDataDefinitions(this.shaderContent);
        const settingsValues = makeStructuredView(this.defs.uniforms.setup);

        settingsValues.set({
            resolution: [canvas.width, canvas.height],
            crapRender: settings.crapRender ? 1 : 0,
            environmentEnabled: settings.environmentEnabled ? 1 : 0,
            sunFocus: settings.sunFocus,
            groundColor: settings.groundColor.static(),
            sunColor: settings.sunColor.static(),
            skyColorHorizon: settings.skyColorHorizon.static(),
            skyColorZenith: settings.skyColorZenith.static(),
            sunLightDirection: settings.sunLightDirection.static(),
            maxBounceCount: settings.maxBounceCount,
            numOfRaysPerPixel: settings.numOfRaysPerPixel
        })

        this.settingsBuffer = this.device.createBuffer({
            label: "settings buffer",
            size: settingsValues.arrayBuffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.device.queue.writeBuffer(this.settingsBuffer, 0, settingsValues.arrayBuffer);

        // --------

        this.currentValues = makeStructuredView(this.defs.uniforms.currentSetup);
        this.currentBuffer = this.device.createBuffer({
            label: "current settings buffer",
            size: this.currentValues.arrayBuffer.byteLength, // 12 x 32 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.renderFrameValues = makeStructuredView(this.defs2.uniforms.renderedFrames);
        this.renderFrameBuffer = this.device.createBuffer({
            label: "render frame buffer",
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // --------

        this.bindGroupLayout0 = this.device.createBindGroupLayout({
            label: "bind group layout 0",
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: { format: "rgba8unorm" }
            }]
        });

        this.bindGroupLayout1 = this.device.createBindGroupLayout({
            label: "bind group layout 1",
            entries: [{
                binding: 0, // uniform
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "uniform" },
            }]
        });

        this.bindGroupLayout2 = this.device.createBindGroupLayout({
            label: "bind group layout 2",
            entries: [{
                binding: 0, // storage
                visibility: GPUShaderStage.COMPUTE,
                buffer: {type: "read-only-storage"},
            }, {
                binding: 1, // storage
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" },
            }, {
                binding: 2, // storage
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" },
            }]
        });

        this.bindGroupLayout3 = this.device.createBindGroupLayout({
            label: "bind group layout 3",
            entries: [{
                binding: 0, // uniform
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "uniform" },
            }]
        });

        const computePipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [
                this.bindGroupLayout0, // @group(0)
                this.bindGroupLayout1, // @group(1)
                this.bindGroupLayout2, // @group(2)
                this.bindGroupLayout3 // @group(3)
            ]
        });

        // --------

        this.renderBindGroupLayout = this.device.createBindGroupLayout({
            label: "render bind group layout 0",
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                texture: { format: "rgba8unorm" }
            }, {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                texture: { format: "rgba8unorm" }
            }, {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: { type: "uniform" }
            }]
        });

        const renderPipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [ this.renderBindGroupLayout ]
        });

        // --------

        this.renderPassDescriptor = {
            label: 'renderPass',
            colorAttachments: [
                {
                    // view: <- to be filled out when we render
                    clearValue: [0.0, 0.0, 0.0, 0.0],
                    loadOp: 'load',
                    storeOp: 'store',
                },
            ],
        };

        this.computePipeline = this.device.createComputePipeline({
            label: "ray tracing compute pipeline",
            layout: computePipelineLayout,
            compute: {
                entryPoint: "main",
                module: this.computeShader,
            }
        });

        this.renderPipeline = this.device.createRenderPipeline({
            label: "ray tracing basic pipeline",
            layout: renderPipelineLayout,
            vertex: {
                entryPoint: "vertexMain",
                module: this.shader
            },
            fragment: {
                entryPoint: "fragMain",
                module: this.shader,
                targets: [{ format: this.presentationFormat }]
            }
        });

        // --------

        this.imageInputTexture = this.device.createTexture({
            size: [canvas.width, canvas.height, 1],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.COPY_SRC |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.RENDER_ATTACHMENT
        });

        this.imageOutputTexture = this.device.createTexture({
            size: [canvas.width, canvas.height, 1],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.STORAGE_BINDING |
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.COPY_SRC
        });

        this.computeBindGroup0 = this.device.createBindGroup({
            layout: this.bindGroupLayout0,
            entries: [
                {
                    binding: 0,
                    resource: this.imageOutputTexture.createView(),
                }
            ]
        });

        // for vertex + fragment shader
        this.renderBindGroup = this.device.createBindGroup({
            label: "render bind group",
            layout: this.renderBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.imageInputTexture.createView(),
                },
                {
                    binding: 1,
                    resource: this.imageOutputTexture.createView()
                },
                {
                    binding: 2,
                    resource: this.renderFrameBuffer
                }
            ]
        });
    }

    render() {
        // Get the current texture from the canvas context and
        // set it as the texture to render to.
        this.renderPassDescriptor.colorAttachments[0].view =
            this.ctx.getCurrentTexture().createView();

        // make a command encoder to start encoding commands
        const encoder = this.device.createCommandEncoder({ label: 'encoder' });

        // copy texture
        encoder.copyTextureToTexture(
            { texture: this.ctx.getCurrentTexture() }, { texture: this.imageInputTexture },
            { width: canvas.width, height: canvas.height }
        );

        // make a compute pass encoder to do all of the everything
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.computeBindGroup0);
        computePass.setBindGroup(1, this.computeBindGroup1);
        computePass.setBindGroup(2, this.computeBindGroup2);
        computePass.setBindGroup(3, this.computeBindGroup3);
        computePass.dispatchWorkgroups(canvas.width, canvas.height);
        computePass.end();

        /*if (this.frame == 0) {
            encoder.copyTextureToTexture(
                { texture: this.imageOutputTexture }, { texture: this.imageInputTexture },
                { width: canvas.width, height: canvas.height }
            );
        }*/

        // make a render pass encoder to encode render specific commands
        const renderPass = encoder.beginRenderPass(this.renderPassDescriptor);
        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.renderBindGroup);
        renderPass.draw(6);
        renderPass.end();

        this.device.queue.submit([encoder.finish()]);

        //console.log(this.ctx.getCurrentTexture())
    }

    insert(object) {
        this.objects.push(object);
        return object;
    }
}