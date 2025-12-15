#version 330 es

#define PI 3.1415926538

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
};
// --------

uniform vec2 uResolution;

uniform bool environmentEnabled;

uniform float sunFocus;
uniform vec3 groundColor;
uniform vec3 sunColor;

uniform vec3 skyColorHorizon;
uniform vec3 skyColorZenith;
uniform vec3 sunLightDirection;

uniform vec3 viewParams;

uniform vec3 camCframePos;
uniform vec3 camCframeRight;
uniform vec3 camCframeUp;
uniform vec3 camCframeLook;

uniform mat4 camCframe;

uniform int maxBounceCount;

uniform int sphereCount;
//uniform Sphere spheres[sphereCount];

/*layout(std430, binding = 1) buffer test {
    int foo;
};*/

out vec4 fragColor;

// ---- math functions ----
vec3 lerp(vec3 v1, vec3 v2, float x) {
    return v1 + (v2 - v1) * x;
}
// --------

// ---- random functions ----
uint nextRandom(inout uint state) {
    state = (state * 747796405u + 2891336453u);
    uint result = ((state >> ((state >> 28) + 4u)) ^ state) * 277803737u;
    result = (result >> 22) ^ result;
    return result;
}

float randomValue(inout uint state) {
    return float(nextRandom(state)) / 4294967295.0f; // 2^32 - 1
}

float randomValueNormalDistribution(inout uint state) {
    float theta = 2.0f * PI * randomValue(state);
    float rho = sqrt(-2.0f * log(randomValue(state)));
    return rho * cos(theta);
}

vec3 randomDirection(inout uint state) {
    float x = randomValueNormalDistribution(state);
    float y = randomValueNormalDistribution(state);
    float z = randomValueNormalDistribution(state);
    return normalize(vec3(x, y, z));
}
// --------

vec3 getEnvironmentLight(vec3 dir) {
    if (!environmentEnabled) {
        return vec3(0);
    }

    float skyGradientT = pow(smoothstep(0.0f, 0.4f, dir.y), 0.35f);
    float groundToSkyT = smoothstep(-0.01f, 0.0f, dir.y);
    vec3 skyGradient = lerp(skyColorHorizon, skyColorZenith, skyGradientT);

    float s = 1000.0f * (1.0f / sunFocus);
    float sun = pow(max(0.0f, dot(dir, sunLightDirection)), s);
    vec3 composite = lerp(groundColor, skyGradient, groundToSkyT) + (sun * sunColor * (groundToSkyT >= 1.0f ? 1.0f : 0.0f));

    return composite;

    /*float skyGradientT = pow(smoothstep(0.0f, 0.4f, dir.y), 0.35f);
    float groundToSkyT = smoothstep(-0.01f, 0.0f, dir.y);

    return vec3(skyGradientT);*/
}

vec3 trace(Ray initialRay, inout uint rngState) {
    vec3 incomingLight = vec3(0);
    vec3 rayColor = vec3(1);

    Ray ray = initialRay;

    /*for(int i = 0; i < maxBounceCount; i++) {
        TriangleHitInfo hitInfo = calculateRayCollision(ray);

        if(!hitInfo.didHit) {
            incomingLight += getEnvironmentLight(ray.dir) * rayColor;
            break;
        }

        ray.origin = hitInfo.hitPoint;
        vec3 diffuseDir = normalize(hitInfo.normal + randomDirection(rngState));
        //vec3 specularDir = 
    }*/

    incomingLight += getEnvironmentLight(ray.dir) * rayColor;

    return incomingLight;
}

void main(void) {
    int pixelIdx = int(gl_FragCoord.y * uResolution.x + gl_FragCoord.x);
    vec2 tPos = gl_FragCoord.xy / uResolution.xy;
    uint state = uint(pixelIdx) + 719393u;

    vec3 pointLocal = vec3(tPos.x - 0.5, tPos.y - 0.5, 1) * viewParams;
    vec3 point = camCframePos + (camCframeRight * pointLocal.x) + (camCframeUp * pointLocal.y) - (camCframeLook * pointLocal.z);

    Ray ray;
    ray.origin = camCframePos;
    ray.dir = normalize(point - ray.origin);

    vec3 color = trace(ray, state);

    fragColor = vec4(color, 1.0);
    //fragColor = vec4(tPos, 0.0, 1.0);
}