import { useState } from "react";
import { GameProvider } from "./game/GameContext";
import { Table } from "./components/Table";
import { StatsHUD } from "./components/StatsHUD";
import { FeedbackPanel } from "./components/FeedbackPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { DebugPanel } from "./components/DebugPanel";
import { RulesFooter } from "./components/RulesFooter";
import { CountPanel } from "./components/CountPanel";
import { CollapsiblePanel } from "./components/CollapsiblePanel";
import "./App.css";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <GameProvider>
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

          <aside className={`feedback-rail ${sidebarOpen ? 'open' : ''}`}>
            <CollapsiblePanel title="Shoe Info" defaultExpanded={true}>
              <CountPanel />
            </CollapsiblePanel>
            <CollapsiblePanel title="Decision Accuracy" defaultExpanded={true} grow>
              <FeedbackPanel />
            </CollapsiblePanel>
            <CollapsiblePanel title="Table Rules" defaultExpanded={false}>
              <SettingsPanel />
            </CollapsiblePanel>
            <CollapsiblePanel title="Debug" defaultExpanded={false}>
              <DebugPanel />
            </CollapsiblePanel>
          </aside>
        </main>

        {/* Footer Rail */}
        <RulesFooter />
      </div>
    </GameProvider>
  );
}
