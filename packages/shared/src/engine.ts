import { Card, Rank, Suit, TableRules } from "./types";

// ─── Deck ─────────────────────────────────────────────────────────────────────

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

export function buildShoe(decks: number): Card[] {
  const shoe: Card[] = [];
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ rank, suit });
      }
    }
  }
  return shuffleShoe(shoe);
}

export function shuffleShoe(shoe: Card[]): Card[] {
  const s = [...shoe];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

// ─── Hand Evaluation ──────────────────────────────────────────────────────────

export function cardValue(rank: Rank): number {
  if (rank === "A") return 11;
  if (["J", "Q", "K"].includes(rank)) return 10;
  return parseInt(rank, 10);
}

/** Hi-Lo count value for a card. */
export function hiLoValue(rank: Rank): number {
  if (["2", "3", "4", "5", "6"].includes(rank)) return 1;
  if (["10", "J", "Q", "K", "A"].includes(rank)) return -1;
  return 0;
}

export interface HandEval {
  total: number;
  isSoft: boolean;
  isBust: boolean;
  isBlackjack: boolean;
}

export function evaluateHand(cards: Card[]): HandEval {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    total += cardValue(card.rank);
    if (card.rank === "A") aces++;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  const isSoft = aces > 0 && total <= 21;
  const isBust = total > 21;
  const isBlackjack = cards.length === 2 && total === 21;

  return { total, isSoft, isBust, isBlackjack };
}

export function isPair(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  const v1 = cardValue(cards[0].rank);
  const v2 = cardValue(cards[1].rank);
  return v1 === v2;
}

// ─── Cut Card ─────────────────────────────────────────────────────────────────

/** Returns the index in the shoe at which the cut card is placed. */
export function cutCardIndex(rules: TableRules): number {
  const totalCards = rules.decks * 52;
  return Math.floor(totalCards * rules.cutCardPenetration);
}
