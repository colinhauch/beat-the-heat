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

  const canDouble =
    playerCards.length === 2 && playerStack >= currentHand.betAmount;
  // splitCount = number of splits performed (2 hands = 1 split, 3 hands = 2 splits, etc.)
  const splitCount = splitHands.length > 0 ? splitHands.length - 1 : 0;
  const canSplit =
    playerCards.length === 2 &&
    playerCards[0] &&
    playerCards[1] &&
    cardValue(playerCards[0].rank) === cardValue(playerCards[1].rank) &&
    playerStack >= currentHand.betAmount &&
    splitCount < rules.maxSplits;
  const canSurrender = playerCards.length === 2 && rules.surrenderAllowed;

  const actions: {
    action: PlayerAction;
    label: string;
    enabled: boolean;
    cls: string;
  }[] = [
    { action: "hit", label: "Hit", enabled: true, cls: "btn--hit" },
    { action: "stand", label: "Stand", enabled: true, cls: "btn--stand" },
    {
      action: "double",
      label: "Double",
      enabled: canDouble,
      cls: "btn--double",
    },
    { action: "split", label: "Split", enabled: !!canSplit, cls: "btn--split" },
    {
      action: "surrender",
      label: "Surrender",
      enabled: canSurrender,
      cls: "btn--surrender",
    },
  ];

  return (
    <div className="action-bar">
      {actions.map(({ action, label, enabled, cls }) => (
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
