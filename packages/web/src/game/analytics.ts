import { Decision, PlayerAction, Session, StrategyTable, TableRules } from "@beat-the-heat/shared";
import { getRecommendation, adjustForRules } from "@beat-the-heat/shared";

export interface DecisionResult {
  decision: Decision;
  recommended: PlayerAction | null;
  isCorrect: boolean | null;
}

export interface SessionStats {
  totalDecisions: number;
  correctDecisions: number;
  accuracy: number;
  handsPlayed: number;
  netChips: number;
}

export function evaluateDecision(
  decision: Decision,
  strategy: StrategyTable,
  rules: TableRules,
): DecisionResult {
  const raw = getRecommendation(decision.tableState, strategy, rules);
  const recommended = raw ? adjustForRules(raw, decision.tableState, rules) : null;
  const isCorrect = recommended !== null ? decision.playerAction === recommended : null;
  return { decision, recommended, isCorrect };
}

export function sessionStats(session: Session, strategy: StrategyTable): SessionStats {
  let totalDecisions = 0;
  let correctDecisions = 0;
  let netChips = 0;

  for (const hand of session.hands) {
    netChips += hand.payout;
    for (const decision of hand.decisions) {
      const result = evaluateDecision(decision, strategy, session.tableRules);
      totalDecisions++;
      if (result.isCorrect === true) correctDecisions++;
    }
  }

  return {
    totalDecisions,
    correctDecisions,
    accuracy: totalDecisions > 0 ? correctDecisions / totalDecisions : 0,
    handsPlayed: session.hands.length,
    netChips,
  };
}
