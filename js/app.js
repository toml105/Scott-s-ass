/* ============================================
   TAVERN ROYALE - App Initialization & Wiring
   ============================================ */

(function() {
  'use strict';

  let game;
  let selectedPlayerCount = 3;

  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  // Wait for DOM
  document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    game = new GameState();

    setupSplash();
    setupPlayerSetup();
    setupGameScreen();
    setupEndScreen();
  });

  // --- Splash Screen ---
  function setupSplash() {
    document.getElementById('btn-start').onclick = () => {
      UI.showScreen('setup');
    };
  }

  // --- Player Setup ---
  function setupPlayerSetup() {
    // Player count toggle
    document.querySelectorAll('.count-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedPlayerCount = parseInt(btn.dataset.count);

        // Show/hide 4th player input
        const p3group = document.querySelector('.player-input-group[data-player="3"]');
        if (p3group) {
          p3group.style.display = selectedPlayerCount >= 4 ? 'block' : 'none';
        }
      };
    });

    // Avatar selection
    document.querySelectorAll('.player-input-group').forEach(group => {
      group.querySelectorAll('.avatar-btn').forEach(btn => {
        btn.onclick = () => {
          group.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        };
      });
    });

    // Begin game
    document.getElementById('btn-begin').onclick = () => {
      game.reset(selectedPlayerCount);

      // Read player names and avatars
      for (let idx = 0; idx < selectedPlayerCount; idx++) {
        const group = document.querySelector(`.player-input-group[data-player="${idx}"]`);
        if (!group) continue;
        const nameInput = group.querySelector('.player-name-input');
        const selectedAvatar = group.querySelector('.avatar-btn.selected');

        game.players[idx].name = nameInput.value.trim() || `Bloke #${idx + 1}`;
        game.players[idx].avatar = selectedAvatar ? selectedAvatar.dataset.avatar : 'beer';
      }

      startGame();
    };
  }

  // --- Game Flow ---
  function startGame() {
    UI.setupPlayerChips(game);
    UI.showScreen('game');
    UI.updatePlayerBar(game);
    startRound();
  }

  function startRound() {
    if (game.isGameOver) {
      endGame();
      return;
    }

    UI.showScreen('game');
    UI.updateRoundInfo(game);
    UI.updatePlayerBar(game);
    UI.updateActiveRules(game);

    const roundType = game.currentRoundType;
    const area = document.getElementById('round-area');
    area.innerHTML = '';

    // Show round intro first
    UI.showRoundIntro(game, () => {
      // After player taps "Deal Me In", check skull card then launch
      if (game.currentRound === game.skullCardRound && game.skullKing < 0) {
        const skullPlayer = Math.floor(Math.random() * game.playerCount);
        game.skullKing = skullPlayer;
        UI.showSkullCardEvent(game, skullPlayer, () => {
          launchRound(roundType, area);
        });
      } else {
        launchRound(roundType, area);
      }
    });
  }

  function launchRound(roundType, area) {
    const roundImpl = Rounds[roundType];
    if (!roundImpl) {
      console.error('Unknown round type:', roundType);
      game.advanceRound();
      startRound();
      return;
    }

    roundImpl.start(game, area, (penalties, special) => {
      onRoundComplete(penalties, special);
    });
  }

  function onRoundComplete(penalties, special) {
    // Handle special: 'assign' means winner assigns 2 fingers
    if (special === 'assign') {
      // Find who won this round (highest roundsWon)
      let roundWinner = 0;
      let maxWins = -1;
      for (let i = 0; i < game.playerCount; i++) {
        if (game.players[i].roundsWon > maxWins) {
          maxWins = game.players[i].roundsWon;
          roundWinner = i;
        }
      }

      UI.showAssignOverlay(game, roundWinner, 2, (target) => {
        if (!penalties) penalties = {};
        penalties[target] = (penalties[target] || 0) + 2;
        showPenalties(penalties);
      });
    } else {
      showPenalties(penalties || {});
    }
  }

  function showPenalties(penalties) {
    UI.showDrinkScreen(game, penalties, () => {
      game.advanceRound();
      startRound();
    });
  }

  // --- Game Screen Buttons ---
  function setupGameScreen() {
    document.getElementById('btn-scoreboard').onclick = () => {
      UI.showScoreboard(game);
    };

    document.getElementById('btn-close-scoreboard').onclick = () => {
      UI.showScreen('game');
    };
  }

  // --- End Game ---
  function endGame() {
    UI.showEndScreen(game);
  }

  function setupEndScreen() {
    document.getElementById('btn-play-again').onclick = () => {
      game.reset(selectedPlayerCount);
      UI.showScreen('setup');
    };
  }

})();
