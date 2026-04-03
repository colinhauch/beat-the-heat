import { useGame } from "../game/GameContext";
import { PlayerAction, cardValue, Card } from "@beat-the-heat/shared";
import "./ActionBar.css";

function getPlayerCards(state: ReturnType<typeof useGame>['state']): Card[] {
  const hand = state.currentHand;
  if (!hand) return [];
  if (hand.decisions.length === 0) return hand.playerCards;
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

  return (
    <div className="action-bar">
      <div className="action-row action-row--primary">
        <button
          className="action-btn action-btn--lg btn--hit"
          disabled={false}
          onClick={() => dispatchPlayerAction("hit")}
          aria-label="Hit"
        >
          <span className="btn-label mono">Hit</span>
        </button>
        <button
          className="action-btn action-btn--lg btn--stand"
          disabled={false}
          onClick={() => dispatchPlayerAction("stand")}
          aria-label="Stand"
        >
          <span className="btn-label mono">Stand</span>
        </button>
      </div>
      <div className="action-row action-row--secondary">
        <button
          className="action-btn action-btn-secondary action-btn--sm btn--double"
          disabled={!canDouble}
          onClick={() => dispatchPlayerAction("double")}
          aria-label="Double"
        >
          <span className="btn-label mono">Double</span>
        </button>
        <button
          className="action-btn action-btn-secondary action-btn--sm btn--split"
          disabled={!canSplit}
          onClick={() => dispatchPlayerAction("split")}
          aria-label="Split"
        >
          <span className="btn-label mono">Split</span>
        </button>
        {rules.surrenderAllowed && (
          <button
            className="action-btn action-btn-secondary action-btn--sm btn--surrender"
            disabled={!canSurrender}
            onClick={() => dispatchPlayerAction("surrender")}
            aria-label="Surrender"
          >
            <span className="btn-label mono">Surrender</span>
          </button>
        )}
      </div>
    </div>
  );
}
