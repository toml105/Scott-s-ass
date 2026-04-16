/* ============================================
   TAVERN ROYALE - Round Implementations
   ============================================ */

const Rounds = {

  // ==========================================
  // 1. PICTURE GUESS - Guess the emoji picture
  // ==========================================
  'picture-guess': {
    state: {},

    // Big pool of emoji pictures with category hints
    PICTURES: [
      { emoji: '&#128021;', answer: 'dog', hint: 'Animal' },
      { emoji: '&#128008;', answer: 'cat', hint: 'Animal' },
      { emoji: '&#129409;', answer: 'lion', hint: 'Animal' },
      { emoji: '&#128024;', answer: 'elephant', hint: 'Animal' },
      { emoji: '&#128012;', answer: 'snail', hint: 'Animal' },
      { emoji: '&#129412;', answer: 'gorilla', hint: 'Animal' },
      { emoji: '&#128038;', answer: 'bird', hint: 'Animal' },
      { emoji: '&#129416;', answer: 'shark', hint: 'Animal' },
      { emoji: '&#128034;', answer: 'turtle', hint: 'Animal' },
      { emoji: '&#128013;', answer: 'snake', hint: 'Animal' },
      { emoji: '&#127829;', answer: 'pizza', hint: 'Food' },
      { emoji: '&#127828;', answer: 'burger', hint: 'Food' },
      { emoji: '&#127846;', answer: 'ice cream', hint: 'Food' },
      { emoji: '&#127838;', answer: 'bread', hint: 'Food' },
      { emoji: '&#127847;', answer: 'doughnut', hint: 'Food' },
      { emoji: '&#129372;', answer: 'avocado', hint: 'Food' },
      { emoji: '&#127814;', answer: 'chilli', hint: 'Food' },
      { emoji: '&#9917;', answer: 'football', hint: 'Sport' },
      { emoji: '&#127936;', answer: 'basketball', hint: 'Sport' },
      { emoji: '&#127955;', answer: 'cricket', hint: 'Sport' },
      { emoji: '&#127949;', answer: 'tennis', hint: 'Sport' },
      { emoji: '&#9971;', answer: 'golf', hint: 'Sport' },
      { emoji: '&#128640;', answer: 'rocket', hint: 'Transport' },
      { emoji: '&#9992;', answer: 'plane', hint: 'Transport' },
      { emoji: '&#128658;', answer: 'bus', hint: 'Transport' },
      { emoji: '&#128674;', answer: 'bicycle', hint: 'Transport' },
      { emoji: '&#128661;', answer: 'ambulance', hint: 'Transport' },
      { emoji: '&#127970;', answer: 'hospital', hint: 'Building' },
      { emoji: '&#127979;', answer: 'school', hint: 'Building' },
      { emoji: '&#9962;', answer: 'church', hint: 'Building' },
      { emoji: '&#127960;', answer: 'house', hint: 'Building' },
      { emoji: '&#127928;', answer: 'guitar', hint: 'Music' },
      { emoji: '&#127927;', answer: 'violin', hint: 'Music' },
      { emoji: '&#127929;', answer: 'piano', hint: 'Music' },
      { emoji: '&#129345;', answer: 'drum', hint: 'Music' },
      { emoji: '&#128176;', answer: 'money', hint: 'Object' },
      { emoji: '&#128142;', answer: 'diamond', hint: 'Object' },
      { emoji: '&#128274;', answer: 'lock', hint: 'Object' },
      { emoji: '&#128161;', answer: 'lightbulb', hint: 'Object' },
      { emoji: '&#9749;', answer: 'coffee', hint: 'Drink' },
      { emoji: '&#127870;', answer: 'wine', hint: 'Drink' },
    ],

    start(game, area, onComplete) {
      const self = Rounds['picture-guess'];
      self.game = game;
      self.onComplete = onComplete;
      self.area = area;

      // Pick a random picture
      const pic = self.PICTURES[Math.floor(Math.random() * self.PICTURES.length)];
      // Pick a random "holder" who sees the picture
      const holder = Math.floor(Math.random() * game.playerCount);

      self.state = {
        picture: pic,
        holder: holder,
        questionsAsked: 0,
        phase: 'show-holder' // show-holder, questioning, guessing, result
      };

      self.showHolder();
    },

    showHolder() {
      const self = Rounds['picture-guess'];
      const s = self.state;
      const g = self.game;

      self.area.innerHTML = `
        <div class="turn-indicator">${g.getAvatarEmoji(s.holder)} ${g.players[s.holder].name} is the Picture Holder!</div>
        <p class="text-dim text-center mt-8">Pass the phone to ${g.players[s.holder].name} ONLY.</p>
        <p class="text-dim text-center">Everyone else look away!</p>
        <button class="btn btn-gold btn-large mt-16" id="btn-show-pic">Show Me the Picture</button>
      `;

      document.getElementById('btn-show-pic').onclick = () => {
        self.showPicture();
      };
    },

    showPicture() {
      const self = Rounds['picture-guess'];
      const s = self.state;
      const g = self.game;

      self.area.innerHTML = `
        <div class="turn-indicator">${g.getAvatarEmoji(s.holder)} ${g.players[s.holder].name} - memorise this!</div>
        <div class="picture-card mt-16 pop-in">${s.picture.emoji}</div>
        <p class="text-gold text-center mt-16" style="font-size:1.2rem">It's: <strong>${s.picture.answer}</strong></p>
        <p class="text-dim text-center mt-8">Category: ${s.picture.hint}</p>
        <p class="text-dim text-center mt-8">Others will ask you YES or NO questions to guess it.</p>
        <p class="text-dim text-center">You can only answer YES or NO!</p>
        <button class="btn btn-gold btn-large mt-16" id="btn-start-questions">Got It - Start Questions!</button>
      `;

      document.getElementById('btn-start-questions').onclick = () => {
        s.phase = 'questioning';
        self.showQuestioning();
      };
    },

    showQuestioning() {
      const self = Rounds['picture-guess'];
      const s = self.state;
      const g = self.game;

      const sipsPenalty = Math.min(s.questionsAsked, 5);
      const nextSips = Math.min(s.questionsAsked + 1, 5);

      self.area.innerHTML = `
        <div class="turn-indicator">${g.getAvatarEmoji(s.holder)} ${g.players[s.holder].name} is holding the picture</div>
        <div class="picture-card hidden-picture mt-8">&#10068;</div>
        <p class="text-dim text-center mt-8">Category: <strong class="text-gold">${s.picture.hint}</strong></p>
        <div class="question-counter mt-8">
          Questions asked: <strong>${s.questionsAsked}</strong>
          <div class="sip-warning">Guessing now = ${sipsPenalty} finger${sipsPenalty !== 1 ? 's' : ''} if wrong | Next question = ${nextSips} if wrong</div>
        </div>
        <div class="mt-16" style="display:flex;flex-direction:column;gap:10px;align-items:center;width:100%">
          <button class="btn btn-gold btn-large w-full" id="btn-ask-question" style="max-width:300px">Ask a Question (+1)</button>
          <button class="btn btn-red btn-large w-full" id="btn-guess-now" style="max-width:300px">We Want to Guess!</button>
        </div>
      `;

      document.getElementById('btn-ask-question').onclick = () => {
        s.questionsAsked++;
        self.showQuestioning();
      };

      document.getElementById('btn-guess-now').onclick = () => {
        s.phase = 'guessing';
        self.showGuessing();
      };
    },

    showGuessing() {
      const self = Rounds['picture-guess'];
      const s = self.state;
      const g = self.game;
      const others = g.allPlayerIndices.filter(i => i !== s.holder);

      // With only one other player, skip the picker and go straight to input.
      if (others.length === 1) {
        self.showGuessInput(others[0]);
        return;
      }

      self.area.innerHTML = `
        <div class="turn-indicator">Time to Guess!</div>
        <div class="picture-card hidden-picture mt-8">&#10068;</div>
        <p class="text-center mt-8">After <strong class="text-gold">${s.questionsAsked}</strong> question${s.questionsAsked !== 1 ? 's' : ''}, who wants to guess?</p>
        <p class="text-dim text-center">Wrong guess = <strong class="text-red">${Math.min(s.questionsAsked, 5)} fingers</strong></p>
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
          const guesser = parseInt(btn.dataset.player);
          self.showGuessInput(guesser);
        };
      });
    },

    showGuessInput(guesserIndex) {
      const self = Rounds['picture-guess'];
      const s = self.state;
      const g = self.game;

      self.area.innerHTML = `
        <div class="turn-indicator">${g.getAvatarEmoji(guesserIndex)} ${g.players[guesserIndex].name} is guessing!</div>
        <div class="picture-card hidden-picture mt-8">&#10068;</div>
        <p class="text-dim text-center mt-8">Category: <strong class="text-gold">${s.picture.hint}</strong></p>
        <input type="text" class="guess-input mt-16" id="guess-input" placeholder="Type your guess..." autocomplete="off">
        <div class="mt-16" style="display:flex;gap:10px">
          <button class="btn btn-gold" id="btn-submit-guess">Submit Guess</button>
          <button class="btn btn-dark" id="btn-back-questions">Back to Questions</button>
        </div>
      `;

      document.getElementById('btn-submit-guess').onclick = () => {
        const guess = document.getElementById('guess-input').value.trim().toLowerCase();
        if (!guess) return;
        self.resolveGuess(guesserIndex, guess);
      };

      document.getElementById('guess-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const guess = document.getElementById('guess-input').value.trim().toLowerCase();
          if (guess) self.resolveGuess(guesserIndex, guess);
        }
      });

      document.getElementById('btn-back-questions').onclick = () => {
        s.phase = 'questioning';
        self.showQuestioning();
      };
    },

    resolveGuess(guesserIndex, guess) {
      const self = Rounds['picture-guess'];
      const s = self.state;
      const g = self.game;
      const answer = s.picture.answer.toLowerCase();
      const correct = guess === answer || answer.includes(guess) || guess.includes(answer);
      const penalties = {};

      if (correct) {
        g.winRound(guesserIndex);
        // Holder drinks based on how few questions were asked (they made it too easy)
        const holderPenalty = Math.max(1, 4 - Math.floor(s.questionsAsked / 2));
        penalties[s.holder] = holderPenalty;

        self.area.innerHTML = `
          <h3 class="text-gold text-center sparkle">CORRECT!</h3>
          <div class="picture-card mt-16 pop-in">${s.picture.emoji}</div>
          <p class="text-center mt-8">It was <strong class="text-gold">${s.picture.answer}</strong>!</p>
          <p class="text-center mt-8">${g.players[guesserIndex].name} got it in ${s.questionsAsked} question${s.questionsAsked !== 1 ? 's' : ''}!</p>
          <p class="text-center mt-8">${g.players[s.holder].name} drinks ${holderPenalty} finger${holderPenalty !== 1 ? 's' : ''} for making it too easy!</p>
        `;
      } else {
        // Wrong! Guesser drinks based on questions asked
        const penalty = Math.min(Math.max(s.questionsAsked, 1), 5);
        penalties[guesserIndex] = penalty;

        self.area.innerHTML = `
          <h3 class="text-red text-center shake">WRONG!</h3>
          <div class="picture-card mt-16 pop-in">${s.picture.emoji}</div>
          <p class="text-center mt-8">It was <strong class="text-gold">${s.picture.answer}</strong>, not "${guess}"!</p>
          <p class="text-center mt-8">${g.players[guesserIndex].name} drinks ${penalty} finger${penalty !== 1 ? 's' : ''}!</p>
        `;
      }

      setTimeout(() => self.onComplete(penalties), 2500);
    }
  },

  // ==========================================
  // 2. TOWER OF RISK - Push-your-luck
  // ==========================================
  'tower-of-risk': {
    state: {},

    start(game, area, onComplete) {
      const self = Rounds['tower-of-risk'];
      self.game = game;
      self.onComplete = onComplete;
      // Deal everyone 2 cards to start
      const hands = {};
      game.allPlayerIndices.forEach(i => {
        hands[i] = [game.deck.draw(), game.deck.draw()];
      });
      self.state = {
        hands: hands,
        activePlayers: game.allPlayerIndices.slice(),
        currentTurn: 0,
        bailedPenalties: {},
        bustedPenalties: {}
      };
      self.area = area;
      self.render();
    },

    getHandTotal(cards) {
      let total = 0;
      let aces = 0;
      for (const c of cards) {
        if (c.value === 'A') { aces++; total += 11; }
        else if (['J','Q','K'].includes(c.value)) { total += 10; }
        else { total += c.numValue; }
      }
      while (total > 21 && aces > 0) { total -= 10; aces--; }
      return total;
    },

    render() {
      const self = Rounds['tower-of-risk'];
      const s = self.state;
      const g = self.game;

      if (s.activePlayers.length <= 1) {
        self.resolve();
        return;
      }

      const cp = s.activePlayers[s.currentTurn % s.activePlayers.length];
      const myCards = s.hands[cp];
      const myTotal = self.getHandTotal(myCards);
      const bailCost = Math.ceil(myCards.length / 2);
      const dangerClass = myTotal >= 16 ? ' text-red' : ' text-gold';

      self.area.innerHTML = `
        <div class="turn-indicator">${g.getAvatarEmoji(cp)} ${g.players[cp].name}'s Turn</div>
        <p class="text-center mt-8" style="font-size:1.3rem">Your hand: <strong class="${dangerClass}">${myTotal}</strong></p>
        <div class="card-row mt-8">
          ${myCards.map(c => createCardHTML(c, {})).join('')}
        </div>
        <div class="mt-16" style="background:var(--wood-mid);border-radius:8px;padding:12px;width:100%;max-width:320px">
          <p class="text-dim text-center" style="font-size:0.85rem">&#128163; Bust over 21 = <strong class="text-red">5 fingers</strong></p>
          <p class="text-dim text-center" style="font-size:0.85rem">&#128694; Bail now = <strong class="text-red">${bailCost} finger${bailCost !== 1 ? 's' : ''}</strong> bail tax</p>
          <p class="text-dim text-center" style="font-size:0.85rem">&#127942; Last standing = assign <strong class="text-gold">3 fingers</strong></p>
        </div>
        <div class="tower-actions mt-16">
          <button class="btn btn-red btn-large" id="btn-hit">&#127183; Hit Me!</button>
          <button class="btn btn-gold btn-large" id="btn-bail">&#128694; Bail (${bailCost})</button>
        </div>
        <p class="text-dim text-center mt-8" style="font-size:0.8rem">Still in: ${s.activePlayers.map(i => g.players[i].name).join(', ')}</p>
      `;

      document.getElementById('btn-hit').onclick = () => {
        const card = g.deck.draw();
        myCards.push(card);
        const newTotal = self.getHandTotal(myCards);

        if (newTotal > 21) {
          s.bustedPenalties[cp] = 5;
          s.activePlayers = s.activePlayers.filter(p => p !== cp);

          self.area.innerHTML = `
            <h3 class="text-red text-center shake">BUST! ${newTotal}!</h3>
            <div class="card-row mt-16">
              ${myCards.map(c => createCardHTML(c, {})).join('')}
            </div>
            <p class="text-center mt-8">${g.players[cp].name} busted! <strong class="text-red">5 fingers!</strong></p>
          `;

          setTimeout(() => {
            s.currentTurn = s.currentTurn % Math.max(s.activePlayers.length, 1);
            self.render();
          }, 1800);
        } else {
          self.area.innerHTML = `
            <h3 class="text-gold text-center">Safe! ${newTotal}</h3>
            <div class="card-row mt-16">
              ${myCards.map(c => createCardHTML(c, { animClass: c === card ? 'slam-in' : '' })).join('')}
            </div>
            <p class="text-center mt-8">Pass the phone to the next player!</p>
          `;

          setTimeout(() => {
            s.currentTurn = (s.currentTurn + 1) % s.activePlayers.length;
            self.render();
          }, 1500);
        }
      };

      document.getElementById('btn-bail').onclick = () => {
        s.bailedPenalties[cp] = bailCost;
        s.activePlayers = s.activePlayers.filter(p => p !== cp);

        self.area.innerHTML = `
          <p class="text-center">${g.getAvatarEmoji(cp)} ${g.players[cp].name} bails on ${myTotal}!</p>
          <p class="text-center mt-8">Bail tax: <strong class="text-red">${bailCost} finger${bailCost !== 1 ? 's' : ''}</strong></p>
        `;

        setTimeout(() => {
          s.currentTurn = s.currentTurn % Math.max(s.activePlayers.length, 1);
          self.render();
        }, 1200);
      };
    },

    resolve() {
      const self = Rounds['tower-of-risk'];
      const s = self.state;
      const g = self.game;
      const penalties = {};

      // Collect all bust and bail penalties
      for (const [pi, cost] of Object.entries(s.bustedPenalties)) {
        penalties[parseInt(pi)] = cost;
      }
      for (const [pi, cost] of Object.entries(s.bailedPenalties)) {
        penalties[parseInt(pi)] = cost;
      }

      // Winner is the last player standing
      if (s.activePlayers.length === 1) {
        const winner = s.activePlayers[0];
        g.winRound(winner);
        const winnerTotal = self.getHandTotal(s.hands[winner]);
        const others = g.allPlayerIndices.filter(i => i !== winner);

        self.area.innerHTML = `
          <h3 class="text-gold text-center sparkle">${g.players[winner].name} Wins!</h3>
          <p class="text-center mt-8">Survived on ${winnerTotal}!</p>
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
            penalties[target] = (penalties[target] || 0) + 3;
            self.onComplete(penalties);
          };
        });
      } else {
        // Everyone busted/bailed at the same time - no winner
        self.area.innerHTML = `
          <h3 class="text-red text-center shake">Everyone's Out!</h3>
          <p class="text-center mt-8">No winner this round. Everyone pays their penalty!</p>
        `;
        setTimeout(() => self.onComplete(penalties), 1500);
      }
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

        if (otherPlayers.length === 1) {
          // 2-player mode: no choice, both drink together
          const mate = otherPlayers[0];
          actionArea.innerHTML = `
            <div class="suit-icon" style="color:#CC2200">${SUIT_SYMBOLS.hearts}</div>
            <div class="fate-instruction">MATES! Drink together - ${baseFingers} fingers each!</div>
            <p class="text-center mt-8">${g.players[s.drawer].name} + ${g.players[mate].name} &#127867;</p>
          `;
          setTimeout(() => {
            const penalties = {};
            penalties[s.drawer] = baseFingers;
            penalties[mate] = baseFingers;
            self.onComplete(penalties);
          }, 1400);
          return;
        }

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
        matchFound: false,
        intervalId: null
      };

      // Show instruction screen first
      area.innerHTML = `
        <p class="text-center" style="font-size:1.1rem">Cards flip one at a time. When two in a row have the <strong class="text-gold">same value</strong>...</p>
        <p class="text-center text-gold mt-8" style="font-size:1.3rem">SMASH YOUR COLOUR ZONE!</p>
        <p class="text-dim text-center mt-8">Each player gets a big coloured zone. Fastest snap wins!</p>
        <p class="text-dim text-center">False snap = 3 finger penalty!</p>
        <button class="btn btn-gold btn-large mt-16" id="btn-start-snap">Ready - Go Fullscreen!</button>
      `;

      document.getElementById('btn-start-snap').onclick = () => {
        self.launchFullscreen();
      };
    },

    launchFullscreen() {
      const self = Rounds['snap-showdown'];
      const s = self.state;
      const g = self.game;

      // Create fullscreen overlay
      const fs = document.createElement('div');
      fs.className = 'snap-fullscreen';
      fs.id = 'snap-fullscreen';
      fs.innerHTML = `
        <div class="snap-card-strip" id="snap-strip">
          <div class="snap-status">Cards will appear here...<br>Watch for a match!</div>
        </div>
        <div class="snap-zones players-${g.playerCount}" id="snap-zones">
          ${g.allPlayerIndices.map(i => `
            <div class="snap-zone" data-player="${i}" id="snap-zone-${i}">
              <span class="snap-zone-emoji">${g.getAvatarEmoji(i)}</span>
              <span class="snap-zone-name">${g.players[i].name}</span>
              <span class="snap-zone-label">SNAP!</span>
            </div>
          `).join('')}
        </div>
      `;
      document.body.appendChild(fs);
      self.fsEl = fs;

      // Disable zones initially, start dealing after brief pause
      g.allPlayerIndices.forEach(i => {
        document.getElementById(`snap-zone-${i}`).setAttribute('disabled', '');
      });

      setTimeout(() => {
        // Enable zones
        g.allPlayerIndices.forEach(i => {
          const zone = document.getElementById(`snap-zone-${i}`);
          zone.removeAttribute('disabled');
          zone.onclick = () => self.handleSnap(i);
        });
        self.startDealing();
      }, 800);
    },

    startDealing() {
      const self = Rounds['snap-showdown'];
      const s = self.state;
      const g = self.game;

      const dealNext = () => {
        if (s.matchFound) return;
        const card = g.deck.draw();
        s.cards.push(card);

        const strip = document.getElementById('snap-strip');
        if (strip) {
          const show = s.cards.slice(-2);
          strip.innerHTML = show.map(c =>
            createCardHTML(c, { large: true, animClass: 'slam-in' })
          ).join('<span style="color:var(--cream-dim);font-size:0.8rem;padding:0 4px">vs</span>');
        }

        if (s.cards.length >= 2) {
          const prev = s.cards[s.cards.length - 2];
          const curr = s.cards[s.cards.length - 1];
          if (prev.value === curr.value) {
            s.snapActive = true;
            s.snapTimeout = setTimeout(() => {
              if (!s.matchFound) {
                s.matchFound = true;
                clearInterval(s.intervalId);
                self.cleanup();
                const p = {};
                g.allPlayerIndices.forEach(i => { p[i] = 2; });
                self.area.innerHTML = `<h3 class="text-red text-center shake">TOO SLOW! Nobody snapped! Everyone drinks 2!</h3>`;
                setTimeout(() => self.onComplete(p), 1500);
              }
            }, 3000);
          }
        }
      };

      dealNext();
      s.intervalId = setInterval(dealNext, 1500);
    },

    cleanup() {
      const self = Rounds['snap-showdown'];
      if (self.fsEl) {
        self.fsEl.remove();
        self.fsEl = null;
      }
    },

    handleSnap(playerIndex) {
      const self = Rounds['snap-showdown'];
      const s = self.state;
      const g = self.game;

      if (s.matchFound) return;
      s.matchFound = true;
      clearInterval(s.intervalId);
      if (s.snapTimeout) clearTimeout(s.snapTimeout);
      self.cleanup();

      if (s.snapActive) {
        g.winRound(playerIndex);
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
