import { useRef, useLayoutEffect } from 'react'
import { useGame } from '../game/GameContext'
import { PlayerAction, getStrategyForRules, evaluateHand, isPair } from '@beat-the-heat/shared'
import { evaluateDecision } from '../game/analytics'
import './FeedbackPanel.css'

const ACTION_LABELS: Record<PlayerAction, string> = {
  hit: 'Hit',
  stand: 'Stand',
  double: 'Dbl',
  split: 'Split',
  surrender: 'Sur',
}

function dealerValue(rank: string): string {
  return (rank === 'J' || rank === 'Q' || rank === 'K') ? '10' : rank
}

function formatTotal(total: number, isSoft: boolean, pairFlag: boolean): string {
  if (pairFlag) return `${total / 2}s`
  if (isSoft) return `A+${total - 11}`
  return `${total}`
}

const OUTCOME_MESSAGES: Record<string, { label: string; cls: string }> = {
  win:       { label: 'You Win',    cls: 'outcome--win' },
  lose:      { label: 'Dealer Wins', cls: 'outcome--lose' },
  push:      { label: 'Push',       cls: 'outcome--push' },
  blackjack: { label: 'Blackjack!', cls: 'outcome--blackjack' },
  surrender: { label: 'Surrendered', cls: 'outcome--surrender' },
  bust:      { label: 'Bust',       cls: 'outcome--bust' },
}

const FLIP_DURATION = 220

export function FeedbackPanel() {
  const { state } = useGame()
  const { feedback, currentHand, phase, session } = state

  const strategy = getStrategyForRules(session.tableRules)
  const completedHands = session.hands.filter(h => h.outcome !== null)

  const isActive = phase === 'playerTurn' && currentHand !== null
  let pendingTotal = ''
  let pendingDealer = ''
  if (isActive && currentHand) {
    const cards = currentHand.decisions.length === 0
      ? currentHand.playerCards
      : currentHand.decisions[currentHand.decisions.length - 1].tableState.playerHand
    const ev = evaluateHand(cards)
    const pair = isPair(cards)
    const dealerUpcard = currentHand.dealerCards[0]
    pendingTotal = formatTotal(ev.total, ev.isSoft, pair)
    pendingDealer = dealerUpcard ? dealerValue(dealerUpcard.rank) : '?'
  }

  const recentCompleted = completedHands.slice(-10).reverse()

  // ── FLIP animation on the history body ──────────────────────────────────────
  // Before each render, snapshot every row's position by its key.
  // After the render, diff old vs new positions and animate the delta.
  const historyRef = useRef<HTMLDivElement>(null)

  // Snapshot BEFORE render (called on the previous DOM)
  const snapshotPositions = () => {
    const map = new Map<string, number>()
    const container = historyRef.current
    if (!container) return map
    container.querySelectorAll<HTMLElement>('[data-flip-key]').forEach(el => {
      map.set(el.dataset.flipKey!, el.getBoundingClientRect().top)
    })
    return map
  }

  // We need to snapshot BEFORE the upcoming render. useLayoutEffect runs after,
  // so we snapshot at render time into a ref that useLayoutEffect then consumes.
  const preSnapRef = useRef<Map<string, number>>(new Map())
  // Capture synchronously during render (safe — just reads DOM, no writes)
  preSnapRef.current = snapshotPositions()

  useLayoutEffect(() => {
    const container = historyRef.current
    if (!container) return
    const pre = preSnapRef.current

    container.querySelectorAll<HTMLElement>('[data-flip-key]').forEach(el => {
      const key = el.dataset.flipKey!
      const oldTop = pre.get(key)
      if (oldTop === undefined) return  // new element — let CSS enter animation handle it
      const newTop = el.getBoundingClientRect().top
      const delta = oldTop - newTop
      if (Math.abs(delta) < 0.5) return  // didn't move
      el.animate(
        [{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }],
        { duration: FLIP_DURATION, easing: 'ease-out', fill: 'none' },
      )
    })
  })

  return (
    <div className="feedback-panel">
      {/* Title */}
      <div className="fp-header">
        <span className="fp-title serif">Strategy Coach</span>
        <div className="ornament-line" />
      </div>

      {/* Current Decision Feedback */}
      <div className="fp-section fp-section--decision">
        <div className="fp-section-label mono">Last Decision</div>
        {feedback ? (
          <div className={`fp-decision ${feedback.isCorrect === true ? 'fp-decision--correct' : feedback.isCorrect === false ? 'fp-decision--wrong' : 'fp-decision--neutral'}`}>
            <div className="fp-row">
              <span className="fp-key mono">You</span>
              <span className="fp-value mono">{ACTION_LABELS[feedback.playerAction]}</span>
            </div>
            <div className="fp-row">
              <span className="fp-key mono">{strategy.name}</span>
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
      <div className="fp-section fp-section--outcome">
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

      {/* Session Decision Table */}
      <div className="fp-section fp-section--history">
        <div className="fp-section-label mono">Session</div>
        <div className="fp-decision-table">
          <div className="fp-dt-header">
            <span>Player</span>
            <span>Dealer</span>
            <span>Correct</span>
            <span>Played</span>
          </div>

          {/* Permanent active row — always mounted, shows dashes when idle */}
          <div className="fp-dt-active-row">
            <div
              key={currentHand?.handId}
              className={`fp-dt-row ${isActive ? 'fp-dt-row--pending fp-dt-fade-in' : 'fp-dt-row--idle'}`}
            >
              <span>{pendingTotal || '—'}</span>
              <span>{pendingDealer || '—'}</span>
              <span>—</span>
              <span className="fp-dt-pending-action">{isActive ? '…' : '—'}</span>
            </div>
          </div>

          {/* History body — all decision rows live here permanently, FLIP-animated */}
          <div className="fp-dt-history" ref={historyRef}>
            {(() => {
              // Build a unified flat list of all hands to render, newest first.
              // Active hand (if any) comes first, then completed hands.
              // Rows never move between DOM parents — keys stay stable across hand completion.
              const handsToRender: { hand: typeof recentCompleted[0], isCurrentHand: boolean }[] = []
              // Always include currentHand while it exists — covers playerTurn, dealerTurn, resolution
              if (currentHand) handsToRender.push({ hand: currentHand, isCurrentHand: isActive })
              for (const h of recentCompleted) {
                if (h.handId !== currentHand?.handId) handsToRender.push({ hand: h, isCurrentHand: false })
              }

              const renderable = handsToRender.filter(({ hand, isCurrentHand }) =>
                // Skip active hand until it has at least one decision
                !(isCurrentHand && hand.decisions.length === 0)
              )

              return renderable.map(({ hand, isCurrentHand }, hi) => {
                const results = hand.decisions.map(d =>
                  evaluateDecision(d, strategy, session.tableRules)
                )
                return (
                  <div
                    key={hand.handId}
                    className={`fp-dt-hand ${hi > 0 ? 'fp-dt-hand--separator' : ''}`}
                  >
                    {results.length === 0 && !isCurrentHand && (
                      <div
                        data-flip-key={`${hand.handId}-bj`}
                        className="fp-dt-row fp-dt-row--neutral fp-dt-row-enter"
                      >
                        <span>BJ</span>
                        <span>{hand.dealerCards[0] ? dealerValue(hand.dealerCards[0].rank) : '?'}</span>
                        <span>—</span>
                        <span>—</span>
                      </div>
                    )}
                    {results.length > 0 && [...results].reverse().map((r, ri) => {
                      const di = results.length - 1 - ri
                      const preHand = di === 0
                        ? hand.playerCards
                        : hand.decisions[di - 1].tableState.playerHand
                      const preEval = evaluateHand(preHand)
                      const ts = r.decision.tableState
                      const correct = r.isCorrect === true
                      const wrong = r.isCorrect === false
                      const flipKey = `${hand.handId}-${di}`
                      // New row (ri===0 on the active hand) gets enter animation;
                      // existing rows just get FLIP-translated by useLayoutEffect
                      const isNew = isCurrentHand && ri === 0
                      return (
                        <div
                          key={flipKey}
                          data-flip-key={flipKey}
                          className={`fp-dt-row ${isNew ? 'fp-dt-row-enter' : ''} ${correct ? 'fp-dt-row--correct' : wrong ? 'fp-dt-row--wrong' : 'fp-dt-row--neutral'}`}
                        >
                          <span>{formatTotal(preEval.total, preEval.isSoft, ts.isPair)}</span>
                          <span>{dealerValue(ts.dealerUpcard.rank)}</span>
                          <span>{r.recommended ? ACTION_LABELS[r.recommended] : '—'}</span>
                          <span>{ACTION_LABELS[r.decision.playerAction]}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
