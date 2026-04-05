import { useGame } from "../game/GameContext";
import "./CountPanel.css";

export function CountPanel() {
  const { state } = useGame();
  const { runningCount, cardsDealt, session } = state;
  const decks = session.tableRules.decks;
  const totalCards = decks * 52;
  const cardsRemaining = totalCards - cardsDealt;
  const decksRemaining = cardsRemaining / 52;
  const trueCount = decksRemaining > 0 ? runningCount / decksRemaining : 0;

  return (
    <div className="count-panel">
      <div className="count-header">
        <span className="count-title mono">Count</span>
      </div>

      <div className="count-stats">
        <div className="count-stat">
          <span className="count-stat-label mono">Running Count</span>
          <span className={`count-stat-value mono ${runningCount > 0 ? 'count-positive' : runningCount < 0 ? 'count-negative' : ''}`}>
            {runningCount > 0 ? '+' : ''}{runningCount}
          </span>
        </div>
        <div className="count-stat">
          <span className="count-stat-label mono">True Count</span>
          <span className={`count-stat-value mono ${trueCount > 0 ? 'count-positive' : trueCount < 0 ? 'count-negative' : ''}`}>
            {trueCount > 0 ? '+' : ''}{trueCount.toFixed(1)}
          </span>
        </div>
        <div className="count-stat">
          <span className="count-stat-label mono">Cards Dealt</span>
          <span className="count-stat-value mono">{cardsDealt} / {totalCards}</span>
        </div>
        <div className="count-stat">
          <span className="count-stat-label mono">Decks Remaining</span>
          <span className="count-stat-value mono">{decksRemaining.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}
