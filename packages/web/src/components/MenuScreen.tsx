import './MenuScreen.css'

export type GameMode = 'menu' | 'career' | 'practice' | 'debug'

interface MenuScreenProps {
  onSelectMode: (mode: GameMode) => void
}

export function MenuScreen({ onSelectMode }: MenuScreenProps) {
  return (
    <div className="menu-screen">
      {/* Ambient glow effects */}
      <div className="menu-glow menu-glow--left" />
      <div className="menu-glow menu-glow--right" />

      <div className="menu-content">
        {/* Logo / Title */}
        <div className="menu-header">
          <div className="menu-ornament">♠ ♥ ♦ ♣</div>
          <h1 className="menu-title">Beat the Heat</h1>
          <p className="menu-subtitle">Master Basic Strategy</p>
        </div>

        {/* Card decorations */}
        <div className="menu-cards">
          <div className="menu-card menu-card--left">A<span>♠</span></div>
          <div className="menu-card menu-card--right">K<span>♥</span></div>
        </div>

        {/* Menu buttons */}
        <nav className="menu-nav">
          <button
            className="menu-btn menu-btn--primary"
            onClick={() => onSelectMode('career')}
          >
            <span className="menu-btn-label">Career</span>
            <span className="menu-btn-desc">Begin your card counting journey</span>
          </button>

          <button
            className="menu-btn menu-btn--primary"
            onClick={() => onSelectMode('practice')}
          >
            <span className="menu-btn-label">Practice</span>
            <span className="menu-btn-desc">Train with decision feedback</span>
          </button>

          <button
            className="menu-btn menu-btn--secondary"
            onClick={() => onSelectMode('debug')}
          >
            <span className="menu-btn-label">Debug</span>
            <span className="menu-btn-desc">All panels visible</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="menu-footer">
          <span className="menu-footer-text">Learn to count cards & play perfect basic strategy</span>
        </div>
      </div>
    </div>
  )
}
