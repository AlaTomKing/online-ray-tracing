function initGl(canvas, vertex, frag) {
    let /** @type {WebGL2RenderingContext} */ gl = null;

    try {
        gl = canvas.getContext("webgl2");
    } catch (e) { console.log("something went wrong while getting context: ", e); }

    if (!gl) { console.log("im sorry bro i think yo browser doesn't support webgl"); gl = null; }

    if (gl) {
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;

        initShaders(gl, vertex, frag);
    }

    return gl;
}

function loadShader(/** @type {WebGL2RenderingContext} */ gl, content, type) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, content);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("something bad in shader")
        console.error(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShaders(/** @type {WebGL2RenderingContext} */ gl, vertex, frag) {
    const vertexShader = loadShader(gl, vertex, gl.VERTEX_SHADER);
    const fragmentShader = loadShader(gl, frag, gl.FRAGMENT_SHADER);

    gl.shaderProgram = gl.createProgram();

    gl.attachShader(gl.shaderProgram, vertexShader);
    gl.attachShader(gl.shaderProgram, fragmentShader);
    gl.linkProgram(gl.shaderProgram);

    if (!gl.getProgramParameter(gl.shaderProgram, gl.LINK_STATUS))
        console.warn("cant initialize the shaders");

    gl.useProgram(gl.shaderProgram);

    gl.shaderProgram.vertexPositionAttribute = gl.getAttribLocation(gl.shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(gl.shaderProgram.vertexPositionAttribute);

    gl.shaderProgram.resolution = gl.getUniformLocation(gl.shaderProgram, "uResolution");
    gl.uniform2f(gl.shaderProgram.resolution, gl.viewportWidth, gl.viewportHeight);
}