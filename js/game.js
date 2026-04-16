/* ============================================
   TAVERN ROYALE - Game State Engine
   ============================================ */

const TOTAL_ROUNDS_BY_COUNT = { 2: 7, 3: 9, 4: 9, 5: 9 };
// Kept as a default for legacy reads; real value comes from game.totalRounds.
const TOTAL_ROUNDS = 9;
const ROUND_TYPES = [
  'picture-guess',
  'tower-of-risk',
  'fates-choice',
  'snap-showdown',
  'the-gauntlet',
  'blokes-gambit'
];

const ROUND_INFO = {
  'picture-guess': {
    name: "Picture Guess",
    desc: "One player sees a picture. Others ask yes/no questions to guess it. More questions = more sips!",
    icon: "&#128444;"
  },
  'tower-of-risk': {
    name: "Tower of Risk",
    desc: "Draw cards to build your hand. Bust over 21 = 5 fingers. Bail = pay a tax. Last one standing wins!",
    icon: "&#127183;"
  },
  'fates-choice': {
    name: "Fate's Choice",
    desc: "Draw a card. Let fate decide your drinking destiny.",
    icon: "&#127916;"
  },
  'snap-showdown': {
    name: "Snap Showdown",
    desc: "Watch the cards. When two match in a row, SNAP!",
    icon: "&#9889;"
  },
  'the-gauntlet': {
    name: "The Gauntlet",
    desc: "Higher or lower? Get it right or drink the chain!",
    icon: "&#9876;"
  },
  'blokes-gambit': {
    name: "Bloke's Gambit",
    desc: "Pick a number 1-5. Match at your peril!",
    icon: "&#127922;"
  }
};

class GameState {
  constructor() {
    this.playerCount = 2;
    this.reset();
  }

  reset(playerCount) {
    if (playerCount) this.playerCount = playerCount;
    this.totalRounds = TOTAL_ROUNDS_BY_COUNT[this.playerCount] || 9;
    const defaults = [
      { name: 'Bloke #1', avatar: 'beer' },
      { name: 'Bloke #2', avatar: 'whisky' },
      { name: 'Bloke #3', avatar: 'wine' },
      { name: 'Bloke #4', avatar: 'cocktail' },
      { name: 'Bloke #5', avatar: 'shot' }
    ];
    this.players = [];
    // 2-player mode gets an extra immunity token to even things out.
    const startingImmunity = this.playerCount === 2 ? 2 : 1;
    for (let i = 0; i < this.playerCount; i++) {
      this.players.push({
        name: defaults[i].name,
        avatar: defaults[i].avatar,
        fingers: 0,
        immunity: startingImmunity,
        roundsWon: 0
      });
    }
    this.currentRound = 0;
    this.roundOrder = [];
    this.activeRules = [];
    this.skullKing = -1; // player index, -1 = not assigned
    this.skullKingUsed = false;
    this.deck = new Deck();
    this.generateRoundOrder();
  }

  generateRoundOrder() {
    const total = this.totalRounds;
    const pool = [...ROUND_TYPES, ...ROUND_TYPES, ...ROUND_TYPES]; // 18 available
    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // Take rounds, but ensure no more than 2 of same type
    this.roundOrder = [];
    const counts = {};
    for (const type of pool) {
      if (this.roundOrder.length >= total) break;
      counts[type] = (counts[type] || 0);
      if (counts[type] < 2) {
        this.roundOrder.push(type);
        counts[type]++;
      }
    }
    while (this.roundOrder.length < total) {
      const remaining = ROUND_TYPES.filter(t => (counts[t] || 0) < 2);
      if (remaining.length === 0) break;
      const pick = remaining[Math.floor(Math.random() * remaining.length)];
      this.roundOrder.push(pick);
      counts[pick] = (counts[pick] || 0) + 1;
    }

    // Skull card lands somewhere in the middle third.
    const minR = Math.max(1, Math.floor(total / 3));
    const maxR = Math.min(total - 2, Math.floor((total * 2) / 3));
    const span = Math.max(1, maxR - minR + 1);
    this.skullCardRound = minR + Math.floor(Math.random() * span);
  }

  get currentRoundType() {
    return this.roundOrder[this.currentRound];
  }

  get currentRoundInfo() {
    return ROUND_INFO[this.currentRoundType];
  }

  get multiplier() {
    const t = this.totalRounds;
    if (this.currentRound < Math.floor(t / 3)) return 1;
    if (this.currentRound < Math.floor((t * 2) / 3)) return 1.5;
    return 2;
  }

  get multiplierLabel() {
    const m = this.multiplier;
    if (m === 1) return 'x1';
    if (m === 1.5) return 'x1.5';
    return 'x2';
  }

  get isGameOver() {
    return this.currentRound >= this.totalRounds;
  }

  applyFingers(playerIndex, amount) {
    const scaled = Math.ceil(amount * this.multiplier);
    this.players[playerIndex].fingers += scaled;
    return scaled;
  }

  applyFingersRaw(playerIndex, amount) {
    this.players[playerIndex].fingers += amount;
    return amount;
  }

  useImmunity(playerIndex) {
    if (this.players[playerIndex].immunity > 0) {
      this.players[playerIndex].immunity--;
      return true;
    }
    return false;
  }

  grantImmunity(playerIndex) {
    this.players[playerIndex].immunity++;
  }

  winRound(playerIndex) {
    this.players[playerIndex].roundsWon++;
  }

  addRule(rule) {
    this.activeRules.push(rule);
  }

  advanceRound() {
    this.currentRound++;
  }

  getRankings() {
    const sorted = this.players
      .map((p, i) => ({ ...p, index: i }))
      .sort((a, b) => a.fingers - b.fingers);
    return sorted;
  }

  getLoser() {
    const r = this.getRankings();
    return r[r.length - 1];
  }

  getWinner() {
    return this.getRankings()[0];
  }

  // Helper: array of all player indices [0, 1, 2] or [0, 1, 2, 3]
  get allPlayerIndices() {
    return Array.from({ length: this.playerCount }, (_, i) => i);
  }

  getAvatarEmoji(playerIndex) {
    const avatarMap = {
      beer: '\u{1F37A}',
      whisky: '\u{1F943}',
      wine: '\u{1F377}',
      cocktail: '\u{1F378}',
      shot: '\u{1F944}'
    };
    return avatarMap[this.players[playerIndex].avatar] || '\u{1F37A}';
  }
}
