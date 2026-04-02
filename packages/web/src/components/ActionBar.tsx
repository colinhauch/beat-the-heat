import { useGame } from "../game/GameContext";
import { PlayerAction, cardValue, Card } from "@beat-the-heat/shared";
import "./ActionBar.css";

function getPlayerCards(state: ReturnType<typeof useGame>["state"]): Card[] {
  const hand = state.currentHand;
  if (!hand) return [];
  if (hand.decisions.length === 0) return hand.playerInitialHand;
  return hand.decisions[hand.decisions.length - 1].tableState.playerHand;
}

export function ActionBar() {
  const { state, dispatchPlayerAction } = useGame();
  const { currentHand, playerStack, splitHands, session } = state;

  if (!currentHand || state.phase !== "playerTurn") return null;

  const playerCards = getPlayerCards(state);
  const rules = session.tableRules;

  // Check if we're in a split hand
  const isInSplit = splitHands.length > 0;

  // Double: allowed on first 2 cards, but during splits only if DAS is allowed
  const canDouble =
    playerCards.length === 2 &&
    playerStack >= currentHand.betAmount &&
    (!isInSplit || rules.doubleAfterSplit);

  // splitCount = number of splits performed (2 hands = 1 split, 3 hands = 2 splits, etc.)
  const splitCount = splitHands.length > 0 ? splitHands.length - 1 : 0;
  const canSplit =
    playerCards.length === 2 &&
    playerCards[0] &&
    playerCards[1] &&
    cardValue(playerCards[0].rank) === cardValue(playerCards[1].rank) &&
    playerStack >= currentHand.betAmount &&
    splitCount < rules.maxSplits;

  // Surrender only on initial hand (not after split), and only if allowed
  const canSurrender = playerCards.length === 2 && rules.surrenderAllowed && !isInSplit;

  const actions: {
    action: PlayerAction;
    label: string;
    enabled: boolean;
    visible: boolean;
    cls: string;
  }[] = [
    { action: "hit", label: "Hit", enabled: true, visible: true, cls: "btn--hit" },
    { action: "stand", label: "Stand", enabled: true, visible: true, cls: "btn--stand" },
    {
      action: "double",
      label: "Double",
      enabled: canDouble,
      visible: true,
      cls: "btn--double",
    },
    { action: "split", label: "Split", enabled: canSplit, visible: true, cls: "btn--split" },
    {
      action: "surrender",
      label: "Surrender",
      enabled: canSurrender,
      visible: rules.surrenderAllowed,
      cls: "btn--surrender",
    },
  ];

  return (
    <div className="action-bar">
      {actions.filter(a => a.visible).map(({ action, label, enabled, cls }) => (
        <button
          key={action}
          className={`action-btn ${cls}`}
          disabled={!enabled}
          onClick={() => dispatchPlayerAction(action)}
          aria-label={label}
        >
          <span className="btn-label mono">{label}</span>
        </button>
      ))}
    </div>
  );
}
