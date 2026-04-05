import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";

// ─── Timing Config ────────────────────────────────────────────────────────────
export const DEAL_INTERVAL_MS = 400;  // delay between each card during initial deal
export const DEALER_DRAW_INTERVAL_MS = 500; // delay between dealer draw steps
import {
  DEFAULT_TABLE_RULES,
  PlayerAction,
  getStrategyForRules,
  getRecommendation,
  adjustForRules,
  evaluateHand,
  isPair,
} from "@beat-the-heat/shared";
import {
  GameState,
  GameAction,
  gameReducer,
  initialGameState,
} from "./gameState";

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  dispatchPlayerAction: (action: PlayerAction) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    gameReducer,
    initialGameState(DEFAULT_TABLE_RULES, 1000),
  );

  // Auto-deal cards one at a time
  useEffect(() => {
    if (state.phase === "dealing") {
      const timer = setTimeout(() => {
        dispatch({ type: "DEAL_CARD" });
      }, DEAL_INTERVAL_MS);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.dealStep]);

  // Auto-run dealer turn
  useEffect(() => {
    if (state.phase === "dealerTurn") {
      const timer = setTimeout(() => {
        dispatch({ type: "DEALER_DRAW" });
      }, DEALER_DRAW_INTERVAL_MS);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.currentHand?.dealerCards.length]);

  function dispatchPlayerAction(action: PlayerAction) {
    // Compute recommendation before dispatching so it's available for feedback
    let recommended: PlayerAction | null = null;
    if (state.currentHand) {
      const ts = buildCurrentTableStateForContext(state);
      if (ts) {
        const strategy = getStrategyForRules(state.session.tableRules);
        const raw = getRecommendation(
          ts,
          strategy,
          state.session.tableRules,
        );
        recommended = raw
          ? adjustForRules(raw, ts, state.session.tableRules)
          : null;
      }
    }
    dispatch({ type: "PLAYER_ACTION", action, recommended });
  }

  return (
    <GameContext.Provider value={{ state, dispatch, dispatchPlayerAction }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

// Helper: reconstruct current tableState from context (mirrors gameState.ts logic)
function buildCurrentTableStateForContext(state: GameState) {
  const hand = state.currentHand;
  if (!hand) return null;
  const rules = state.session.tableRules;
  const totalCards = rules.decks * 52;

  const playerCards = hand.playerCards;

  const eval_ = evaluateHand(playerCards);
  const isInSplit = state.splitHands.length > 0;

  return {
    playerHand: playerCards,
    dealerUpcard: hand.dealerCards[0],
    cardsDealt: state.cardsDealt,
    cardsRemainingInShoe: totalCards - state.cardsDealt,
    runningCount: state.runningCount,
    playerStack: state.playerStack,
    currentBet: hand.betAmount,
    handTotal: eval_.total,
    isSoft: eval_.isSoft,
    isPair: isPair(playerCards),
    canDouble:
      playerCards.length === 2 &&
      state.playerStack >= hand.betAmount &&
      (!isInSplit || rules.doubleAfterSplit),
    canSplit:
      isPair(playerCards) &&
      state.playerStack >= hand.betAmount &&
      (state.splitHands.length > 0 ? state.splitHands.length - 1 : 0) <
        rules.maxSplits,
    canSurrender: playerCards.length === 2 && rules.surrenderAllowed && !isInSplit,
    splitDepth: state.activeSplitIndex,
  };
}
