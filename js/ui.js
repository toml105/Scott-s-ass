/* ============================================
   TAVERN ROYALE - UI Rendering & DOM
   ============================================ */

const UI = {
  screens: {},
  currentScreen: null,

  init() {
    this.screens = {
      splash: document.getElementById('screen-splash'),
      setup: document.getElementById('screen-setup'),
      game: document.getElementById('screen-game'),
      drink: document.getElementById('screen-drink'),
      scoreboard: document.getElementById('screen-scoreboard'),
      end: document.getElementById('screen-end')
    };
  },

  showScreen(name) {
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    this.screens[name].classList.add('active');
    this.currentScreen = name;
  },

  // Update the player bar at top of game screen
  updatePlayerBar(game) {
    for (let i = 0; i < 3; i++) {
      const p = game.players[i];
      document.getElementById(`p${i}-avatar`).textContent = game.getAvatarEmoji(i);
      document.getElementById(`p${i}-name`).textContent = p.name;

      const fingersEl = document.getElementById(`p${i}-fingers`);
      const oldVal = parseInt(fingersEl.textContent) || 0;
      fingersEl.textContent = p.fingers;
      if (p.fingers > oldVal) {
        fingersEl.classList.add('count-pop');
        setTimeout(() => fingersEl.classList.remove('count-pop'), 400);
      }

      const immunityEl = document.getElementById(`p${i}-immunity`);
      if (p.immunity <= 0) {
        immunityEl.classList.add('used');
      } else {
        immunityEl.classList.remove('used');
      }
    }
  },

  // Update round info header
  updateRoundInfo(game) {
    document.getElementById('round-number').textContent = `${game.currentRound + 1}/${TOTAL_ROUNDS}`;
    document.getElementById('round-multiplier').textContent = game.multiplierLabel;

    const info = game.currentRoundInfo;
    document.getElementById('round-type-name').innerHTML = `${info.icon} ${info.name}`;
    document.getElementById('round-type-desc').textContent = info.desc;
  },

  // Update active rules display
  updateActiveRules(game) {
    const container = document.getElementById('active-rules');
    const list = document.getElementById('rules-list');

    if (game.activeRules.length === 0) {
      container.style.display = 'none';
    } else {
      container.style.display = 'block';
      list.innerHTML = game.activeRules
        .map(r => `<div class="rule-item">- ${r} (1 finger penalty!)</div>`)
        .join('');
    }
  },

  // Show round intro before each round
  showRoundIntro(game, onReady) {
    const intro = document.getElementById('round-intro');
    const info = game.currentRoundInfo;
    const header = document.getElementById('round-header');
    header.style.display = 'none';
    document.getElementById('round-area').innerHTML = '';

    document.getElementById('round-intro-icon').innerHTML = info.icon;
    document.getElementById('round-intro-name').textContent = `Round ${game.currentRound + 1}: ${info.name}`;
    document.getElementById('round-intro-desc').textContent = info.desc;

    const mult = game.multiplierLabel;
    const multEl = document.getElementById('round-intro-multiplier');
    if (mult !== 'x1') {
      multEl.textContent = `Multiplier: ${mult} - penalties are scaled!`;
      multEl.style.display = 'block';
    } else {
      multEl.style.display = 'none';
    }

    intro.style.display = 'flex';

    document.getElementById('btn-start-round').onclick = () => {
      intro.style.display = 'none';
      header.style.display = 'block';
      onReady();
    };
  },

  // Show drink penalty screen
  // NOTE: penalties are RAW (unscaled). We scale for display and apply scaled values.
  showDrinkScreen(game, penalties, onCheers) {
    const container = document.getElementById('drink-assignments');
    container.innerHTML = '';

    // Pre-compute scaled values for each player
    const scaledPenalties = {};
    let hasPenalties = false;

    for (let i = 0; i < 3; i++) {
      const raw = penalties[i] || 0;
      if (raw <= 0) continue;
      hasPenalties = true;
      scaledPenalties[i] = Math.ceil(raw * game.multiplier);
    }

    for (const iStr of Object.keys(scaledPenalties)) {
      const i = parseInt(iStr);
      const scaled = scaledPenalties[i];

      const card = document.createElement('div');
      card.className = 'drink-card slide-up';
      card.style.animationDelay = `${i * 0.15}s`;
      card.innerHTML = `
        <div class="drink-card-player">
          <span class="drink-card-avatar">${game.getAvatarEmoji(i)}</span>
          <span class="drink-card-name">${game.players[i].name}</span>
        </div>
        <div class="drink-card-amount">
          <div class="drink-card-fingers" data-player="${i}">${scaled}</div>
          <div class="drink-card-label">fingers</div>
        </div>
        ${game.players[i].immunity > 0 ? `
          <button class="immunity-use-btn" data-player="${i}" data-amount="${scaled}">
            &#128737; Halve to ${Math.ceil(scaled / 2)}
          </button>
        ` : ''}
      `;
      container.appendChild(card);
    }

    if (!hasPenalties) {
      container.innerHTML = '<p class="text-gold text-center">No penalties this round! Lucky!</p>';
    }

    // Immunity button handlers
    container.querySelectorAll('.immunity-use-btn').forEach(btn => {
      btn.onclick = () => {
        const pi = parseInt(btn.dataset.player);
        const amount = parseInt(btn.dataset.amount);
        if (game.useImmunity(pi)) {
          const halved = Math.ceil(amount / 2);
          scaledPenalties[pi] = halved;
          const fingersEl = btn.closest('.drink-card').querySelector('.drink-card-fingers');
          fingersEl.textContent = halved;
          fingersEl.classList.add('count-pop');
          btn.remove();
          UI.updatePlayerBar(game);
        }
      };
    });

    // Skull King button
    const skullKingDiv = document.getElementById('drink-skull-king');
    if (game.skullKing >= 0 && !game.skullKingUsed && hasPenalties) {
      skullKingDiv.style.display = 'block';
      document.getElementById('btn-skull-king').onclick = () => {
        game.skullKingUsed = true;
        skullKingDiv.style.display = 'none';
        const targets = Object.keys(scaledPenalties).map(Number).filter(i => i !== game.skullKing && scaledPenalties[i] > 0);
        if (targets.length > 0) {
          UI.showSkullKingPicker(game, scaledPenalties, targets);
        }
      };
    } else {
      skullKingDiv.style.display = 'none';
    }

    // Title
    const title = document.getElementById('drink-title');
    title.textContent = hasPenalties ? 'Time to Drink!' : 'Safe Round!';

    // Cheers button - apply already-scaled values directly (no double-multiplier)
    document.getElementById('btn-cheers').onclick = () => {
      for (const iStr of Object.keys(scaledPenalties)) {
        const i = parseInt(iStr);
        game.applyFingersRaw(i, scaledPenalties[i]);
      }
      UI.updatePlayerBar(game);
      onCheers();
    };

    this.showScreen('drink');
  },

  // scaledPenalties are already multiplied values
  showSkullKingPicker(game, scaledPenalties, targets) {
    const container = document.getElementById('drink-assignments');
    const pickerDiv = document.createElement('div');
    pickerDiv.className = 'slide-up mt-16';
    pickerDiv.innerHTML = `
      <p class="text-center text-red">&#9760; Skull King: Double someone's penalty!</p>
      <div class="player-select-row mt-8">
        ${targets.map(i => `
          <button class="player-select-btn" data-player="${i}">
            ${game.getAvatarEmoji(i)} ${game.players[i].name} (${scaledPenalties[i]} -> ${scaledPenalties[i] * 2})
          </button>
        `).join('')}
      </div>
    `;
    container.appendChild(pickerDiv);

    pickerDiv.querySelectorAll('.player-select-btn').forEach(btn => {
      btn.onclick = () => {
        const target = parseInt(btn.dataset.player);
        scaledPenalties[target] = scaledPenalties[target] * 2;
        // Update the displayed fingers
        const fEl = container.querySelector(`.drink-card-fingers[data-player="${target}"]`);
        if (fEl) {
          fEl.textContent = scaledPenalties[target];
          fEl.classList.add('count-pop');
          fEl.closest('.drink-card').classList.add('shake');
        }
        pickerDiv.remove();
      };
    });
  },

  // Show scoreboard overlay
  showScoreboard(game) {
    const container = document.getElementById('scoreboard-players');
    const maxFingers = Math.max(...game.players.map(p => p.fingers), 1);

    container.innerHTML = game.players.map((p, i) => `
      <div class="sb-player">
        <div class="sb-player-header">
          <span class="sb-avatar">${game.getAvatarEmoji(i)}</span>
          <span class="sb-name">${p.name}</span>
          <span class="sb-total-fingers">${p.fingers} fingers</span>
        </div>
        <div class="sb-beer-glass">
          <div class="sb-beer-fill" style="width: ${Math.min((p.fingers / maxFingers) * 100, 100)}%"></div>
        </div>
        <div class="sb-stats">
          <span>Rounds won: ${p.roundsWon}</span>
          <span>Immunity: ${p.immunity > 0 ? '&#128737;' : 'Used'}</span>
          ${game.skullKing === i ? '<span class="skull-king-badge">&#9760; Skull King</span>' : ''}
        </div>
      </div>
    `).join('');

    this.showScreen('scoreboard');
  },

  // Show end game screen
  showEndScreen(game) {
    const rankings = game.getRankings();
    const container = document.getElementById('end-rankings');

    const medals = ['&#128081;', '&#129352;', '&#128128;'];
    const titles = ['Pub Legend', 'Survivor', 'Shame King'];

    container.innerHTML = rankings.map((p, rank) => `
      <div class="end-rank ${rank === 0 ? 'winner' : ''} ${rank === 2 ? 'loser' : ''} slide-up" style="animation-delay:${rank * 0.2}s">
        <span class="rank-position">${medals[rank]}</span>
        <span class="sb-avatar">${game.getAvatarEmoji(p.index)}</span>
        <div class="rank-info">
          <div class="rank-name">${p.name}</div>
          <div class="rank-title">${titles[rank]}</div>
        </div>
        <span class="rank-fingers">${p.fingers} fingers</span>
      </div>
    `).join('');

    const loser = rankings[2];
    document.getElementById('end-punishment').innerHTML = `
      <strong>&#9760; Punishment Round!</strong><br>
      ${loser.name} must skull the rest of their beer<br>
      OR do a dare chosen by the other two!
    `;

    this.showScreen('end');
  },

  // Show assign fingers overlay (for Tower of Risk winner)
  showAssignOverlay(game, winnerIndex, fingers, onAssign) {
    const others = [0,1,2].filter(i => i !== winnerIndex);
    const overlay = document.createElement('div');
    overlay.className = 'message-overlay';
    overlay.innerHTML = `
      <div class="message-box">
        <h3>${game.getAvatarEmoji(winnerIndex)} ${game.players[winnerIndex].name} Wins!</h3>
        <p>Assign ${fingers} fingers to someone:</p>
        <div class="player-select-row">
          ${others.map(i => `
            <button class="player-select-btn" data-player="${i}">
              ${game.getAvatarEmoji(i)} ${game.players[i].name}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.player-select-btn').forEach(btn => {
      btn.onclick = () => {
        const target = parseInt(btn.dataset.player);
        overlay.remove();
        onAssign(target);
      };
    });
  },

  // Show skull card event
  showSkullCardEvent(game, playerIndex, onDone) {
    const overlay = document.createElement('div');
    overlay.className = 'message-overlay';
    overlay.innerHTML = `
      <div class="message-box">
        <div class="skull-entrance" style="font-size:4rem">&#9760;</div>
        <h3>THE SKULL CARD!</h3>
        <p>${game.players[playerIndex].name} is now the <strong>Skull King</strong>!</p>
        <p class="text-dim">Once this game, force someone to drink DOUBLE on any penalty.</p>
        <button class="btn btn-gold mt-16" id="btn-skull-ok">Fear Me!</button>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('btn-skull-ok').onclick = () => {
      overlay.remove();
      onDone();
    };
  }
};
