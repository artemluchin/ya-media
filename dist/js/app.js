var canvasVideo = document.querySelector('.player__video'),
    canvasEffects = document.querySelector('.player__effects'),
    canvasSubs = document.querySelector('.player__subtitles'),
    ctxVideo = canvasVideo.getContext('webgl') || canvasVideo.getContext('experimental-webgl'),
    ctxEffects,
    ctxSubs;

var effectsLoop,
    videoLoop,
    subsLoop;
    
var player = document.querySelector('.player'),
    button = document.querySelector('.order-form__button'),
    container = document.querySelector('.container'),
    orderBox = document.querySelector('.order-form'),
    movieLink = document.querySelector('.ticket__screening input'),
    taperLink = document.querySelector('.ticket__taper input'),
    subtitlesLink = document.querySelector('.ticket__subtitles input'),
    video,
    aspectRatio,
    audio;
    
var rawSubtitles,
    subtitles,
    subtitlesBuffer;

var audioContext = new AudioContext(),
    audioSource,
    audioFilter,
    whiteNoise;
    
var isPlayerPlaying = false,
    isSubsPlaying = false,
    isFoundSubs = false,
    subsId = 0,
    subsIndex;

var patternSize = 64,
    patternScaleX = 6,
    patternScaleY = 6,
    patternAlpha = 15,
    patternRefreshInterval = 8; // изменяем зернистость не каждый кадр, а через
                                // установленное значение
var patternCanvas,
    patternCtx,
    patternData,
    patternFrame = 0;
  
var srtDuration,
    srtNewDuration,
    srtStratTime,
    srtEndTime;
    
initAudioFilter();
initWhiteNoise();
prepareWebGL(canvasVideo, ctxVideo, canvasSubs);
player.addEventListener('click', _onPlayerClick);
button.addEventListener('click', _onButtonClick);
function _onButtonClick() {
  
  // изменяем стили для красоты
  container.style.background = '#222';
  player.style.opacity = 1;
  player.style.marginTop = '0';
  orderBox.style.display = 'none';
  
  createVideoElement('dist/assets/video/sherlock720.mp4');
  createAudioElement(taperLink.value);
  
  getSubtitles(subtitlesLink.value);
  subtitles = parseSubtitles(rawSubtitles);
  
  // копия сабов для манипуляций
  subtitlesBuffer = Object.create(subtitles);
  
  // Настраиваем аудио
  audioSource = audioContext.createMediaElementSource(audio);
  audioSource.connect(audioFilter);
  audioFilter.connect(audioContext.destination);
  
  // Вешаем обработчики на вновьсозданный тэг video
  video.addEventListener("loadstart", function() {
    canvasSubs.width = canvasEffects.width = 640;
    canvasSubs.height = canvasEffects.height = 360;
    initcanvasSubs();
    drawText(['Наматываем пленку...'])
  }, false);
  
  video.addEventListener('canplay', function() {
    aspectRatio = video.videoWidth / video.videoHeight;
    canvasSubs.width = canvasEffects.width = 1280;
    canvasSubs.height = canvasEffects.height = 1280 / aspectRatio;
    initCanvasEffects();
    initcanvasSubs();
    initGrainPattern();
    drawText(['Приятного просмотра'])
  }, false);
  
  video.addEventListener('play', function () {
      videoLoop = requestAnimationFrame(loopVideo);
      window.cancelAnimationFrame(subsLoop);
      canvasSubs.style.opacity = 0;
  }, false);
  
  video.addEventListener("pause", function() {
    window.cancelAnimationFrame(videoLoop);
  }, false);
  
  video.addEventListener("ended", function() {
    window.cancelAnimationFrame(videoLoop);
    window.cancelAnimationFrame(effectsLoop);
    whiteNoise.disconnect(audioContext.destination);
    audio.pause();
  }, false);
}


function _onPlayerClick() {
  if (!isPlayerPlaying) {
    if (isSubsPlaying) {
      subsLoop = requestAnimationFrame(loopSubs);
      // если продолжили воспроизведение на показе субтитров
      // вычисляем оставшуюся продолжительность их показа
      srtStratTime = Date.now();
      srtEndTime = srtStratTime + srtNewDuration;
    }
    else {
      video.play();
    }
    audio.play();
    whiteNoise.connect(audioContext.destination);
    effectsLoop = requestAnimationFrame(loopEffects);
  }
  else {
    if (isSubsPlaying) {
      window.cancelAnimationFrame(subsLoop);
      // вычисляем продолжительность показа субтитров
      srtNewDuration = srtEndTime - Date.now();
    }
    else {
      video.pause();
    }
    audio.pause();
    whiteNoise.disconnect(audioContext.destination);
    window.cancelAnimationFrame(effectsLoop);
  }
  isPlayerPlaying = !isPlayerPlaying;
}
/**
 * Парсер субтитров.
 * @param {string} subtitles
 * @returns {object} объект структурированных субтитров
 *
 */
function parseSubtitles(subtitles) {
  var object = [],
      premade;
  // обрезаем ненужные "", а также \n по краям
  subtitles = subtitles.replace(/\"/g, "").replace(/\\n$|^\\n/g, "");
  premade = subtitles.split(/\\n\\n/).map(str => str.split(/\\n/));
  
  premade.forEach((item, index) => {
    object.push({
      id: Number(item[0]),
      // берем строку, где записан интервал. Делим ее на две части. Для каждой
      // части парсим строку, чтобы вычислить время в секундах.
      // В секундах, для того, чтобы удобнее сравнивать с video.currentTime
      time: item[1].split(/\s-->\s/).map(time => time.replace(/(\d+):(\d+):(\d+)\,(\d+)/, (str, hours, minutes, seconds, ms) => {
        return +hours * 3600 + +minutes * 60 + +seconds + +ms * 0.001;
      })),
      // заносим всю оставшуюся часть массива. В ней только текст.
      text: premade[index].splice(2)
    });
  });
  
  return object;
}


/**
 * Забирает субтитры по заданному пути
 * @param {string} url
 *
 */
function getSubtitles(url) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    rawSubtitles = JSON.stringify(xhttp.responseText);
  };
  xhttp.open('GET', url, false);
  xhttp.send();
}


/**
 * Создает новый тэг 'video' в контейнере
 * @param {string} src - путь к файлу видео
 *
 */
function createVideoElement(src) {
  var newVideo = document.createElement('video');
  newVideo.setAttribute('muted', '');
  newVideo.setAttribute('class','video');
  newVideo.setAttribute('crossorigin','anonymous');
  newVideo.innerHTML = '<source src="'+src+'" type="video/mp4">';
  container.appendChild(newVideo);
  
  video = document.querySelector('.video');
}

/**
 * Создает новый тэг 'audio' в контейнере
 * @param {string} src - путь к файлу аудио
 *
 */
function createAudioElement(src) {
  var newAudio = document.createElement('audio');
  newAudio.setAttribute('class', 'audio');
  newAudio.setAttribute('src', src);
  newAudio.setAttribute('crossorigin','anonymous');
  container.appendChild(newAudio);
  
  audio = document.querySelector('.audio');
}


/**
 * Рисует субтитры на канвасе
 * @param {array} subtitles - массив субтитров
 *
 */
function drawText(subtitles) {
  ctxSubs.fillStyle = "white";
  for (var i = 0; i < subtitles.length; i++) {
    // рисуем в зависимости от количества реплик
    // если одна реплика то посередине. Если две, то 1/3 и 2/3. И т.д.
    ctxSubs.fillText(subtitles[i], canvasSubs.width / 2, canvasSubs.height / (subtitles.length + 1) * (i + 1));
  }
}

/**
 * Рисует субтитры на канвасе
 * @param {number} density - плотность элементов (кол-во)
 * @param {function} func - функция отрисовки элемента
 *
 */
function drawFew(density, func) {
  for (var i = 0; i <= density; i++) {
    func();
  }
}


/**
 * Рисует произвольные царапины в произвольном месте
 *
 */
function drawScrap() {
  var x = (Math.random() * canvasEffects.width) | 0;
  var y = (Math.random() * canvasEffects.height) | 0;
  
  var maxLenght = 50,
      minLength = -50;
  var lengthX = Math.floor(Math.random() * (maxLenght - minLength + 1)) + minLength;
  var lengthY = Math.floor(Math.random() * (maxLenght - minLength + 1)) + minLength;
  var lineWidth = 0.4;
  
  ctxEffects.beginPath();
  ctxEffects.lineCap = 'round';
  ctxEffects.strokeStyle = 'rgba(100, 100, 100, 0.4)';
  ctxEffects.moveTo(x, y);
  ctxEffects.lineTo(x + lengthX, y + lengthY);
  ctxEffects.lineWidth = lineWidth;
  ctxEffects.stroke();
}


/**
 * Рисует вертикальные царапины в произвольном месте
 *
 */
function drawScratch() {
  var x = (Math.random() * canvasEffects.width) | 0;
  var y = 0;
  
  ctxEffects.beginPath();
  ctxEffects.strokeStyle = 'rgba(70, 70, 70, 0.2)';
  ctxEffects.lineWidth = 1;
  ctxEffects.moveTo(x, y);
  ctxEffects.lineTo(x, canvasEffects.height);
  ctxEffects.stroke();
}


/**
 * Рисует произвольные пятна в произвольном месте
 *
 */
function drawCircle() {
  var maxRadius = 6;
  var x = (Math.random() * canvasEffects.width) | 0;
  var y = (Math.random() * canvasEffects.height) | 0;
  var radius = (Math.random() * maxRadius) | 0;
  
  ctxEffects.beginPath();
  ctxEffects.arc(x+0.5, y+0.5, radius, 0, Math.PI * 2);
  ctxEffects.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctxEffects.fill();
  ctxEffects.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctxEffects.lineWidth = 0.1;
  ctxEffects.stroke();
}
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


/**
 * Создает эффект шума на шаблоне
 *
 */
function updatePattern() {
  var value;
  
  for (var i = 0; i < patternData.data.length; i += 4) {
    value = (Math.random() * 255) | 0;

    patternData.data[i] = value;
    patternData.data[i + 1] = value;
    patternData.data[i + 2] = value;
    patternData.data[i + 3] = patternAlpha;
  }
  
  patternCtx.putImageData(patternData, 0, 0);
}


function updateVideo() {
  postprocessWebGL(canvasVideo, ctxVideo, video);
}


/**
 * Заполняет canvas зернистостью, а также рисует остальные эффекты
 *
 */
function drawEffects() {
  ctxEffects.clearRect(0, 0, canvasEffects.width, canvasEffects.height);

  ctxEffects.fillStyle = ctxEffects.createPattern(patternCanvas, 'repeat');
  ctxEffects.fillRect(0, 0, canvasEffects.width, canvasEffects.height);
  
  drawFew(2, drawCircle);
  drawFew(3, drawScratch);
  drawFew(2, drawScrap);
}


/**
 * Отрисовывает эффекты через каждые patternRefreshInterval фреймов
 *
 */
function loopEffects() {
  if (++patternFrame % patternRefreshInterval === 0) {
    updatePattern();
    drawEffects();
  }

  effectsLoop = requestAnimationFrame(loopEffects);
}


/**
 * Отрисовывает видеопоток, если не нужно показывать субтитры
 *
 */
function loopVideo() {
  var curr = video.currentTime;
  
  // ищем субтитры, которые должны отображаться в данный момент времени.
  // пометка: данная реализация излишняя в текущем функционале. Я делал ее
  // забегая вперед. Если бы была реализована перемотка видео, то subtitlesBuffer
  // обновлялся бы каждый раз после перемотки.
  subtitlesBuffer.forEach((sub, index) => {
    if (curr > sub.time[1] && curr < (Number(sub.time[1]) + 0.2)) {
      subsId = sub.id - 1;
      subsIndex = index;
      isFoundSubs = true;
    }
  });
  
  // если нашли субтитры, то тормозим видео и показываем их
  if (isFoundSubs) {
    video.pause();
    subsLoop = requestAnimationFrame(loopSubs);
    subtitlesBuffer.splice(subsIndex, 1);
  }
  else {
    updateVideo();
  }
  
  videoLoop = requestAnimationFrame(loopVideo);
}


/**
 * Отрисовывает субтитры
 *
 */
function loopSubs() {

  if (!isSubsPlaying) {
    canvasSubs.style.opacity = 1;
    ctxSubs.clearRect(0, 0, canvasSubs.width, canvasSubs.height);
    ctxSubs.fillStyle = 'black';
    ctxSubs.fillRect(0, 0, canvasSubs.width, canvasSubs.height);
    drawText(subtitles[subsId].text);
    
    isSubsPlaying = true;
    
    srtDuration = subtitles[subsId].time[1] - subtitles[subsId].time[0];
    srtStratTime = Date.now();
    srtEndTime = srtStratTime + srtDuration * 1000;
  }
  else if (isSubsPlaying && ((srtEndTime - Date.now()) < 0)) {
    subsId += 1;
    isSubsPlaying = false;
    isFoundSubs = false;
    video.play();
  }
  
  subsLoop = requestAnimationFrame(loopSubs);
}

function postprocessWebGL(canvas, gl, sourceCanvas, delta) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);

    gl.viewport(0,0,canvas.width,canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}