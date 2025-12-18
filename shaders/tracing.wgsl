// ray tracing shader

// -----------------------------------------------------------------------------
// ---- this is literally the entire vertex ------------------------------------
// -----------------------------------------------------------------------------
@vertex
fn vs(@location(0) position: vec4f) -> @builtin(position) vec4f {
    return position;
}
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------


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
    posA: vec3<f32>, posB: vec3<f32>, posC: vec3<f32>,
    normA: vec3<f32>, normB: vec3<f32>, normC: vec3<f32>
}

struct RayTracingMaterial {
    color: vec3<f32>,
    smoothness: f32,
    emissionColor: vec3<f32>,
    emissionStrength: f32
};

struct Sphere {
    radius: f32,
    position: vec3<f32>,
    material: RayTracingMaterial
};
// --------

override PI = 3.1415926538;

// settings that doesn't update frequently if at all
struct Settings {
    resolution: vec2<f32>,

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

// ---- uniforms that are given ----
@group(0) @binding(0) var<uniform> setup: Settings;
@group(1) @binding(0) var<storage, read> spheres: array<Sphere>;
@group(2) @binding(0) var<uniform> currentSetup: CurrentSettings;

// --------

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
    let rho = sqrt(-2 * log(randomValue()));
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
        let dst = (-b - sqrt(discriminant)) / (2 * a);

        if (dst >= 0.0) {
            hitInfo.didHit = true;
            hitInfo.dst = dst;
            hitInfo.hitPoint = r.origin + r.dir * dst;
            hitInfo.normal = normalize(hitInfo.hitPoint - sphereCenter);
        }
    }

    return hitInfo;
}
// --------

fn calculateRayCollision(ray: Ray) -> HitInfo {
    var closestHit = HitInfo();
    closestHit.dst = bitcast<f32>(0x7F7FFFFF); // maximum value of float

    for (var i = 0u; i < arrayLength(&spheres); i++) {
        let sphere = spheres[i];
        let hitInfo = raySphere(ray, sphere.position, sphere.radius);

        if (hitInfo.didHit && hitInfo.dst < closestHit.dst) {
            closestHit = hitInfo;
            closestHit.material = sphere.material;
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
    let groundToSkyT = smoothstep(-0.01f, 0.0f, dir.y);
    let skyGradient = mix(setup.skyColorHorizon, setup.skyColorZenith, skyGradientT);

    let s = 1000.0f * (1.0f / setup.sunFocus);
    let sun = pow(max(0.0f, dot(dir, setup.sunLightDirection)), s);
    if (groundToSkyT >= 1.0f) {sunMask = 1.0f;} else {sunMask = 0.0f;};
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
            var specularDir: vec3<f32>; if (material.smoothness > 0.0) {specularDir = reflect(ray.dir, hitInfo.normal); } else { specularDir = vec3(0); }
            ray.dir = mix(diffuseDir, specularDir, material.smoothness);

            let emittedLight = material.emissionColor * material.emissionStrength;
            incomingLight += (emittedLight * rayColor);
            rayColor *= material.color;
        } else {
            incomingLight += getEnvironmentLight(ray.dir) * rayColor;
            break;
        }
    }

    return incomingLight;
}

@fragment
fn fs(@builtin(position) fragCoord_inv: vec4<f32>) -> @location(0) vec4<f32> {
    let fragCoord = vec4(fragCoord_inv.x, setup.resolution.y - fragCoord_inv.y, 0.0, 1.0);
    let pixelIdx = i32(fragCoord.y * setup.resolution.x + fragCoord.x);
    let tPos = fragCoord.xy / setup.resolution;

    let pointLocal = vec3(tPos.x - 0.5, tPos.y - 0.5, 1) * currentSetup.viewParams;
    let point = (currentSetup.camCFrame[3] + (currentSetup.camCFrame[0] * pointLocal.x) + (currentSetup.camCFrame[1] * pointLocal.y) - (currentSetup.camCFrame[2] * pointLocal.z)).xyz;

    let ray = Ray(currentSetup.camCFrame[3].xyz, normalize(point - currentSetup.camCFrame[3].xyz));


    var totalIncomingLight = vec3(0.0);

    state = u32(pixelIdx) + currentSetup.frame * 719393u;

    for (var rayIndex = 0u; rayIndex < setup.numOfRaysPerPixel; rayIndex++) {
        let t = trace(ray);
        totalIncomingLight += t;
    }

    totalIncomingLight /= f32(setup.numOfRaysPerPixel);

    return vec4(totalIncomingLight, 1.0);

    //let val = randomValue();

    //return vec4(val, val, val, 1.0);

    //return vec4(fragCoord.xy / setup.resolution, 0.0, 1.0);
}
