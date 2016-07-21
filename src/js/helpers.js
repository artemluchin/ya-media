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