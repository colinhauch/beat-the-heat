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
  const { playerStack, pendingBet, session } = state
  const { minBet, maxBet } = session.tableRules
  const [customInput, setCustomInput] = useState('')
  const [hasSelectedBet, setHasSelectedBet] = useState(false)

  const setBet = (amount: number) => {
    const clamped = Math.max(minBet, Math.min(amount, playerStack, maxBet))
    dispatch({ type: 'SET_BET', amount: clamped })
    setCustomInput('')
  }

  const handleChipClick = (chipValue: number) => {
    if (!hasSelectedBet) {
      // First chip click: set bet to chip value
      setBet(chipValue)
      setHasSelectedBet(true)
    } else {
      // Subsequent clicks: add to current bet
      setBet(pendingBet + chipValue)
    }
  }

  const handleMinBet = () => {
    setBet(minBet)
    setHasSelectedBet(false)
  }

  const handleCustom = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomInput(e.target.value)
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val > 0) {
      dispatch({ type: 'SET_BET', amount: Math.min(val, playerStack, maxBet) })
      setHasSelectedBet(true)
    }
  }

  const handleDeal = () => {
    if (pendingBet > 0 && pendingBet <= playerStack) {
      dispatch({ type: 'DEAL' })
    }
  }

  return (
    <div className="betting-panel">
      <div className="bet-chips-row">
        {QUICK_BETS.map(({ value, color }) => (
          <button
            key={value}
            className={`chip-btn chip-btn--${color}`}
            onClick={() => handleChipClick(value)}
            disabled={value > playerStack}
          >
            <span className="chip-value mono">{value}</span>
          </button>
        ))}
      </div>

      <div className="bet-controls-row">
        <input
          type="number"
          className="bet-custom-input mono"
          placeholder="Custom"
          value={customInput}
          min={minBet}
          max={Math.min(playerStack, maxBet)}
          onChange={handleCustom}
        />
        <button
          className="bet-action-btn bet-action-btn--secondary mono"
          onClick={handleMinBet}
        >
          Min
        </button>
        <button
          className="bet-action-btn bet-action-btn--primary serif"
          onClick={handleDeal}
          disabled={pendingBet <= 0 || pendingBet > playerStack}
        >
          Deal
        </button>
      </div>
    </div>
  )
}
