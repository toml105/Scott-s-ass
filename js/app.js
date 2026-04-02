/* ============================================
   TAVERN ROYALE - App Initialization & Wiring
   ============================================ */

(function() {
  'use strict';

  let game;

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
    // Avatar selection
    document.querySelectorAll('.player-input-group').forEach(group => {
      const playerIdx = parseInt(group.dataset.player);
      group.querySelectorAll('.avatar-btn').forEach(btn => {
        btn.onclick = () => {
          group.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        };
      });
    });

    // Begin game
    document.getElementById('btn-begin').onclick = () => {
      game.reset();

      // Read player names and avatars
      document.querySelectorAll('.player-input-group').forEach(group => {
        const idx = parseInt(group.dataset.player);
        const nameInput = group.querySelector('.player-name-input');
        const selectedAvatar = group.querySelector('.avatar-btn.selected');

        game.players[idx].name = nameInput.value.trim() || `Bloke #${idx + 1}`;
        game.players[idx].avatar = selectedAvatar ? selectedAvatar.dataset.avatar : 'beer';
      });

      startGame();
    };
  }

  // --- Game Flow ---
  function startGame() {
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
        const skullPlayer = Math.floor(Math.random() * 3);
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
      // Find the round winner (most recent)
      const rankings = game.getRankings();
      const winner = rankings[0].index; // Player with least fingers likely won
      // Actually find who won this round
      let roundWinner = -1;
      for (let i = 0; i < 3; i++) {
        if (game.players[i].roundsWon > 0) roundWinner = i;
      }
      if (roundWinner < 0) roundWinner = 0;

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
      // Grant immunity to round winner if they don't have one
      // (Winner was already recorded by the round)
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
      game.reset();
      UI.showScreen('setup');
    };
  }

})();
