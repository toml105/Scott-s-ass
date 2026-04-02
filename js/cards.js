/* ============================================
   TAVERN ROYALE - Card Deck Logic
   ============================================ */

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUIT_SYMBOLS = { hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663', spades: '\u2660' };
const VALUE_NUMBERS = {
  '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,
  'J':11,'Q':12,'K':13,'A':14
};

class Deck {
  constructor() {
    this.cards = [];
    this.reset();
  }

  reset() {
    this.cards = [];
    for (const suit of SUITS) {
      for (const value of VALUES) {
        this.cards.push({ suit, value, numValue: VALUE_NUMBERS[value] });
      }
    }
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw(count = 1) {
    if (this.cards.length < count) {
      this.reset();
    }
    return count === 1 ? this.cards.pop() : this.cards.splice(-count);
  }

  peek() {
    if (this.cards.length === 0) this.reset();
    return this.cards[this.cards.length - 1];
  }

  get remaining() {
    return this.cards.length;
  }
}

function isFaceCard(card) {
  return ['J','Q','K','A'].includes(card.value);
}

function cardDisplay(card) {
  return `${card.value}${SUIT_SYMBOLS[card.suit]}`;
}

function cardColor(card) {
  return (card.suit === 'hearts' || card.suit === 'diamonds') ? 'red' : 'black';
}

function createCardHTML(card, options = {}) {
  const { faceDown = false, large = false, animClass = '' } = options;
  const sizeClass = large ? 'card-large' : '';
  const flipClass = faceDown ? '' : 'flipped';
  const colorClass = card.suit;
  const symbol = SUIT_SYMBOLS[card.suit];

  return `
    <div class="card ${sizeClass} ${flipClass} ${animClass}">
      <div class="card-inner">
        <div class="card-back"></div>
        <div class="card-front">
          <span class="card-mini ${colorClass}">${card.value}${symbol}</span>
          <span class="card-value">${card.value}</span>
          <span class="card-suit ${colorClass}">${symbol}</span>
          <span class="card-mini-bottom ${colorClass}">${card.value}${symbol}</span>
        </div>
      </div>
    </div>
  `;
}

function createFaceDownCardHTML(options = {}) {
  const { large = false, animClass = '' } = options;
  const sizeClass = large ? 'card-large' : '';
  return `
    <div class="card ${sizeClass} ${animClass}">
      <div class="card-inner">
        <div class="card-back"></div>
        <div class="card-front"></div>
      </div>
    </div>
  `;
}
