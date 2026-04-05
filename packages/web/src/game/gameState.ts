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
  | "idle" // waiting to start / place bet
  | "betting" // player is choosing bet
  | "dealing" // initial deal in progress
  | "playerTurn" // player making decisions
  | "splitDealing" // waiting to deal card to new split hand
  | "dealerTurn" // dealer revealing / drawing
  | "resolution" // hand outcome shown
  | "shoeEnd"; // cut card reached, shuffle pending

// ─── Game State ───────────────────────────────────────────────────────────────

export interface GameState {
  phase: GamePhase;
  session: Session;
  shoe: Card[];
  cardsDealt: number;
  runningCount: number;
  holeCardCounted: boolean; // true once dealer's hole card has been revealed and counted
  cutCard: number; // index in shoe where cut card is placed
  currentHand: Hand | null;
  pendingBet: number;
  playerStack: number;
  // For split hands: list of hands waiting to be played + index of active one
  splitHands: Hand[];
  activeSplitIndex: number;
  feedback: DecisionFeedback | null;
  // Dealing animation: cards dealt one at a time, step 0-4 (4 = complete)
  dealStep: number;
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

export function initialGameState(
  rules: TableRules = DEFAULT_TABLE_RULES,
  startingStack = 1000,
): GameState {
  const shoe = buildShoe(rules.decks);
  const cutCard = cutCardIndex(rules);
  const sessionId = makeSessionId();
  return {
    phase: "betting",
    session: { sessionId, startedAt: Date.now(), tableRules: rules, hands: [] },
    shoe,
    cardsDealt: 0,
    runningCount: 0,
    holeCardCounted: false,
    cutCard,
    currentHand: null,
    pendingBet: Math.max(rules.decks, 10), // sensible default bet
    playerStack: startingStack,
    splitHands: [],
    activeSplitIndex: 0,
    feedback: null,
    dealStep: 0,
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

export type GameAction =
  | { type: "SET_BET"; amount: number }
  | { type: "DEAL" }
  | { type: "DEAL_CARD" }
  | {
      type: "PLAYER_ACTION";
      action: PlayerAction;
      recommended: PlayerAction | null;
    }
  | { type: "DEALER_DRAW" }
  | { type: "SPLIT_DEAL" } // deal a card to the active split hand
  | { type: "NEXT_HAND" }
  | { type: "SHUFFLE" }
  | { type: "CHANGE_RULES"; rules: TableRules }
  | {
      type: "SET_DEBUG_HAND";
      playerCards: [Card, Card];
      dealerCards: [Card, Card];
    }; // for testing specific scenarios, bypasses normal dealing and sets up a hand directly

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_BET":
      return { ...state, pendingBet: action.amount };

    case "DEAL":
      return handleDeal(state);

    case "DEAL_CARD":
      return handleDealCard(state);

    case "PLAYER_ACTION":
      return handlePlayerAction(state, action.action, action.recommended);

    case "DEALER_DRAW":
      return handleDealerDraw(state);

    case "SPLIT_DEAL":
      return handleSplitDeal(state);

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
        holeCardCounted: false,
        cutCard,
        phase: "betting",
        currentHand: null,
        splitHands: [],
        activeSplitIndex: 0,
        feedback: null,
        dealStep: 0,
      };
    }

    case "SET_DEBUG_HAND":
      return handleDebugHand(state, action.playerCards, action.dealerCards);

    default:
      return state;
  }
}

// ─── Deal ─────────────────────────────────────────────────────────────────────

function dealCard(state: GameState, countIt = true): { card: Card; state: GameState } {
  const card = state.shoe[state.cardsDealt];
  const runningCount = countIt 
    ? state.runningCount + hiLoValue(card.rank)
    : state.runningCount;
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
  ({ card: d2, state: s } = dealCard(s, false)); // hole card - don't count yet

  const hand: Hand = {
    handId: makeHandId(),
    decisions: [],
    outcome: null,
    betAmount: s.pendingBet,
    payout: 0,
    isBlackjack: false, // determined after all cards dealt
    playerCards: [p1, p2],
    dealerCards: [d1, d2],
  };

  return {
    ...s,
    phase: "dealing",
    playerStack: s.playerStack - s.pendingBet,
    currentHand: hand,
    splitHands: [],
    activeSplitIndex: 0,
    holeCardCounted: false,
    feedback: null,
    dealStep: 0,
  };
}

// Called once per card during the dealing animation. Deal order: p1, d1, p2, d2(hole).
function handleDealCard(state: GameState): GameState {
  if (state.phase !== "dealing" || !state.currentHand) return state;

  const nextStep = state.dealStep + 1;

  // Not done yet — just advance the step so Table renders one more card
  if (nextStep < 4) {
    return { ...state, dealStep: nextStep };
  }

  // All 4 cards revealed — transition to playerTurn (or resolve blackjack)
  const hand = state.currentHand;
  const playerEval = evaluateHand(hand.playerCards);
  const finalHand: Hand = { ...hand, isBlackjack: playerEval.isBlackjack };

  if (playerEval.isBlackjack) {
    const payout =
      state.session.tableRules.blackjackPayout === "3:2"
        ? Math.floor(state.pendingBet * 1.5)
        : Math.floor(state.pendingBet * 1.2);
    const resolvedHand: Hand = { ...finalHand, outcome: "blackjack", payout };
    return finishHand(
      { ...state, dealStep: 4 },
      resolvedHand,
      state.playerStack + state.pendingBet + payout,
      hand.dealerCards,
    );
  }

  return {
    ...state,
    phase: "playerTurn",
    currentHand: finalHand,
    dealStep: 4,
  };
}

// ─── Debug Hand ───────────────────────────────────────────────────────────────

function handleDebugHand(
  state: GameState,
  playerCards: [Card, Card],
  dealerCards: [Card, Card],
): GameState {
  const playerEval = evaluateHand(playerCards);
  const dealerEval = evaluateHand(dealerCards);

  const hand: Hand = {
    handId: makeHandId(),
    decisions: [],
    outcome: null,
    betAmount: state.pendingBet,
    payout: 0,
    isBlackjack: playerEval.isBlackjack,
    playerCards: playerCards,
    dealerCards: dealerCards,
  };

  const newStack = state.playerStack - state.pendingBet;

  // Check for blackjacks
  if (playerEval.isBlackjack && dealerEval.isBlackjack) {
    // Both have blackjack = push
    const resolvedHand: Hand = { ...hand, outcome: "push", payout: 0 };
    return finishHand(
      state,
      resolvedHand,
      newStack + state.pendingBet,
      dealerCards,
    );
  }

  if (dealerEval.isBlackjack) {
    // Dealer blackjack, player loses
    const resolvedHand: Hand = {
      ...hand,
      outcome: "lose",
      payout: -state.pendingBet,
    };
    return finishHand(state, resolvedHand, newStack, dealerCards);
  }

  if (playerEval.isBlackjack) {
    // Player blackjack
    const payout =
      state.session.tableRules.blackjackPayout === "3:2"
        ? Math.floor(state.pendingBet * 1.5)
        : Math.floor(state.pendingBet * 1.2);
    const resolvedHand: Hand = { ...hand, outcome: "blackjack", payout };
    return finishHand(
      state,
      resolvedHand,
      newStack + state.pendingBet + payout,
      dealerCards,
    );
  }

  return {
    ...state,
    phase: "playerTurn",
    playerStack: newStack,
    currentHand: hand,
    splitHands: [],
    activeSplitIndex: 0,
    holeCardCounted: false,
    feedback: null,
  };
}

// ─── Split Hand Advancement ───────────────────────────────────────────────────

/**
 * After a split hand is done (stood, busted, or doubled), either:
 * - Move to the next split hand if more remain (may need to deal a card first)
 * - Go to dealer turn if all split hands are complete
 */
function advanceToNextSplitOrDealer(
  state: GameState,
  completedHand: Hand,
  feedback: DecisionFeedback,
): GameState {
  // Update the splitHands array with the completed hand's final state
  const updatedSplitHands = state.splitHands.map((h, i) =>
    i === state.activeSplitIndex ? completedHand : h,
  );

  const nextIndex = state.activeSplitIndex + 1;

  if (nextIndex < state.splitHands.length) {
    const nextHand = updatedSplitHands[nextIndex];
    // If next hand only has 1 card, need to deal to it first
    const needsDeal = nextHand.playerCards.length === 1;
    return {
      ...state,
      splitHands: updatedSplitHands,
      currentHand: nextHand,
      activeSplitIndex: nextIndex,
      phase: needsDeal ? "splitDealing" : "playerTurn",
      feedback,
    };
  }

  // All split hands complete - go to dealer turn
  // Set currentHand to the first non-busted hand for dealer resolution
  // (or the last hand if all busted)
  const firstNonBusted = updatedSplitHands.find((h) => h.outcome !== "bust");
  const handForDealer =
    firstNonBusted ?? updatedSplitHands[updatedSplitHands.length - 1];

  return {
    ...state,
    splitHands: updatedSplitHands,
    currentHand: handForDealer,
    phase: "dealerTurn",
    feedback,
  };
}

// ─── Split Deal ───────────────────────────────────────────────────────────────

/**
 * Deal a card to the active split hand (when it only has 1 card after split).
 */
function handleSplitDeal(state: GameState): GameState {
  if (state.phase !== "splitDealing" || !state.currentHand) return state;

  const { card, state: s } = dealCard(state);
  const hand = state.currentHand;
  const newCards = [...hand.playerCards, card];

  const updatedHand: Hand = {
    ...hand,
    playerCards: newCards,
  };

  // Update splitHands array with the new hand
  const updatedSplitHands = state.splitHands.map((h, i) =>
    i === state.activeSplitIndex ? updatedHand : h,
  );

  return {
    ...s,
    currentHand: updatedHand,
    splitHands: updatedSplitHands,
    phase: "playerTurn",
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
  const feedback: DecisionFeedback = {
    playerAction: action,
    recommended,
    isCorrect,
  };

  const updatedHand: Hand = {
    ...hand,
    decisions: [...hand.decisions, decision],
  };

  if (action === "surrender") {
    const payout = -Math.floor(hand.betAmount / 2);
    const resolvedHand: Hand = { ...updatedHand, outcome: "surrender", payout };
    return finishHand(
      state,
      resolvedHand,
      state.playerStack + hand.betAmount + payout,
      hand.dealerCards,
      feedback,
    );
  }

  if (action === "stand") {
    const stoodHand: Hand = { ...updatedHand };
    // If in a split, advance to next hand; otherwise go to dealer turn
    if (state.splitHands.length > 0) {
      return advanceToNextSplitOrDealer(state, stoodHand, feedback);
    }
    return {
      ...state,
      currentHand: stoodHand,
      phase: "dealerTurn",
      feedback,
    };
  }

  if (action === "hit") {
    let s = state;
    const { card, state: s2 } = dealCard(s);
    s = s2;
    const newCards = [...tableState.playerHand, card];
    const eval_ = evaluateHand(newCards);

    // Update playerCards on the hand (decision stores pre-action state)
    const handWithNewCard: Hand = {
      ...updatedHand,
      playerCards: newCards,
    };

    if (eval_.isBust) {
      const bustedHand: Hand = {
        ...handWithNewCard,
        outcome: "bust",
        payout: -hand.betAmount,
      };
      // If in a split, advance to next hand; otherwise finish
      if (s.splitHands.length > 0) {
        return advanceToNextSplitOrDealer(s, bustedHand, feedback);
      }
      return finishHand(
        s,
        bustedHand,
        s.playerStack,
        hand.dealerCards,
        feedback,
      );
    }

    // Auto-stand on hard 21
    if (eval_.total === 21 && !eval_.isSoft) {
      if (s.splitHands.length > 0) {
        return advanceToNextSplitOrDealer(s, handWithNewCard, feedback);
      }
      return {
        ...s,
        currentHand: handWithNewCard,
        phase: "dealerTurn",
        feedback,
      };
    }

    // Keep splitHands in sync with currentHand during hit
    if (s.splitHands.length > 0) {
      const updatedSplitHands = s.splitHands.map((h, i) =>
        i === s.activeSplitIndex ? handWithNewCard : h
      );
      return { ...s, currentHand: handWithNewCard, splitHands: updatedSplitHands, feedback };
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

    // Update playerCards on the hand (decision stores pre-action state)
    const handAfterDouble: Hand = {
      ...updatedHand,
      playerCards: newCards,
      betAmount: newBet,
    };

    if (eval_.isBust) {
      const bustedHand: Hand = {
        ...handAfterDouble,
        outcome: "bust",
        payout: -newBet,
      };
      // If in a split, advance to next hand; otherwise finish
      if (s.splitHands.length > 0) {
        return advanceToNextSplitOrDealer(
          { ...s, playerStack: newStack },
          bustedHand,
          feedback,
        );
      }
      return finishHand(
        s,
        bustedHand,
        newStack,
        hand.dealerCards,
        feedback,
      );
    }

    // After double, advance to next split hand or dealer turn
    if (s.splitHands.length > 0) {
      return advanceToNextSplitOrDealer(
        { ...s, playerStack: newStack },
        handAfterDouble,
        feedback,
      );
    }
    return {
      ...s,
      playerStack: newStack,
      currentHand: handAfterDouble,
      phase: "dealerTurn",
      feedback,
    };
  }

  if (action === "split") {
    const [card1, card2] = tableState.playerHand;

    // Each hand starts with just 1 card - they'll each receive a card
    // via splitDealing phase (with delay) when they become active.
    // Hand 1 (idx=0, displayed on RIGHT due to row-reverse) gets card2 (right card)
    // Hand 2 (idx=1, displayed on LEFT) gets card1 (left card)
    // This way cards slide outward without crossing.
    const hand1: Hand = {
      handId: makeHandId(),
      decisions: [],
      outcome: null,
      betAmount: hand.betAmount,
      payout: 0,
      isBlackjack: false,
      playerCards: [card2],
      dealerCards: hand.dealerCards,
    };
    const hand2: Hand = {
      handId: makeHandId(),
      decisions: [],
      outcome: null,
      betAmount: hand.betAmount,
      payout: 0,
      isBlackjack: false,
      playerCards: [card1],
      dealerCards: hand.dealerCards,
    };

    const newStack = state.playerStack - hand.betAmount; // extra bet for second hand

    // Handle re-split: insert new hands at current position
    if (state.splitHands.length > 0) {
      const newSplitHands = [
        ...state.splitHands.slice(0, state.activeSplitIndex),
        hand1,
        hand2,
        ...state.splitHands.slice(state.activeSplitIndex + 1),
      ];
      return {
        ...state,
        playerStack: newStack,
        currentHand: hand1,
        splitHands: newSplitHands,
        activeSplitIndex: state.activeSplitIndex, // stay at same index (now pointing to hand1)
        phase: "splitDealing", // will deal card to hand1 after delay
        feedback,
      };
    }

    // First split
    return {
      ...state,
      playerStack: newStack,
      currentHand: hand1,
      splitHands: [hand1, hand2],
      activeSplitIndex: 0,
      phase: "splitDealing", // will deal card to hand1 after delay
      feedback,
    };
  }

  return state;
}

function buildCurrentTableState(state: GameState, hand: Hand): TableState {
  const rules = state.session.tableRules;
  const totalCards = rules.decks * 52;

  // Player cards are always stored directly on the hand
  const playerCards = hand.playerCards;

  const eval_ = evaluateHand(playerCards);
  const dealerUpcard = hand.dealerCards[0];
  const isInSplit = state.splitHands.length > 0;
  const canDouble =
    playerCards.length === 2 &&
    state.playerStack >= hand.betAmount &&
    (!isInSplit || rules.doubleAfterSplit);
  // Allow splits up to maxSplits times (maxSplits + 1 hands total)
  // splitHands.length: 0=no split, 2=1 split, 3=2 splits, 4=3 splits
  const splitCount =
    state.splitHands.length > 0 ? state.splitHands.length - 1 : 0;
  const canSplit =
    isPair(playerCards) &&
    state.playerStack >= hand.betAmount &&
    splitCount < rules.maxSplits;

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
    canSurrender: playerCards.length === 2 && rules.surrenderAllowed && !isInSplit,
    splitDepth: state.activeSplitIndex,
  };
}

// ─── Dealer Turn ──────────────────────────────────────────────────────────────

function handleDealerDraw(state: GameState): GameState {
  let s = state;

  // Count hole card when first revealed
  if (!s.holeCardCounted && s.currentHand) {
    const holeCard = s.currentHand.dealerCards[1];
    s = {
      ...s,
      runningCount: s.runningCount + hiLoValue(holeCard.rank),
      holeCardCounted: true,
    };
  }

  const hand = s.currentHand!;
  const rules = s.session.tableRules;
  const dealerCards = [...hand.dealerCards]; // already includes hole card
  const eval_ = evaluateHand(dealerCards);

  const shouldDraw =
    eval_.total < 17 ||
    (eval_.isSoft && eval_.total === 17 && rules.dealerHitsSoft17);

  if (!shouldDraw) {
    // Dealer stands — resolve
    return resolveHand(s, hand, dealerCards);
  }

  // Draw one more card
  const { card, state: s2 } = dealCard(s);
  s = s2;
  const newDealerCards = [...dealerCards, card];

  const newEval = evaluateHand(newDealerCards);
  const updatedHand: Hand = { ...hand, dealerCards: newDealerCards };

  // Update dealer cards in all split hands for display
  const updatedSplitHands = s.splitHands.map((h) => ({
    ...h,
    dealerCards: newDealerCards,
  }));

  if (
    newEval.isBust ||
    !(
      newEval.total < 17 ||
      (newEval.isSoft && newEval.total === 17 && rules.dealerHitsSoft17)
    )
  ) {
    return resolveHand(
      { ...s, splitHands: updatedSplitHands },
      updatedHand,
      newDealerCards,
    );
  }

  return { ...s, currentHand: updatedHand, splitHands: updatedSplitHands };
}

function resolveOneHand(hand: Hand, dealerCards: Card[]): Hand {
  // If already resolved (bust), just update dealer cards
  if (hand.outcome === "bust") {
    return { ...hand, dealerCards: dealerCards };
  }

  const playerCards = hand.playerCards;

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

  return {
    ...hand,
    outcome,
    payout,
    dealerCards: dealerCards,
  };
}

function resolveHand(
  state: GameState,
  _hand: Hand,
  dealerCards: Card[],
): GameState {
  // If we have split hands, resolve all of them
  if (state.splitHands.length > 0) {
    const resolvedHands = state.splitHands.map((h) =>
      resolveOneHand(h, dealerCards),
    );
    const totalPayout = resolvedHands.reduce((sum, h) => sum + h.payout, 0);
    const totalBets = resolvedHands.reduce((sum, h) => sum + h.betAmount, 0);

    const updatedSession: Session = {
      ...state.session,
      hands: [...state.session.hands, ...resolvedHands],
    };

    const needsShuffle = state.cardsDealt >= state.cutCard;

    return {
      ...state,
      phase: needsShuffle ? "shoeEnd" : "resolution",
      session: updatedSession,
      // Keep first hand as currentHand for display, but all are in splitHands
      currentHand: resolvedHands[0],
      splitHands: resolvedHands,
      playerStack: state.playerStack + totalBets + totalPayout,
      feedback: state.feedback ?? null,
    };
  }

  // Single hand resolution (no split)
  const hand = state.currentHand!;
  const resolvedHand = resolveOneHand(hand, dealerCards);

  return finishHand(
    state,
    resolvedHand,
    state.playerStack + hand.betAmount + resolvedHand.payout,
    dealerCards,
    state.feedback,
  );
}

function finishHand(
  state: GameState,
  hand: Hand,
  newStack: number,
  _dealerCards?: Card[],
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
  // After resolution (including split resolution), go back to betting
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
    holeCardCounted: false,
    cutCard,
    phase: "betting",
  };
}
