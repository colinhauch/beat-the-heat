import { useGame } from '../game/GameContext'
import { sessionStats } from '../game/analytics'
import { BASIC_STRATEGY } from '@beat-the-heat/shared'
import './StatsHUD.css'

export function StatsHUD() {
  const { state } = useGame()
  const stats = sessionStats(state.session, BASIC_STRATEGY)

  const accuracyPct = stats.totalDecisions > 0
    ? Math.round(stats.accuracy * 100)
    : null

  const netColor = stats.netChips > 0
    ? 'var(--correct-glow)'
    : stats.netChips < 0
    ? 'var(--wrong-glow)'
    : 'var(--text-dim)'

  return (
    <div className="stats-hud">
      <div className="stat-item">
        <span className="stat-label mono">Hands</span>
        <span className="stat-value mono">{stats.handsPlayed}</span>
      </div>
      <div className="stat-divider">·</div>
      <div className="stat-item">
        <span className="stat-label mono">Accuracy</span>
        <span className="stat-value mono">
          {stats.totalDecisions > 0
            ? `${stats.correctDecisions}/${stats.totalDecisions} — ${accuracyPct}%`
            : '—'
          }
        </span>
      </div>
      <div className="stat-divider">·</div>
      <div className="stat-item">
        <span className="stat-label mono">Net</span>
        <span className="stat-value mono" style={{ color: netColor }}>
          {stats.netChips >= 0 ? '+' : ''}{stats.netChips}
        </span>
      </div>
      <div className="stat-divider">·</div>
      <div className="stat-item">
        <span className="stat-label mono">Stack</span>
        <span className="stat-value mono" style={{ color: state.playerStack > 0 ? 'var(--gold-mid)' : 'var(--wrong-glow)' }}>
          {state.playerStack}
        </span>
      </div>
    </div>
  )
}
