/* ============================================
   TAVERN ROYALE - Round Implementations
   ============================================ */

const Rounds = {

  // ==========================================
  // 1. LIAR'S DRAW - Bluffing round
  // ==========================================
  'liars-draw': {
    state: {},

    start(game, area, onComplete) {
      const self = Rounds['liars-draw'];
      self.game = game;
      self.onComplete = onComplete;
      self.state = {
        cards: game.allPlayerIndices.map(() => game.deck.draw()),
        currentPlayer: 0,
        lastClaim: null,
        lastClaimPlayer: -1,
        claimCount: 0,
        phase: 'claim' // claim, challenge, reveal
      };

      self.render(area);
    },

    render(area) {
      const self = Rounds['liars-draw'];
      const s = self.state;
      const g = self.game;
      const cp = s.currentPlayer;

      if (s.phase === 'claim') {
        const playerCard = s.cards[cp];
        area.innerHTML = `
          <div class="turn-indicator">${g.getAvatarEmoji(cp)} ${g.players[cp].name}'s Turn</div>
          <p class="text-dim text-center mt-8">Pass the phone to ${g.players[cp].name}!</p>
          <p class="text-dim text-center">Tap the card to peek (hides after 3s), then claim a value - truth or bluff!</p>
          <div class="card-row mt-16">
            ${createCardHTML(playerCard, { faceDown: true, large: true, animClass: 'deal-in' })}
          </div>
          <p class="text-gold text-center mt-8" id="peek-hint">&#9757; Tap the card to peek</p>
          <div class="claim-area mt-16" id="claim-area" style="display:none">
            <p class="text-gold mb-16">Now claim a value (truth or lie!):</p>
            <div class="claim-options" id="claim-options"></div>
            ${s.lastClaim ? `<p class="text-dim mt-8">Last claim: ${s.lastClaim} by ${g.players[s.lastClaimPlayer].name}</p>` : ''}
          </div>
        `;

        const cardEl = area.querySelector('.card');
        cardEl.onclick = () => {
          cardEl.classList.add('flipped');
          const hint = document.getElementById('peek-hint');
          if (hint) hint.textContent = 'Card hides in 3s...';
          setTimeout(() => {
            document.getElementById('claim-area').style.display = 'block';
            self.renderClaimOptions();
          }, 300);
          setTimeout(() => {
            cardEl.classList.remove('flipped');
            if (hint) hint.textContent = 'Card hidden! Now make your claim below.';
          }, 3000);
        };

      } else if (s.phase === 'challenge') {
        const nextPlayer = (s.lastClaimPlayer + 1) % g.playerCount;
        const isFinalChallenge = s.claimCount >= g.playerCount;
        area.innerHTML = `
          <div class="turn-indicator">${g.getAvatarEmoji(nextPlayer)} ${g.players[nextPlayer].name}'s Turn</div>
          <p class="text-center mt-8">
            ${g.players[s.lastClaimPlayer].name} claims: <strong class="text-gold">${s.lastClaim}</strong>
          </p>
          ${isFinalChallenge ? '<p class="text-red text-center mt-8">Final call! You MUST call Bullshit or accept.</p>' : ''}
          <div class="mt-16" style="display:flex;flex-direction:column;gap:12px;align-items:center">
            <button class="btn bs-btn" id="btn-bs">BULLSHIT!</button>
            ${isFinalChallenge ? '<button class="btn btn-gold" id="btn-accept">I Believe It (end round)</button>' : '<button class="btn btn-gold" id="btn-accept">I Believe It (my turn to claim)</button>'}
          </div>
        `;

        document.getElementById('btn-bs').onclick = () => {
          self.resolveChallenge(nextPlayer, true);
        };
        document.getElementById('btn-accept').onclick = () => {
          if (isFinalChallenge) {
            // Accepted on final round - no penalties, round ends cleanly
            self.onComplete({});
            return;
          }
          // Move to next player's claim
          s.currentPlayer = nextPlayer;
          s.phase = 'claim';
          self.render(area);
        };

      } else if (s.phase === 'reveal') {
        // Handled by resolveChallenge
      }
    },

    renderClaimOptions() {
      const self = Rounds['liars-draw'];
      const container = document.getElementById('claim-options');
      if (!container) return;
      const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
      container.innerHTML = values.map(v =>
        `<button class="claim-btn" data-value="${v}">${v}</button>`
      ).join('');

      container.querySelectorAll('.claim-btn').forEach(btn => {
        btn.onclick = () => {
          const s = self.state;
          s.lastClaim = btn.dataset.value;
          s.lastClaimPlayer = s.currentPlayer;
          s.claimCount++;
          s.phase = 'challenge';
          self.render(document.getElementById('round-area'));
        };
      });
    },

    resolveChallenge(challengerIndex, called) {
      const self = Rounds['liars-draw'];
      const s = self.state;
      const g = self.game;
      const claimerCard = s.cards[s.lastClaimPlayer];
      const wasLie = claimerCard.value !== s.lastClaim;

      const area = document.getElementById('round-area');
      area.innerHTML = `
        <div class="slide-up">
          <h3 class="text-gold text-center">${called ? 'BULLSHIT CALLED!' : 'Challenge!'}</h3>
          <div class="card-row mt-16">
            ${createCardHTML(claimerCard, { large: true, animClass: 'slam-in' })}
          </div>
          <p class="text-center mt-16">${g.players[s.lastClaimPlayer].name} claimed <strong>${s.lastClaim}</strong></p>
          <p class="text-center">The card was <strong class="${wasLie ? 'text-red' : 'text-gold'}">${claimerCard.value}</strong></p>
        </div>
      `;

      const penalties = {};
      if (wasLie) {
        // Caller was right - liar drinks
        penalties[s.lastClaimPlayer] = 3;
        // Caller wins
        g.winRound(challengerIndex);
      } else {
        // Caller was wrong - caller drinks
        penalties[challengerIndex] = 3;
        g.winRound(s.lastClaimPlayer);
      }

      setTimeout(() => {
        self.onComplete(penalties);
      }, 2000);
    }
  },

  // ==========================================
  // 2. TOWER OF RISK - Blackjack style
  // ==========================================
  'tower-of-risk': {
    state: {},

    start(game, area, onComplete) {
      const self = Rounds['tower-of-risk'];
      self.game = game;
      self.onComplete = onComplete;
      self.state = {
        total: 0,
        cardsPlayed: [],
        activePlayers: game.allPlayerIndices.slice(),
        currentTurn: 0,
        lastStacker: -1,
        bailed: []
      };
      self.area = area;
      self.render();
    },

    render() {
      const self = Rounds['tower-of-risk'];
      const s = self.state;
      const g = self.game;

      if (s.activePlayers.length === 0 || s.total > 21) {
        self.resolve();
        return;
      }

      const cp = s.activePlayers[s.currentTurn % s.activePlayers.length];
      const dangerClass = s.total >= 17 ? 'danger' : '';

      self.area.innerHTML = `
        <div class="tower-total ${dangerClass}">${s.total}</div>
        <p class="text-dim text-center">Target: 21 | Don't bust!</p>
        <div class="card-row mt-8">
          ${s.cardsPlayed.slice(-5).map(c => createCardHTML(c, { animClass: '' })).join('')}
        </div>
        <div class="turn-indicator mt-16">${g.getAvatarEmoji(cp)} ${g.players[cp].name}'s Turn</div>
        <div class="tower-actions mt-16">
          <button class="btn btn-red btn-large" id="btn-stack">&#127183; Stack (draw card)</button>
          <button class="btn btn-gold btn-large" id="btn-bail">&#128694; Bail (safe)</button>
        </div>
      `;

      document.getElementById('btn-stack').onclick = () => {
        const card = g.deck.draw();
        const val = Math.min(card.numValue, 10); // Face cards = 10, Ace handled below
        const addVal = card.value === 'A' ? (s.total + 11 > 21 ? 1 : 11) : val;
        s.total += addVal;
        s.cardsPlayed.push(card);
        s.lastStacker = cp;

        if (s.total > 21) {
          self.render();
          return;
        }
        s.currentTurn++;
        self.render();
      };

      document.getElementById('btn-bail').onclick = () => {
        s.bailed.push(cp);
        s.activePlayers = s.activePlayers.filter(p => p !== cp);
        if (s.activePlayers.length === 0) {
          self.render();
          return;
        }
        s.currentTurn = s.currentTurn % s.activePlayers.length;
        self.render();
      };
    },

    resolve() {
      const self = Rounds['tower-of-risk'];
      const s = self.state;
      const g = self.game;
      const penalties = {};

      if (s.total > 21) {
        // Whoever stacked last busted
        const overBy = Math.min(s.total - 21, 5);
        penalties[s.lastStacker] = overBy;

        self.area.innerHTML = `
          <div class="tower-total danger bust">${s.total}</div>
          <h3 class="text-red text-center mt-8">BUST!</h3>
          <p class="text-center mt-8">${g.players[s.lastStacker].name} went over by ${s.total - 21}!</p>
        `;

        // Winner is whoever bailed last (or first bailer if all bailed)
        if (s.bailed.length > 0) {
          g.winRound(s.bailed[s.bailed.length - 1]);
        }
      } else {
        // All bailed, last one standing wins
        const lastActive = s.bailed.length > 0 ? s.bailed[s.bailed.length - 1] : 0;
        self.area.innerHTML = `
          <div class="tower-total">${s.total}</div>
          <h3 class="text-gold text-center mt-8">Everyone Bailed!</h3>
        `;
        // Winner assigns 2 fingers - handled via onComplete with special flag
        g.winRound(lastActive);
      }

      setTimeout(() => self.onComplete(penalties, s.total <= 21 ? 'assign' : null), 2000);
    }
  },

  // ==========================================
  // 3. FATE'S CHOICE - Kings Cup inspired
  // ==========================================
  'fates-choice': {
    state: {},

    start(game, area, onComplete) {
      const self = Rounds['fates-choice'];
      self.game = game;
      self.onComplete = onComplete;
      self.area = area;

      // Drawer is random
      self.state = {
        drawer: Math.floor(Math.random() * game.playerCount),
        card: game.deck.draw()
      };

      self.showCard();
    },

    showCard() {
      const self = Rounds['fates-choice'];
      const s = self.state;
      const g = self.game;
      const card = s.card;
      const isFace = isFaceCard(card);

      self.area.innerHTML = `
        <div class="turn-indicator">${g.getAvatarEmoji(s.drawer)} ${g.players[s.drawer].name} draws...</div>
        <div class="card-row mt-16">
          ${createCardHTML(card, { large: true, animClass: 'deal-in' })}
        </div>
        <div class="mt-16" id="fate-action"></div>
      `;

      setTimeout(() => {
        self.showFateAction(card, isFace);
      }, 800);
    },

    showFateAction(card, isFace) {
      const self = Rounds['fates-choice'];
      const s = self.state;
      const g = self.game;
      const actionArea = document.getElementById('fate-action');
      const baseFingers = isFace ? 4 : 2;

      if (card.suit === 'hearts') {
        // Mates - pick someone to drink with
        const otherPlayers = g.allPlayerIndices.filter(i => i !== s.drawer);
        actionArea.innerHTML = `
          <div class="suit-icon" style="color:#CC2200">${SUIT_SYMBOLS.hearts}</div>
          <div class="fate-instruction">MATES! Pick a drinking buddy (${baseFingers} fingers each)</div>
          <div class="player-select-row">
            ${otherPlayers.map(i => `
              <button class="player-select-btn" data-player="${i}">
                ${g.getAvatarEmoji(i)} ${g.players[i].name}
              </button>
            `).join('')}
          </div>
        `;
        actionArea.querySelectorAll('.player-select-btn').forEach(btn => {
          btn.onclick = () => {
            const mate = parseInt(btn.dataset.player);
            const penalties = {};
            penalties[s.drawer] = baseFingers;
            penalties[mate] = baseFingers;
            self.onComplete(penalties);
          };
        });

      } else if (card.suit === 'diamonds') {
        // Waterfall
        actionArea.innerHTML = `
          <div class="suit-icon" style="color:#D4A847">${SUIT_SYMBOLS.diamonds}</div>
          <div class="fate-instruction">WATERFALL! Everyone drinks. Can't stop until the person to your left stops!</div>
          <p class="text-dim text-center">${g.players[s.drawer].name} controls when to stop.</p>
          <div class="waterfall-timer mt-16" id="wf-timer">0s</div>
          <button class="btn btn-gold mt-16" id="btn-start-wf">Start Waterfall!</button>
        `;
        let wfTime = 0;
        let wfInterval = null;
        document.getElementById('btn-start-wf').onclick = function() {
          this.style.display = 'none';
          wfInterval = setInterval(() => {
            wfTime++;
            const timerEl = document.getElementById('wf-timer');
            if (timerEl) timerEl.textContent = wfTime + 's';
          }, 1000);

          const stopBtn = document.createElement('button');
          stopBtn.className = 'btn btn-red mt-8';
          stopBtn.textContent = 'Stop Waterfall!';
          stopBtn.onclick = () => {
            clearInterval(wfInterval);
            // Everyone gets fingers based on time
            const fingers = Math.min(Math.ceil(wfTime / 3), 5);
            const penalties = {};
            g.allPlayerIndices.forEach(i => { penalties[i] = fingers; });
            self.onComplete(penalties);
          };
          actionArea.appendChild(stopBtn);
        };

      } else if (card.suit === 'clubs') {
        // Category
        const categories = [
          'Beer brands', 'Football teams', 'Countries', 'Dog breeds',
          'Movie titles', 'Songs', 'Car brands', 'TV shows',
          'Cocktails', 'Pizza toppings', 'Superheroes', 'Celebrities'
        ];
        const cat = categories[Math.floor(Math.random() * categories.length)];
        self.state.categoryPlayer = (s.drawer + 1) % g.playerCount;

        actionArea.innerHTML = `
          <div class="suit-icon">${SUIT_SYMBOLS.clubs}</div>
          <div class="fate-instruction">CATEGORY: ${cat}</div>
          <p class="text-dim text-center">Go around! First to hesitate or repeat drinks ${baseFingers} fingers.</p>
          <div class="turn-indicator mt-16" id="cat-turn">${g.getAvatarEmoji(self.state.categoryPlayer)} ${g.players[self.state.categoryPlayer].name}'s turn</div>
          <div class="pass-fail-btns mt-16">
            <button class="btn btn-gold" id="btn-pass">Good Answer!</button>
            <button class="btn btn-red" id="btn-fail">Failed!</button>
          </div>
        `;

        document.getElementById('btn-pass').onclick = () => {
          self.state.categoryPlayer = (self.state.categoryPlayer + 1) % g.playerCount;
          const turnEl = document.getElementById('cat-turn');
          if (turnEl) {
            const cp = self.state.categoryPlayer;
            turnEl.innerHTML = `${g.getAvatarEmoji(cp)} ${g.players[cp].name}'s turn`;
          }
        };

        document.getElementById('btn-fail').onclick = () => {
          const penalties = {};
          penalties[self.state.categoryPlayer] = baseFingers;
          self.onComplete(penalties);
        };

      } else if (card.suit === 'spades') {
        // Rule card
        const suggestedRules = [
          'No first names - use nicknames only',
          'Must drink with non-dominant hand',
          'No pointing allowed',
          'Must say "cheers" before every sip',
          'No swearing',
          'Must speak in an accent'
        ];
        const suggestion = suggestedRules[Math.floor(Math.random() * suggestedRules.length)];

        actionArea.innerHTML = `
          <div class="suit-icon">${SUIT_SYMBOLS.spades}</div>
          <div class="fate-instruction">RULE CARD! Make a rule that lasts the rest of the game.</div>
          <p class="text-dim text-center">Breaking it = 1 finger penalty each time!</p>
          <p class="text-dim text-center mt-8">Suggestion: "${suggestion}"</p>
          <input type="text" class="rule-input mt-16" id="rule-input" placeholder="Type your rule..." value="${suggestion}">
          <button class="btn btn-gold mt-16" id="btn-set-rule">Set Rule!</button>
        `;

        document.getElementById('btn-set-rule').onclick = () => {
          const rule = document.getElementById('rule-input').value.trim();
          if (rule) {
            g.addRule(rule);
            self.onComplete({});
          }
        };
      }
    }
  },

  // ==========================================
  // 4. SNAP SHOWDOWN - Reaction game
  // ==========================================
  'snap-showdown': {
    state: {},

    start(game, area, onComplete) {
      const self = Rounds['snap-showdown'];
      self.game = game;
      self.onComplete = onComplete;
      self.area = area;
      self.state = {
        cards: [],
        snapActive: false,
        snapped: [],
        matchFound: false,
        intervalId: null
      };

      area.innerHTML = `
        <p class="text-center text-dim">Cards will flip one by one. When two in a row have the <strong class="text-gold">same value</strong> - hit your SNAP button!</p>
        <div class="snap-card-area mt-16" id="snap-cards">
          <p class="text-dim">Cards will appear here...</p>
        </div>
        <div class="snap-buttons-row mt-16" id="snap-buttons">
          ${game.allPlayerIndices.map(i => `
            <button class="snap-btn" data-player="${i}" id="snap-btn-${i}">
              <span class="snap-emoji">${game.getAvatarEmoji(i)}</span>
              <span>SNAP!</span>
              <span style="font-size:0.6rem;text-transform:none">${game.players[i].name}</span>
            </button>
          `).join('')}
        </div>
        <button class="btn btn-gold mt-16" id="btn-start-snap">Start Dealing!</button>
      `;

      // Disable snap buttons initially
      game.allPlayerIndices.forEach(i => {
        document.getElementById(`snap-btn-${i}`).disabled = true;
      });

      document.getElementById('btn-start-snap').onclick = () => {
        document.getElementById('btn-start-snap').style.display = 'none';
        self.startDealing();
      };
    },

    startDealing() {
      const self = Rounds['snap-showdown'];
      const s = self.state;
      const g = self.game;

      // Enable snap buttons
      g.allPlayerIndices.forEach(i => {
        const btn = document.getElementById(`snap-btn-${i}`);
        btn.disabled = false;
        btn.classList.add('snap-btn-active');
        btn.onclick = () => self.handleSnap(i);
      });

      const dealNext = () => {
        if (s.matchFound) return;

        const card = g.deck.draw();
        s.cards.push(card);

        const cardArea = document.getElementById('snap-cards');
        if (cardArea) {
          // Show last 2 cards
          const show = s.cards.slice(-2);
          cardArea.innerHTML = show.map(c => createCardHTML(c, { large: true, animClass: 'slam-in' })).join('');
        }

        // Check for match (same value as previous)
        if (s.cards.length >= 2) {
          const prev = s.cards[s.cards.length - 2];
          const curr = s.cards[s.cards.length - 1];
          if (prev.value === curr.value) {
            s.snapActive = true;
            // Auto-resolve after 3 seconds if nobody snaps
            s.snapTimeout = setTimeout(() => {
              if (!s.matchFound) {
                s.matchFound = true;
                clearInterval(s.intervalId);
                // Nobody snapped - everyone drinks
                const p = {};
                g.allPlayerIndices.forEach(i => { p[i] = 2; });
                self.onComplete(p);
              }
            }, 3000);
          }
        }
      };

      // Deal cards every 1.5 seconds
      dealNext();
      s.intervalId = setInterval(dealNext, 1500);
    },

    handleSnap(playerIndex) {
      const self = Rounds['snap-showdown'];
      const s = self.state;
      const g = self.game;

      if (s.matchFound) return;

      if (s.snapActive) {
        // Valid snap!
        s.matchFound = true;
        clearInterval(s.intervalId);
        clearTimeout(s.snapTimeout);

        // Flash effect
        self.area.classList.add('snap-flash');

        g.winRound(playerIndex);
        // Winner picks who gets 3 fingers
        const others = g.allPlayerIndices.filter(i => i !== playerIndex);

        self.area.innerHTML = `
          <h3 class="text-gold text-center sparkle">SNAP! ${g.players[playerIndex].name} wins!</h3>
          <p class="text-center mt-8">Assign 3 fingers to someone:</p>
          <div class="player-select-row mt-16">
            ${others.map(i => `
              <button class="player-select-btn" data-player="${i}">
                ${g.getAvatarEmoji(i)} ${g.players[i].name}
              </button>
            `).join('')}
          </div>
        `;

        self.area.querySelectorAll('.player-select-btn').forEach(btn => {
          btn.onclick = () => {
            const target = parseInt(btn.dataset.player);
            const penalties = {};
            penalties[target] = 3;
            self.onComplete(penalties);
          };
        });

      } else {
        // False snap! Penalty
        s.matchFound = true;
        clearInterval(s.intervalId);

        self.area.innerHTML = `
          <h3 class="text-red text-center shake">FALSE SNAP!</h3>
          <p class="text-center mt-8">${g.players[playerIndex].name} jumped the gun!</p>
        `;

        const penalties = {};
        penalties[playerIndex] = 3;
        setTimeout(() => self.onComplete(penalties), 1500);
      }
    }
  },

  // ==========================================
  // 5. THE GAUNTLET - Higher/Lower
  // ==========================================
  'the-gauntlet': {
    state: {},

    start(game, area, onComplete) {
      const self = Rounds['the-gauntlet'];
      self.game = game;
      self.onComplete = onComplete;
      self.area = area;
      self.state = {
        currentCard: game.deck.draw(),
        chain: 1,
        currentPlayer: Math.floor(Math.random() * game.playerCount),
        totalCorrect: 0
      };

      self.render();
    },

    render() {
      const self = Rounds['the-gauntlet'];
      const s = self.state;
      const g = self.game;
      const cp = s.currentPlayer;

      self.area.innerHTML = `
        <div class="turn-indicator">${g.getAvatarEmoji(cp)} ${g.players[cp].name}'s Turn</div>
        <div class="gauntlet-chain mt-8">
          ${Array.from({length: s.chain}, (_, i) => `<span class="chain-dot"></span>`).join('')}
          <span class="text-dim">Chain: ${s.chain}</span>
        </div>
        <p class="text-dim text-center">Wrong = drink ${s.chain} finger${s.chain > 1 ? 's' : ''}! (${s.totalCorrect}/3 correct)</p>
        <div class="card-row mt-16">
          ${createCardHTML(s.currentCard, { large: true })}
        </div>
        <p class="text-center mt-8">Will the next card be...</p>
        <div class="gauntlet-actions mt-16">
          <button class="btn btn-gold btn-large" id="btn-higher">&#9650; Higher</button>
          <button class="btn btn-red btn-large" id="btn-lower">&#9660; Lower</button>
        </div>
        ${s.totalCorrect >= 2 ? '<p class="text-gold text-center mt-8 glow">One more for safety!</p>' : ''}
      `;

      document.getElementById('btn-higher').onclick = () => self.guess('higher');
      document.getElementById('btn-lower').onclick = () => self.guess('lower');
    },

    guess(direction) {
      const self = Rounds['the-gauntlet'];
      const s = self.state;
      const g = self.game;

      const nextCard = g.deck.draw();
      const correct = (direction === 'higher' && nextCard.numValue >= s.currentCard.numValue) ||
                       (direction === 'lower' && nextCard.numValue <= s.currentCard.numValue);

      s.currentCard = nextCard;

      if (correct) {
        s.totalCorrect++;
        s.chain++;

        if (s.totalCorrect >= 3) {
          // Survived! Safe and assign 3 fingers
          g.winRound(s.currentPlayer);
          const winner = s.currentPlayer;
          const others = g.allPlayerIndices.filter(i => i !== winner);

          self.area.innerHTML = `
            <h3 class="text-gold text-center sparkle">SURVIVED THE GAUNTLET!</h3>
            <div class="card-row mt-16">
              ${createCardHTML(nextCard, { large: true, animClass: 'slam-in' })}
            </div>
            <p class="text-center mt-8">${g.players[winner].name} is safe! Assign 3 fingers:</p>
            <div class="player-select-row mt-16">
              ${others.map(i => `
                <button class="player-select-btn" data-player="${i}">
                  ${g.getAvatarEmoji(i)} ${g.players[i].name}
                </button>
              `).join('')}
            </div>
          `;

          self.area.querySelectorAll('.player-select-btn').forEach(btn => {
            btn.onclick = () => {
              const target = parseInt(btn.dataset.player);
              const penalties = {};
              penalties[target] = 3;
              self.onComplete(penalties);
            };
          });
          return;
        }

        // Correct but chain continues - pass to next player
        s.currentPlayer = (s.currentPlayer + 1) % g.playerCount;

        self.area.innerHTML = `
          <h3 class="text-gold text-center">Correct!</h3>
          <div class="card-row mt-16">
            ${createCardHTML(nextCard, { large: true, animClass: 'slam-in' })}
          </div>
          <p class="text-center mt-8">Chain grows to ${s.chain}!</p>
        `;

        setTimeout(() => self.render(), 1500);

      } else {
        // Wrong! Drink the chain
        self.area.innerHTML = `
          <h3 class="text-red text-center shake">WRONG!</h3>
          <div class="card-row mt-16">
            ${createCardHTML(nextCard, { large: true, animClass: 'slam-in' })}
          </div>
          <p class="text-center mt-8">${g.players[s.currentPlayer].name} drinks ${s.chain} finger${s.chain > 1 ? 's' : ''}!</p>
        `;

        const penalties = {};
        penalties[s.currentPlayer] = s.chain;
        setTimeout(() => self.onComplete(penalties), 2000);
      }
    }
  },

  // ==========================================
  // 6. BLOKE'S GAMBIT - Number picking
  // ==========================================
  'blokes-gambit': {
    state: {},

    start(game, area, onComplete) {
      const self = Rounds['blokes-gambit'];
      self.game = game;
      self.onComplete = onComplete;
      self.area = area;
      self.state = {
        picks: new Array(game.playerCount).fill(-1),
        currentPicker: 0,
        revealed: false
      };

      self.renderPicker();
    },

    renderPicker() {
      const self = Rounds['blokes-gambit'];
      const s = self.state;
      const g = self.game;
      const cp = s.currentPicker;

      if (cp >= g.playerCount) {
        self.reveal();
        return;
      }

      self.area.innerHTML = `
        <div class="turn-indicator">${g.getAvatarEmoji(cp)} ${g.players[cp].name} - Pick secretly!</div>
        <p class="text-dim text-center mt-8">&#128064; Others look away! Pick a number 1-5, then pass the phone.</p>
        <div class="gambit-numbers mt-16">
          ${[1,2,3,4,5].map(n => `
            <button class="gambit-num" data-num="${n}">${n}</button>
          `).join('')}
        </div>
        <button class="btn btn-gold mt-16" id="btn-confirm-pick" disabled>Lock In</button>
      `;

      let selected = -1;
      self.area.querySelectorAll('.gambit-num').forEach(btn => {
        btn.onclick = () => {
          self.area.querySelectorAll('.gambit-num').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selected = parseInt(btn.dataset.num);
          document.getElementById('btn-confirm-pick').disabled = false;
        };
      });

      document.getElementById('btn-confirm-pick').onclick = () => {
        if (selected > 0) {
          s.picks[cp] = selected;
          s.currentPicker++;
          self.renderPicker();
        }
      };
    },

    reveal() {
      const self = Rounds['blokes-gambit'];
      const s = self.state;
      const g = self.game;
      const picks = s.picks;

      self.area.innerHTML = `
        <h3 class="text-gold text-center">REVEAL!</h3>
        <div class="stagger mt-16" style="display:flex;flex-direction:column;gap:12px;align-items:center">
          ${g.allPlayerIndices.map(i => `
            <div class="number-reveal" style="display:flex;align-items:center;gap:12px">
              <span>${g.getAvatarEmoji(i)} ${g.players[i].name}</span>
              <span class="gambit-num selected" style="pointer-events:none">${picks[i]}</span>
            </div>
          `).join('')}
        </div>
        <div class="mt-16" id="gambit-result"></div>
      `;

      setTimeout(() => {
        const penalties = {};
        const resultArea = document.getElementById('gambit-result');

        // Count occurrences of each number
        const freq = {};
        picks.forEach((v, i) => {
          if (!freq[v]) freq[v] = [];
          freq[v].push(i);
        });
        const groups = Object.entries(freq); // [[val, [playerIndices]], ...]

        const allSame = groups.length === 1;
        const allDifferent = groups.length === picks.length;

        if (allSame) {
          // Cursed round - everyone drinks their number
          const val = picks[0];
          resultArea.innerHTML = `<p class="text-red text-center shake">CURSED! All picked ${val}! Everyone drinks ${val} fingers!</p>`;
          g.allPlayerIndices.forEach(i => { penalties[i] = val; });
        } else if (allDifferent) {
          // All different - lowest drinks their number
          const minVal = Math.min(...picks);
          const loser = picks.indexOf(minVal);
          resultArea.innerHTML = `<p class="text-red text-center">${g.players[loser].name} picked the lowest (${minVal}) and drinks ${minVal} fingers!</p>`;
          penalties[loser] = minVal;
          const maxVal = Math.max(...picks);
          g.winRound(picks.indexOf(maxVal));
        } else {
          // Some matching - find the biggest matching group, they drink
          // Odd ones out are safe (and if only 1, they win)
          const sorted = groups.sort((a, b) => b[1].length - a[1].length);
          const biggestGroup = sorted[0];
          const matchVal = parseInt(biggestGroup[0]);
          const matchers = biggestGroup[1];
          const oddOnes = g.allPlayerIndices.filter(i => !matchers.includes(i));

          const matcherNames = matchers.map(i => g.players[i].name).join(' and ');
          resultArea.innerHTML = `<p class="text-gold text-center">${matcherNames} all picked ${matchVal} - they each drink ${matchVal} fingers!</p>`;
          matchers.forEach(i => { penalties[i] = matchVal; });
          if (oddOnes.length > 0) g.winRound(oddOnes[0]);
        }

        setTimeout(() => self.onComplete(penalties), 2500);
      }, 1000);
    }
  }
};
