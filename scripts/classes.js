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
        );
    }

    lerp(vec, t) {
        return new Vector3(
            this.x + (vec.x - this.x) * t,
            this.y + (vec.y - this.y) * t,
            this.z + (vec.z - this.z) * t
        );
    }

    nlerp(vec, t) {
        return new Vector3(
            this.x + (vec.x - this.x) * t,
            this.y + (vec.y - this.y) * t,
            this.z + (vec.z - this.z) * t
        ).unit();
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
    constructor(px = 0, py = 0, pz = 0, xx = 1, yx = 0, zx = 0, xy = 0, yy = 1, zy = 0, xz = 0, yz = 0, zz = 1) {
        if (px instanceof Vector3) {
            this.position = px;
            this.rightVector = new Vector3(1, 0, 0);
            this.upVector = new Vector3(0, 1, 0);
            this.lookVector = new Vector3(0, 0, 1);
        } else {
            this.position = new Vector3(px, py, pz);
            this.rightVector = new Vector3(xx, xy, xz);
            this.upVector = new Vector3(yx, yy, yz);
            this.lookVector = new Vector3(zx, zy, zz);
        }
    }

    static() {
        return [
            this.position.x, this.position.y, this.position.z,
            this.rightVector.x, this.upVector.x, this.lookVector.x,
            this.rightVector.y, this.upVector.y, this.lookVector.y,
            this.rightVector.z, this.upVector.z, this.lookVector.z
        ]
    }

    /*
    // in columns: rightVector, upVector, lookVector, position
    [ 0,  4,  8, 12]
    [ 1,  5,  9, 13]
    [ 2,  6, 10, 14]
    [ 3,  7, 11, 15]
    */

    matrix() { // convert to 4x4 matrix in array
        return [
            this.rightVector.x, this.rightVector.y, this.rightVector.z, 0,
            this.upVector.x,    this.upVector.y,    this.upVector.z,    0,     
            this.lookVector.x,  this.lookVector.y,  this.lookVector.z,  0,
            this.position.x,    this.position.y,    this.position.z,    1
        ]
    }

    eulerXYZ() { // convert rotation matrix to euler angles in (xyz)
        return new Vector3(
            Math.atan2(-this.lookVector.y, this.lookVector.z),
            Math.asin(this.lookVector.x),
            Math.atan2(-this.upVector.x, this.rightVector.x)
        )
    }

    eulerYXZ() { // convert rotation matrix to euler angles in (yxz)
        return new Vector3(
            Math.asin(-this.lookVector.y),
            Math.atan2(this.lookVector.x, this.lookVector.z),
            Math.atan2(this.rightVector.y, this.upVector.y)
        )
    }

    quaternion() { // convert rotation matrix to quaternion
        let i, t, a, b, c;

        if (this.rightVector.x + this.upVector.y + this.lookVector.z > 0) {
            i = 3;
            t = 1 + this.rightVector.x + this.upVector.y + this.lookVector.z;
            a = this.upVector.z - this.lookVector.y;
            b = this.lookVector.x - this.rightVector.z;
            c = this.rightVector.y - this.upVector.x;
        } else if (this.rightVector.x >= this.upVector.y && this.rightVector.x >= this.lookVector.z) {
            i = 0;
            t = 1 + this.rightVector.x - this.upVector.y - this.lookVector.z;
            a = this.rightVector.y + this.upVector.x;
            b = this.rightVector.z + this.lookVector.z;
            c = this.upVector.z - this.lookVector.y;
        } else if (this.upVector.y > this.lookVector.z) {
            i = 1;
            t = 1 - this.rightVector.x + this.upVector.y - this.lookVector.z;
            a = this.upVector.x + this.rightVector.y;
            b = this.lookVector.y + this.upVector.z;
            c = this.lookVector.x - this.rightVector.z;
        } else {
            i = 2;
            t = 1 - this.rightVector.x - this.upVector.y + this.lookVector.z;
            a = this.lookVector.x + this.rightVector.z;
            b = this.lookVector.y + this.upVector.z;
            c = this.rightVector.y - this.upVector.x;
        }

        const s = .5 / Math.sqrt(t);

        switch (i) {
            case 3:
                return new Quaternion(a * s, b * s, c * s, t * s);
            case 2:
                return new Quaternion(a * s, b * s, t * s, c * s);
            case 1:
                return new Quaternion(a * s, t * s, b * s, c * s);
            default:
                return new Quaternion(t * s, a * s, b * s, c * s);
        }
    }

    mul(cf) { // i do not know anything about this i just know what to add and multiply
        /*
        - position x-axis: [a_0] * [b_12] + [a_4] * [b_13] + [a_8]  * [b_14] + [a_12]
        - position y-axis: [a_1] * [b_12] + [a_5] * [b_13] + [a_9]  * [b_14] + [a_13]
        - position z-axis: [a_2] * [b_12] + [a_6] * [b_13] + [a_10] * [b_14] + [a_14]

        - rightVector x-axis: [a_0] * [b_0] + [a_4] * [b_1] + [a_8] * [b_2]
        - upVector    x-axis: [a_0] * [b_4] + [a_4] * [b_5] + [a_8] * [b_6]
        - lookVector  x-axis: [a_0] * [b_8] + [a_4] * [b_9] + [a_8] * [b_10]

        - rightVector y-axis: [a_1] * [b_0] + [a_5] * [b_1] + [a_9] * [b_2]
        - upVector    y-axis: [a_1] * [b_4] + [a_5] * [b_5] + [a_9] * [b_6]
        - lookVector  y-axis: [a_1] * [b_8] + [a_5] * [b_9] + [a_9] * [b_10]

        - rightVector z-axis: [a_2] * [b_0] + [a_6] * [b_1] + [a_10] * [b_2]
        - upVector    z-axis: [a_2] * [b_4] + [a_6] * [b_5] + [a_10] * [b_6]
        - lookVector  z-axis: [a_2] * [b_8] + [a_6] * [b_9] + [a_10] * [b_10]
        */

        return new CFrame(
            this.rightVector.x * cf.position.x    + this.upVector.x * cf.position.y    + this.lookVector.x * cf.position.z + this.position.x,
            this.rightVector.y * cf.position.x    + this.upVector.y * cf.position.y    + this.lookVector.y * cf.position.z + this.position.y,
            this.rightVector.z * cf.position.x    + this.upVector.z * cf.position.y    + this.lookVector.z * cf.position.z + this.position.z,

            this.rightVector.x * cf.rightVector.x + this.upVector.x * cf.rightVector.y + this.lookVector.x * cf.rightVector.z,
            this.rightVector.x * cf.upVector.x    + this.upVector.x * cf.upVector.y    + this.lookVector.x * cf.upVector.z,
            this.rightVector.x * cf.lookVector.x  + this.upVector.x * cf.lookVector.y  + this.lookVector.x * cf.lookVector.z,

            this.rightVector.y * cf.rightVector.x + this.upVector.y * cf.rightVector.y + this.lookVector.y * cf.rightVector.z,
            this.rightVector.y * cf.upVector.x    + this.upVector.y * cf.upVector.y    + this.lookVector.y * cf.upVector.z,
            this.rightVector.y * cf.lookVector.x  + this.upVector.y * cf.lookVector.y  + this.lookVector.y * cf.lookVector.z,

            this.rightVector.z * cf.rightVector.x + this.upVector.z * cf.rightVector.y + this.lookVector.z * cf.rightVector.z,
            this.rightVector.z * cf.upVector.x    + this.upVector.z * cf.upVector.y    + this.lookVector.z * cf.upVector.z,
            this.rightVector.z * cf.lookVector.x  + this.upVector.z * cf.lookVector.y  + this.lookVector.z * cf.lookVector.z,
        );
    }

    lerp(cf, t, shortWay) {
        const cf2 = new CFrame();
        cf2.position = this.position.lerp(cf.position, t);
        
        const cf3 = this.quaternion().slerp(cf.quaternion(), t, shortWay).cframe();

        cf2.rightVector = cf3.rightVector;
        cf2.upVector = cf3.upVector;
        cf2.lookVector = cf3.lookVector;

        return cf2;
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

class Quaternion { // i DO NOT know what this is but i need it for something
    x = 0;
    y = 0;
    z = 0;
    w = 0;

    constructor(x, y, z, w) {
        this.set(x,y,z,w);
    }

    set(x, y, z, w) {
        this.x = x || this.x;
        this.y = y || this.y;
        this.z = z || this.z;
        this.w = w || this.w;
    }

    slerp(q, t, shortWay) {
        const dot = this.dot(q);
        if (shortWay && dot < 0) {
            return this.scale(-1).slerp(q, t, true);
        }

        const angle = Math.acos(dot);
        const first = this.scale(Math.sin((1 - t) * angle));
        const second = q.scale(Math.sin(t * angle));
        const division = 1 / Math.sin(angle);

        return first.add(second).scale(division);
    }

    add(q) {
        return new Quaternion(this.x + q.x, this.y + q.y, this.z + q.z, this.w + q.w);
    }

    dot(q) {
        return this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;
    }

    mul(q) {
        return new Quaternion(
            this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
            this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x,
            this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w,
            
            this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z
        )
    }

    pow(x) {
        return this.ln().scale(x).exp();
    }

    exp() { // exponential
        const r = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        const et = Math.exp(this.w);
        const s = r > 0 ? et * Math.sin(r) / r : 0;
        return new Quaternion(this.x*s,this.y*s,this.z*s,et*Math.cos(r));
    }

    ln() {
        const r = Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z);
        const t = r > 0 ? Math.atan2(r,this.w)/r : 0;
        return new Quaternion(this.x * t, this.y * t, this.z * t, 0.5 * Math.log(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z));
    }

    inverse() {
        const m = this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w;
        return new Quaternion(-this.x / m, -this.y / m, -this.z / m, this.w / m);
    }

    scale(n) {
        return new Quaternion(this.x*n,this.y*n,this.z*n,this.w*n);
    }

    cframe() { // convert to cframe (position will be 0)
        const n = 1 / Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);

        const qx = this.x * n;
        const qy = this.y * n;
        const qz = this.z * n;
        const qw = this.w * n;

        return new CFrame(
            0, 0, 0,
            1 - 2 * qy * qy - 2 * qz * qz, 2 * qx * qy - 2 * qz * qw, 2 * qx * qz + 2 * qy * qw,
            2 * qx * qy + 2 * qz * qw, 1 - 2 * qx * qx - 2 * qz * qz, 2 * qy * qz - 2 * qx * qw,
            2 * qx * qz - 2 * qy * qw, 2 * qy * qz + 2 * qx * qw, 1 - 2 * qx * qx - 2 * qy * qy
        )
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

    objectify() {
        return {
            color: this.color.static(),
            smoothness: this.smoothness,
            emissionColor: this.emissionColor.static(),
            emissionStrength: this.emissionStrength
        }
    }
}

class Sphere {
    radius = 1;
    position = new Vector3();
    material = new Material();

    objectify() {
        return {
            radius: this.radius, 
            position: this.position.static(),
            material: this.material.objectify()
        }
    }
}

class Mesh {
    triangles = [];
    material = new Material();
}

const rad = (x) => x * Math.PI / 180;
const deg = (x) => x * 180 / Math.PI;

const clamp = (x, min, max) => Math.min(Math.max(x, min), max);

const Vector3_num = (x) => new Vector3(x, x, x);
const Color3_RGB = (r, g, b) => new Color3(r / 255, g / 255, b / 255);
const Triangle_flat = (x, y, z, n) => new Triangle(x, y, z, n, n, n);

const CFrame_angles = (rx = 0, ry = 0, rz = 0) => {
    // this is something else and doesn't work because i tried
    
    /*const rxCFrame = new CFrame(0, 0, 0, 1, 0, 0, 0, Math.cos(rx), Math.sin(rx), 0, -Math.sin(rx), Math.cos(rx));
    const ryCFrame = new CFrame(0, 0, 0, Math.cos(ry), 0, -Math.sin(ry), 0, 1, 0, Math.sin(ry), 0, Math.cos(ry));
    const rzCFrame = new CFrame(0, 0, 0, Math.cos(rz), Math.sin(rz), 0, -Math.sin(rz), Math.cos(rz), 0, 0, 0, 1);*/

    const rxCFrame = new CFrame(0, 0, 0, 1, 0, 0, 0, Math.cos(rx), -Math.sin(rx), 0, Math.sin(rx), Math.cos(rx)) // roll
    const ryCFrame = new CFrame(0, 0, 0, Math.cos(ry), 0, Math.sin(ry), 0, 1, 0, -Math.sin(ry), 0, Math.cos(ry)); // pitch
    const rzCFrame = new CFrame(0, 0, 0, Math.cos(rz), -Math.sin(rz), 0, Math.sin(rz), Math.cos(rz), 0, 0, 0, 1); // yaw

    return rxCFrame.mul(ryCFrame).mul(rzCFrame);
}