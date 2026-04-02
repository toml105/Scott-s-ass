/* ============================================
   TAVERN ROYALE - Game State Engine
   ============================================ */

const TOTAL_ROUNDS = 9;
const ROUND_TYPES = [
  'liars-draw',
  'tower-of-risk',
  'fates-choice',
  'snap-showdown',
  'the-gauntlet',
  'blokes-gambit'
];

const ROUND_INFO = {
  'liars-draw': {
    name: "Liar's Draw",
    desc: "Bluff about your card. Get caught? Drink up. Catch a liar? They drink.",
    icon: "&#129396;"
  },
  'tower-of-risk': {
    name: "Tower of Risk",
    desc: "Stack cards toward 21. Bail to safety, or push your luck!",
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
    this.playerCount = 3;
    this.reset();
  }

  reset(playerCount) {
    if (playerCount) this.playerCount = playerCount;
    const defaults = [
      { name: 'Bloke #1', avatar: 'beer' },
      { name: 'Bloke #2', avatar: 'whisky' },
      { name: 'Bloke #3', avatar: 'wine' },
      { name: 'Bloke #4', avatar: 'cocktail' },
      { name: 'Bloke #5', avatar: 'shot' }
    ];
    this.players = [];
    for (let i = 0; i < this.playerCount; i++) {
      this.players.push({
        name: defaults[i].name,
        avatar: defaults[i].avatar,
        fingers: 0,
        immunity: 1,
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
    // 9 rounds: shuffle types, repeat as needed to fill 9
    const pool = [...ROUND_TYPES, ...ROUND_TYPES, ...ROUND_TYPES]; // 18 available
    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // Take first 9, but ensure no more than 2 of same type
    this.roundOrder = [];
    const counts = {};
    for (const type of pool) {
      if (this.roundOrder.length >= TOTAL_ROUNDS) break;
      counts[type] = (counts[type] || 0);
      if (counts[type] < 2) {
        this.roundOrder.push(type);
        counts[type]++;
      }
    }
    // If we somehow don't have 9, fill from shuffled types
    while (this.roundOrder.length < TOTAL_ROUNDS) {
      const remaining = ROUND_TYPES.filter(t => (counts[t] || 0) < 2);
      if (remaining.length === 0) break;
      const pick = remaining[Math.floor(Math.random() * remaining.length)];
      this.roundOrder.push(pick);
      counts[pick] = (counts[pick] || 0) + 1;
    }

    // Insert skull card at random round (rounds 3-7)
    this.skullCardRound = 2 + Math.floor(Math.random() * 5);
  }

  get currentRoundType() {
    return this.roundOrder[this.currentRound];
  }

  get currentRoundInfo() {
    return ROUND_INFO[this.currentRoundType];
  }

  get multiplier() {
    if (this.currentRound < 3) return 1;
    if (this.currentRound < 6) return 1.5;
    return 2;
  }

  get multiplierLabel() {
    if (this.currentRound < 3) return 'x1';
    if (this.currentRound < 6) return 'x1.5';
    return 'x2';
  }

  get isGameOver() {
    return this.currentRound >= TOTAL_ROUNDS;
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
