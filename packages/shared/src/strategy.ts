import { Rank, StrategyAction, StrategyTable, TableState, TableRules } from "./types";

// ─── Strategy Table Builder ──────────────────────────────────────────────────
//
// We have multiple strategy tables based on rule variations:
// - S17 vs H17 (dealer stands/hits on soft 17)
// - DAS vs No-DAS (double after split allowed)
// - Surrender vs No-Surrender
//
// Key: {S17|H17}_{DAS|NDAS}_{SUR|NSUR}

type ActionMap = Record<Rank, StrategyAction>;

function row(vals: [StrategyAction, StrategyAction, StrategyAction, StrategyAction, StrategyAction, StrategyAction, StrategyAction, StrategyAction, StrategyAction, StrategyAction]): ActionMap {
  const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];
  const map = {} as ActionMap;
  ranks.forEach((r, i) => { map[r] = vals[i]; });
  return map;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY TABLES - Edit these to change the correct play for each scenario
// ═══════════════════════════════════════════════════════════════════════════════

// ─── S17 + DAS + Surrender (Default Vegas) ───────────────────────────────────

const hard_S17_DAS_SUR: Record<number, ActionMap> = {
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

const soft_S17_DAS_SUR: Record<number, ActionMap> = {
  //          2      3      4      5      6      7      8      9      10     A
  13: row(["hit",  "hit",  "hit",  "double","double","hit",  "hit",  "hit",  "hit",  "hit"]),
  14: row(["hit",  "hit",  "hit",  "double","double","hit",  "hit",  "hit",  "hit",  "hit"]),
  15: row(["hit",  "hit",  "double","double","double","hit",  "hit",  "hit",  "hit",  "hit"]),
  16: row(["hit",  "hit",  "double","double","double","hit",  "hit",  "hit",  "hit",  "hit"]),
  17: row(["hit",  "double","double","double","double","hit",  "hit",  "hit",  "hit",  "hit"]),
  18: row(["stand","double","double","double","double","stand","stand","hit",  "hit",  "hit"]),
  19: row(["stand","stand","stand","stand","stand","stand","stand","stand","stand","stand"]),
  20: row(["stand","stand","stand","stand","stand","stand","stand","stand","stand","stand"]),
};

const pairs_S17_DAS_SUR: Record<Rank, ActionMap> = {
  //          2      3      4      5      6      7      8      9      10     A
  "A": row(["split","split","split","split","split","split","split","split","split","split"]),
  "10":row(["stand","stand","stand","stand","stand","stand","stand","stand","stand","stand"]),
  "9": row(["split","split","split","split","split","stand","split","split","stand","stand"]),
  "8": row(["split","split","split","split","split","split","split","split","split","split"]),
  "7": row(["split","split","split","split","split","split","hit",  "hit",  "hit",  "hit"]),
  "6": row(["split","split","split","split","split","hit",  "hit",  "hit",  "hit",  "hit"]),
  "5": row(["double","double","double","double","double","double","double","double","hit","hit"]),
  "4": row(["hit",  "hit",  "hit",  "split","split","hit",  "hit",  "hit",  "hit",  "hit"]),
  "3": row(["split","split","split","split","split","split","hit",  "hit",  "hit",  "hit"]),
  "2": row(["split","split","split","split","split","split","hit",  "hit",  "hit",  "hit"]),
};

// ─── H17 + DAS + Surrender ───────────────────────────────────────────────────
// TODO: Edit these to reflect H17 strategy differences

const hard_H17_DAS_SUR: Record<number, ActionMap> = {
  //          2      3      4      5      6      7      8      9      10     A
  17: row(["stand","stand","stand","stand","stand","stand","stand","stand","stand","surrender"]), // vs A: surrender on H17
  16: row(["stand","stand","stand","stand","stand","hit",  "hit",  "surrender","surrender","surrender"]),
  15: row(["stand","stand","stand","stand","stand","hit",  "hit",  "hit",  "surrender","surrender"]), // vs A: surrender on H17
  14: row(["stand","stand","stand","stand","stand","hit",  "hit",  "hit",  "hit",  "hit"]),
  13: row(["stand","stand","stand","stand","stand","hit",  "hit",  "hit",  "hit",  "hit"]),
  12: row(["hit",  "hit",  "stand","stand","stand","hit",  "hit",  "hit",  "hit",  "hit"]),
  11: row(["double","double","double","double","double","double","double","double","double","double"]), // vs A: double on H17
  10: row(["double","double","double","double","double","double","double","double","hit",  "hit"]),
  9:  row(["hit",  "double","double","double","double","hit",  "hit",  "hit",  "hit",  "hit"]),
  8:  row(["hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit"]),
};

const soft_H17_DAS_SUR: Record<number, ActionMap> = {
  //          2      3      4      5      6      7      8      9      10     A
  20: row(["stand","stand","stand","stand","stand","stand","stand","stand","stand","stand"]),
  19: row(["stand","stand","stand","stand","double","stand","stand","stand","stand","stand"]), // vs 6: double on H17
  18: row(["double","double","double","double","double","stand","stand","hit",  "hit",  "hit"]), // vs 2: double on H17
  17: row(["hit",  "double","double","double","double","hit",  "hit",  "hit",  "hit",  "hit"]),
  16: row(["hit",  "hit",  "double","double","double","hit",  "hit",  "hit",  "hit",  "hit"]),
  15: row(["hit",  "hit",  "double","double","double","hit",  "hit",  "hit",  "hit",  "hit"]),
  14: row(["hit",  "hit",  "hit",  "double","double","hit",  "hit",  "hit",  "hit",  "hit"]),
  13: row(["hit",  "hit",  "hit",  "double","double","hit",  "hit",  "hit",  "hit",  "hit"]),
};

const pairs_H17_DAS_SUR: Record<Rank, ActionMap> = {
  // Same as S17 for most cases - edit if H17 changes pair strategy
  "A": row(["split","split","split","split","split","split","split","split","split","split"]),
  "10":row(["stand","stand","stand","stand","stand","stand","stand","stand","stand","stand"]),
  "9": row(["split","split","split","split","split","stand","split","split","stand","stand"]),
  "8": row(["split","split","split","split","split","split","split","split","split","split"]),
  "7": row(["split","split","split","split","split","split","hit",  "hit",  "hit",  "hit"]),
  "6": row(["split","split","split","split","split","hit",  "hit",  "hit",  "hit",  "hit"]),
  "5": row(["double","double","double","double","double","double","double","double","hit","hit"]),
  "4": row(["hit",  "hit",  "hit",  "split","split","hit",  "hit",  "hit",  "hit",  "hit"]),
  "3": row(["split","split","split","split","split","split","hit",  "hit",  "hit",  "hit"]),
  "2": row(["split","split","split","split","split","split","hit",  "hit",  "hit",  "hit"]),
};

// ─── S17 + No DAS + Surrender ────────────────────────────────────────────────
// TODO: Edit pairs table - without DAS, some splits become hits

const pairs_S17_NDAS_SUR: Record<Rank, ActionMap> = {
  //          2      3      4      5      6      7      8      9      10     A
  "A": row(["split","split","split","split","split","split","split","split","split","split"]),
  "10":row(["stand","stand","stand","stand","stand","stand","stand","stand","stand","stand"]),
  "9": row(["split","split","split","split","split","stand","split","split","stand","stand"]),
  "8": row(["split","split","split","split","split","split","split","split","split","split"]),
  "7": row(["split","split","split","split","split","split","hit",  "hit",  "hit",  "hit"]),
  "6": row(["hit",  "split","split","split","split","hit",  "hit",  "hit",  "hit",  "hit"]), // 6 vs 2: hit without DAS
  "5": row(["double","double","double","double","double","double","double","double","hit","hit"]),
  "4": row(["hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit"]), // 4s: never split without DAS
  "3": row(["hit",  "hit",  "split","split","split","split","hit",  "hit",  "hit",  "hit"]),
  "2": row(["hit",  "hit",  "split","split","split","split","hit",  "hit",  "hit",  "hit"]), // 2,3 vs 2,3: hit without DAS
};

// ─── H17 + No DAS + Surrender ────────────────────────────────────────────────
// TODO: Combine H17 hard/soft with NDAS pairs

const pairs_H17_NDAS_SUR: Record<Rank, ActionMap> = {
  // Copy of NDAS pairs - edit if H17 changes anything
  "A": row(["split","split","split","split","split","split","split","split","split","split"]),
  "10":row(["stand","stand","stand","stand","stand","stand","stand","stand","stand","stand"]),
  "9": row(["split","split","split","split","split","stand","split","split","stand","stand"]),
  "8": row(["split","split","split","split","split","split","split","split","split","split"]),
  "7": row(["split","split","split","split","split","split","hit",  "hit",  "hit",  "hit"]),
  "6": row(["hit",  "split","split","split","split","hit",  "hit",  "hit",  "hit",  "hit"]),
  "5": row(["double","double","double","double","double","double","double","double","hit","hit"]),
  "4": row(["hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit",  "hit"]),
  "3": row(["hit",  "hit",  "split","split","split","split","hit",  "hit",  "hit",  "hit"]),
  "2": row(["hit",  "hit",  "split","split","split","split","hit",  "hit",  "hit",  "hit"]),
};

// ─── No Surrender variants ───────────────────────────────────────────────────
// For no-surrender tables, surrender actions become hits
// These are handled dynamically in getRecommendation() by checking canSurrender

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY TABLE SELECTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Returns the appropriate strategy table based on table rules.
 * 
 * Rule combinations that affect strategy:
 * - dealerHitsSoft17 (H17 vs S17): Changes some soft totals and hard 11 vs A
 * - doubleAfterSplit (DAS vs NDAS): Changes pair splitting decisions
 * - surrenderAllowed: Handled dynamically (surrender → hit when not allowed)
 */
export function getStrategyForRules(rules: TableRules): StrategyTable {
  const isH17 = rules.dealerHitsSoft17;
  const isDAS = rules.doubleAfterSplit;

  if (isH17 && isDAS) {
    return {
      name: "Basic Strategy (H17, DAS)",
      hard: hard_H17_DAS_SUR,
      soft: soft_H17_DAS_SUR,
      pairs: pairs_H17_DAS_SUR,
    };
  }

  if (isH17 && !isDAS) {
    return {
      name: "Basic Strategy (H17, No DAS)",
      hard: hard_H17_DAS_SUR,
      soft: soft_H17_DAS_SUR,
      pairs: pairs_H17_NDAS_SUR,
    };
  }

  if (!isH17 && !isDAS) {
    return {
      name: "Basic Strategy (S17, No DAS)",
      hard: hard_S17_DAS_SUR,
      soft: soft_S17_DAS_SUR,
      pairs: pairs_S17_NDAS_SUR,
    };
  }

  // Default: S17 + DAS (classic Vegas)
  return {
    name: "Basic Strategy (S17, DAS)",
    hard: hard_S17_DAS_SUR,
    soft: soft_S17_DAS_SUR,
    pairs: pairs_S17_DAS_SUR,
  };
}

// Keep BASIC_STRATEGY for backwards compatibility
export const BASIC_STRATEGY: StrategyTable = {
  name: "Basic Strategy (6-deck, S17, DAS)",
  hard: hard_S17_DAS_SUR,
  soft: soft_S17_DAS_SUR,
  pairs: pairs_S17_DAS_SUR,
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

// ─── Rule adjustments (legacy - now mostly handled by table selection) ────────

/**
 * Additional runtime adjustments if needed.
 * Most rule-based changes are now in the separate strategy tables.
 */
export function adjustForRules(
  action: StrategyAction,
  _state: TableState,
  _rules: TableRules,
): StrategyAction {
  // Strategy tables now handle most rule variations directly.
  // This function can be used for edge cases not covered by the tables.
  return action;
}
