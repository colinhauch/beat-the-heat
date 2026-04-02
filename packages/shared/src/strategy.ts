import { Rank, StrategyAction, StrategyTable, TableState, TableRules } from "./types";

// ─── Basic Strategy Table (Classic Vegas, 6 decks, S17, DAS) ─────────────────
//
// Source: standard basic strategy charts
// Rows = player total or pair rank
// Cols = dealer upcard (2–10, A)
// Actions: H=hit, S=stand, D=double, P=split, R=surrender (else hit)

type ActionMap = Record<Rank, StrategyAction>;

function row(vals: [StrategyAction, StrategyAction, StrategyAction, StrategyAction, StrategyAction, StrategyAction, StrategyAction, StrategyAction, StrategyAction, StrategyAction]): ActionMap {
  const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];
  const map = {} as ActionMap;
  ranks.forEach((r, i) => { map[r] = vals[i]; });
  return map;
}

// Hard totals (8 and below always hit; 17+ always stand)
const hard: Record<number, ActionMap> = {
  //          2      3      4      5      6      7      8      9      10     A
  8:  row(["hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit"]),
  9:  row(["hit",  "double","double","double","double","hit",  "hit",  "hit",  "hit",  "hit"]),
  10: row(["double","double","double","double","double","double","double","double","hit",  "hit"]),
  11: row(["double","double","double","double","double","double","double","double","double","hit"]),
  12: row(["hit",  "hit",  "stand","stand","stand","hit",  "hit",  "hit",  "hit",  "hit"]),
  13: row(["stand","stand","stand","stand","stand","hit",  "hit",  "hit",  "hit",  "hit"]),
  14: row(["stand","stand","stand","stand","stand","hit",  "hit",  "hit",  "hit",  "hit"]),
  15: row(["stand","stand","stand","stand","stand","hit",  "hit",  "hit",  "surrender","hit"]),
  16: row(["stand","stand","stand","stand","stand","hit",  "hit",  "surrender","surrender","surrender"]),
  17: row(["stand","stand","stand","stand","stand","stand","stand","stand","stand","stand"]),
};

// Soft totals (A+x, total shown includes ace as 11)
const soft: Record<number, ActionMap> = {
  //          2      3      4      5      6      7      8      9      10     A
  13: row(["hit",  "hit",  "hit",  "double","double","hit",  "hit",  "hit",  "hit",  "hit"]),  // A+2
  14: row(["hit",  "hit",  "hit",  "double","double","hit",  "hit",  "hit",  "hit",  "hit"]),  // A+3
  15: row(["hit",  "hit",  "double","double","double","hit",  "hit",  "hit",  "hit",  "hit"]),  // A+4
  16: row(["hit",  "hit",  "double","double","double","hit",  "hit",  "hit",  "hit",  "hit"]),  // A+5
  17: row(["hit",  "double","double","double","double","hit",  "hit",  "hit",  "hit",  "hit"]),  // A+6
  18: row(["stand","double","double","double","double","stand","stand","hit",  "hit",  "hit"]),  // A+7
  19: row(["stand","stand","stand","stand","stand","stand","stand","stand","stand","stand"]),    // A+8
  20: row(["stand","stand","stand","stand","stand","stand","stand","stand","stand","stand"]),    // A+9
};

// Pairs (rank of each card in the pair)
const pairs: Record<Rank, ActionMap> = {
  //          2      3      4      5      6      7      8      9      10     A
  "A": row(["split","split","split","split","split","split","split","split","split","split"]),
  "2": row(["split","split","split","split","split","split","hit",  "hit",  "hit",  "hit"]),
  "3": row(["split","split","split","split","split","split","hit",  "hit",  "hit",  "hit"]),
  "4": row(["hit",  "hit",  "hit",  "split","split","hit",  "hit",  "hit",  "hit",  "hit"]),
  "5": row(["double","double","double","double","double","double","double","double","hit","hit"]),
  "6": row(["split","split","split","split","split","hit",  "hit",  "hit",  "hit",  "hit"]),
  "7": row(["split","split","split","split","split","split","hit",  "hit",  "hit",  "hit"]),
  "8": row(["split","split","split","split","split","split","split","split","split","split"]),
  "9": row(["split","split","split","split","split","stand","split","split","stand","stand"]),
  "10":row(["stand","stand","stand","stand","stand","stand","stand","stand","stand","stand"]),
  "J": row(["stand","stand","stand","stand","stand","stand","stand","stand","stand","stand"]),
  "Q": row(["stand","stand","stand","stand","stand","stand","stand","stand","stand","stand"]),
  "K": row(["stand","stand","stand","stand","stand","stand","stand","stand","stand","stand"]),
};

export const BASIC_STRATEGY: StrategyTable = {
  name: "Basic Strategy (6-deck, S17, DAS)",
  hard,
  soft,
  pairs,
};

// ─── Strategy Lookup ──────────────────────────────────────────────────────────

export function getRecommendation(
  state: TableState,
  strategy: StrategyTable,
  _rules: TableRules,
): StrategyAction | null {
  const dealerRank = state.dealerUpcard.rank;

  // Pairs first (if split is allowed)
  if (state.isPair && state.canSplit) {
    const pairRank = state.playerHand[0].rank;
    const pairRow = strategy.pairs[pairRank];
    if (pairRow) {
      const action = pairRow[dealerRank];
      // If strategy says split but split isn't allowed, fall through to hard/soft
      if (action === "split") return "split";
    }
  }

  // Soft totals
  if (state.isSoft) {
    const softRow = strategy.soft[state.handTotal];
    if (softRow) {
      const action = softRow[dealerRank];
      // If action is double but can't double, hit instead
      if (action === "double" && !state.canDouble) return "hit";
      // If action is surrender but can't surrender, hit instead
      if (action === "surrender" && !state.canSurrender) return "hit";
      return action;
    }
  }

  // Hard totals (clamp to table range)
  const clampedTotal = Math.min(Math.max(state.handTotal, 8), 17);
  const hardRow = strategy.hard[clampedTotal];
  if (hardRow) {
    const action = hardRow[dealerRank];
    if (action === "double" && !state.canDouble) return "hit";
    if (action === "surrender" && !state.canSurrender) return "hit";
    return action;
  }

  return null;
}

// ─── Rule adjustments ─────────────────────────────────────────────────────────

/**
 * Adjusts a basic strategy recommendation based on table rules.
 * H17 tables require a few tweaks (e.g. soft 18 vs A becomes hit).
 */
export function adjustForRules(
  action: StrategyAction,
  state: TableState,
  rules: TableRules,
): StrategyAction {
  const dealerRank = state.dealerUpcard.rank;

  // H17 adjustments
  if (rules.dealerHitsSoft17) {
    // Soft 18 vs A: stand → hit on H17 tables
    if (state.isSoft && state.handTotal === 18 && dealerRank === "A") {
      return "hit";
    }
    // Soft 19 vs 6: stand → double on H17 tables (if allowed)
    if (state.isSoft && state.handTotal === 19 && dealerRank === "6" && state.canDouble) {
      return "double";
    }
  }

  return action;
}
