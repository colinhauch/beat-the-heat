import { GameProvider } from "./game/GameContext";
import { Table } from "./components/Table";
import { StatsHUD } from "./components/StatsHUD";
import { FeedbackPanel } from "./components/FeedbackPanel";
import { DebugPanel } from "./components/DebugPanel";
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
            <DebugPanel />
          </aside>
        </main>

        {/* Footer Rail */}
        <footer className="app-footer">
          <span className="footer-text mono">
            Classic Vegas Strip · 6 Decks · S17 · DAS
          </span>
        </footer>
      </div>
    </GameProvider>
  );
}
