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