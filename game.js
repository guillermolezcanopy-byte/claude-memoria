/* Fuego Cruzado — lógica del juego */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const selected = new Set([1, 2]); // niveles activos por defecto
  let deck = [];
  let index = 0;

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

  // ---------- Flujo del juego ----------
  function startGame() {
    deck = shuffle(CARDS.filter((c) => selected.has(c.lvl)));
    index = 0;
    showScreen("game");
    $("empty").style.display = "none";
    $("card").style.display = "";
    $("skipBtn").style.display = "";
    $("nextBtn").textContent = "Siguiente carta";
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
      $("progress").textContent = `Carta ${deck.length}/${deck.length}`;
      return;
    }

    const c = deck[index];
    const info = LEVELS[c.lvl];

    // El contenido del frente se actualiza tras un pequeño delay para que no
    // se vea la carta anterior mientras se está dando vuelta.
    setTimeout(() => {
      const badge = $("badge");
      badge.textContent = info.name;
      badge.style.background = info.color;
      $("num").textContent = `#${index + 1}`;
      $("cardText").textContent = c.text;
      $("cardFoot").innerHTML = `Picante: <span class="heat">${heatIcons(c.lvl)}</span>`;
      $("cardText").parentElement.parentElement.classList.add("fade");
      setTimeout(() => $("cardText").parentElement.parentElement.classList.remove("fade"), 500);
    }, 0);

    $("progress").textContent = `Carta ${index + 1}/${deck.length}`;
  }

  // ---------- Eventos ----------
  $("startBtn").addEventListener("click", startGame);

  $("card").addEventListener("click", () => {
    $("card").classList.toggle("flipped");
  });

  $("nextBtn").addEventListener("click", () => {
    if (index >= deck.length) {
      // Reiniciar mazo
      startGame();
      return;
    }
    index++;
    renderCard();
  });

  $("skipBtn").addEventListener("click", () => {
    if (index >= deck.length) return;
    // Mandar la carta actual al final del mazo
    const c = deck.splice(index, 1)[0];
    deck.push(c);
    renderCard();
  });

  $("restart").addEventListener("click", () => {
    showScreen("setup");
  });

  updateStart();
})();
