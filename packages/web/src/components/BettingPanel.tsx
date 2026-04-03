import { useState } from 'react'
import { useGame } from '../game/GameContext'
import './BettingPanel.css'

const QUICK_BETS = [
  { value: 5, color: 'red' },
  { value: 25, color: 'green' },
  { value: 50, color: 'blue' },
  { value: 100, color: 'black' },
]

export function BettingPanel() {
  const { state, dispatch } = useGame()
  const { playerStack, pendingBet } = state
  const [customInput, setCustomInput] = useState('')

  const setBet = (amount: number) => {
    const clamped = Math.max(1, Math.min(amount, playerStack))
    dispatch({ type: 'SET_BET', amount: clamped })
    setCustomInput('')
  }

  const handleCustom = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomInput(e.target.value)
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val > 0) {
      dispatch({ type: 'SET_BET', amount: Math.min(val, playerStack) })
    }
  }

  const handleDeal = () => {
    if (pendingBet > 0 && pendingBet <= playerStack) {
      dispatch({ type: 'DEAL' })
    }
  }

  return (
    <div className="betting-panel">
      <div className="bet-quick-row">
        {QUICK_BETS.map(({ value, color }) => (
          <button
            key={value}
            className={`chip-btn chip-btn--${color} ${pendingBet === value ? 'chip-btn--active' : ''}`}
            onClick={() => setBet(pendingBet + value)}
            disabled={value > playerStack}
          >
            <span className="chip-value mono">{value}</span>
          </button>
        ))}
        <input
          type="number"
          className="bet-custom-input mono"
          placeholder="Custom"
          value={customInput}
          min={1}
          max={playerStack}
          onChange={handleCustom}
        />
      </div>

      <div className="bet-summary mono">
        Bet: <span className="bet-highlight">{pendingBet}</span>
        &nbsp;·&nbsp;
        Stack: <span className="stack-highlight">{playerStack}</span>
      </div>

      <button
        className="deal-btn serif"
        onClick={handleDeal}
        disabled={pendingBet <= 0 || pendingBet > playerStack}
      >
        Deal
      </button>
            <button
        className="deal-btn serif"
        onClick={() => setBet(5)}
        disabled={pendingBet <= 0 || pendingBet > playerStack}
      >
        Reset Bet
      </button>
    </div>
  )
}
