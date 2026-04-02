// ─── Cards ───────────────────────────────────────────────────────────────────

export type Suit = "♠" | "♥" | "♦" | "♣";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  rank: Rank;
  suit: Suit;
}

// ─── Table Rules ─────────────────────────────────────────────────────────────

export interface TableRules {
  decks: number;                    // 1, 2, 4, 6, 8
  dealerHitsSoft17: boolean;        // true = H17, false = S17
  doubleAfterSplit: boolean;        // DAS
  resplitAces: boolean;
  surrenderAllowed: boolean;
  blackjackPayout: "3:2" | "6:5";
  cutCardPenetration: number;       // 0–1, fraction of shoe dealt before shuffle (e.g. 0.75)
  maxSplits: number;                // max times a hand can be split
}

export const DEFAULT_TABLE_RULES: TableRules = {
  decks: 6,
  dealerHitsSoft17: false,
  doubleAfterSplit: true,
  resplitAces: false,
  surrenderAllowed: true,
  blackjackPayout: "3:2",
  cutCardPenetration: 0.75,
  maxSplits: 3,                   // allows up to 4 hands total (original + 3 splits), doing more kind of breaks it.
};

// ─── Actions ─────────────────────────────────────────────────────────────────

export type PlayerAction = "hit" | "stand" | "double" | "split" | "surrender";

// ─── Table State ─────────────────────────────────────────────────────────────

/** Everything a real player can see at the table at the moment of a decision. */
export interface TableState {
  playerHand: Card[];
  dealerUpcard: Card;
  cardsDealt: number;           // total cards dealt from shoe so far
  cardsRemainingInShoe: number;
  runningCount: number;         // Hi-Lo running count (tracked by engine, not surfaced in MVP UI)
  playerStack: number;          // chip balance before this hand's bet
  currentBet: number;
  handTotal: number;            // best non-bust total
  isSoft: boolean;              // hand contains an ace counted as 11
  isPair: boolean;              // first two cards are a pair (eligible for split)
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
  splitDepth: number;           // 0 = original hand, 1+ = post-split
}

// ─── Decision ────────────────────────────────────────────────────────────────

export interface Decision {
  tableState: TableState;
  playerAction: PlayerAction;
}

// ─── Hand ────────────────────────────────────────────────────────────────────

export type HandOutcome = "win" | "lose" | "push" | "blackjack" | "surrender" | "bust";

export interface Hand {
  handId: string;
  decisions: Decision[];
  outcome: HandOutcome | null;  // null while hand is in progress
  betAmount: number;
  payout: number;               // net chip change (positive = win, negative = loss)
  isBlackjack: boolean;
  playerInitialHand: Card[];    // player's starting 2 cards
  dealerFinalHand: Card[];      // dealer's cards (upcard, hole, + any draws)
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface Session {
  sessionId: string;
  startedAt: number;            // Date.now()
  tableRules: TableRules;
  hands: Hand[];
}

// ─── Strategy ────────────────────────────────────────────────────────────────

export type StrategyAction = PlayerAction;

/**
 * A strategy table maps a situation key to a recommended action.
 * Keys use the format produced by getSituationKey().
 */
export interface StrategyTable {
  name: string;
  /** hard[playerTotal][dealerRank] */
  hard: Record<number, Record<Rank, StrategyAction>>;
  /** soft[playerTotal][dealerRank] — total includes the ace as 11 */
  soft: Record<number, Record<Rank, StrategyAction>>;
  /** pairs[rank][dealerRank] */
  pairs: Record<Rank, Record<Rank, StrategyAction>>;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface DecisionResult {
  decision: Decision;
  recommended: StrategyAction | null;
  isCorrect: boolean | null;    // null if strategy has no recommendation for this situation
}

export interface SessionStats {
  totalDecisions: number;
  correctDecisions: number;
  accuracy: number;             // 0–1
  handsPlayed: number;
  netChips: number;
}
