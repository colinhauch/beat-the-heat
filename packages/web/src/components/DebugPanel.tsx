import { useState } from "react";
import { Card, Rank } from "@beat-the-heat/shared";
import { useGame } from "../game/GameContext";
import "./DebugPanel.css";

const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

function makeCard(rank: Rank): Card {
  return { rank, suit: "♠" };
}

export function DebugPanel() {
  const { state, dispatch } = useGame();
  const [p1, setP1] = useState<Rank>("A");
  const [p2, setP2] = useState<Rank>("6");
  const [d1, setD1] = useState<Rank>("10");
  const [d2, setD2] = useState<Rank>("7");

  const nextCard = state.shoe[state.cardsDealt];

  function handleSetHand() {
    dispatch({
      type: "SET_DEBUG_HAND",
      playerCards: [makeCard(p1), makeCard(p2)],
      dealerCards: [makeCard(d1), makeCard(d2)],
    });
  }

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <span className="debug-title mono">Debug</span>
      </div>

      <div className="debug-next-card">
        <span className="debug-label mono">Next Card</span>
        <span className="debug-card-value mono">
          {nextCard ? `${nextCard.rank}${nextCard.suit}` : "—"}
        </span>
      </div>

      <div className="debug-grid">
        <label className="debug-label mono">Player 1</label>
        <select
          className="debug-select mono"
          value={p1}
          onChange={(e) => setP1(e.target.value as Rank)}
        >
          {RANKS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <label className="debug-label mono">Player 2</label>
        <select
          className="debug-select mono"
          value={p2}
          onChange={(e) => setP2(e.target.value as Rank)}
        >
          {RANKS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <label className="debug-label mono">Dealer Up</label>
        <select
          className="debug-select mono"
          value={d1}
          onChange={(e) => setD1(e.target.value as Rank)}
        >
          {RANKS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <label className="debug-label mono">Dealer Hole</label>
        <select
          className="debug-select mono"
          value={d2}
          onChange={(e) => setD2(e.target.value as Rank)}
        >
          {RANKS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <button className="debug-btn mono" onClick={handleSetHand}>
        Set Hand
      </button>
    </div>
  );
}
