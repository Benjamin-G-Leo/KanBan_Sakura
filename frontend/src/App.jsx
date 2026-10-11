import { useEffect } from 'react';
import { KanbanBoard } from './components/KanbanBoard';
import { PixelArtBackground } from './components/PixelArtBackground';
import { SettingsModal } from './components/SettingsModal';
import { KanbanProvider } from './context/KanbanContext';
import { useKanban } from './context/useKanban';

function SuggestionsDrawer() {
  const { isAiModeEnabled, suggestionsOpen, suggestions, suggestionsLoading, toggleSuggestions } = useKanban();

  if (!isAiModeEnabled || !suggestionsOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm" onClick={toggleSuggestions} />
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-white/10 bg-slate-900/90 p-4 text-white shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-lg font-semibold">AI Suggestions</h2>
          <button
            type="button"
            onClick={toggleSuggestions}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-slate-200 hover:bg-white/10"
            aria-label="Close AI Suggestions"
          >
            Close
          </button>
        </div>

        {suggestionsLoading ? (
          <div className="flex h-40 items-center justify-center text-slate-300">Generating insights...</div>
        ) : suggestions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            No suggestions yet. Open the board with more work to analyze flow.
          </div>
        ) : (
          <ul className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.id || `${suggestion.title}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-emerald-200">
                    Insight {index + 1}
                  </span>
                  {suggestion.priority && (
                    <span className="text-[10px] uppercase tracking-[0.12em] text-slate-300">
                      {suggestion.priority}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-100">{suggestion.recommendation || suggestion}</p>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </>
  );
}

function AppContent() {
  const {
    apiKey,
    settingsModalOpen,
    toggleSettingsModal,
    handleSaveApiKey,
    toggleSuggestions,
    suggestionsOpen,
    isAiModeEnabled,
    setAiModeEnabled,
  } = useKanban();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const isKeyConnected = Boolean(apiKey);

  const handleAiModeChange = (event) => {
    setAiModeEnabled(event.target.checked);
  };

  return (
    <div className="app-wrapper min-h-screen bg-slate-950 text-white">
      <PixelArtBackground />

      <header className="relative z-10 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-300/80">AI Kanban</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Project Board</h1>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200">
              <span>AI Mode</span>
              <input
                type="checkbox"
                className="peer sr-only"
                checked={isAiModeEnabled}
                onChange={handleAiModeChange}
                aria-label="Toggle AI Mode"
              />
              <span className={`relative h-6 w-11 rounded-full transition-colors ${isAiModeEnabled ? 'bg-emerald-500' : 'bg-slate-600'} peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-emerald-300`}>
                <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${isAiModeEnabled ? 'translate-x-5' : ''}`} />
              </span>
            </label>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200">
              <span className={`h-2.5 w-2.5 rounded-full ${isKeyConnected ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-slate-500'}`} />
              {isKeyConnected ? 'Key Connected' : 'Set API Key'}
            </div>

            {isAiModeEnabled && (
              <button
                type="button"
                onClick={toggleSuggestions}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
                aria-label={suggestionsOpen ? 'Close AI Suggestions' : 'Open AI Suggestions'}
              >
                {suggestionsOpen ? 'Close Insights' : 'Open Insights'}
              </button>
            )}

            <button
              type="button"
              onClick={toggleSettingsModal}
              className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20"
            >
              {isKeyConnected ? 'Update Key' : 'Set API Key'}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <KanbanBoard />
      </main>

      <SuggestionsDrawer />
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={toggleSettingsModal}
        onSave={handleSaveApiKey}
      />
    </div>
  );
}

function App() {
  return (
    <KanbanProvider>
      <AppContent />
    </KanbanProvider>
  );
}

export default App;
