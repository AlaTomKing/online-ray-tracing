class Raytracer {
    objects = [];

    constructor(gl) {
        /** @type {Webthis.gl2RenderingContext} */
        this.gl = gl;
    }

    build() {
        this.vertexBuffer = this.gl.createBuffer();
        this.vertexBuffer.itemSize = 2;
        this.vertexBuffer.numItems = 4;

        const vertices = [
            -1.0, 1.0,
            -1.0, -1.0,
            1.0, 1.0,
            1.0, -1.0];
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        console.log(this.vertexBuffer)
    }

    setup(settings) {
        this.gl.shaderProgram.environmentEnabled = this.gl.getUniformLocation(this.gl.shaderProgram, "environmentEnabled");

        this.gl.shaderProgram.sunFocus = this.gl.getUniformLocation(this.gl.shaderProgram, "sunFocus");
        this.gl.shaderProgram.sunColor = this.gl.getUniformLocation(this.gl.shaderProgram, "sunColor");
        this.gl.shaderProgram.groundColor = this.gl.getUniformLocation(this.gl.shaderProgram, "groundColor");

        this.gl.shaderProgram.skyColorHorizon = this.gl.getUniformLocation(this.gl.shaderProgram, "skyColorHorizon");
        this.gl.shaderProgram.skyColorZenith = this.gl.getUniformLocation(this.gl.shaderProgram, "skyColorZenith");
        this.gl.shaderProgram.sunLightDirection = this.gl.getUniformLocation(this.gl.shaderProgram, "sunLightDirection");

        this.gl.uniform1i(this.gl.shaderProgram.environmentEnabled, settings.environmentEnabled);

        this.gl.uniform1f(this.gl.shaderProgram.sunFocus, settings.sunFocus);
        this.gl.uniform3f(this.gl.shaderProgram.sunColor, settings.sunColor.x, settings.sunColor.y, settings.sunColor.z);
        this.gl.uniform3f(this.gl.shaderProgram.groundColor, settings.groundColor.x, settings.groundColor.y, settings.groundColor.z);

        this.gl.uniform3f(this.gl.shaderProgram.skyColorHorizon, settings.skyColorHorizon.x, settings.skyColorHorizon.y, settings.skyColorHorizon.z);
        this.gl.uniform3f(this.gl.shaderProgram.skyColorZenith, settings.skyColorZenith.x, settings.skyColorZenith.y, settings.skyColorZenith.z);
        this.gl.uniform3f(this.gl.shaderProgram.sunLightDirection, settings.sunLightDirection.x, settings.sunLightDirection.y, settings.sunLightDirection.z);

        // --------

        this.gl.shaderProgram.viewParams = this.gl.getUniformLocation(this.gl.shaderProgram, "viewParams");

        this.gl.shaderProgram.camCframePos = this.gl.getUniformLocation(this.gl.shaderProgram, "camCframePos");
        this.gl.shaderProgram.camCframeRight = this.gl.getUniformLocation(this.gl.shaderProgram, "camCframeRight");
        this.gl.shaderProgram.camCframeUp = this.gl.getUniformLocation(this.gl.shaderProgram, "camCframeUp");
        this.gl.shaderProgram.camCframeLook = this.gl.getUniformLocation(this.gl.shaderProgram, "camCframeLook");

        this.gl.shaderProgram.camCframe = this.gl.getUniformLocation(this.gl.shaderProgram, "camCframe");
    }

    render(cSettings) {
        console.log(cSettings.viewParams)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(this.gl.shaderProgram.vertexPositionAttribute, this.vertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

        this.gl.uniform3f(this.gl.shaderProgram.viewParams, cSettings.viewParams.x, cSettings.viewParams.y, cSettings.viewParams.z);

        this.gl.uniform3f(this.gl.shaderProgram.camCframePos, cSettings.camCframePos.x, cSettings.camCframePos.y, cSettings.camCframePos.z);
        this.gl.uniform3f(this.gl.shaderProgram.camCframeRight, cSettings.camCframeRight.x, cSettings.camCframeRight.y, cSettings.camCframeRight.z);
        this.gl.uniform3f(this.gl.shaderProgram.camCframeUp, cSettings.camCframeUp.x, cSettings.camCframeUp.y, cSettings.camCframeUp.z);
        this.gl.uniform3f(this.gl.shaderProgram.camCframeLook, cSettings.camCframeLook.x, cSettings.camCframeLook.y, cSettings.camCframeLook.z);

        this.gl.uniform

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertexBuffer.numItems);
    }

    insert(object) {
        this.objects.push(object);
        return object;
    }
}

class Vector3 {
    x = 0; y = 0; z = 0;

    constructor(x, y, z) {
        this.set(x, y, z);
    }

    set(x, y, z) {
        this.x = x || this.x;
        this.y = y || this.y;
        this.z = z || this.z;
    }

    static() {
        return [this.x, this.y, this.z];
    }

    add(vec) {
        if (vec instanceof Vector3)
            return new Vector3(this.x + vec.x, this.y + vec.y, this.z + vec.z)
        else if (typeof vec === "number")
            return new Vector3(this.x + vec, this.y + vec, this.z + vec)
    }

    sub(vec) {
        if (vec instanceof Vector3)
            return new Vector3(this.x - vec.x, this.y - vec.y, this.z - vec.z)
        else if (typeof vec === "number")
            return new Vector3(this.x - vec, this.y - vec, this.z - vec)
    }

    mul(vec) {
        if (vec instanceof Vector3)
            return new Vector3(this.x * vec.x, this.y * vec.y, this.z * vec.z)
        else if (typeof vec === "number")
            return new Vector3(this.x * vec, this.y * vec, this.z * vec)
    }

    div(vec) {
        if (vec instanceof Vector3)
            return new Vector3(this.x / vec.x, this.y / vec.y, this.z / vec.z)
        else if (typeof vec === "number")
            return new Vector3(this.x / vec, this.y / vec, this.z / vec)
    }

    neg() {
        return new Vector3(-this.x, -this.y, -this.z)
    }

    magnitude() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2))
    }

    unit() {
        const magnitude = this.magnitude();
        return new Vector3(
            this.x / magnitude,
            this.y / magnitude,
            this.z / magnitude
        )
    }

    dot(vec) {
        return (this.x * vec.x) + (this.y * vec.y) + (this.z * vec.z)
    }

    cross(vec) {
        return new Vector3(
            (this.y * vec.z) - (this.z * vec.y),
            (this.z * vec.x) - (this.x * vec.z),
            (this.x * vec.y) - (this.y * vec.x)
        )
    }

    lerp(vec, t) {
        return new Vector3(
            this.x + (vec.x - this.x) * t,
            this.y + (vec.y - this.y) * t,
            this.z + (vec.z - this.z) * t
        )
    }

    min(vec) {
        return new Vector3(
            Math.min(this.x, vec.x),
            Math.min(this.y, vec.y),
            Math.min(this.z, vec.z)
        )
    }

    max(vec) {
        return new Vector3(
            Math.max(this.x, vec.x),
            Math.max(this.y, vec.y),
            Math.max(this.z, vec.z)
        )
    }
}

class CFrame {
    constructor(px, py, pz, xx, yx, zx, xy, yy, zy, xz, yz, zz) {
        this.position = new Vector3(px, py, pz);
        this.rightVector = new Vector3(xx, xy, xz);
        this.upVector = new Vector3(yx, yy, yz);
        this.lookVector = new Vector3(zx, zy, zz);
    }

    static() {
        return [
            this.position.x, this.position.y, this.position.z,
            this.rightVector.x, this.rightVector.y, this.rightVector.z,
            this.upVector.x, this.upVector.y, this.upVector.z,
            this.lookVector.x, this.lookVector.y, this.lookVector.z
        ]
    }
}

class Color3 {
    r = 0; g = 0; b = 0;

    constructor(r, g, b) {
        this.set(r, g, b);
    }

    set(r, g, b) {
        this.r = r || this.r;
        this.g = g || this.g;
        this.b = b || this.b;
    }

    static() {
        return [this.r, this.g, this.b];
    }

    toVector3() {
        return new Vector3(this.r, this.g, this.b);
    }

    toRGB() {
        return [Math.floor(this.r * 255), Math.floor(this.g * 255), Math.floor(this.b * 255)]
    }
}

class Triangle {
    posA = new Vector3();
    posB = new Vector3();
    posC = new Vector3();

    triA = new Vector3();
    triB = new Vector3();
    triC = new Vector3();

    constructor(posA, posB, posC, triA, triB, triC) {
        this.posA = posA || this.posA;
        this.posB = posB || this.posB;
        this.posC = posC || this.posC;
        this.triA = triA || this.triA;
        this.triB = triB || this.triB;
        this.triC = triC || this.triC;
    }
}

class Material {
    color = new Color3();
    smoothness = 0;

    emissionColor = new Color3();
    emissionStrength = 0;
}

class Sphere {
    radius = 1;
    position = new Vector3();
}

class Mesh {
    triangles = [];
    material = new Material();
}

const Vector3_num = (x) => new Vector3(x, x, x);
const Color3_RGB = (r, g, b) => new Color3(r / 255, g / 255, b / 255);
const Triangle_flat = (x, y, z, n) => new Triangle(x, y, z, n, n, n);