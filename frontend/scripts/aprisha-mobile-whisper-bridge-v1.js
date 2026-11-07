// AP_APRISHA_WHISPER_MOBILE_BRIDGE_V1
// Private, opt-in preview bridge: ?apMobileTalk=1 (not for production).
(() => {
  "use strict";
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const allowed = true; // Experimental Preview branch only; never merge directly.
  if (!mobile || !allowed || document.getElementById("ap-mobile-whisper-launcher")) return;

  const HOST = "https://ap-synapse-aprisha-staging.onrender.com";
  const MAX_MS = 12000;
  let token = "", media = null, recorder = null, chunks = [], timer = null, pending = false;

  const css = document.createElement("style");
  css.textContent = `
    #ap-mobile-whisper-launcher {position:fixed;bottom:calc(195px + env(safe-area-inset-bottom));right:14px;z-index:2147483000;
      padding:11px 14px;background:#1c1811;color:#f6dcac;border:1px solid #bb9659;
      border-radius:14px;font:600 13px system-ui;box-shadow:0 8px 24px #0009;}
    #ap-mobile-whisper-panel {display:none;position:fixed;inset:auto 9px calc(146px + env(safe-area-inset-bottom)) 9px;
      z-index:2147483000;max-height:72dvh;overflow:auto;padding:17px;border-radius:16px;
      background:#111214;color:#f3ede2;border:1px solid #7d6542;box-shadow:0 20px 80px #000b;
      font:14px/1.5 system-ui;}
    #ap-mobile-whisper-panel * {box-sizing:border-box;}
    #ap-mobile-whisper-panel h2 {font:bold 18px system-ui;margin:0 35px 8px 0;color:#eec98d;}
    #ap-mobile-whisper-panel p {margin:6px 0 12px;color:#d5cdbf;}
    #ap-mobile-whisper-panel input,#ap-mobile-whisper-panel textarea {width:100%;max-width:100%;padding:11px;
      background:#202124;color:white;border:1px solid #75664c;border-radius:10px;margin:7px 0;font:inherit;}
    #ap-mobile-whisper-panel button {font:600 13px system-ui;border-radius:10px;padding:11px 12px;
      background:#262018;color:#f2d8a5;border:1px solid #a98754;}
    #ap-mobile-whisper-panel button:disabled {opacity:.45;}
    #ap-mobile-whisper-panel .apmw-actions {display:flex;gap:7px;flex-wrap:wrap;margin-top:8px;}
    #ap-mobile-whisper-panel .apmw-actions button {flex:1;}
    #ap-mobile-whisper-panel #apmw-close {position:absolute;top:8px;right:10px;}
    #ap-mobile-whisper-panel #apmw-status {color:#e9cb91;min-height:24px;}
  `;
  document.head.appendChild(css);
  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.id = "ap-mobile-whisper-launcher";
  launcher.textContent = "🎤 APRISHA Talk";
  launcher.setAttribute("aria-label", "Open APRISHA mobile talk test");

  const panel = document.createElement("section");
  panel.id = "ap-mobile-whisper-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "APRISHA mobile voice test");
  panel.innerHTML = `
    <button id="apmw-close" type="button" aria-label="Close APRISHA voice panel">✕</button>
    <h2>APRISHA · Mobile Talk</h2>
    <p>Private Preview test: tap Record, speak, and send the transcript into AP Synapse chat.</p>
    <div id="apmw-connect">
      <label for="apmw-token">Staging test token</label>
      <input id="apmw-token" type="password" autocomplete="off" placeholder="Paste your private staging token"/>
      <button id="apmw-connect-btn" type="button">Use token for this page only</button>
    </div>
    <div class="apmw-actions">
      <button id="apmw-start" type="button" disabled>🎤 Record</button>
      <button id="apmw-stop" type="button" disabled>Stop & transcribe</button>
    </div>
    <p id="apmw-status" role="status" aria-live="polite">Connect your staging token to begin.</p>
    <label for="apmw-text">Recognized words (editable)</label>
    <textarea id="apmw-text" rows="3" placeholder="Your spoken words will appear here"></textarea>
    <div class="apmw-actions"><button id="apmw-send" type="button">Insert into AP Synapse chat</button><button id="apmw-copy" type="button">Copy transcript</button></div>
    <p style="font-size:11px">This Preview experiment requires your private token; do not merge it into production.</p>`;

  document.body.appendChild(launcher);
  document.body.appendChild(panel);
  const $ = id => panel.querySelector("#" + id);
  const status = text => { $("apmw-status").textContent = text; };
  launcher.addEventListener("click", () => { panel.style.display = "block"; });
  $("apmw-close").addEventListener("click", () => { panel.style.display = "none"; });
  $("apmw-connect-btn").addEventListener("click", () => {
    const entered = $("apmw-token").value.trim();
    if (entered.length < 24) return status("Use your actual staging token (24+ characters).");
    token = entered; $("apmw-token").value = "";
    $("apmw-connect").style.display = "none";
    $("apmw-start").disabled = false;
    status("Ready. Tap Record and speak normally.");
  });
  function release() {
    clearTimeout(timer); timer = null;
    if (media) { media.getTracks().forEach(track => track.stop()); media = null; }
  }
  $("apmw-start").addEventListener("click", async () => {
    if (pending || recorder?.state === "recording") return;
    if (!token) return status("Enter your staging token first.");
    if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia)
      return status("This browser cannot record microphone audio.");
    try {
      media = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      const types = ["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg"];
      const mime = types.find(t => MediaRecorder.isTypeSupported(t));
      recorder = new MediaRecorder(media, mime ? {mimeType:mime} : undefined);
      chunks = [];
      recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
      recorder.onerror = () => { release(); status("Recorder error; please retry."); $("apmw-start").disabled=false; $("apmw-stop").disabled=true; };
      recorder.onstop = async () => {
        release();
        pending = true;
        $("apmw-stop").disabled = true;
        status("Transcribing your speech…");
        const type = recorder.mimeType || "audio/webm";
        const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(chunks,{type});
        if (blob.size < 500) { status("Recording too short; speak for 3–12 seconds."); pending=false; $("apmw-start").disabled=false; return; }
        const form = new FormData();
        form.append("audio",blob,"speech."+ext);
        form.append("language","en");
        const ac = new AbortController();
        const to = setTimeout(() => ac.abort(), 40000);
        try {
          const res = await fetch(HOST + "/aprisha/transcribe",{
            method:"POST",headers:{"x-ap-stt-test-token":token},body:form,signal:ac.signal
          });
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.error || "HTTP " + res.status);
          const transcript = String(data.text || "").trim()
            .replace(/\b(?:apresha|apreisha|apreesha)\b/ig,"APRISHA");
          $("apmw-text").value = transcript;
          status(transcript ? "Recognized! Review or send to chat." : "No speech recognized; retry.");
        } catch(error) {
          status("Transcription failed: " + (error.name === "AbortError" ? "Timed out" : error.message));
        } finally {clearTimeout(to);pending=false;$("apmw-start").disabled=false;}
      };
      recorder.start();
      $("apmw-start").disabled=true;
      $("apmw-stop").disabled=false;
      status("Recording… speak clearly for 3–12 seconds.");
      timer=setTimeout(()=>{if(recorder?.state==="recording")recorder.stop();},MAX_MS);
    } catch(error) {
      release(); $("apmw-start").disabled=false; $("apmw-stop").disabled=true;
      status("Microphone failed: " + error.message);
    }
  });
  $("apmw-stop").addEventListener("click",()=>{if(recorder?.state==="recording")recorder.stop();});

  function visible(el) {return !!(el && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden");}
  function findComposer() {
    const selectors=[
      "#messageInput","#chatInput","#userInput","#promptInput","#message-input","#chat-input",
      "[data-testid='chat-input']","[data-testid='message-input']",
      "textarea","[contenteditable='true']","input[type='text']"
    ];
    const found=[];
    for(const selector of selectors) {
      for(const el of document.querySelectorAll(selector)) {
        if(panel.contains(el) || !visible(el) || el.disabled || el.readOnly || found.includes(el)) continue;
        const d=[el.id,el.className,el.getAttribute("placeholder"),el.getAttribute("aria-label")].join(" ").toLowerCase();
        let score=el.tagName==="TEXTAREA"?10:0;
        if(/message|chat|prompt|ask|synapse|question|composer|type/.test(d))score+=40;
        if(/search|filter|email|password|name/.test(d))score-=50;
        if(el.closest("form"))score+=5;
        found.push(el);el.__apmwScore=score;
      }
    }
    return found.sort((a,b)=>b.__apmwScore-a.__apmwScore)[0];
  }
  function setText(el,text) {
    el.focus();
    if(el.isContentEditable)el.textContent=text;
    else {
      const proto=el.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
      const set=Object.getOwnPropertyDescriptor(proto,"value")?.set;
      if(set)set.call(el,text); else el.value=text;
    }
    try {el.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertText",data:text}));}
    catch {el.dispatchEvent(new Event("input",{bubbles:true}));}
    el.dispatchEvent(new Event("change",{bubbles:true}));
  }
  $("apmw-send").addEventListener("click",()=>{
    const text=$("apmw-text").value.trim();
    if(!text)return status("Record and transcribe speech first.");
    const input=findComposer();
    if(!input)return status("Couldn't locate chat composer. Copy the transcript into chat manually.");
    setText(input,text);
    panel.style.display="none";
    input.scrollIntoView({block:"nearest"});
    input.focus();
    // Deliberately leave submitting to the user: unknown chat UI cannot be safely auto-invoked.
    status("Transcript inserted. Tap AP Synapse's Send button to get a response.");
    launcher.textContent="✓ APRISHA text ready";
    setTimeout(()=>{launcher.textContent="🎤 APRISHA Talk";},3500);
  });
  $("apmw-copy").addEventListener("click",async()=>{
    const transcript=$("apmw-text").value.trim();
    if(!transcript)return status("No transcript to copy yet.");
    try {await navigator.clipboard.writeText(transcript);status("Transcript copied. Paste it into chat.");}
    catch {status("Select the transcript and copy it manually.");}
  });
  window.addEventListener("pagehide",()=>{
    if(recorder?.state==="recording")recorder.stop();
    release();token="";
  });
})();
