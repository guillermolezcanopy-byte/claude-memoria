/* Fuego Cruzado — lógica del juego */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const selected = new Set([1, 2]);
  let deck = [];
  let index = 0;
  let players = ["Jugador 1", "Jugador 2"];
  let turn = 0;
  let soundOn = true;

  // ---------- Sonido: "hoja de papel" (Web Audio, sin archivos) ----------
  let actx = null;
  function audio() {
    if (!soundOn) return null;
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  function noiseBuffer(ac, dur) {
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }
  function rustle(intensity = 1, bursts = 3) {
    const ac = audio();
    if (!ac) return;
    const t0 = ac.currentTime;
    for (let b = 0; b < bursts; b++) {
      const start = t0 + b * 0.045 + Math.random() * 0.02;
      const dur = 0.07 + Math.random() * 0.06;
      const src = ac.createBufferSource();
      src.buffer = noiseBuffer(ac, dur);
      const bp = ac.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2600 + Math.random() * 2600;
      bp.Q.value = 0.6;
      const hp = ac.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1100;
      const g = ac.createGain();
      const peak = 0.07 * intensity;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(peak, start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      src.connect(bp).connect(hp).connect(g).connect(ac.destination);
      src.start(start);
      src.stop(start + dur + 0.03);
    }
  }
  const sndFlip = () => rustle(1.0, 4);
  const sndPage = () => rustle(0.8, 3);
  const sndSoft = () => rustle(0.5, 2);

  // ---------- Niveles ----------
  const levelsEl = $("levels");
  Object.entries(LEVELS).forEach(([lvl, info]) => {
    const n = Number(lvl);
    const count = CARDS.filter((c) => c.lvl === n).length;
    const div = document.createElement("div");
    div.className = "level" + (selected.has(n) ? " on" : "");
    div.dataset.lvl = lvl;
    div.innerHTML = `
      <span class="emoji">${info.emoji}</span>
      <span class="meta">
        <span class="name">${info.name}</span>
        <span class="desc">${info.desc} · ${count} cartas</span>
      </span>
      <span class="check">✓</span>`;
    div.addEventListener("click", () => {
      if (selected.has(n)) selected.delete(n);
      else selected.add(n);
      div.classList.toggle("on", selected.has(n));
      updateStart();
    });
    levelsEl.appendChild(div);
  });

  function updateStart() {
    $("startBtn").disabled = selected.size === 0;
  }

  // ---------- Utils ----------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function heatIcons(lvl) {
    return "🔥".repeat(lvl) + "<span style='opacity:.25'>" + "🔥".repeat(4 - lvl) + "</span>";
  }
  function fmt(secs) {
    return Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");
  }
  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    $(id).classList.add("active");
  }
  function renderTurn() {
    const t = $("turn");
    t.textContent = "Turno de " + players[turn];
    t.classList.remove("bump");
    void t.offsetWidth;
    t.classList.add("bump");
  }

  // ---------- Temporizador ----------
  let timerId = null, timerTotal = 0, timerLeft = 0;
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function resetTimerUI() {
    const btn = $("timerBtn");
    btn.classList.remove("running", "done");
    $("timerFill").classList.remove("done");
    $("timerFill").style.transform = "scaleX(1)";
    if (timerTotal) $("timerLabel").textContent = fmt(timerTotal);
  }
  function setupTimer(secs) {
    stopTimer();
    if (!secs) { $("timerWrap").style.display = "none"; timerTotal = timerLeft = 0; return; }
    timerTotal = secs; timerLeft = secs;
    $("timerWrap").style.display = "";
    resetTimerUI();
  }
  function tick() {
    timerLeft--;
    $("timerLabel").textContent = fmt(Math.max(0, timerLeft));
    $("timerFill").style.transform = "scaleX(" + Math.max(0, timerLeft) / timerTotal + ")";
    if (timerLeft <= 0) {
      stopTimer();
      const btn = $("timerBtn");
      btn.classList.remove("running");
      btn.classList.add("done");
      $("timerFill").classList.add("done");
      $("timerLabel").textContent = "¡Tiempo!";
      sndSoft(); setTimeout(sndSoft, 200);
      if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
    }
  }
  function toggleTimer() {
    if (!timerTotal) return;
    const btn = $("timerBtn");
    if (timerId) { stopTimer(); btn.classList.remove("running"); return; }
    if (timerLeft <= 0) timerLeft = timerTotal;
    resetTimerUI();
    btn.classList.add("running");
    $("timerLabel").textContent = fmt(timerLeft);
    $("timerFill").style.transform = "scaleX(" + timerLeft / timerTotal + ")";
    timerId = setInterval(tick, 1000);
  }

  // ---------- Acciones ----------
  function skipCard() {
    if (index >= deck.length) return;
    stopTimer();
    sndPage();
    const c = deck.splice(index, 1)[0];
    deck.push(c);
    renderCard();
  }

  function advance() {
    stopTimer();
    sndPage();
    index++;
    if (index < deck.length) {
      turn = turn === 0 ? 1 : 0;
      renderTurn();
    }
    renderCard();
  }

  // ---------- Juego ----------
  function startGame() {
    const n1 = $("p1").value.trim();
    const n2 = $("p2").value.trim();
    players = [n1 || "Jugador 1", n2 || "Jugador 2"];
    turn = 0;
    deck = shuffle(CARDS.filter((c) => selected.has(c.lvl)));
    index = 0;
    showScreen("game");
    $("empty").style.display = "none";
    $("cardWrap").style.display = "";
    $("skipBtn").style.display = "";
    $("nextBtn").style.display = "";
    $("swipeHint").style.display = "";
    renderTurn();
    renderCard();
  }

  function renderCard() {
    const card = $("card");
    const wrap = $("cardWrap");
    card.classList.remove("flipped");
    wrap.classList.remove("snap", "fly");
    wrap.style.cssText = "";
    $("lblLeft").style.opacity = 0;
    $("lblRight").style.opacity = 0;
    stopTimer();

    if (index >= deck.length) {
      $("cardWrap").style.display = "none";
      $("empty").style.display = "";
      $("skipBtn").style.display = "none";
      $("nextBtn").style.display = "none";
      $("swipeHint").style.display = "none";
      $("timerWrap").style.display = "none";
      $("turn").textContent = "¡Fin del juego!";
      $("progress").textContent = "Carta " + deck.length + "/" + deck.length;
      return;
    }

    const c = deck[index];
    const info = LEVELS[c.lvl];
    setupTimer(c.secs);

    setTimeout(() => {
      const badge = $("badge");
      badge.textContent = info.name;
      badge.style.background = info.color;
      $("num").textContent = "#" + (index + 1);
      $("cardText").textContent = c.text;
      $("cardFoot").innerHTML =
        "Le toca a <b>" + players[turn] + "</b> · Picante: <span class='heat'>" + heatIcons(c.lvl) + "</span>";
      const front = $("front");
      front.classList.add("fade");
      setTimeout(() => front.classList.remove("fade"), 450);
    }, 0);

    $("progress").textContent = "Carta " + (index + 1) + "/" + deck.length;
  }

  // ---------- Swipe estilo Tinder ----------
  // El flip de la carta lo maneja el evento "click" nativo (confiable en
  // todos los dispositivos). El código de swipe solo actúa cuando hay un
  // arrastre horizontal real; si no, deja pasar el click para que flipee.
  const THRESHOLD = 85;
  let startX = 0, curX = 0;
  let dragging = false, swiped = false, animating = false;

  function getXY(e) {
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
  }

  function onStart(e) {
    if (animating || index >= deck.length) return;
    startX = getXY(e).x; curX = 0;
    dragging = true; swiped = false;
    const wrap = $("cardWrap");
    wrap.classList.remove("snap", "fly");
    wrap.style.transition = "none";
  }

  function onMove(e) {
    if (!dragging) return;
    const dx = getXY(e).x - startX;
    // Solo tomar el control si el movimiento horizontal supera 10px
    if (Math.abs(dx) < 10) return;
    curX = dx;
    swiped = true;
    $("cardWrap").style.transform = "translateX(" + dx + "px) rotate(" + dx * 0.07 + "deg)";
    const ratio = Math.min(Math.abs(dx) / THRESHOLD, 1);
    $("lblLeft").style.opacity  = dx < 0 ? ratio : 0;
    $("lblRight").style.opacity = dx > 0 ? ratio : 0;
    if (e.cancelable) e.preventDefault(); // evita scroll y suprime el click posterior
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    const wrap = $("cardWrap");
    wrap.style.transition = "";

    if (!swiped) return; // tap → el evento "click" nativo lo maneja

    $("lblLeft").style.opacity = 0;
    $("lblRight").style.opacity = 0;

    if (Math.abs(curX) >= THRESHOLD) {
      animating = true;
      const dir = curX > 0 ? 1 : -1;
      wrap.classList.add("fly");
      wrap.style.transform = "translateX(" + dir * (window.innerWidth + 320) + "px) rotate(" + dir * 28 + "deg)";
      wrap.style.opacity = "0";
      setTimeout(() => {
        animating = false;
        wrap.classList.remove("fly");
        wrap.style.cssText = "";
        if (dir > 0) advance(); else skipCard();
      }, 390);
    } else {
      wrap.classList.add("snap");
      wrap.style.transform = "";
      wrap.addEventListener("transitionend", () => wrap.classList.remove("snap"), { once: true });
    }
  }

  // ---------- Listeners ----------
  $("startBtn").addEventListener("click", startGame);
  $("restartBtn").addEventListener("click", startGame);
  $("soundToggle").addEventListener("change", (e) => { soundOn = e.target.checked; if (soundOn) audio(); });
  $("timerBtn").addEventListener("click", toggleTimer);
  $("skipBtn").addEventListener("click", skipCard);
  $("nextBtn").addEventListener("click", advance);
  $("restart").addEventListener("click", () => { stopTimer(); showScreen("setup"); });

  // Flip via click nativo: confiable en mobile (tap) y desktop (click)
  $("cardWrap").addEventListener("click", () => {
    if (animating || index >= deck.length) return;
    $("card").classList.toggle("flipped");
    if ($("card").classList.contains("flipped")) sndFlip();
  });

  const wrap = $("cardWrap");
  wrap.addEventListener("touchstart", onStart, { passive: true });
  wrap.addEventListener("touchmove",  onMove,  { passive: false });
  wrap.addEventListener("touchend",   onEnd,   { passive: true });
  wrap.addEventListener("mousedown",  onStart);
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup",   onEnd);

  updateStart();
})();
