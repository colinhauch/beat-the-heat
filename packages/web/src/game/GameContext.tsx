import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  ReactNode,
} from "react";

// ─── Timing Config ────────────────────────────────────────────────────────────
export const DEAL_INTERVAL_MS = 400;  // delay between each card during initial deal
export const DEALER_DRAW_INTERVAL_MS = 500; // delay between dealer draw steps
import {
  DEFAULT_TABLE_RULES,
  TableRules,
  TableState,
  Card,
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

interface GameProviderProps {
  children: ReactNode;
  tableRules?: TableRules;
  initialStack?: number;
  onChipsChange?: (chips: number) => void;
  onHandComplete?: (won: boolean) => void;
  onDecision?: (situation: string, playerAction: string, correctAction: string, isCorrect: boolean) => void;
}

export function GameProvider({
  children,
  tableRules = DEFAULT_TABLE_RULES,
  initialStack = 1000,
  onChipsChange,
  onHandComplete,
  onDecision,
}: GameProviderProps) {
  const [state, dispatch] = useReducer(
    gameReducer,
    initialGameState(tableRules, initialStack),
  );
  
  // Track previous phase to detect transitions to resolution
  const prevPhaseRef = useRef(state.phase);
  const prevHandIdRef = useRef<string | null>(null);

  // Notify parent of chip changes (for career mode)
  useEffect(() => {
    if (onChipsChange) {
      onChipsChange(state.playerStack);
    }
  }, [state.playerStack, onChipsChange]);

  // Notify parent when a hand completes (enters resolution phase)
  useEffect(() => {
    const wasResolution = prevPhaseRef.current === 'resolution';
    const isResolution = state.phase === 'resolution';
    const handId = state.currentHand?.handId ?? null;
    
    // Detect transition INTO resolution (new hand completing)
    if (!wasResolution && isResolution && onHandComplete && state.currentHand) {
      const outcome = state.currentHand.outcome;
      const won = outcome === 'win' || outcome === 'blackjack';
      onHandComplete(won);
    }
    
    prevPhaseRef.current = state.phase;
    prevHandIdRef.current = handId;
  }, [state.phase, state.currentHand, onHandComplete]);

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

  // Auto-deal card to split hand after delay
  useEffect(() => {
    if (state.phase === "splitDealing") {
      const timer = setTimeout(() => {
        dispatch({ type: "SPLIT_DEAL" });
      }, 500); // 500ms delay before dealing to split hand
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.activeSplitIndex]);

  function dispatchPlayerAction(action: PlayerAction) {
    // Compute recommendation before dispatching so it's available for feedback
    let recommended: PlayerAction | null = null;
    let situationStr = '';
    
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
        
        // Build situation string for tracking
        situationStr = formatSituation(ts, state.currentHand.playerCards);
        
        // Notify parent of decision
        if (onDecision && recommended) {
          const isCorrect = action === recommended;
          onDecision(situationStr, action, recommended, isCorrect);
        }
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

// Helper: format a situation for display (e.g., "16 vs 10", "A,7 vs 9", "8,8 vs A")
function formatSituation(ts: TableState, playerCards: Card[]): string {
  const dealerCard = ts.dealerUpcard.rank === '10' || ts.dealerUpcard.rank === 'J' || 
                     ts.dealerUpcard.rank === 'Q' || ts.dealerUpcard.rank === 'K' 
                     ? '10' : ts.dealerUpcard.rank;
  
  // Check for pair (first two cards only)
  if (playerCards.length === 2 && ts.isPair) {
    const rank = playerCards[0].rank;
    return `${rank},${rank} vs ${dealerCard}`;
  }
  
  // Check for soft hand (Ace counted as 11)
  if (ts.isSoft && playerCards.length === 2) {
    // Find the non-ace card value
    const nonAce = playerCards.find(c => c.rank !== 'A');
    if (nonAce) {
      return `A,${nonAce.rank} vs ${dealerCard}`;
    }
  }
  
  // Hard total
  return `${ts.handTotal} vs ${dealerCard}`;
}
