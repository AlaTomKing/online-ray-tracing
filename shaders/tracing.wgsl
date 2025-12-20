// ray tracing shader

// ---- buffers that are given ----
@group(0) @binding(0) var outputTex : texture_storage_2d<rgba8unorm, write>;

@group(1) @binding(0) var<uniform> setup: Settings;

@group(2) @binding(0) var<storage, read> spheres: array<Sphere>;
@group(2) @binding(1) var<storage, read> triangles: array<Triangle>;
@group(2) @binding(2) var<storage, read> meshInfos: array<MeshInfo>;

@group(3) @binding(0) var<uniform> currentSetup: CurrentSettings;
// --------

// ---- structs ----
struct Ray {
    origin: vec3<f32>,
    dir: vec3<f32>
}

struct HitInfo {
    didHit: bool,
    dst: f32,
    hitPoint: vec3<f32>,
    normal: vec3<f32>,
    material: RayTracingMaterial
}

struct Triangle {
    posA: vec3<f32>,
    posB: vec3<f32>,
    posC: vec3<f32>,
    normA: vec3<f32>,
    normB: vec3<f32>,
    normC: vec3<f32>
}

struct MeshInfo {
    firstTriangleIndex: u32,
    numTriangles: u32,
    material: RayTracingMaterial,
}

struct RayTracingMaterial {
    color: vec3<f32>,
    smoothness: f32,
    emissionColor: vec3<f32>,
    emissionStrength: f32
}

struct Sphere {
    radius: f32,
    position: vec3<f32>,
    material: RayTracingMaterial
}
// --------

override PI = 3.1415926538;

// settings that doesn't update frequently if at all
struct Settings {
    resolution: vec2<u32>,

    crapRender: u32,
    environmentEnabled: u32,

    sunFocus: f32,
    groundColor: vec3<f32>,
    sunColor: vec3<f32>,

    skyColorHorizon: vec3<f32>,
    skyColorZenith: vec3<f32>,
    sunLightDirection: vec3<f32>,

    maxBounceCount: u32,
    numOfRaysPerPixel: u32
}

struct CurrentSettings {
    camCFrame: mat4x4<f32>,
    viewParams: vec3<f32>,
    frame: u32
}

var<private> state: u32;

// ---- random functions ----
fn nextRandom() -> u32 {
    state = (state * 747796405u + 2891336453u);
    var result = ((state >> ((state >> 28) + 4u)) ^ state) * 277803737u;
    result = (result >> 22) ^ result;
    return result;
}

fn randomValue() -> f32 {
    return f32(nextRandom()) / 4294967295.0;
}

fn randomValueNormalDistribution() -> f32 {
    let theta = 2 * PI * randomValue();
    let rho = sqrt(- 2 * log(randomValue()));
    return rho * cos(theta);
}

fn randomDirection() -> vec3<f32> {
    let x = randomValueNormalDistribution();
    let y = randomValueNormalDistribution();
    let z = randomValueNormalDistribution();

    return normalize(vec3(x, y, z));
}

// --------

// ---- ray something ----
fn raySphere(r: Ray, sphereCenter: vec3<f32>, sphereRadius: f32) -> HitInfo {
    var hitInfo: HitInfo;
    let offsetRayRegion = r.origin - sphereCenter;

    let a = dot(r.dir, r.dir);
    let b = 2 * dot(offsetRayRegion, r.dir);
    let c = dot(offsetRayRegion, offsetRayRegion) - (sphereRadius * sphereRadius);

    let discriminant = b * b - 4 * a * c;

    if (discriminant >= 0.0) {
        let dst = (- b - sqrt(discriminant)) / (2 * a);

        if (dst >= 0.0) {
            hitInfo.didHit = true;
            hitInfo.dst = dst;
            hitInfo.hitPoint = r.origin + r.dir * dst;
            hitInfo.normal = normalize(hitInfo.hitPoint - sphereCenter);
        }
    }

    return hitInfo;
}

fn rayTriangle(r: Ray, tri: Triangle) -> HitInfo {
    let edgeAB = tri.posB - tri.posA;
    let edgeAC = tri.posC - tri.posA;
    let normalVector = cross(edgeAB, edgeAC);
    let ao = r.origin - tri.posA;
    let dao = cross(ao, r.dir);

    let determinant = - dot(r.dir, normalVector);
    let invDet = 1.0 / determinant;

    let dst = dot(ao, normalVector) * invDet;
    let u = dot(edgeAC, dao) * invDet;
    let v = - dot(edgeAB, dao) * invDet;
    let w = 1 - u - v;

    var hitInfo = HitInfo();
    hitInfo.didHit = determinant >= 1E-6 && dst >= 0 && u >= 0 && v >= 0 && w >= 0;
    hitInfo.hitPoint = r.origin + r.dir * dst;
    hitInfo.normal = (tri.normA * w + tri.normB * u + tri.normC * v);
    hitInfo.dst = dst;

    return hitInfo;
}

// --------

fn calculateRayCollision(ray: Ray) -> HitInfo {
    var closestHit = HitInfo();
    closestHit.dst = bitcast<f32>(0x7F7FFFFF);
    // maximum value of float

    var i: u32;
    var hitInfo: HitInfo;
    for (i = 0u; i < arrayLength(&spheres); i++) {
        let sphere = spheres[i];
        hitInfo = raySphere(ray, sphere.position, sphere.radius);

        if (hitInfo.didHit && hitInfo.dst < closestHit.dst) {
            closestHit = hitInfo;
            closestHit.material = sphere.material;
        }
    }

    for (i = 0u; i < arrayLength(&meshInfos); i++) {
        let meshInfo = meshInfos[i];

        for (var t = 0u; t < meshInfo.numTriangles; t++) {
            let tri = triangles[meshInfo.firstTriangleIndex + t];
            hitInfo = rayTriangle(ray, tri);

            if (hitInfo.didHit && hitInfo.dst < closestHit.dst) {
                closestHit = hitInfo;
                closestHit.material = meshInfo.material;
            }
        }
    }

    return closestHit;
}

fn getEnvironmentLight(dir: vec3<f32>) -> vec3<f32> {
    if (setup.environmentEnabled == 0) {
        return vec3(0.0);
    }

    var sunMask: f32;

    let skyGradientT = pow(smoothstep(0.0f, 0.4f, dir.y), 0.35f);
    let groundToSkyT = smoothstep(- 0.01f, 0.0f, dir.y);
    let skyGradient = mix(setup.skyColorHorizon, setup.skyColorZenith, skyGradientT);

    let s = 1000.0f * (1.0f / setup.sunFocus);
    let sun = pow(max(0.0f, dot(dir, setup.sunLightDirection)), s);
    if (groundToSkyT >= 1.0f) {
        sunMask = 1.0f;
    }
    else {
        sunMask = 0.0f;
    }
    ;
    let composite = mix(setup.groundColor, skyGradient, groundToSkyT) + (sun * setup.sunColor * sunMask);

    return composite;
}

fn trace(initialRay: Ray) -> vec3<f32> {
    var incomingLight = vec3(0.0);
    var rayColor = vec3(1.0);

    var ray = initialRay;

    for (var i = 0u; i < setup.maxBounceCount; i++) {
        let hitInfo = calculateRayCollision(ray);
        let material = hitInfo.material;

        if (hitInfo.didHit) {
            ray.origin = hitInfo.hitPoint;
            let diffuseDir = normalize(hitInfo.normal + randomDirection());
            var specularDir: vec3<f32>;
            if (material.smoothness > 0.0) {
                specularDir = reflect(ray.dir, hitInfo.normal);
            }
            else {
                specularDir = vec3(0);
            }
            ray.dir = mix(diffuseDir, specularDir, material.smoothness);

            let emittedLight = material.emissionColor * material.emissionStrength;
            incomingLight += (emittedLight * rayColor);
            rayColor *= material.color;
        }
        else {
            incomingLight += getEnvironmentLight(ray.dir) * rayColor;
            break;
        }
    }

    return incomingLight;
}

// crappier version of trace
fn trace1(ray: Ray) -> vec3<f32> {
    var incomingLight = vec3(0.0);
    var rayColor = vec3(1.0);

    let hitInfo = calculateRayCollision(ray);
    let material = hitInfo.material;

    if (hitInfo.didHit) {
        let val = mix(0.3, 1 - (dot(ray.dir, hitInfo.normal) + 1) / 2, 0.7);

        let emittedLight = material.emissionColor;
        let num = max(0.3, (hitInfo.normal.x + hitInfo.normal.y + hitInfo.normal.z));
        //incomingLight = emittedLight + vec3(num) * material.color;

        var r = vec3(0.0);

        if (material.smoothness > 0) {
            r = getEnvironmentLight(reflect(ray.dir, hitInfo.normal));
        }

        incomingLight = emittedLight + vec3(val) * mix(material.color, r, material.smoothness) * clamp(1 - log(length(hitInfo.hitPoint - ray.origin) / 10) / 5, 0.1, 1);
    }
    else {
        incomingLight = vec3(0.1);
    }

    return incomingLight;
}

@compute @workgroup_size(1,1,1)
fn main(@builtin(global_invocation_id) invocationId: vec3<u32>) {
    let fragCoord = vec4(invocationId.x, setup.resolution.y - invocationId.y, 0u, 1u);
    let pixelIdx = u32(fragCoord.y * setup.resolution.x + fragCoord.x);
    let tPos = vec2f(fragCoord.xy) / vec2f(setup.resolution);

    let pointLocal = vec3(tPos.x - 0.5, tPos.y - 0.5, 1) * currentSetup.viewParams;
    let point = (currentSetup.camCFrame[3] + (currentSetup.camCFrame[0] * pointLocal.x) + (currentSetup.camCFrame[1] * pointLocal.y) - (currentSetup.camCFrame[2] * pointLocal.z)).xyz;

    let ray = Ray(currentSetup.camCFrame[3].xyz, normalize(point - currentSetup.camCFrame[3].xyz));

    var totalIncomingLight = vec3(0.0);

    if (setup.crapRender == 1) {
        totalIncomingLight = trace1(ray);
    } else {
        state = pixelIdx + currentSetup.frame * 719393u;

        for (var rayIndex = 0u; rayIndex < setup.numOfRaysPerPixel; rayIndex++) {
            let t = trace(ray);
            totalIncomingLight += t;
        }
        totalIncomingLight /= f32(setup.numOfRaysPerPixel);
    }

    textureStore(outputTex, vec2u(invocationId.x,invocationId.y), vec4(totalIncomingLight, 1));
}

