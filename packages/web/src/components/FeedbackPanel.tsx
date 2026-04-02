import { useGame } from '../game/GameContext'
import { PlayerAction } from '@beat-the-heat/shared'
import './FeedbackPanel.css'

const ACTION_LABELS: Record<PlayerAction, string> = {
  hit: 'Hit',
  stand: 'Stand',
  double: 'Double',
  split: 'Split',
  surrender: 'Surrender',
}

const OUTCOME_MESSAGES: Record<string, { label: string; cls: string }> = {
  win:       { label: 'You Win',    cls: 'outcome--win' },
  lose:      { label: 'Dealer Wins', cls: 'outcome--lose' },
  push:      { label: 'Push',       cls: 'outcome--push' },
  blackjack: { label: 'Blackjack!', cls: 'outcome--blackjack' },
  surrender: { label: 'Surrendered', cls: 'outcome--surrender' },
  bust:      { label: 'Bust',       cls: 'outcome--bust' },
}

export function FeedbackPanel() {
  const { state } = useGame()
  const { feedback, currentHand, phase, session } = state

  const completedHands = session.hands.filter(h => h.outcome !== null)

  return (
    <div className="feedback-panel">
      {/* Title */}
      <div className="fp-header">
        <span className="fp-title serif">Strategy Coach</span>
        <div className="ornament-line" />
      </div>

      {/* Current Decision Feedback */}
      <div className="fp-section">
        <div className="fp-section-label mono">Last Decision</div>
        {feedback ? (
          <div className={`fp-decision ${feedback.isCorrect === true ? 'fp-decision--correct' : feedback.isCorrect === false ? 'fp-decision--wrong' : 'fp-decision--neutral'}`}>
            <div className="fp-row">
              <span className="fp-key mono">You</span>
              <span className="fp-value mono">{ACTION_LABELS[feedback.playerAction]}</span>
            </div>
            <div className="fp-row">
              <span className="fp-key mono">Basic Strategy</span>
              <span className="fp-value mono">
                {feedback.recommended ? ACTION_LABELS[feedback.recommended] : '—'}
              </span>
            </div>
            <div className="fp-verdict">
              {feedback.isCorrect === true && <span className="verdict verdict--correct mono">✓ Correct</span>}
              {feedback.isCorrect === false && <span className="verdict verdict--wrong mono">✗ Incorrect</span>}
              {feedback.isCorrect === null && <span className="verdict verdict--neutral mono">No recommendation</span>}
            </div>
          </div>
        ) : (
          <div className="fp-empty mono">—</div>
        )}
      </div>

      <div className="ornament-line" />

      {/* Hand Outcome */}
      <div className="fp-section">
        <div className="fp-section-label mono">Hand Result</div>
        {phase === 'resolution' && currentHand?.outcome ? (
          <div className="fp-outcome-area">
            <div className={`fp-outcome ${OUTCOME_MESSAGES[currentHand.outcome]?.cls ?? ''}`}>
              {OUTCOME_MESSAGES[currentHand.outcome]?.label ?? currentHand.outcome}
            </div>
            <div className="fp-payout mono">
              {currentHand.payout >= 0 ? '+' : ''}{currentHand.payout} chips
            </div>
          </div>
        ) : (
          <div className="fp-empty mono">—</div>
        )}
      </div>

      <div className="ornament-line" />

      {/* Session History */}
      <div className="fp-section fp-section--history">
        <div className="fp-section-label mono">Session</div>
        <div className="fp-history-list">
          {completedHands.length === 0 && (
            <div className="fp-empty mono">No hands yet</div>
          )}
          {completedHands.slice(-8).reverse().map((hand, i) => {
            const isWin = hand.outcome === 'win' || hand.outcome === 'blackjack'
            const isLose = hand.outcome === 'lose' || hand.outcome === 'bust'
            return (
              <div key={hand.handId} className={`fp-history-row ${i === 0 ? 'fp-history-row--latest' : ''}`}>
                <span className="mono" style={{
                  color: isWin ? 'var(--correct-glow)' : isLose ? 'var(--wrong-glow)' : 'var(--text-dim)',
                  fontSize: '0.72rem',
                  letterSpacing: '0.05em',
                }}>
                  {hand.outcome === 'win' ? '✓ Win' :
                   hand.outcome === 'blackjack' ? '✦ BJ' :
                   hand.outcome === 'push' ? '· Push' :
                   hand.outcome === 'lose' ? '✗ Lose' :
                   hand.outcome === 'bust' ? '✗ Bust' :
                   hand.outcome === 'surrender' ? '↩ Sur.' : hand.outcome}
                </span>
                <span className="mono" style={{
                  fontSize: '0.72rem',
                  color: hand.payout >= 0 ? 'var(--correct-glow)' : 'var(--wrong-glow)',
                  marginLeft: 'auto',
                }}>
                  {hand.payout >= 0 ? '+' : ''}{hand.payout}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
