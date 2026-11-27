(function (window, document) {
  var code = document.getElementById('screen-code');
  var status = document.getElementById('lobby-status');
  var retry = document.getElementById('new-code');
  var callbacks = [];
  var requesting = false;
  var moduleReady = false;
  var statusRequest = false;
  var stream;
  var audioAllowed = false;
  var reportedAudio;
  var connected = false;
  var mediaURL = '';
  var primaryMediaURL = '';
  var currentMediaKey = '';
  var primaryTried = false;
  var displayedCommentId = '';
  var fallbackURL = '';
  var fallbackTried = false;
  var bufferingSince = 0;
  var lastTouch = 0;
  var playback;
  var timer;
  var lobby = document.getElementById('lobby');
  var viewer = document.getElementById('viewer');
  var video = document.getElementById('display-video');
  var wait = document.getElementById('wait');
  var caption = document.getElementById('caption');
  var subtitle = document.getElementById('subtitle');
  var author = document.getElementById('author');
  var authorName = document.getElementById('author-name');
  var avatar = document.getElementById('author-avatar');
  var initial = document.getElementById('avatar-letter');
  var text = document.getElementById('text');
  var audio = document.getElementById('screen-audio');
  var fullscreen = document.getElementById('fullscreen');
  var comment = document.getElementById('screen-comment');
  var commentLetter = document.getElementById('comment-letter');
  var commentAvatar = document.getElementById('comment-avatar');
  var commentName = document.getElementById('comment-name');
  var commentHandle = document.getElementById('comment-handle');
  var commentTime = document.getElementById('comment-time');
  var commentText = document.getElementById('comment-text');
  var commentStats = document.getElementById('comment-stats');

  function write(element, value) {
    if (element.textContent !== value) element.textContent = value;
  }

  function requestJSON(path, data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open(data ? 'POST' : 'GET', path, true);
    xhr.timeout = 3500;
    if (data) xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      var result;
      try {
        result = JSON.parse(xhr.responseText);
      } catch (error) {
        callback(error);
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        callback(new Error('Screen request failed.'));
        return;
      }
      callback(null, result);
    };
    xhr.onerror = xhr.ontimeout = function () { callback(new Error('Screen request failed.')); };
    xhr.send(data ? JSON.stringify(data) : null);
    return xhr;
  }

  function showWait(message) {
    wait.hidden = !message;
    write(wait, message);
  }

  function showComment(value) {
    if (!value) {
      displayedCommentId = '';
      comment.hidden = true;
      return;
    }
    if (displayedCommentId === value.id) return;
    displayedCommentId = value.id;
    comment.hidden = false;
    write(commentName, value.name || (value.author ? '@' + value.author : 'X'));
    write(commentHandle, value.name && value.author ? '@' + value.author : '');
    write(commentLetter, (value.name || value.author || 'X').charAt(0).toUpperCase());
    write(commentText, value.text || '');
    if (commentAvatar.getAttribute('src') !== (value.avatar || '')) {
      commentAvatar.hidden = !value.avatar;
      if (value.avatar) commentAvatar.src = value.avatar;
      else commentAvatar.removeAttribute('src');
    }
    var timestamp = value.date ? Date.parse(value.date) : NaN;
    commentTime.hidden = !isFinite(timestamp);
    write(commentTime, isFinite(timestamp) ? new Date(timestamp).toLocaleString() : '');
    var visible = false;
    var spans = commentStats.getElementsByTagName('span');
    for (var index = 0; index < spans.length; index++) {
      var key = spans[index].getAttribute('data-comment-stat');
      var count = value[key];
      spans[index].hidden = typeof count !== 'number' || count < 0;
      spans[index].getElementsByTagName('b')[0].textContent =
        typeof count === 'number' && count >= 0 ? String(count) : '';
      if (!spans[index].hidden) visible = true;
    }
    commentStats.hidden = !visible;
  }

  function useAlternativeSource() {
    var next = mediaURL === primaryMediaURL ? fallbackURL : primaryMediaURL;
    if (!next || next === mediaURL) return false;
    if (next === fallbackURL) {
      if (fallbackTried) return false;
      fallbackTried = true;
    } else {
      if (primaryTried) return false;
      primaryTried = true;
    }
    mediaURL = next;
    video.src = mediaURL;
    video.load();
    bufferingSince = new Date().getTime();
    return true;
  }

  function reportAudio(enabled) {
    if (!connected) return;
    if (reportedAudio === enabled) return;
    reportedAudio = enabled;
    requestJSON('/api/screen/audio', { enabled: enabled }, function (error) {
      if (error) reportedAudio = undefined;
    });
  }

  function syncVideo(value) {
    playback = value;
    var media = value && value.media;
    if (!media || !media.url) {
      if (video.getAttribute('src')) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
      mediaURL = '';
      primaryMediaURL = '';
      currentMediaKey = '';
      displayedCommentId = '';
      fallbackURL = '';
      fallbackTried = false;
      primaryTried = false;
      caption.hidden = true;
      subtitle.hidden = true;
      avatar.hidden = true;
      showComment(null);
      showWait(media && media.unavailable ? 'Cette vidéo est disponible sur l’ordinateur.' : 'En attente d’une vidéo sur XScroll…');
      reportAudio(false);
      return;
    }

    var mediaKey = media.key || media.url;
    if (currentMediaKey !== mediaKey || primaryMediaURL !== media.url) {
      currentMediaKey = mediaKey;
      primaryMediaURL = media.url;
      fallbackURL = media.fallback && media.fallback !== media.url ? media.fallback : '';
      mediaURL = fallbackURL || primaryMediaURL;
      fallbackTried = Boolean(fallbackURL);
      primaryTried = mediaURL === primaryMediaURL;
      bufferingSince = new Date().getTime();
      video.src = mediaURL;
      video.load();
    }
    if (bufferingSince && !value.paused && video.readyState < 3 &&
        new Date().getTime() - bufferingSince > 3500 && useAlternativeSource()) return;
    if (!value.paused && video.readyState >= 3) bufferingSince = 0;
    showWait(video.error ? 'Cet écran ne peut pas lire la vidéo.' :
      bufferingSince && !value.paused && new Date().getTime() - bufferingSince > 900 ?
        'La vidéo se charge…' : '');
    video.loop = media.loop !== false;
    video.setAttribute('data-fit', media.fit === 'fill' ? 'fill' : 'contain');
    subtitle.hidden = !media.subtitle;
    write(subtitle, media.subtitle || '');
    caption.hidden = !media.author && !media.name && !media.text;
    write(authorName, media.name || (media.author ? '@' + media.author : 'X'));
    write(author, media.name && media.author ? '@' + media.author : '');
    write(initial, (media.name || media.author || 'X').charAt(0).toUpperCase());
    text.hidden = !media.text;
    write(text, media.text || '');
    if (avatar.getAttribute('src') !== (media.avatar || '')) {
      avatar.hidden = !media.avatar;
      if (media.avatar) avatar.src = media.avatar;
      else avatar.removeAttribute('src');
    }
    showComment(media.screenComment);

    var muted = !audioAllowed || value.muted === true;
    if (video.muted !== muted) video.muted = muted;
    if (typeof value.volume === 'number' && video.volume !== value.volume) video.volume = value.volume;
    write(audio, audioAllowed ? 'Couper le son ici' : 'Activer le son');
    audio.setAttribute('aria-pressed', String(audioAllowed));
    var duration = video.duration || media.duration || 0;
    if (video.readyState > 0 && !video.seeking) {
      var target = media.time || 0;
      if (!value.paused && !media.stalled) target += Math.max(0, Math.min(value.age || 0, 8000)) / 1000 * (value.rate || 1);
      if (duration > 0) {
        if (media.loop !== false && !value.paused) target = target % duration;
        else target = Math.min(target, duration);
      }
      if (Math.abs(video.currentTime - target) > (value.paused ? 0.3 : 2)) {
        try { video.currentTime = target; } catch (error) {}
      }
    }
    var rate = value.rate || 1;
    if (video.playbackRate !== rate) {
      try { video.playbackRate = rate; } catch (error) {}
    }
    if (value.paused) {
      if (!video.paused) video.pause();
    } else if (video.paused) {
      var playing = video.play();
      if (playing && typeof playing.catch === 'function') playing.catch(function () {
        showWait('Appuie sur le bouton de son pour lancer la vidéo.');
      });
    }
    reportAudio(audioAllowed && !value.muted);
  }

  function renderFallback(result) {
    if (moduleReady) return;
    if (result.phase === 'connected') {
      if (!connected) reportedAudio = undefined;
      connected = true;
      lobby.hidden = true;
      viewer.hidden = false;
      syncVideo(result.playback);
      openFallbackStream();
      return;
    }
    connected = false;
    reportedAudio = undefined;
    lobby.hidden = false;
    viewer.hidden = true;
    if (result.phase === 'pending') {
      code.textContent = result.code || code.textContent;
      status.textContent = '';
      retry.hidden = true;
    } else {
      closeFallbackStream();
      status.textContent = 'Le code a expiré ou la diffusion a été arrêtée.';
      retry.hidden = false;
      if (video.getAttribute('src')) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
      mediaURL = primaryMediaURL = currentMediaKey = fallbackURL = '';
      primaryTried = fallbackTried = false;
      displayedCommentId = '';
      showComment(null);
    }
  }

  function fallbackPoll() {
    if (moduleReady || statusRequest || (stream && new Date().getTime() - lastTouch < 5000)) return;
    statusRequest = true;
    lastTouch = new Date().getTime();
    requestJSON('/api/screen/status', null, function (error, result) {
      statusRequest = false;
      if (moduleReady) return;
      if (!error) renderFallback(result);
      else if (!viewer.hidden) showWait('Reconnexion à XScroll…');
    });
  }

  function closeFallbackStream() {
    if (!stream) return;
    stream.close();
    stream = undefined;
  }

  function openFallbackStream() {
    if (moduleReady || stream || !window.EventSource) return;
    stream = new window.EventSource('/api/screen/events');
    stream.onmessage = function (event) {
      if (moduleReady || !stream) return;
      try {
        renderFallback(JSON.parse(event.data));
      } catch (error) {}
    };
    stream.onerror = function () {
      closeFallbackStream();
      lastTouch = 0;
    };
  }

  function finish(error, result) {
    requesting = false;
    if (!error && result && result.phase === 'pending' && /^\d{6}$/.test(result.code || '')) {
      code.textContent = result.code;
      status.textContent = '';
      retry.hidden = true;
    } else if (error) {
      status.textContent = 'Impossible de contacter XScroll.';
      retry.hidden = false;
    }
    var pending = callbacks;
    callbacks = [];
    for (var index = 0; index < pending.length; index++) pending[index](error, result);
  }

  function request(callback) {
    callbacks.push(callback || function () {});
    if (requesting) return;
    requesting = true;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/screen/request', true);
    xhr.timeout = 3500;
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      var result;
      try {
        result = JSON.parse(xhr.responseText);
      } catch (error) {
        finish(error);
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300 || !result || result.phase !== 'pending' ||
          !/^\d{6}$/.test(result.code || '')) {
        finish(new Error('Screen code request failed.'));
        return;
      }
      finish(null, result);
    };
    xhr.onerror = xhr.ontimeout = function () { finish(new Error('Screen code request failed.')); };
    xhr.send('{}');
  }

  window.xscrollScreenRequest = request;
  window.xscrollScreenModuleReady = function () {
    moduleReady = true;
    closeFallbackStream();
    window.clearInterval(timer);
  };
  audio.addEventListener('click', function () {
    if (moduleReady) return;
    audioAllowed = !audioAllowed;
    if (playback) syncVideo(playback);
    else {
      video.muted = !audioAllowed;
      write(audio, audioAllowed ? 'Couper le son ici' : 'Activer le son');
      audio.setAttribute('aria-pressed', String(audioAllowed));
      reportAudio(audioAllowed);
    }
  });
  fullscreen.addEventListener('click', function () {
    if (moduleReady) return;
    var enter = viewer.requestFullscreen || viewer.webkitRequestFullscreen;
    var exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (exit) exit.call(document);
    } else if (enter) enter.call(viewer);
  });
  video.addEventListener('error', function () {
    if (moduleReady) return;
    if (video.getAttribute('src') && !useAlternativeSource()) showWait('Cet écran ne peut pas lire la vidéo.');
  });
  video.addEventListener('canplay', function () { bufferingSince = 0; });
  video.addEventListener('waiting', function () { if (!bufferingSince) bufferingSince = new Date().getTime(); });
  if (!viewer.requestFullscreen && !viewer.webkitRequestFullscreen) fullscreen.hidden = true;
  retry.addEventListener('click', function () { if (!moduleReady) request(); });
  request();

  timer = window.setInterval(function () {
    if (moduleReady || requesting) return;
    fallbackPoll();
  }, 350);
}(window, document));
