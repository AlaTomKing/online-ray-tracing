// vertex + fragment shader

@group(0) @binding(0) var inputTexture : texture_2d<f32>;
@group(0) @binding(1) var outputTexture : texture_2d<f32>;
@group(0) @binding(2) var<uniform> renderedFrames : f32;

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
    const vertices = array(
        vec2(-1.0, -1.0),
        vec2(-1.0, 1.0),
        vec2(1.0, -1.0),
        vec2(-1.0, 1.0),
        vec2(1.0, 1.0),
        vec2(1.0, -1.0)
    );

    return vec4(vertices[vertexIndex], 0.0, 1.0);
}

@fragment
fn fragMain(@builtin(position) fragCoord : vec4<f32>) -> @location(0) vec4f {
    let pos = vec2i(fragCoord.xy);
    let tex1 = textureLoad(inputTexture, pos, 0);
    let tex2 = textureLoad(outputTexture, pos, 0);

    let weight = 1.0 / (renderedFrames + 1);
    let avg = tex1 * (1 - weight) + tex2 * weight;

    return avg;
}