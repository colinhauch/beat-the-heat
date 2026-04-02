import { GameProvider } from "./game/GameContext";
import { Table } from "./components/Table";
import { StatsHUD } from "./components/StatsHUD";
import { FeedbackPanel } from "./components/FeedbackPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { DebugPanel } from "./components/DebugPanel";
import { RulesFooter } from "./components/RulesFooter";
import "./App.css";

export default function App() {
  return (
    <GameProvider>
      <div className="app-shell">
        {/* Header Rail */}
        <header className="app-header">
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
          <aside className="feedback-rail">
            <FeedbackPanel />
            <SettingsPanel />
            <DebugPanel />
          </aside>
        </main>

        {/* Footer Rail */}
        <RulesFooter />
      </div>
    </GameProvider>
  );
}
