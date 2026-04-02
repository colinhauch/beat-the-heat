import {
  Card,
  Decision,
  Hand,
  HandOutcome,
  PlayerAction,
  Session,
  TableRules,
  TableState,
  DEFAULT_TABLE_RULES,
} from "@beat-the-heat/shared";
import {
  buildShoe,
  cutCardIndex,
  evaluateHand,
  hiLoValue,
  isPair,
} from "@beat-the-heat/shared";

// ─── Game Phase ───────────────────────────────────────────────────────────────

export type GamePhase =
  | "idle"          // waiting to start / place bet
  | "betting"       // player is choosing bet
  | "dealing"       // initial deal in progress
  | "playerTurn"    // player making decisions
  | "dealerTurn"    // dealer revealing / drawing
  | "resolution"    // hand outcome shown
  | "shoeEnd";      // cut card reached, shuffle pending

// ─── Game State ───────────────────────────────────────────────────────────────

export interface GameState {
  phase: GamePhase;
  session: Session;
  shoe: Card[];
  cardsDealt: number;
  runningCount: number;
  cutCard: number;           // index in shoe where cut card is placed
  currentHand: Hand | null;
  pendingBet: number;
  playerStack: number;
  // For split hands: list of hands waiting to be played + index of active one
  splitHands: Hand[];
  activeSplitIndex: number;
  feedback: DecisionFeedback | null;
}

export interface DecisionFeedback {
  playerAction: PlayerAction;
  recommended: PlayerAction | null;
  isCorrect: boolean | null;
}

function makeSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function makeHandId(): string {
  return `hand_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Initial State ────────────────────────────────────────────────────────────

export function initialGameState(rules: TableRules = DEFAULT_TABLE_RULES, startingStack = 1000): GameState {
  const shoe = buildShoe(rules.decks);
  const cutCard = cutCardIndex(rules);
  const sessionId = makeSessionId();
  return {
    phase: "betting",
    session: { sessionId, startedAt: Date.now(), tableRules: rules, hands: [] },
    shoe,
    cardsDealt: 0,
    runningCount: 0,
    cutCard,
    currentHand: null,
    pendingBet: Math.max(rules.decks, 10), // sensible default bet
    playerStack: startingStack,
    splitHands: [],
    activeSplitIndex: 0,
    feedback: null,
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

export type GameAction =
  | { type: "SET_BET"; amount: number }
  | { type: "DEAL" }
  | { type: "PLAYER_ACTION"; action: PlayerAction; recommended: PlayerAction | null }
  | { type: "DEALER_DRAW" }
  | { type: "NEXT_HAND" }
  | { type: "SHUFFLE" }
  | { type: "CHANGE_RULES"; rules: TableRules };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_BET":
      return { ...state, pendingBet: action.amount };

    case "DEAL":
      return handleDeal(state);

    case "PLAYER_ACTION":
      return handlePlayerAction(state, action.action, action.recommended);

    case "DEALER_DRAW":
      return handleDealerDraw(state);

    case "NEXT_HAND":
      return handleNextHand(state);

    case "SHUFFLE":
      return handleShuffle(state);

    case "CHANGE_RULES": {
      const shoe = buildShoe(action.rules.decks);
      const cutCard = cutCardIndex(action.rules);
      return {
        ...state,
        session: { ...state.session, tableRules: action.rules },
        shoe,
        cardsDealt: 0,
        runningCount: 0,
        cutCard,
        phase: "betting",
      };
    }

    default:
      return state;
  }
}

// ─── Deal ─────────────────────────────────────────────────────────────────────

function dealCard(state: GameState): { card: Card; state: GameState } {
  const card = state.shoe[state.cardsDealt];
  const runningCount = state.runningCount + hiLoValue(card.rank);
  return {
    card,
    state: { ...state, cardsDealt: state.cardsDealt + 1, runningCount },
  };
}

function handleDeal(state: GameState): GameState {
  let s = state;
  let p1: Card, p2: Card, d1: Card, d2: Card;

  ({ card: p1, state: s } = dealCard(s));
  ({ card: d1, state: s } = dealCard(s));
  ({ card: p2, state: s } = dealCard(s));
  ({ card: d2, state: s } = dealCard(s));

  const playerCards = [p1, p2];
  const dealerCards = [d1, d2]; // d2 is hole card (face down)

  const playerEval = evaluateHand(playerCards);
  const hand: Hand = {
    handId: makeHandId(),
    decisions: [],
    outcome: null,
    betAmount: s.pendingBet,
    payout: 0,
    isBlackjack: playerEval.isBlackjack,
    playerInitialHand: playerCards,
    dealerFinalHand: dealerCards,
  };

  const newStack = s.playerStack - s.pendingBet;

  if (playerEval.isBlackjack) {
    // Resolve blackjack immediately (simplified: no dealer blackjack check for now)
    const payout = s.session.tableRules.blackjackPayout === "3:2"
      ? Math.floor(s.pendingBet * 1.5)
      : Math.floor(s.pendingBet * 1.2);
    const resolvedHand: Hand = {
      ...hand,
      outcome: "blackjack",
      payout,
    };
    return finishHand(s, resolvedHand, newStack + s.pendingBet + payout, dealerCards);
  }

  return {
    ...s,
    phase: "playerTurn",
    playerStack: newStack,
    currentHand: hand,
    splitHands: [],
    activeSplitIndex: 0,
    feedback: null,
  };
}

// ─── Player Action ────────────────────────────────────────────────────────────


function handlePlayerAction(
  state: GameState,
  action: PlayerAction,
  recommended: PlayerAction | null,
): GameState {
  const hand = state.currentHand!;
  const tableState = buildCurrentTableState(state, hand);

  const decision: Decision = { tableState, playerAction: action };
  const isCorrect = recommended !== null ? action === recommended : null;
  const feedback: DecisionFeedback = { playerAction: action, recommended, isCorrect };

  const updatedHand: Hand = { ...hand, decisions: [...hand.decisions, decision] };

  if (action === "surrender") {
    const payout = -Math.floor(hand.betAmount / 2);
    const resolvedHand: Hand = { ...updatedHand, outcome: "surrender", payout };
    return finishHand(state, resolvedHand, state.playerStack + hand.betAmount + payout, hand.dealerFinalHand, feedback);
  }

  if (action === "stand") {
    return { ...state, currentHand: updatedHand, phase: "dealerTurn", feedback };
  }

  if (action === "hit") {
    let s = state;
    const { card, state: s2 } = dealCard(s);
    s = s2;
    const newCards = [...tableState.playerHand, card];
    const eval_ = evaluateHand(newCards);

    // Update the tableState in the last decision to reflect new card
    const lastDecision = updatedHand.decisions[updatedHand.decisions.length - 1];
    const updatedDecision: Decision = {
      ...lastDecision,
      tableState: { ...lastDecision.tableState, playerHand: newCards, handTotal: eval_.total, isSoft: eval_.isSoft },
    };
    const handWithNewCard: Hand = {
      ...updatedHand,
      decisions: [...updatedHand.decisions.slice(0, -1), updatedDecision],
      dealerFinalHand: updatedHand.dealerFinalHand,
    };

    if (eval_.isBust) {
      const resolvedHand: Hand = { ...handWithNewCard, outcome: "bust", payout: -hand.betAmount };
      return finishHand(s, resolvedHand, s.playerStack, hand.dealerFinalHand, feedback);
    }

    return { ...s, currentHand: handWithNewCard, feedback };
  }

  if (action === "double") {
    let s = state;
    const { card, state: s2 } = dealCard(s);
    s = s2;
    const newCards = [...tableState.playerHand, card];
    const eval_ = evaluateHand(newCards);
    const newBet = hand.betAmount * 2;
    const newStack = s.playerStack - hand.betAmount; // extra bet charged

    const lastDecision = updatedHand.decisions[updatedHand.decisions.length - 1];
    const updatedDecision: Decision = {
      ...lastDecision,
      tableState: { ...lastDecision.tableState, playerHand: newCards, handTotal: eval_.total, isSoft: eval_.isSoft },
    };
    const handAfterDouble: Hand = {
      ...updatedHand,
      betAmount: newBet,
      decisions: [...updatedHand.decisions.slice(0, -1), updatedDecision],
    };

    if (eval_.isBust) {
      const resolvedHand: Hand = { ...handAfterDouble, outcome: "bust", payout: -newBet };
      return finishHand(s, resolvedHand, newStack, hand.dealerFinalHand, feedback);
    }

    // After double, go to dealer turn
    return { ...s, playerStack: newStack, currentHand: handAfterDouble, phase: "dealerTurn", feedback };
  }

  if (action === "split") {
    let s = state;
    const [card1, card2] = tableState.playerHand;
    let newCard1: Card, newCard2: Card;
    ({ card: newCard1, state: s } = dealCard(s));
    ({ card: newCard2, state: s } = dealCard(s));

    const hand1Cards = [card1, newCard1];
    const hand2Cards = [card2, newCard2];

    const hand1: Hand = {
      handId: makeHandId(),
      decisions: [],
      outcome: null,
      betAmount: hand.betAmount,
      payout: 0,
      isBlackjack: false,
      playerInitialHand: hand1Cards,
      dealerFinalHand: hand.dealerFinalHand,
    };
    const hand2: Hand = {
      handId: makeHandId(),
      decisions: [],
      outcome: null,
      betAmount: hand.betAmount,
      payout: 0,
      isBlackjack: false,
      playerInitialHand: hand2Cards,
      dealerFinalHand: hand.dealerFinalHand,
    };

    const newStack = s.playerStack - hand.betAmount; // extra bet for second hand

    return {
      ...s,
      playerStack: newStack,
      currentHand: hand1,
      splitHands: [hand1, hand2],
      activeSplitIndex: 0,
      phase: "playerTurn",
      feedback,
    };
  }

  return state;
}

function buildCurrentTableState(state: GameState, hand: Hand): TableState {
  const rules = state.session.tableRules;
  const totalCards = rules.decks * 52;

  // Player cards: from playerInitialHand initially, then updated via decisions
  let playerCards: Card[];
  if (hand.decisions.length === 0) {
    playerCards = hand.playerInitialHand;
  } else {
    playerCards = hand.decisions[hand.decisions.length - 1].tableState.playerHand;
  }

  const eval_ = evaluateHand(playerCards);
  const dealerUpcard = hand.dealerFinalHand[0];
  const canDouble = playerCards.length === 2 && state.playerStack >= hand.betAmount;
  const canSplit = isPair(playerCards) && state.playerStack >= hand.betAmount && state.splitHands.length < rules.maxSplits;

  return {
    playerHand: playerCards,
    dealerUpcard,
    cardsDealt: state.cardsDealt,
    cardsRemainingInShoe: totalCards - state.cardsDealt,
    runningCount: state.runningCount,
    playerStack: state.playerStack,
    currentBet: hand.betAmount,
    handTotal: eval_.total,
    isSoft: eval_.isSoft,
    isPair: isPair(playerCards),
    canDouble,
    canSplit,
    canSurrender: playerCards.length === 2 && rules.surrenderAllowed,
    splitDepth: state.activeSplitIndex,
  };
}

// ─── Dealer Turn ──────────────────────────────────────────────────────────────


function handleDealerDraw(state: GameState): GameState {
  const hand = state.currentHand!;
  const rules = state.session.tableRules;
  const dealerCards = [...hand.dealerFinalHand]; // already includes hole card
  const eval_ = evaluateHand(dealerCards);

  const shouldDraw = eval_.total < 17 || (eval_.isSoft && eval_.total === 17 && rules.dealerHitsSoft17);

  if (!shouldDraw) {
    // Dealer stands — resolve
    return resolveHand(state, hand, dealerCards);
  }

  // Draw one more card
  let s = state;
  const { card, state: s2 } = dealCard(s);
  s = s2;
  const newDealerCards = [...dealerCards, card];

  const newEval = evaluateHand(newDealerCards);
  const updatedHand: Hand = { ...hand, dealerFinalHand: newDealerCards };

  if (newEval.isBust || !( newEval.total < 17 || (newEval.isSoft && newEval.total === 17 && rules.dealerHitsSoft17))) {
    return resolveHand(s, updatedHand, newDealerCards);
  }

  return { ...s, currentHand: updatedHand };
}

function resolveHand(state: GameState, hand: Hand, dealerCards: Card[]): GameState {
  const playerCards = hand.decisions.length > 0
    ? hand.decisions[hand.decisions.length - 1].tableState.playerHand
    : hand.playerInitialHand;

  const playerEval = evaluateHand(playerCards);
  const dealerEval = evaluateHand(dealerCards);

  let outcome: HandOutcome;
  let payout: number;

  if (dealerEval.isBust || playerEval.total > dealerEval.total) {
    outcome = "win";
    payout = hand.betAmount;
  } else if (playerEval.total === dealerEval.total) {
    outcome = "push";
    payout = 0;
  } else {
    outcome = "lose";
    payout = -hand.betAmount;
  }

  const resolvedHand: Hand = { ...hand, outcome, payout, dealerFinalHand: dealerCards };
  return finishHand(state, resolvedHand, state.playerStack + hand.betAmount + payout, dealerCards, state.feedback);
}

function finishHand(
  state: GameState,
  hand: Hand,
  newStack: number,
  _dealerCards: Card[],
  feedback?: DecisionFeedback | null,
): GameState {
  const updatedSession: Session = {
    ...state.session,
    hands: [...state.session.hands, hand],
  };

  const needsShuffle = state.cardsDealt >= state.cutCard;

  return {
    ...state,
    phase: needsShuffle ? "shoeEnd" : "resolution",
    session: updatedSession,
    currentHand: hand,
    playerStack: newStack,
    feedback: feedback ?? state.feedback ?? null,
  };
}

function handleNextHand(state: GameState): GameState {
  if (state.splitHands.length > 0 && state.activeSplitIndex + 1 < state.splitHands.length) {
    const nextIndex = state.activeSplitIndex + 1;
    return {
      ...state,
      phase: "playerTurn",
      currentHand: state.splitHands[nextIndex],
      activeSplitIndex: nextIndex,
      feedback: null,
    };
  }

  return {
    ...state,
    phase: "betting",
    currentHand: null,
    splitHands: [],
    activeSplitIndex: 0,
    feedback: null,
  };
}

function handleShuffle(state: GameState): GameState {
  const shoe = buildShoe(state.session.tableRules.decks);
  const cutCard = cutCardIndex(state.session.tableRules);
  return {
    ...state,
    shoe,
    cardsDealt: 0,
    runningCount: 0,
    cutCard,
    phase: "betting",
  };
}
