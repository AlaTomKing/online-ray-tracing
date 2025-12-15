#version 300 es

// this is the main raytracing script

#define PI 3.1415926

precision highp float;

// ---- structs ----
struct Ray {
    vec3 origin;
    vec3 dir;
};

struct Triangle {
    vec3 posA, posB, posC;
    vec3 normA, normB, normC;
};

struct TriangleHitInfo {
    bool didHit;
    float dst;
    vec3 hitPoint;
    vec3 normal;
};

struct RayTracingMaterial {
    float smoothness;
    float emissionStrength;
};

struct Sphere {
    vec3 position;
    float radius;
    RayTracingMaterial material;
}
// --------

uniform bool environmentEnabled;

uniform float sunFocus;
uniform vec3 groundColor;
uniform vec3 sunColor;

uniform vec3 skyColorHorizon;
uniform vec3 skyColorZenith;
uniform vec3 sunLightDirection;

uniform int maxBounceCount;

// ---- math functions ----
vec3 lerp(vec3 v1, vec3 v2, float x) {
    return v1 + (v2 - v1) * x;
}
// --------

// ---- random functions ----
uint nextRandom(inout uint state) {
    state = (state * 747796405u + 2891336453u);
    uint result = (state >> ((state >> 28) + 4u)) ^ state;
    result = (result >> 22) ^ result;
    return result;
}

float randomValue(inout uint state) {
    return float(nextRandom(state)) / 4294967295.0; // 2^32 - 1
}

float randomValueNormalDistribution(inout uint state) {
    float theta = 2.0 * PI * randomValue(state);
    float rho = sqrt(-2.0 * log(randomValue(state)));
    return rho * cos(theta);
}

vec3 randomDirection(inout uint state) {
    float x = randomValueNormalDistribution(state);
    float y = randomValueNormalDistribution(state);
    float z = randomValueNormalDistribution(state);
    return normalize(vec3(x,y,z));
}
// --------

vec3 getEnvironmentLight(vec3 dir) {
    if (environmentEnabled) { return vec3(0); }

    float skyGradientT = pow(smoothstep(0.0, 0.4, dir.y), 0.35);
    float groundToSkyT = smoothstep(-0.01, 0.0, dir.y);
    vec3 skyGradient = lerp(skyColorHorizon, skyColorZenith, skyGradientT);

    float s = 1000.0 * (1.0 / sunFocus);
    float sun = pow(max(0.0, dot(dir, sunLightDirection)), s);
    vec3 composite = lerp(groundColor, skyGradient, groundToSkyT) * (sun * sunColor * (groundToSkyT >= 1.0f ? 1.0f : 0.0f));

    return composite;
}

TriangleHitInfo calculateRayCollision(Ray ray) {
    TriangleHitInfo closestHit;
    closestHit.dst = 0.0;

    return closestHit;
}

vec3 trace(Ray initialRay, inout uint rngState) {
    vec3 incomingLight = vec3(0);
    vec3 rayColor = vec3(1);

    Ray ray = initialRay;

    for (int i = 0; i < maxBounceCount; i++) {
        TriangleHitInfo hitInfo = calculateRayCollision(ray);

        if (!hitInfo.didHit) {
            incomingLight += getEnvironmentLight(ray.dir) * rayColor;
            break;
        }

        ray.origin = hitInfo.hitPoint;
        vec3 diffuseDir = normalize(hitInfo.normal + randomDirection(rngState));
        //vec3 specularDir = 
    }

    return incomingLight;
}

void main(void) {
    //gl_FragColor = vec4(0.57, 0.15, 0.15, 1.0);
}