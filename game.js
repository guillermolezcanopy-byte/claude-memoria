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

  // ---------- Sonido (Web Audio, sin archivos) ----------
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
  function tone(freq, dur, type = "sine", vol = 0.18, delay = 0) {
    const ac = audio();
    if (!ac) return;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }
  const sndFlip = () => { tone(420, 0.12, "triangle", 0.15); tone(660, 0.14, "triangle", 0.12, 0.05); };
  const sndNext = () => tone(330, 0.10, "sine", 0.13);
  const sndHeat = (lvl) => { // pequeño "subidón" según el nivel
    const base = [0, 392, 466, 523, 622][lvl] || 440;
    tone(base, 0.16, "sawtooth", 0.10);
    if (lvl >= 3) tone(base * 1.5, 0.22, "sawtooth", 0.10, 0.08);
  };
  const sndEnd = () => { tone(523, 0.16, "sine", 0.14); tone(659, 0.18, "sine", 0.14, 0.12); tone(784, 0.3, "sine", 0.14, 0.24); };

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

    if (index >= deck.length) {
      $("card").style.display = "none";
      $("empty").style.display = "";
      $("skipBtn").style.display = "none";
      $("nextBtn").textContent = "Jugar de nuevo";
      $("turn").textContent = "¡Fin del juego!";
      $("progress").textContent = `Carta ${deck.length}/${deck.length}`;
      sndEnd();
      return;
    }

    const c = deck[index];
    const info = LEVELS[c.lvl];

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
    if (card.classList.contains("flipped")) {
      sndFlip();
      const c = deck[index];
      if (c) setTimeout(() => sndHeat(c.lvl), 180);
    }
  });

  $("nextBtn").addEventListener("click", () => {
    if (index >= deck.length) {
      startGame();
      return;
    }
    sndNext();
    advance();
  });

  $("skipBtn").addEventListener("click", () => {
    if (index >= deck.length) return;
    sndNext();
    // Mandar la carta actual al final del mazo (mismo turno)
    const c = deck.splice(index, 1)[0];
    deck.push(c);
    renderCard();
  });

  $("restart").addEventListener("click", () => {
    showScreen("setup");
  });

  updateStart();
})();
