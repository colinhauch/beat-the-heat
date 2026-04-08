import { useGame } from "../game/GameContext";
import { evaluateHand } from "@beat-the-heat/shared";
import "./InsurancePanel.css";

export function InsurancePanel() {
  const { state, dispatch } = useGame();
  const { currentHand, phase } = state;

  if (phase !== "insurance" || !currentHand) return null;

  const playerEval = evaluateHand(currentHand.playerCards);
  const hasBlackjack = playerEval.isBlackjack;
  const insuranceAmount = Math.floor(currentHand.betAmount / 2);

  return (
    <div className="insurance-panel">
      <div className="insurance-header">
        <span className="insurance-title mono">Dealer Shows Ace</span>
      </div>

      {hasBlackjack ? (
        <>
          <div className="insurance-prompt mono">
            Take even money?
          </div>
          <div className="insurance-info mono">
            Even money guarantees ${currentHand.betAmount} win.
            Declining risks a push if dealer also has Blackjack.
          </div>
          <div className="insurance-actions">
            <button
              className="insurance-btn insurance-btn--accept"
              onClick={() => dispatch({ type: "TAKE_EVEN_MONEY" })}
            >
              <span className="btn-label mono">Even Money</span>
              <span className="btn-sublabel mono">Win ${currentHand.betAmount}</span>
            </button>
            <button
              className="insurance-btn insurance-btn--decline"
              onClick={() => dispatch({ type: "DECLINE_INSURANCE" })}
            >
              <span className="btn-label mono">No Thanks</span>
              <span className="btn-sublabel mono">Play it out</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="insurance-prompt mono">Insurance?</div>
          <div className="insurance-info mono">
            Pay ${insuranceAmount} (half your bet). Wins 2:1 if dealer has Blackjack.
          </div>
          <div className="insurance-actions">
            <button
              className="insurance-btn insurance-btn--accept"
              onClick={() => dispatch({ type: "TAKE_INSURANCE" })}
            >
              <span className="btn-label mono">Insurance</span>
              <span className="btn-sublabel mono">${insuranceAmount}</span>
            </button>
            <button
              className="insurance-btn insurance-btn--decline"
              onClick={() => dispatch({ type: "DECLINE_INSURANCE" })}
            >
              <span className="btn-label mono">No Insurance</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
