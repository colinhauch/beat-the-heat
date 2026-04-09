import { useCareer } from '../career/CareerContext'
import './StoryDialogue.css'

export function StoryDialogue() {
  const { state, advanceDialogue, skipDialogue } = useCareer()
  const { activeDialogue, dialogueIndex } = state

  if (!activeDialogue) return null

  const currentLine = activeDialogue.lines[dialogueIndex]
  const isLastLine = dialogueIndex === activeDialogue.lines.length - 1
  const isNarrator = currentLine.speaker === 'NARRATOR'

  return (
    <div className="dialogue-overlay" onClick={advanceDialogue}>
      <div className="dialogue-container">
        {/* Skip button */}
        <button
          className="dialogue-skip mono"
          onClick={(e) => {
            e.stopPropagation()
            skipDialogue()
          }}
        >
          Skip ▸▸
        </button>

        {/* Portrait (if character has one) */}
        {!isNarrator && currentLine.portrait && (
          <div className="dialogue-portrait">
            <div className="portrait-frame">
              {currentLine.portrait === 'pit-boss' && (
                <span className="portrait-emoji">👔</span>
              )}
              {currentLine.portrait === 'mentor' && (
                <span className="portrait-emoji">🎩</span>
              )}
            </div>
          </div>
        )}

        {/* Dialogue box */}
        <div className={`dialogue-box ${isNarrator ? 'dialogue-box--narrator' : ''}`}>
          {/* Speaker name */}
          {!isNarrator && (
            <div className="dialogue-speaker mono">{currentLine.speaker}</div>
          )}

          {/* Text */}
          <p className={`dialogue-text ${isNarrator ? 'dialogue-text--narrator' : ''}`}>
            {currentLine.text}
          </p>

          {/* Continue indicator */}
          <div className="dialogue-continue mono">
            {isLastLine ? '[ Click to continue ]' : '[ Click for next ▸ ]'}
          </div>
        </div>

        {/* Progress dots */}
        <div className="dialogue-progress">
          {activeDialogue.lines.map((_, i) => (
            <div
              key={i}
              className={`progress-dot ${i === dialogueIndex ? 'progress-dot--active' : ''} ${i < dialogueIndex ? 'progress-dot--done' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
