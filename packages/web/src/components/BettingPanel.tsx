import { useState } from 'react'
import { useGame } from '../game/GameContext'
import './BettingPanel.css'

const QUICK_BETS = [10, 25, 50, 100]

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
        {QUICK_BETS.map(amt => (
          <button
            key={amt}
            className={`chip-btn ${pendingBet === amt ? 'chip-btn--active' : ''}`}
            onClick={() => setBet(amt)}
            disabled={amt > playerStack}
          >
            <span className="chip-value mono">{amt}</span>
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
    </div>
  )
}
