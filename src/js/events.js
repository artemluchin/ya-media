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