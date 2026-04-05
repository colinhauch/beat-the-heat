import { useGame } from "../game/GameContext";
import { BettingPanel } from "./BettingPanel";
import { ActionBar } from "./ActionBar";
import { DealerControls } from "./DealerControls";
import "./ControlDashboard.css";

export function ControlDashboard() {
  const { state } = useGame();
  const { phase } = state;

  const showBetting = phase === "betting" || phase === "resolution";
  const showAction = phase === "playerTurn";
  const showDealer = phase === "dealerTurn" || phase === "shoeEnd";

  return (
    <div className="control-dashboard">
      {showBetting && <BettingPanel />}
      {showAction && <ActionBar />}
      {showDealer && <DealerControls />}
    </div>
  );
}
