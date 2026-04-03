import { useGame } from "../game/GameContext";

export function RulesFooter() {
  const { state } = useGame();
  const rules = state.session.tableRules;

  const parts = [
    `${rules.decks} Deck${rules.decks > 1 ? "s" : ""}`,
    rules.dealerHitsSoft17 ? "H17" : "S17",
    rules.doubleAfterSplit ? "DAS" : "No DAS",
    rules.surrenderAllowed ? "Surrender" : "No Surrender",
    `BJ ${rules.blackjackPayout}`,
    `Min/Max Bet ${rules.minBet}/${rules.maxBet}`,
  ];

  return (
    <footer className="app-footer">
      <span className="footer-text mono">{parts.join(" · ")}</span>
    </footer>
  );
}
