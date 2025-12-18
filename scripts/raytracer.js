import { makeShaderDataDefinitions, makeStructuredView, getSizeAndAlignmentOfUnsizedArrayElement } from './webgpu-utils-module.js';

export class Raytracer {
    objects = [];

    constructor(gpu) {
        this.ctx = gpu.ctx;
        this.device = gpu.device;
        this.shader = gpu.shader;
        this.shaderContent = gpu.shaderContent;
        this.presentationFormat = gpu.presentationFormat;
    }

    build() {
        const sphereList = [];

        this.objects.forEach((v) => {
            if (v instanceof Sphere) {
                sphereList.push(v.objectify())
            }
        });

        const {size} = getSizeAndAlignmentOfUnsizedArrayElement(this.defs.storages.spheres);
        this.sphereValues = makeStructuredView(this.defs.storages.spheres, new ArrayBuffer(size * sphereList.length));
        this.sphereBuffer = this.device.createBuffer({
            label: "sphere list buffer",
            size: this.sphereValues.arrayBuffer.byteLength, // 12 x 32 bytes
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.sphereValues.set(sphereList);
        /*this.sphereValues.set([{
            //position: 1,
        }]);*/

        this.bindGroup = this.device.createBindGroup({
            label: "bind group",
            layout: this.bindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.settingsBuffer }
            }],
        });

        this.bindGroup1 = this.device.createBindGroup({
            label: "bind group 1",
            layout: this.bindGroupLayout1,
            entries: [{
                binding: 0,
                resource: { buffer: this.sphereBuffer }
            }],
        });

        this.bindGroup2 = this.device.createBindGroup({
            label: "bind group 2",
            layout: this.bindGroupLayout2,
            entries: [{
                binding: 0,
                resource: { buffer: this.currentBuffer }
            }],
        });

        console.log(this.sphereBuffer)
        this.device.queue.writeBuffer(this.sphereBuffer, 0, this.sphereValues.arrayBuffer);
    }

    update(currentSettings, frame) {
        this.currentValues.set({
            camCFrame: currentSettings.camCFrame.matrix(),
            viewParams: currentSettings.viewParams.static(),
            frame: frame
        });

        this.device.queue.writeBuffer(this.currentBuffer, 0, this.currentValues.arrayBuffer);
    }

    setup(settings) {
        this.defs = makeShaderDataDefinitions(this.shaderContent);

        const settingsValues = makeStructuredView(this.defs.uniforms.setup);

        settingsValues.set({
            resolution: [canvas.width, canvas.height],
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

        // --------
        
        const vertexBuffersDescriptors = [
            {
                attributes: [
                    {
                        shaderLocation: 0,
                        offset: 0,
                        format: "float32x4",
                    },
                ],
                arrayStride: 16,
                stepMode: "vertex",
            },
        ];

        this.bindGroupLayout = this.device.createBindGroupLayout({
            label: "bind group layout",
            entries: [{
                binding: 0, // uniform
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {type: "uniform"},
            }]
        });

        this.bindGroupLayout1 = this.device.createBindGroupLayout({
            label: "bind group layout 1",
            entries: [{
                binding: 0, // storage
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {type: "read-only-storage"},
            }]
        });

        this.bindGroupLayout2 = this.device.createBindGroupLayout({
            label: "bind group layout 2",
            entries: [{
                binding: 0, // storage
                visibility: GPUShaderStage.FRAGMENT,
                buffer: { type: "uniform" },
            }]
        });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [
                this.bindGroupLayout, // @group(0)
                this.bindGroupLayout1, // @group(1)
                this.bindGroupLayout2 // @group(2)
            ]
        });

        this.renderPassDescriptor = {
            label: 'renderPass',
            colorAttachments: [
                {
                    // view: <- to be filled out when we render
                    clearValue: [0.0, 0.0, 0.0, 0.0],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        };

        this.pipeline = this.device.createRenderPipeline({
            label: "ray tracing",
            layout: pipelineLayout,
            vertex: {
                entryPoint: "vs",
                module: this.shader,
                buffers: vertexBuffersDescriptors,
            },
            fragment: {
                entryPoint: "fs",
                module: this.shader,
                targets: [{ format: this.presentationFormat }]
            }
        })

        // --------

        const vertices = new Float32Array([
            -1.0, -1.0, 0, 1,
            -1.0, 1.0, 0, 1,
            1.0, -1.0, 0, 1,
            -1.0, 1.0, 0, 1,
            1.0, 1.0, 0, 1,
            1.0, -1.0, 0, 1,
        ]);
        this.vertexBuffer = this.device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });

        new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
        this.vertexBuffer.unmap();
    }

    render() {
        // Get the current texture from the canvas context and
        // set it as the texture to render to.
        this.renderPassDescriptor.colorAttachments[0].view =
            this.ctx.getCurrentTexture().createView();

        // make a command encoder to start encoding commands
        const encoder = this.device.createCommandEncoder({ label: 'encoder' });

        // make a render pass encoder to encode render specific commands
        const pass = encoder.beginRenderPass(this.renderPassDescriptor);

        pass.setPipeline(this.pipeline);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setBindGroup(0, this.bindGroup);
        pass.setBindGroup(1, this.bindGroup1);
        pass.setBindGroup(2, this.bindGroup2);
        pass.draw(6);
        pass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    insert(object) {
        this.objects.push(object);
        return object;
    }
}