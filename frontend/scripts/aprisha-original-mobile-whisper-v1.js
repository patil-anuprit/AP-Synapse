// AP_APRISHA_ORIGINAL_MOBILE_WHISPER_V1
// Staging-only bridge for original APRISHA Speak/Stop. No floating controls.
(() => {
  'use strict';
  if (!/Android/i.test(navigator.userAgent)) return;
  if (window.__apOriginalAprishaWhisperV1) return;
  window.__apOriginalAprishaWhisperV1 = true;

  const HOST = 'https://ap-synapse-aprisha-staging.onrender.com';
  const MAX_MS = 12000;
  const MAX_UPLOAD = 5 * 1024 * 1024;
  let testToken = '';
  let manualStartUntil = 0;
  let session = null;
  let lastText = '';
  const handled = new WeakSet();

  function isButton(event, expected) {
    const button = event.target?.closest?.('button,[role="button"]');
    if (!button) return false;
    const text = String(button.textContent || '').trim();
    const label = String(button.getAttribute('aria-label') || '').trim();
    return text.toLowerCase() === expected || label.toLowerCase() === expected;
  }

  document.addEventListener('click', event => {
    if (isButton(event, 'speak')) {
      if (!testToken) {
        const entered = window.prompt('APRISHA staging test: enter your private transcription token (not your Groq key).');
        if (!entered || entered.trim().length < 24) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
        testToken = entered.trim();
      }
      manualStartUntil = Date.now() + 15000;
    } else if (isButton(event, 'stop')) {
      manualStartUntil = 0;
      if (session) finish(session, false);
    }
  }, true);

  function fire(recognizer, name, props = {}) {
    const event = new Event(name);
    for (const [key, value] of Object.entries(props)) {
      Object.defineProperty(event, key, { value, enumerable: true });
    }
    recognizer.dispatchEvent(event);
  }

  function closeStream(s) {
    if (s.timer) clearTimeout(s.timer);
    s.timer = null;
    if (s.stream) {
      s.stream.getTracks().forEach(track => track.stop());
      s.stream = null;
    }
  }

  function reportError(s, code) {
    if (session !== s) return;
    closeStream(s);
    session = null;
    console.warn('[APRISHA mobile Whisper]', code);
    fire(s.recognizer, 'error', { error: code, message: code });
    fire(s.recognizer, 'end');
  }

  async function transcribe(s) {
    if (session !== s || s.cancelled) return;
    s.processing = true;
    closeStream(s);
    try {
      const type = s.recorder?.mimeType || 'audio/webm';
      const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
      const blob = new Blob(s.chunks, { type });
      if (blob.size < 500 || blob.size > MAX_UPLOAD) throw new Error('audio-capture');
      const form = new FormData();
      form.append('audio', blob, `speech.${ext}`);
      const lang = String(s.recognizer.lang || 'en-IN').toLowerCase().startsWith('hi') ? 'hi' : 'en';
      form.append('language', lang);
      s.controller = new AbortController();
      const timeout = setTimeout(() => s.controller.abort(), 40000);
      let response;
      try {
        response = await fetch(`${HOST}/aprisha/transcribe`, {
          method: 'POST',
          headers: { 'x-ap-stt-test-token': testToken },
          body: form,
          signal: s.controller.signal,
          cache: 'no-store'
        });
      } finally {
        clearTimeout(timeout);
      }
      const data = await response.json();
      if (!response.ok || data.ok !== true) throw new Error(data.error || `HTTP ${response.status}`);
      const transcript = String(data.text || '').trim()
        .replace(/\b(?:apresha|apreisha|apreesha)\b/ig, 'APRISHA');
      if (session !== s || s.cancelled) return;
      session = null;
      lastText = transcript;
      if (transcript) {
        const alternative = { transcript, confidence: 0.95 };
        const result = [alternative];
        Object.defineProperty(result, 'isFinal', { value: true });
        fire(s.recognizer, 'result', { results: [result], resultIndex: 0 });
      } else {
        fire(s.recognizer, 'nomatch');
      }
      fire(s.recognizer, 'speechend');
      fire(s.recognizer, 'audioend');
      fire(s.recognizer, 'end');
    } catch (error) {
      reportError(s, error.name === 'AbortError' ? 'network' : 'network');
    }
  }

  function finish(s, cancel) {
    if (session !== s) return;
    if (cancel) {
      s.cancelled = true;
      if (s.controller) s.controller.abort();
      closeStream(s);
      session = null;
      if (s.recorder?.state === 'recording') {
        try { s.recorder.stop(); } catch (_) {}
      }
      fire(s.recognizer, 'end');
      return;
    }
    if (s.processing) return;
    if (!s.recorder) {
      s.cancelled = true;
      closeStream(s);
      session = null;
      fire(s.recognizer, 'end');
      return;
    }
    if (s.recorder?.state === 'recording') {
      try { s.recorder.stop(); } catch (_) { reportError(s, 'audio-capture'); }
    }
  }

  async function capture(recognizer) {
    const s = { recognizer, stream: null, recorder: null, chunks: [], cancelled: false,
      processing: false, controller: null, timer: null };
    if (session) finish(session, true);
    session = s;
    try {
      if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('audio-capture');
      }
      fire(recognizer, 'start');
      s.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false
      });
      if (session !== s || s.cancelled) { closeStream(s); return; }
      const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const mime = types.find(value => MediaRecorder.isTypeSupported(value));
      s.recorder = new MediaRecorder(s.stream, mime ? { mimeType: mime } : undefined);
      s.recorder.ondataavailable = event => { if (event.data?.size) s.chunks.push(event.data); };
      s.recorder.onerror = () => reportError(s, 'audio-capture');
      s.recorder.onstop = () => transcribe(s);
      fire(recognizer, 'audiostart');
      s.recorder.start();
      fire(recognizer, 'speechstart');
      s.timer = setTimeout(() => finish(s, false), MAX_MS);
    } catch (error) {
      reportError(s, error?.name === 'NotAllowedError' ? 'not-allowed' : 'audio-capture');
    }
  }

  const prototypes = new Set([
    window.SpeechRecognition?.prototype,
    window.webkitSpeechRecognition?.prototype
  ].filter(Boolean));
  let patched = 0;
  for (const proto of prototypes) {
    if (typeof proto.start !== 'function' || typeof proto.stop !== 'function' || typeof proto.abort !== 'function') continue;
    const originalStart = proto.start;
    const originalStop = proto.stop;
    const originalAbort = proto.abort;
    proto.start = function () {
      if (manualStartUntil > Date.now()) {
        manualStartUntil = 0;
        handled.add(this);
        capture(this);
        return;
      }
      // Prevent the older mobile recognizer from immediately rearming a
      // Chrome-recognition session after our Whisper result.
      if (handled.has(this)) return;
      return originalStart.call(this);
    };
    proto.stop = function () {
      if (session?.recognizer === this) return finish(session, false);
      if (handled.has(this)) return;
      return originalStop.call(this);
    };
    proto.abort = function () {
      if (session?.recognizer === this) return finish(session, true);
      if (handled.has(this)) return;
      return originalAbort.call(this);
    };
    patched++;
  }
  window.addEventListener('pagehide', () => {
    if (session) finish(session, true);
    testToken = '';
  });
  console.info(`[APRISHA mobile] Original Speak → Whisper bridge ready; recognizers: ${patched}`);
})();
