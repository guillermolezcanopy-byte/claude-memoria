/* Fuego Cruzado — lógica del juego */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const selected = new Set([1, 2]); // niveles activos por defecto
  let deck = [];
  let index = 0;
  let players = ["Jugador 1", "Jugador 2"];
  let turn = 0; // 0 o 1
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

  // Ruido filtrado en micro-ráfagas: suena a papel/hoja moviéndose.
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

  const sndFlip = () => rustle(1.0, 4);   // dar vuelta la carta
  const sndPage = () => rustle(0.8, 3);   // pasar / saltar carta
  const sndSoft = () => rustle(0.5, 2);   // detalles suaves (fin de tiempo)

  // ---------- Construir selección de niveles ----------
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

  // ---------- Utilidades ----------
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
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m + ":" + String(s).padStart(2, "0");
  }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    $(id).classList.add("active");
  }

  function renderTurn() {
    const t = $("turn");
    t.textContent = "Turno de " + players[turn];
    t.classList.remove("bump");
    void t.offsetWidth; // reinicia la animación
    t.classList.add("bump");
  }

  // ---------- Temporizador ----------
  let timerId = null;
  let timerTotal = 0;
  let timerLeft = 0;

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function resetTimerUI() {
    const btn = $("timerBtn");
    btn.classList.remove("running", "done");
    $("timerFill").classList.remove("done");
    $("timerFill").style.transform = "scaleX(1)";
    if (timerTotal) $("timerLabel").textContent = fmt(timerTotal);
  }

  function setupTimer(secs) {
    stopTimer();
    if (!secs) {
      $("timerWrap").style.display = "none";
      timerTotal = timerLeft = 0;
      return;
    }
    timerTotal = secs;
    timerLeft = secs;
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
    if (timerId) {
      // pausar
      stopTimer();
      btn.classList.remove("running");
      return;
    }
    if (timerLeft <= 0) timerLeft = timerTotal; // reiniciar tras "¡Tiempo!"
    resetTimerUI();
    btn.classList.add("running");
    $("timerLabel").textContent = fmt(timerLeft);
    $("timerFill").style.transform = "scaleX(" + timerLeft / timerTotal + ")";
    timerId = setInterval(tick, 1000);
  }

  // ---------- Flujo del juego ----------
  function startGame() {
    const n1 = $("p1").value.trim();
    const n2 = $("p2").value.trim();
    players = [n1 || "Jugador 1", n2 || "Jugador 2"];
    turn = 0;
    deck = shuffle(CARDS.filter((c) => selected.has(c.lvl)));
    index = 0;
    showScreen("game");
    $("empty").style.display = "none";
    $("card").style.display = "";
    $("skipBtn").style.display = "";
    $("nextBtn").textContent = "Siguiente carta";
    renderTurn();
    renderCard();
  }

  function renderCard() {
    const card = $("card");
    card.classList.remove("flipped");
    stopTimer();

    if (index >= deck.length) {
      $("card").style.display = "none";
      $("empty").style.display = "";
      $("skipBtn").style.display = "none";
      $("timerWrap").style.display = "none";
      $("nextBtn").textContent = "Jugar de nuevo";
      $("turn").textContent = "¡Fin del juego!";
      $("progress").textContent = `Carta ${deck.length}/${deck.length}`;
      return;
    }

    const c = deck[index];
    const info = LEVELS[c.lvl];
    setupTimer(c.secs);

    setTimeout(() => {
      const badge = $("badge");
      badge.textContent = info.name;
      badge.style.background = info.color;
      $("num").textContent = `#${index + 1}`;
      $("cardText").textContent = c.text;
      $("cardFoot").innerHTML =
        `Le toca a <b>${players[turn]}</b> · Picante: <span class="heat">${heatIcons(c.lvl)}</span>`;
      const wrap = $("cardText").parentElement.parentElement;
      wrap.classList.add("fade");
      setTimeout(() => wrap.classList.remove("fade"), 500);
    }, 0);

    $("progress").textContent = `Carta ${index + 1}/${deck.length}`;
  }

  function advance() {
    index++;
    if (index < deck.length) {
      turn = turn === 0 ? 1 : 0; // alternar turno
      renderTurn();
    }
    renderCard();
  }

  // ---------- Eventos ----------
  $("startBtn").addEventListener("click", startGame);

  $("soundToggle").addEventListener("change", (e) => {
    soundOn = e.target.checked;
    if (soundOn) audio(); // desbloquea el contexto con el gesto del usuario
  });

  $("card").addEventListener("click", () => {
    const card = $("card");
    card.classList.toggle("flipped");
    if (card.classList.contains("flipped")) sndFlip();
  });

  $("timerBtn").addEventListener("click", toggleTimer);

  $("nextBtn").addEventListener("click", () => {
    if (index >= deck.length) {
      startGame();
      return;
    }
    sndPage();
    advance();
  });

  $("skipBtn").addEventListener("click", () => {
    if (index >= deck.length) return;
    sndPage();
    // Mandar la carta actual al final del mazo (mismo turno)
    const c = deck.splice(index, 1)[0];
    deck.push(c);
    renderCard();
  });

  $("restart").addEventListener("click", () => {
    stopTimer();
    showScreen("setup");
  });

  updateStart();
})();
