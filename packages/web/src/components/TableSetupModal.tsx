import { useState } from 'react'
import { TableRules, DEFAULT_TABLE_RULES } from '@beat-the-heat/shared'
import './TableSetupModal.css'

interface TableSetupModalProps {
  onStart: (rules: TableRules) => void
  onBack: () => void
}

export function TableSetupModal({ onStart, onBack }: TableSetupModalProps) {
  const [rules, setRules] = useState<TableRules>({ ...DEFAULT_TABLE_RULES })

  function updateRule<K extends keyof TableRules>(key: K, value: TableRules[K]) {
    setRules(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="setup-overlay">
      <div className="setup-modal">
        {/* Header */}
        <div className="setup-header">
          <h2 className="setup-title">Table Setup</h2>
          <p className="setup-subtitle mono">Configure your practice session</p>
        </div>

        {/* Rules Grid */}
        <div className="setup-grid">
          {/* Decks */}
          <div className="setup-field">
            <label className="setup-label mono">Decks</label>
            <select
              className="setup-select mono"
              value={rules.decks}
              onChange={e => updateRule('decks', parseInt(e.target.value))}
            >
              <option value="1">1 Deck</option>
              <option value="2">2 Decks</option>
              <option value="4">4 Decks</option>
              <option value="6">6 Decks</option>
              <option value="8">8 Decks</option>
            </select>
          </div>

          {/* Min Bet */}
          <div className="setup-field">
            <label className="setup-label mono">Min Bet</label>
            <input
              type="number"
              className="setup-input mono"
              value={rules.minBet}
              min={1}
              onChange={e => updateRule('minBet', Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          {/* Max Bet */}
          <div className="setup-field">
            <label className="setup-label mono">Max Bet</label>
            <input
              type="number"
              className="setup-input mono"
              value={rules.maxBet}
              min={rules.minBet}
              onChange={e => updateRule('maxBet', Math.max(rules.minBet, parseInt(e.target.value) || rules.minBet))}
            />
          </div>

          {/* Dealer Soft 17 */}
          <div className="setup-field">
            <label className="setup-label mono">Dealer Soft 17</label>
            <select
              className="setup-select mono"
              value={rules.dealerHitsSoft17 ? 'H17' : 'S17'}
              onChange={e => updateRule('dealerHitsSoft17', e.target.value === 'H17')}
            >
              <option value="S17">Stands (S17)</option>
              <option value="H17">Hits (H17)</option>
            </select>
          </div>

          {/* Double After Split */}
          <div className="setup-field">
            <label className="setup-label mono">Double After Split</label>
            <select
              className="setup-select mono"
              value={rules.doubleAfterSplit ? 'yes' : 'no'}
              onChange={e => updateRule('doubleAfterSplit', e.target.value === 'yes')}
            >
              <option value="yes">Allowed</option>
              <option value="no">Not Allowed</option>
            </select>
          </div>

          {/* Surrender */}
          <div className="setup-field">
            <label className="setup-label mono">Surrender</label>
            <select
              className="setup-select mono"
              value={rules.surrenderAllowed ? 'yes' : 'no'}
              onChange={e => updateRule('surrenderAllowed', e.target.value === 'yes')}
            >
              <option value="yes">Allowed</option>
              <option value="no">Not Allowed</option>
            </select>
          </div>

          {/* Blackjack Payout */}
          <div className="setup-field">
            <label className="setup-label mono">Blackjack Pays</label>
            <select
              className="setup-select mono"
              value={rules.blackjackPayout}
              onChange={e => updateRule('blackjackPayout', e.target.value as '3:2' | '6:5')}
            >
              <option value="3:2">3:2</option>
              <option value="6:5">6:5</option>
            </select>
          </div>

          {/* Cut Card */}
          <div className="setup-field">
            <label className="setup-label mono">Cut Card</label>
            <div className="setup-input-group">
              <input
                type="number"
                className="setup-input mono"
                value={+(rules.decks * (1 - rules.cutCardPenetration)).toFixed(1)}
                min={0.5}
                max={rules.decks - 0.5}
                step={0.5}
                onChange={e => updateRule('cutCardPenetration', 1 - parseFloat(e.target.value) / rules.decks)}
              />
              <span className="setup-unit mono">decks behind</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="setup-actions">
          <button className="setup-btn setup-btn--back mono" onClick={onBack}>
            ← Back
          </button>
          <button className="setup-btn setup-btn--start" onClick={() => onStart(rules)}>
            <span className="serif">Start Practice</span>
          </button>
        </div>
      </div>
    </div>
  )
}
