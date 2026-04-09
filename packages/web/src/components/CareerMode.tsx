import { useState, useEffect } from 'react'
import { DEFAULT_TABLE_RULES, TableRules } from '@beat-the-heat/shared'
import { useCareer } from '../career/CareerContext'
import { getLevelById, LEVELS } from '../career/levels'
import { getAvailableShopItems, getShopItemById } from '../career/shop'
import { StoryDialogue } from './StoryDialogue'
import { GameProvider } from '../game/GameContext'
import { Table } from './Table'
import { StatsHUD } from './StatsHUD'
import { RulesFooter } from './RulesFooter'
import './CareerMode.css'

type CareerView = 'hub' | 'playing' | 'shop'

interface CareerModeProps {
  onBackToMenu: () => void
}

export function CareerMode({ onBackToMenu }: CareerModeProps) {
  const { state, startLevel, completeLevel, failLevel, exitLevel, recordHand, recordDecision, purchaseItem } = useCareer()
  const [view, setView] = useState<CareerView>('hub')

  // Get current level if in progress
  const currentLevel = state.currentLevelId ? getLevelById(state.currentLevelId) : null

  // Clear invalid currentLevelId (e.g., from old localStorage data)
  useEffect(() => {
    if (state.currentLevelId && !currentLevel) {
      exitLevel()
    }
  }, [state.currentLevelId, currentLevel, exitLevel])

  // Build table rules from current level
  const getTableRules = (): TableRules => {
    if (!currentLevel) return DEFAULT_TABLE_RULES
    return { ...DEFAULT_TABLE_RULES, ...currentLevel.tableRules }
  }

  // Handle level start
  const handleStartLevel = (levelId: string) => {
    startLevel(levelId)
    // View will switch to 'playing' after dialogue ends
  }

  // Handle level completion check (called from game)
  const handleChipsUpdate = (chips: number) => {
    if (!currentLevel) return
    
    // Check win condition for chips-based goals
    if (currentLevel.goal.type === 'chips' && chips >= currentLevel.goal.target) {
      completeLevel(chips)
      setView('hub')
    }
    
    // Check loss condition (out of chips or below min bet) - only for chip goals
    if (currentLevel.goal.type === 'chips') {
      const rules = getTableRules()
      if (chips < rules.minBet) {
        failLevel()
        setView('hub')
      }
    }
  }

  // Handle hand completion (called from game when a hand finishes)
  const handleHandComplete = (won: boolean) => {
    if (!currentLevel) return
    
    recordHand(won)
    
    // Check hands-played goal (check stats after recording)
    if (currentLevel.goal.type === 'hands-played') {
      const handsAfter = (state.currentLevelStats?.handsPlayed ?? 0) + 1
      if (handsAfter >= currentLevel.goal.target) {
        // Calculate final accuracy
        const totalDecisions = (state.currentLevelStats?.totalDecisions ?? 0)
        const correctDecisions = (state.currentLevelStats?.correctDecisions ?? 0)
        const accuracy = totalDecisions > 0 ? (correctDecisions / totalDecisions) * 100 : 0
        
        // Small delay to let the state update, then check result
        setTimeout(() => {
          if (currentLevel.minimumAccuracy && accuracy < currentLevel.minimumAccuracy) {
            // Failed accuracy requirement
            failLevel()
          } else {
            // Passed!
            completeLevel(0) // chips don't matter for training
          }
          setView('hub')
        }, 500)
      }
    }
  }

  // Handle decision tracking (called from game when player makes a decision)
  const handleDecision = (situation: string, playerAction: string, correctAction: string, isCorrect: boolean) => {
    recordDecision(situation, playerAction, correctAction, isCorrect)
  }

  // Handle exiting level
  const handleExitLevel = () => {
    exitLevel()
    setView('hub')
  }

  // Get completed level IDs for shop unlocks
  const completedLevelIds = Object.entries(state.levelProgress)
    .filter(([_, progress]) => progress.status === 'completed')
    .map(([id]) => id)

  // Available shop items
  const shopItems = getAvailableShopItems(completedLevelIds, state.purchasedItems)

  // If dialogue is active, show it on top of everything
  const showDialogue = state.activeDialogue !== null

  // Watch for dialogue ending - transition to playing view after intro dialogue
  useEffect(() => {
    if (!showDialogue && state.currentLevelId && currentLevel && view === 'hub') {
      // Dialogue just ended after starting level
      setView('playing')
    }
  }, [showDialogue, state.currentLevelId, currentLevel, view])

  return (
    <div className="career-mode">
      {/* Story Dialogue Overlay */}
      {showDialogue && <StoryDialogue />}

      {/* Hub View - Level Select & Shop */}
      {view === 'hub' && !showDialogue && (
        <div className="career-hub">
          <header className="career-header">
            <button className="menu-back-btn mono" onClick={onBackToMenu}>
              ← Menu
            </button>
            <h1 className="career-title">Career Mode</h1>
            <div className="career-chips mono">
              <span className="chips-label">Chips:</span>
              <span className="chips-value">{state.currentChips.toLocaleString()}</span>
            </div>
          </header>

          <div className="career-content">
            {/* Level Select */}
            <section className="career-section">
              <h2 className="section-title">Levels</h2>
              <div className="levels-grid">
                {LEVELS.map((level) => {
                  const progress = state.levelProgress[level.id]
                  const isLocked = progress?.status === 'locked'
                  const isCompleted = progress?.status === 'completed'

                  return (
                    <button
                      key={level.id}
                      className={`level-card ${isLocked ? 'level-card--locked' : ''} ${isCompleted ? 'level-card--completed' : ''}`}
                      onClick={() => !isLocked && handleStartLevel(level.id)}
                      disabled={isLocked}
                    >
                      <div className="level-status">
                        {isCompleted && <span className="status-badge status-badge--complete">✓</span>}
                        {isLocked && <span className="status-badge status-badge--locked">🔒</span>}
                      </div>
                      <h3 className="level-name">{level.name}</h3>
                      <p className="level-desc mono">{level.description}</p>
                      <div className="level-goal mono">
                        <span className="goal-label">Goal:</span> {level.goal.description}
                      </div>
                      <div className="level-meta mono">
                        <span className="difficulty difficulty--{level.difficulty}">{level.difficulty}</span>
                        {isCompleted && progress?.bestChips && (
                          <span className="best-chips">Best: {progress.bestChips}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Shop */}
            <section className="career-section">
              <div className="section-header">
                <h2 className="section-title">Shop</h2>
                <button
                  className="shop-toggle mono"
                  onClick={() => setView('shop')}
                >
                  View All →
                </button>
              </div>
              {shopItems.length === 0 ? (
                <p className="shop-empty mono">Complete levels to unlock items</p>
              ) : (
                <div className="shop-preview">
                  {shopItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="shop-item-preview">
                      <span className="item-icon">{item.icon}</span>
                      <span className="item-name">{item.name}</span>
                      <span className="item-cost mono">{item.cost}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Shop View */}
      {view === 'shop' && !showDialogue && (
        <div className="career-shop">
          <header className="career-header">
            <button className="menu-back-btn mono" onClick={() => setView('hub')}>
              ← Back
            </button>
            <h1 className="career-title">Shop</h1>
            <div className="career-chips mono">
              <span className="chips-label">Chips:</span>
              <span className="chips-value">{state.currentChips.toLocaleString()}</span>
            </div>
          </header>

          <div className="shop-content">
            {shopItems.length === 0 ? (
              <p className="shop-empty-full mono">No items available. Complete levels to unlock the shop.</p>
            ) : (
              <div className="shop-grid">
                {shopItems.map((item) => {
                  const canAfford = state.currentChips >= item.cost
                  const purchased = state.purchasedItems[item.id] || 0

                  return (
                    <div key={item.id} className={`shop-card ${!canAfford ? 'shop-card--unaffordable' : ''}`}>
                      <div className="shop-icon">{item.icon}</div>
                      <h3 className="shop-name">{item.name}</h3>
                      <p className="shop-desc">{item.description}</p>
                      <div className="shop-footer">
                        <span className="shop-cost mono">{item.cost} chips</span>
                        {item.maxPurchases > 1 && (
                          <span className="shop-owned mono">{purchased}/{item.maxPurchases}</span>
                        )}
                        <button
                          className="shop-buy mono"
                          onClick={() => purchaseItem(item.id)}
                          disabled={!canAfford}
                        >
                          {canAfford ? 'Buy' : 'Need more chips'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Playing View */}
      {view === 'playing' && currentLevel && !showDialogue && (
        <GameProvider
          tableRules={getTableRules()}
          initialStack={currentLevel.startingChips}
          onChipsChange={handleChipsUpdate}
          onHandComplete={handleHandComplete}
          onDecision={handleDecision}
          key={currentLevel.id}
        >
          <div className="career-game">
            <header className="app-header">
              <button className="menu-back-btn mono" onClick={handleExitLevel}>
                ← Exit Level
              </button>
              <div className="level-info">
                <span className="level-name-small mono">{currentLevel.name}</span>
                <span className="level-goal-small mono">
                  {currentLevel.goal.type === 'hands-played' 
                    ? `Hands: ${state.currentLevelStats?.handsPlayed ?? 0} / ${currentLevel.goal.target}`
                    : currentLevel.goal.description
                  }
                </span>
              </div>
              <div className="stats-slot">
                <StatsHUD />
              </div>
            </header>

            <div className="ornament-line" />

            <main className="app-body">
              <div className="table-area">
                <Table />
              </div>
            </main>

            <RulesFooter />
          </div>
        </GameProvider>
      )}
    </div>
  )
}
