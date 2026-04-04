import { Rank, PlayerAction, StrategyTable, TableState, TableRules } from "./types";

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSITE ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════
//
// Composite actions encode conditional logic directly in the table cells.
// They are resolved at runtime based on the current table rules.
//
// Legend:
//   H   = Hit
//   S   = Stand
//   Dh  = Double if allowed, else Hit
//   Ds  = Double if allowed, else Stand
//   P   = Split (always)
//   Ph  = Split if DAS allowed, else Hit (treat as hard total)
//   Rh  = Surrender if allowed, else Hit
//   Rs  = Surrender if allowed, else Stand
//   Rp  = Surrender if allowed, else Split

type CompositeAction = "H" | "S" | "Dh" | "Ds" | "P" | "Ph" | "Rh" | "Rs" | "Rp";
type ActionMap = Record<Rank, CompositeAction>;

function row(vals: [CompositeAction, CompositeAction, CompositeAction, CompositeAction, CompositeAction, CompositeAction, CompositeAction, CompositeAction, CompositeAction, CompositeAction]): ActionMap {
  const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];
  const map = {} as ActionMap;
  ranks.forEach((r, i) => { map[r] = vals[i]; });
  return map;
}

// ═══════════════════════════════════════════════════════════════════════════════
// S17 STRATEGY TABLES (Dealer Stands on Soft 17)
// ═══════════════════════════════════════════════════════════════════════════════

const S17_hardTotals: Record<number, ActionMap> = {
  //          2     3     4     5     6     7     8     9     10    A
  17: row(["S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S"  ]),
  16: row(["S",  "S",  "S",  "S",  "S",  "H",  "H",  "Rh", "Rh", "Rh" ]),
  15: row(["S",  "S",  "S",  "S",  "S",  "H",  "H",  "H",  "Rh", "H"  ]),
  14: row(["S",  "S",  "S",  "S",  "S",  "H",  "H",  "H",  "H",  "H"  ]),
  13: row(["S",  "S",  "S",  "S",  "S",  "H",  "H",  "H",  "H",  "H"  ]),
  12: row(["H",  "H",  "S",  "S",  "S",  "H",  "H",  "H",  "H",  "H"  ]),
  11: row(["Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "H"  ]),
  10: row(["Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "H",  "H"  ]),
  9:  row(["H",  "Dh", "Dh", "Dh", "Dh", "H",  "H",  "H",  "H",  "H"  ]),
  8:  row(["H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H"  ]),
};

const S17_softTotals: Record<number, ActionMap> = {
  //          2     3     4     5     6     7     8     9     10    A
  20: row(["S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S"  ]),
  19: row(["S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S"  ]),
  18: row(["S",  "Ds", "Ds", "Ds", "Ds", "S",  "S",  "H",  "H",  "H"  ]),
  17: row(["H",  "Dh", "Dh", "Dh", "Dh", "H",  "H",  "H",  "H",  "H"  ]),
  16: row(["H",  "H",  "Dh", "Dh", "Dh", "H",  "H",  "H",  "H",  "H"  ]),
  15: row(["H",  "H",  "Dh", "Dh", "Dh", "H",  "H",  "H",  "H",  "H"  ]),
  14: row(["H",  "H",  "H",  "Dh", "Dh", "H",  "H",  "H",  "H",  "H"  ]),
  13: row(["H",  "H",  "H",  "Dh", "Dh", "H",  "H",  "H",  "H",  "H"  ]),
};

type PairRank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
type PairsTable = Record<PairRank, ActionMap>;

const S17_pairs: PairsTable = {
  //          2     3     4     5     6     7     8     9     10    A
  "A": row(["P",  "P",  "P",  "P",  "P",  "P",  "P",  "P",  "P",  "P"  ]),
  "10":row(["S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S"  ]),
  "9": row(["P",  "P",  "P",  "P",  "P",  "S",  "P",  "P",  "S",  "S"  ]),
  "8": row(["P",  "P",  "P",  "P",  "P",  "P",  "P",  "P",  "P",  "Rp" ]),
  "7": row(["P",  "P",  "P",  "P",  "P",  "P",  "H",  "H",  "H",  "H"  ]),
  "6": row(["Ph", "P",  "P",  "P",  "P",  "H",  "H",  "H",  "H",  "H"  ]),
  "5": row(["Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "H",  "H"  ]),
  "4": row(["H",  "H",  "H",  "Ph", "Ph", "H",  "H",  "H",  "H",  "H"  ]),
  "3": row(["Ph", "Ph", "P",  "P",  "P",  "P",  "H",  "H",  "H",  "H"  ]),
  "2": row(["Ph", "Ph", "P",  "P",  "P",  "P",  "H",  "H",  "H",  "H"  ]),
};

// ═══════════════════════════════════════════════════════════════════════════════
// H17 STRATEGY TABLES (Dealer Hits on Soft 17)
// ═══════════════════════════════════════════════════════════════════════════════

const H17_hardTotals: Record<number, ActionMap> = {
  //          2     3     4     5     6     7     8     9     10    A
  17: row(["S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "Rs" ]),
  16: row(["S",  "S",  "S",  "S",  "S",  "H",  "H",  "Rh", "Rh", "Rh" ]),
  15: row(["S",  "S",  "S",  "S",  "S",  "H",  "H",  "H",  "Rh", "Rh" ]),
  14: row(["S",  "S",  "S",  "S",  "S",  "H",  "H",  "H",  "H",  "H"  ]),
  13: row(["S",  "S",  "S",  "S",  "S",  "H",  "H",  "H",  "H",  "H"  ]),
  12: row(["H",  "H",  "S",  "S",  "S",  "H",  "H",  "H",  "H",  "H"  ]),
  11: row(["Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh" ]),
  10: row(["Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "H",  "H"  ]),
  9:  row(["H",  "Dh", "Dh", "Dh", "Dh", "H",  "H",  "H",  "H",  "H"  ]),
  8:  row(["H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H"  ]),
};

const H17_softTotals: Record<number, ActionMap> = {
  //          2     3     4     5     6     7     8     9     10    A
  20: row(["S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S"  ]),
  19: row(["S",  "S",  "S",  "S",  "Ds", "S",  "S",  "S",  "S",  "S"  ]),
  18: row(["Ds", "Ds", "Ds", "Ds", "Ds", "S",  "S",  "H",  "H",  "H"  ]),
  17: row(["H",  "Dh", "Dh", "Dh", "Dh", "H",  "H",  "H",  "H",  "H"  ]),
  16: row(["H",  "H",  "Dh", "Dh", "Dh", "H",  "H",  "H",  "H",  "H"  ]),
  15: row(["H",  "H",  "Dh", "Dh", "Dh", "H",  "H",  "H",  "H",  "H"  ]),
  14: row(["H",  "H",  "H",  "Dh", "Dh", "H",  "H",  "H",  "H",  "H"  ]),
  13: row(["H",  "H",  "H",  "Dh", "Dh", "H",  "H",  "H",  "H",  "H"  ]),
};

const H17_pairs: PairsTable = {
  //          2     3     4     5     6     7     8     9     10    A
  "A": row(["P",  "P",  "P",  "P",  "P",  "P",  "P",  "P",  "P",  "P"  ]),
  "10":row(["S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S"  ]),
  "9": row(["P",  "P",  "P",  "P",  "P",  "S",  "P",  "P",  "S",  "S"  ]),
  "8": row(["P",  "P",  "P",  "P",  "P",  "P",  "P",  "P",  "P",  "Rp" ]),
  "7": row(["P",  "P",  "P",  "P",  "P",  "P",  "H",  "H",  "H",  "H"  ]),
  "6": row(["Ph", "P",  "P",  "P",  "P",  "H",  "H",  "H",  "H",  "H"  ]),
  "5": row(["Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "H",  "H"  ]),
  "4": row(["H",  "H",  "H",  "Ph", "Ph", "H",  "H",  "H",  "H",  "H"  ]),
  "3": row(["Ph", "Ph", "P",  "P",  "P",  "P",  "H",  "H",  "H",  "H"  ]),
  "2": row(["Ph", "Ph", "P",  "P",  "P",  "P",  "H",  "H",  "H",  "H"  ]),
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSITE ACTION RESOLVER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Resolves a composite action to a concrete PlayerAction based on table rules.
 */
function resolveCompositeAction(
  action: CompositeAction,
  canDouble: boolean,
  canSurrender: boolean,
  canSplitDAS: boolean,
): PlayerAction {
  switch (action) {
    case "H":  return "hit";
    case "S":  return "stand";
    case "Dh": return canDouble ? "double" : "hit";
    case "Ds": return canDouble ? "double" : "stand";
    case "P":  return "split";
    case "Ph": return canSplitDAS ? "split" : "hit";
    case "Rh": return canSurrender ? "surrender" : "hit";
    case "Rs": return canSurrender ? "surrender" : "stand";
    case "Rp": return canSurrender ? "surrender" : "split";
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY TABLE SELECTOR
// ═══════════════════════════════════════════════════════════════════════════════

interface InternalStrategyTable {
  name: string;
  hard: Record<number, ActionMap>;
  soft: Record<number, ActionMap>;
  pairs: PairsTable;
}

function getInternalStrategy(rules: TableRules): InternalStrategyTable {
  if (rules.dealerHitsSoft17) {
    return {
      name: "Basic Strategy (H17)",
      hard: H17_hardTotals,
      soft: H17_softTotals,
      pairs: H17_pairs,
    };
  }
  return {
    name: "Basic Strategy (S17)",
    hard: S17_hardTotals,
    soft: S17_softTotals,
    pairs: S17_pairs,
  };
}

/**
 * Returns a resolved strategy table with concrete PlayerActions.
 * DAS and Surrender rules are applied during resolution.
 */
export function getStrategyForRules(rules: TableRules): StrategyTable {
  const internal = getInternalStrategy(rules);
  const canSplitDAS = rules.doubleAfterSplit;
  const canSurrender = rules.surrenderAllowed;

  // Build resolved tables
  const resolvedHard: Record<number, Record<Rank, PlayerAction>> = {};
  const resolvedSoft: Record<number, Record<Rank, PlayerAction>> = {};
  const resolvedPairs: Record<Rank, Record<Rank, PlayerAction>> = {} as Record<Rank, Record<Rank, PlayerAction>>;

  const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];
  const pairRanks: PairRank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

  // Resolve hard totals
  for (const total of Object.keys(internal.hard).map(Number)) {
    resolvedHard[total] = {} as Record<Rank, PlayerAction>;
    for (const rank of ranks) {
      resolvedHard[total][rank] = resolveCompositeAction(internal.hard[total][rank], true, canSurrender, canSplitDAS);
    }
  }

  // Resolve soft totals
  for (const total of Object.keys(internal.soft).map(Number)) {
    resolvedSoft[total] = {} as Record<Rank, PlayerAction>;
    for (const rank of ranks) {
      resolvedSoft[total][rank] = resolveCompositeAction(internal.soft[total][rank], true, canSurrender, canSplitDAS);
    }
  }

  // Resolve pairs (J/Q/K normalize to 10 at lookup time)
  for (const pairRank of pairRanks) {
    resolvedPairs[pairRank] = {} as Record<Rank, PlayerAction>;
    for (const dealerRank of ranks) {
      resolvedPairs[pairRank][dealerRank] = resolveCompositeAction(internal.pairs[pairRank][dealerRank], true, canSurrender, canSplitDAS);
    }
  }

  return {
    name: internal.name + (canSplitDAS ? ", DAS" : ", No DAS") + (canSurrender ? "" : ", No Surrender"),
    hard: resolvedHard,
    soft: resolvedSoft,
    pairs: resolvedPairs,
  };
}

// ─── Strategy Lookup ──────────────────────────────────────────────────────────

type StrategyAction = PlayerAction;

/**
 * Gets the recommended action for the current table state.
 * Looks up the composite action from the appropriate S17/H17 table,
 * then resolves it based on the hand state and table rules.
 */
export function getRecommendation(
  state: TableState,
  _strategy: StrategyTable,  // Kept for API compatibility, but we use internal tables
  rules: TableRules,
): StrategyAction | null {
  const internal = getInternalStrategy(rules);
  const rawRank = state.dealerUpcard.rank;
  const dealerRank: Rank = (rawRank === "J" || rawRank === "Q" || rawRank === "K") ? "10" : rawRank;

  let compositeAction: CompositeAction | null = null;

  // Pairs first (if split is allowed)
  if (state.isPair && state.canSplit) {
    const pairRank = state.playerHand[0].rank;
    const normPairRank: Rank = (pairRank === "J" || pairRank === "Q" || pairRank === "K") ? "10" : pairRank;
    const pairRow = internal.pairs[normPairRank];
    if (pairRow) {
      compositeAction = pairRow[dealerRank];
      // If action would result in split, return it resolved
      const resolved = resolveCompositeAction(compositeAction, state.canDouble, state.canSurrender, rules.doubleAfterSplit);
      if (resolved === "split") return "split";
      // Otherwise fall through to hard/soft totals (treat as non-pair)
      compositeAction = null;
    }
  }

  // Soft totals
  if (state.isSoft && !compositeAction) {
    const softRow = internal.soft[state.handTotal];
    if (softRow) {
      compositeAction = softRow[dealerRank];
    }
  }

  // Hard totals (clamp to table range)
  if (!compositeAction) {
    const clampedTotal = Math.min(Math.max(state.handTotal, 8), 17);
    const hardRow = internal.hard[clampedTotal];
    if (hardRow) {
      compositeAction = hardRow[dealerRank];
    }
  }

  if (!compositeAction) return null;

  // Resolve using actual hand state
  return resolveCompositeAction(
    compositeAction,
    state.canDouble,
    state.canSurrender,
    rules.doubleAfterSplit,
  );
}

// ─── Rule adjustments (legacy - kept for API compatibility) ──────────────────

/**
 * @deprecated Rule adjustments are now handled directly in getRecommendation.
 */
export function adjustForRules(
  action: StrategyAction,
  _state: TableState,
  _rules: TableRules,
): StrategyAction {
  return action;
}
