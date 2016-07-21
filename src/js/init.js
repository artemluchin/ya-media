/**
 * Добавляет высокочастотный фильтр
 * с заданными характеристиками
 *
 */
function initAudioFilter() {
  audioFilter = audioContext.createBiquadFilter();
  audioFilter.type = "highpass";
  audioFilter.frequency.value = 400;
  audioFilter.Q.value = 14;
}

/**
 * Создает поток белого шума
 *
 */
function initWhiteNoise() {
  whiteNoise = audioContext.createScriptProcessor(4096, 1, 1);
  whiteNoise.onaudioprocess = function(e) {
    var output = e.outputBuffer.getChannelData(0);
    for (var i = 0; i < 4096; i++) {
      output[i] = Math.random() * 0.03;
    }
  };
}


function initcanvasSubs() {
  ctxSubs = canvasSubs.getContext('2d');
  ctxSubs.textAlign = "center";
  ctxSubs.textBaseline = "middle";
  ctxSubs.font = ""+canvasSubs.height * 0.070+"px Oranienbaum";
  ctxSubs.fillStyle = 'black';
  ctxSubs.fillRect(0, 0, canvasSubs.width, canvasSubs.height);
  drawText(['Приятного просмотра']);
}


function initCanvasEffects() {
  ctxEffects = canvasEffects.getContext('2d');
  ctxEffects.scale(patternScaleX, patternScaleY);
}


function initGrainPattern() {
  patternCanvas = document.createElement('canvas');
  patternCanvas.width = patternSize;
  patternCanvas.height = patternSize;
  patternCtx = patternCanvas.getContext('2d');
  patternData = patternCtx.createImageData(patternSize, patternSize);
}


function prepareWebGL(canvas, gl, sourceCanvas) {
    var program = gl.createProgram();

    var vertexCode = 'attribute vec2 coordinates;' +
        'attribute vec2 texture_coordinates;' +
        'varying vec2 v_texcoord;' +
        'void main() {' +
        '  gl_Position = vec4(coordinates,0.0, 1.0);' +
        '  v_texcoord = texture_coordinates;' +
        '}';

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexCode);
    gl.compileShader(vertexShader);

    var fragmentCode = 'precision mediump float;' +
        'varying vec2 v_texcoord;' +
        'uniform sampler2D u_texture;' +
        'float rand(vec2 co){' +
        '   return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);' +
        '}' +
        'void main() {' +
        '   vec4 texColor = texture2D(u_texture, v_texcoord);' +
        '   float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));' +
        '   gl_FragColor = vec4(gray, gray, gray, 1.0);' +
        '}';

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentCode);
    gl.compileShader(fragmentShader);

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    gl.useProgram(program);

    var positionLocation = gl.getAttribLocation(program, 'coordinates');
    var texcoordLocation = gl.getAttribLocation(program, 'texture_coordinates');

    var buffer = gl.createBuffer();
    var vertices = [
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    buffer = gl.createBuffer();
    var textureCoordinates = [
        0, 1,
        1, 1,
        0, 0,
        0, 0,
        1, 1,
        1, 0
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texcoordLocation);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

