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