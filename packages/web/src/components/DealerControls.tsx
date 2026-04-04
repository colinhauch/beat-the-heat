import { useGame } from "../game/GameContext";
import "./DealerControls.css";

export function DealerControls() {
  const { state, dispatch } = useGame();
  const { phase } = state;

  if (phase === "dealerTurn") {
    return (
      <div className="dealer-controls">
        <div className="dealer-msg mono">Dealer drawing...</div>
      </div>
    );
  }

  if (phase === "shoeEnd") {
    return (
      <div className="dealer-controls">
        <div className="shoe-end-msg mono">Cut card reached</div>
        <button
          className="dealer-btn dealer-btn--shuffle serif"
          onClick={() => dispatch({ type: "SHUFFLE" })}
        >
          Shuffle & Deal
        </button>
      </div>
    );
  }

  return null;
}
