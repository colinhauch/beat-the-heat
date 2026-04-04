import { Card } from '@beat-the-heat/shared'
import './CardDisplay.css'

interface CardDisplayProps {
  card: Card | null   // null = face down
  size?: 'normal' | 'small'
  flip?: boolean      // play flip animation (face-down → face-up reveal)
}

const RED_SUITS = new Set(['♥', '♦'])

export function CardDisplay({ card, size = 'normal', flip = false }: CardDisplayProps) {
  if (card === null) {
    return (
      <div className={`card card--back card--${size}`} aria-label="Face-down card">
        <div className="card-back-pattern">
          <div className="card-back-inner">✦</div>
        </div>
      </div>
    )
  }

  const isRed = RED_SUITS.has(card.suit)
  const colorClass = isRed ? 'card--red' : 'card--black'
  const flipClass = flip ? 'card--flip' : ''

  return (
    <div className={`card card--face ${colorClass} card--${size} ${flipClass}`} aria-label={`${card.rank}${card.suit}`}>
      <div className="card-corner card-corner--tl">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit">{card.suit}</span>
      </div>
      <div className="card-center-suit">{card.suit}</div>
      <div className="card-corner card-corner--br">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit">{card.suit}</span>
      </div>
    </div>
  )
}
