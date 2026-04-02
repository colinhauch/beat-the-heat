import { createContext, useContext, useReducer, ReactNode } from "react";
import {
  DEFAULT_TABLE_RULES,
  PlayerAction,
  BASIC_STRATEGY,
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
  const [state, dispatch] = useReducer(gameReducer, initialGameState(DEFAULT_TABLE_RULES, 1000));

  function dispatchPlayerAction(action: PlayerAction) {
    // Compute recommendation before dispatching so it's available for feedback
    let recommended: PlayerAction | null = null;
    if (state.currentHand) {
      const ts = buildCurrentTableStateForContext(state);
      if (ts) {
        const raw = getRecommendation(ts, BASIC_STRATEGY, state.session.tableRules);
        recommended = raw ? adjustForRules(raw, ts, state.session.tableRules) : null;
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

  const playerCards = hand.decisions.length === 0
    ? hand.dealerFinalHand.slice(2)
    : hand.decisions[hand.decisions.length - 1].tableState.playerHand;

  const eval_ = evaluateHand(playerCards);

  return {
    playerHand: playerCards,
    dealerUpcard: hand.dealerFinalHand[0],
    cardsDealt: state.cardsDealt,
    cardsRemainingInShoe: totalCards - state.cardsDealt,
    runningCount: state.runningCount,
    playerStack: state.playerStack,
    currentBet: hand.betAmount,
    handTotal: eval_.total,
    isSoft: eval_.isSoft,
    isPair: isPair(playerCards),
    canDouble: playerCards.length === 2 && state.playerStack >= hand.betAmount,
    canSplit: isPair(playerCards) && state.playerStack >= hand.betAmount && state.splitHands.length < rules.maxSplits,
    canSurrender: playerCards.length === 2 && rules.surrenderAllowed,
    splitDepth: state.activeSplitIndex,
  };
}
