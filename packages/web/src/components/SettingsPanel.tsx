import { useState } from 'react'
import { useGame } from '../game/GameContext'
import { TableRules } from '@beat-the-heat/shared'
import './SettingsPanel.css'

export function SettingsPanel() {
  const { state, dispatch } = useGame()
  const activeRules = state.session.tableRules
  const [pendingRules, setPendingRules] = useState<TableRules>(activeRules)

  function updatePendingRule<K extends keyof TableRules>(key: K, value: TableRules[K]) {
    setPendingRules(prev => ({ ...prev, [key]: value }))
  }

  function activateRules() {
    dispatch({
      type: 'CHANGE_RULES',
      rules: pendingRules,
    })
  }

  // Check if pending rules differ from active rules
  const hasChanges =
    pendingRules.dealerHitsSoft17 !== activeRules.dealerHitsSoft17 ||
    pendingRules.doubleAfterSplit !== activeRules.doubleAfterSplit ||
    pendingRules.surrenderAllowed !== activeRules.surrenderAllowed ||
    pendingRules.blackjackPayout !== activeRules.blackjackPayout ||
    pendingRules.decks !== activeRules.decks ||
    pendingRules.minBet !== activeRules.minBet ||
    pendingRules.maxBet !== activeRules.maxBet

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <span className="settings-title mono">Table Rules</span>
      </div>

      <div className="settings-grid">
        {/* Min Bet */}
        <label className="settings-label mono">Min Bet</label>
        <input
          type="number"
          className="settings-input mono"
          value={pendingRules.minBet}
          min={1}
          onChange={e => updatePendingRule('minBet', parseInt(e.target.value))}
        />
        {/* Max Bet */}
        <label className="settings-label mono">Max Bet</label>
        <input
          type="number"
          className="settings-input mono"
          value={pendingRules.maxBet}
          min={1}
          onChange={e => updatePendingRule('maxBet', parseInt(e.target.value))}
        />

        {/* Dealer Soft 17 */}
        <label className="settings-label mono">Dealer Soft 17</label>
        <select
          className="settings-select mono"
          value={pendingRules.dealerHitsSoft17 ? 'H17' : 'S17'}
          onChange={e => updatePendingRule('dealerHitsSoft17', e.target.value === 'H17')}
        >
          <option value="S17">Stands (S17)</option>
          <option value="H17">Hits (H17)</option>
        </select>

        {/* Double After Split */}
        <label className="settings-label mono">Double After Split</label>
        <select
          className="settings-select mono"
          value={pendingRules.doubleAfterSplit ? 'yes' : 'no'}
          onChange={e => updatePendingRule('doubleAfterSplit', e.target.value === 'yes')}
        >
          <option value="yes">Allowed</option>
          <option value="no">Not Allowed</option>
        </select>

        {/* Surrender */}
        <label className="settings-label mono">Surrender</label>
        <select
          className="settings-select mono"
          value={pendingRules.surrenderAllowed ? 'yes' : 'no'}
          onChange={e => updatePendingRule('surrenderAllowed', e.target.value === 'yes')}
        >
          <option value="yes">Allowed</option>
          <option value="no">Not Allowed</option>
        </select>

        {/* Blackjack Payout */}
        <label className="settings-label mono">Blackjack Pays</label>
        <select
          className="settings-select mono"
          value={pendingRules.blackjackPayout}
          onChange={e => updatePendingRule('blackjackPayout', e.target.value as '3:2' | '6:5')}
        >
          <option value="3:2">3:2</option>
          <option value="6:5">6:5</option>
        </select>

        {/* Decks */}
        <label className="settings-label mono">Decks</label>
        <select
          className="settings-select mono"
          value={pendingRules.decks}
          onChange={e => updatePendingRule('decks', parseInt(e.target.value))}
        >
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="4">4</option>
          <option value="6">6</option>
          <option value="8">8</option>
        </select>
      </div>

      <button
        className={`settings-btn mono ${hasChanges ? 'settings-btn--active' : ''}`}
        onClick={activateRules}
        disabled={!hasChanges}
      >
        {hasChanges ? 'Activate Rules' : 'Rules Active'}
      </button>

      {hasChanges && (
        <div className="settings-note mono">
          Activating will reset session
        </div>
      )}
    </div>
  )
}
