import { useState } from "react";
import { TableRules, DEFAULT_TABLE_RULES } from "@beat-the-heat/shared";
import { GameProvider } from "./game/GameContext";
import { Table } from "./components/Table";
import { StatsHUD } from "./components/StatsHUD";
import { FeedbackPanel } from "./components/FeedbackPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { DebugPanel } from "./components/DebugPanel";
import { RulesFooter } from "./components/RulesFooter";
import { CountPanel } from "./components/CountPanel";
import { CollapsiblePanel } from "./components/CollapsiblePanel";
import { MenuScreen, GameMode } from "./components/MenuScreen";
import { TableSetupModal } from "./components/TableSetupModal";
import { CareerProvider } from "./career/CareerContext";
import { CareerMode } from "./components/CareerMode";
import "./App.css";

type AppScreen = 'menu' | 'setup' | 'game' | 'career'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('menu')
  const [gameMode, setGameMode] = useState<GameMode>('menu')
  const [tableRules, setTableRules] = useState<TableRules>(DEFAULT_TABLE_RULES)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Handle mode selection from menu
  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode)
    if (mode === 'career') {
      setScreen('career')
    } else if (mode === 'practice') {
      setScreen('setup')
    } else if (mode === 'debug') {
      setTableRules(DEFAULT_TABLE_RULES)
      setScreen('game')
    }
  }

  // Handle starting practice with custom rules
  const handleStartPractice = (rules: TableRules) => {
    setTableRules(rules)
    setScreen('game')
  }

  // Return to menu
  const handleBackToMenu = () => {
    setScreen('menu')
    setGameMode('menu')
  }

  // Show menu screen
  if (screen === 'menu') {
    return <MenuScreen onSelectMode={handleSelectMode} />
  }

  // Show career mode
  if (screen === 'career') {
    return (
      <CareerProvider>
        <CareerMode onBackToMenu={handleBackToMenu} />
      </CareerProvider>
    )
  }

  // Show table setup for practice mode
  if (screen === 'setup') {
    return <TableSetupModal onStart={handleStartPractice} onBack={handleBackToMenu} />
  }

  // Game screen with mode-aware panels
  return (
    <GameProvider tableRules={tableRules} key={JSON.stringify(tableRules)}>
      <div className="app-shell">
        {/* Header Rail */}
        <header className="app-header">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <button className="menu-back-btn mono" onClick={handleBackToMenu}>
            ← Menu
          </button>
          <div className="header-ornament">✦</div>
          <h1 className="app-title">Beat the Heat</h1>
          <div className="header-ornament">✦</div>
          <div className="stats-slot">
            <StatsHUD />
          </div>
        </header>

        <div className="ornament-line" />

        {/* Main Content */}
        <main className="app-body">
          <div className="table-area">
            <Table />
          </div>

          {/* Mobile overlay backdrop */}
          <div
            className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar - visibility based on game mode */}
          {gameMode !== 'career' && (
            <aside className={`feedback-rail ${sidebarOpen ? 'open' : ''}`}>
              {gameMode === 'debug' && (
                <CollapsiblePanel title="Shoe Info" defaultExpanded={true}>
                  <CountPanel />
                </CollapsiblePanel>
              )}
              <CollapsiblePanel title="Decision Accuracy" defaultExpanded={true} grow>
                <FeedbackPanel />
              </CollapsiblePanel>
              {gameMode === 'debug' && (
                <>
                  <CollapsiblePanel title="Table Rules" defaultExpanded={false}>
                    <SettingsPanel />
                  </CollapsiblePanel>
                  <CollapsiblePanel title="Debug" defaultExpanded={false}>
                    <DebugPanel />
                  </CollapsiblePanel>
                </>
              )}
            </aside>
          )}
        </main>

        {/* Footer Rail */}
        <RulesFooter />
      </div>
    </GameProvider>
  );
}
