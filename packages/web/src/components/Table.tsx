import { useGame } from "../game/GameContext";
import { evaluateHand } from "@beat-the-heat/shared";
import { Card, Hand } from "@beat-the-heat/shared";
import { CardDisplay } from "./CardDisplay";
import { ControlDashboard } from "./ControlDashboard";
import "./Table.css";

function getPlayerCards(state: ReturnType<typeof useGame>["state"]): Card[] {
  const hand = state.currentHand;
  if (!hand) return [];
  return hand.playerCards;
}

function getHandCards(hand: Hand): Card[] {
  return hand.playerCards;
}

export function Table() {
  const { state } = useGame();
  const { phase, currentHand, splitHands, activeSplitIndex, dealStep } = state;

  // During dealing, reveal cards one at a time in deal order: p1, d1, p2, d2(hole)
  const allPlayerCards = getPlayerCards(state);
  const allDealerCards = currentHand?.dealerCards.slice(0, 2) ?? [];
  const dealerExtraCards = currentHand?.dealerCards.slice(2) ?? [];

  let playerCards: Card[];
  let dealerCards: Card[];
  if (phase === "dealing") {
    playerCards = dealStep >= 1 ? [allPlayerCards[0], ...(dealStep >= 3 ? [allPlayerCards[1]] : [])].filter(Boolean) : [];
    dealerCards = [
      ...(dealStep >= 2 ? [allDealerCards[0]] : []),
      ...(dealStep >= 4 ? [allDealerCards[1]] : []),
    ];
  } else {
    playerCards = allPlayerCards;
    dealerCards = allDealerCards;
  }

  // During player turn, hole card is face down
  const showHoleCard = phase !== "playerTurn" && phase !== "dealing";

  // Hand totals
  const playerEval = playerCards.length > 0 ? evaluateHand(playerCards) : null;
  const dealerVisibleCards = showHoleCard
    ? [...dealerCards, ...dealerExtraCards]
    : [dealerCards[0]].filter(Boolean);
  const dealerEval =
    dealerVisibleCards.length > 0 ? evaluateHand(dealerVisibleCards) : null;

  const showIdle = phase === "betting" || !currentHand;

  return (
    <div className="table">
      {/* Dealer Zone */}
      <div className="zone zone--dealer">
        <div className="zone-label mono">Dealer</div>
        {currentHand ? (
          <>
            <div className="hand-row">
              {dealerCards[0] && <CardDisplay key={`d0-${dealerCards[0].rank}${dealerCards[0].suit}`} card={dealerCards[0]} />}
              {dealerCards[1] && (
                <CardDisplay
                  key={showHoleCard ? "d1-revealed" : "d1-hole"}
                  card={showHoleCard ? dealerCards[1] : null}
                />
              )}
              {dealerExtraCards.map((card, i) => (
                <CardDisplay key={`dx-${i}-${card.rank}${card.suit}`} card={card} />
              ))}
            </div>
            <div className="hand-total mono">
              {dealerEval && (dealerEval.isBust ? (
                <span className="total--bust">Bust ({dealerEval.total})</span>
              ) : (
                <span>{dealerEval.total}{dealerEval.isSoft ? " soft" : ""}</span>
              ))}
            </div>
          </>
        ) : (
          <div className="hand-row hand-row--empty">
            <div className="empty-zone-text serif">Dealer</div>
          </div>
        )}
      </div>

      {/* Center Divider */}
      <div className="table-center-rail">
        <div className="rail-line" />
        <div className="rail-badge serif">
          {showIdle ? "Place Your Bet" : outcomeLabel(state)}
        </div>
        <div className="rail-line" />
      </div>

      {/* Player Zone */}
      <div className="zone zone--player">
        <div className="zone-label mono">You</div>
        {splitHands.length > 0 ? (
          // Split hands view - show all hands side by side
          <div className="split-hands-container">
            {splitHands.map((hand, idx) => {
              const cards = getHandCards(hand);
              const handEval = evaluateHand(cards);
              const isActive =
                idx === activeSplitIndex && phase === "playerTurn";
              const isResolved = hand.outcome !== null;
              return (
                <div
                  key={hand.handId}
                  className={`split-hand ${isActive ? "split-hand--active" : ""} ${isResolved ? "split-hand--resolved" : ""}`}
                >
                  <div className="split-hand-label mono">Hand {idx + 1}</div>
                  <div className="hand-row">
                    {cards.map((card, i) => (
                      <CardDisplay key={`s${idx}-${i}-${card.rank}${card.suit}`} card={card} />
                    ))}
                  </div>
                  <div className="hand-total mono">
                    {handEval.isBust ? (
                      <span className="total--bust">
                             ({handEval.total}) Bust
                      </span>
                    ) : isResolved && hand.outcome ? (
                      <span className={`total--${hand.outcome}`}>
                        {hand.outcome === "win"
                          ? `Win! (${handEval.total})`
                          : hand.outcome === "lose"
                            ? `Lose (${handEval.total})`
                            : hand.outcome === "push"
                              ? `Push (${handEval.total})`
                              : `${handEval.total}`}
                      </span>
                    ) : (
                      <span>
                        {handEval.total}
                        {handEval.isSoft ? " soft" : ""}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : currentHand ? (
          // Single hand view
          <>
            <div className="hand-row">
              {playerCards.map((card, i) => (
                <CardDisplay key={`p${i}-${card.rank}${card.suit}`} card={card} />
              ))}
            </div>
            <div className="hand-total mono">
              {playerEval && (playerEval.isBust ? (
                <span className="total--bust">{playerEval.total}</span>
              ) : playerEval.isBlackjack ? (
                <span className="total--blackjack">Blackjack! ✦</span>
              ) : (
                <span>{playerEval.total}{playerEval.isSoft ? " soft" : ""}</span>
              ))}
            </div>
          </>
        ) : (
          <div className="hand-row hand-row--empty">
            <div className="empty-zone-text serif">You</div>
          </div>
        )}
      </div>

      {/* Controls Zone */}
      <div className="controls-zone">
        <div className="bet-indicator mono">
          <span className="bet-label">BET</span>
          <span className="bet-amount">
            {splitHands.length > 0 && phase !== "resolution" && phase !== "betting"
              ? splitHands.reduce((sum, h) => sum + h.betAmount, 0)
              : phase === "betting" || phase === "resolution"
                ? state.pendingBet
                : currentHand?.betAmount ?? state.pendingBet}
          </span>
          <span className="stack-label">STACK</span>
          <span
            className="stack-amount"
            style={{
              color:
                state.playerStack > 0 ? "var(--gold-mid)" : "var(--wrong-glow)",
            }}
          >
            {state.playerStack}
          </span>
        </div>
        <ControlDashboard />
      </div>
    </div>
  );
}

function outcomeLabel(state: ReturnType<typeof useGame>["state"]): string {
  if (state.phase === "dealerTurn") return "Dealer's Turn";
  if (state.phase === "shoeEnd") return "Shuffle";
  if (state.phase === "resolution") {
    // For split hands, show net result
    if (state.splitHands.length > 0) {
      const totalPayout = state.splitHands.reduce(
        (sum, h) => sum + h.payout,
        0,
      );
      if (totalPayout > 0) return `✦ +${totalPayout} ✦`;
      if (totalPayout < 0) return `${totalPayout}`;
      return "Push";
    }
    const outcome = state.currentHand?.outcome;
    if (!outcome) return "";
    const map: Record<string, string> = {
      win: "✦ You Win ✦",
      lose: "Dealer Wins",
      push: "Push",
      blackjack: "✦ Blackjack ✦",
      surrender: "Surrendered",
      bust: "Bust",
    };
    return map[outcome] ?? "";
  }
  return "";
}
