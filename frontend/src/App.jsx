import { useEffect, useState } from 'react';
import { KanbanBoard } from './components/KanbanBoard';
import { PixelArtBackground } from './components/PixelArtBackground';
import { SettingsModal } from './components/SettingsModal';
import { Toasts } from './components/Toasts';
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

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'dark';
    } catch (error) {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    document.documentElement.dispatchEvent(new CustomEvent('themechange'));
  }, [theme]);

  const isKeyConnected = Boolean(apiKey);

  const handleAiModeChange = (event) => {
    setAiModeEnabled(event.target.checked);
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="app-wrapper min-h-screen">
      <PixelArtBackground />

      <header className="app-header">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="header-eyebrow text-xs font-semibold uppercase tracking-[0.24em]">AI Kanban</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Project Board</h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleSettingsModal}
              className="header-control inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
              aria-label="Open OpenRouter API key settings"
              title="Open OpenRouter API key settings"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${isKeyConnected ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-slate-500'}`} />
              {isKeyConnected ? 'Update Key' : 'Set API Key'}
            </button>

            {isAiModeEnabled && (
              <button
                type="button"
                onClick={toggleSuggestions}
                className="header-control rounded-lg px-3 py-2 text-sm font-medium"
                aria-label={suggestionsOpen ? 'Close AI Suggestions' : 'Open AI Suggestions'}
              >
                {suggestionsOpen ? 'Close Insights' : 'Open Insights'}
              </button>
            )}

            <label className="header-control inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm">
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

            <button
              type="button"
              onClick={toggleTheme}
              className="header-control inline-flex h-10 w-10 items-center justify-center rounded-lg"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Top padding leaves a band of sky clear so the sun and moon stay visible */}
      <main className="relative z-10 mx-auto max-w-[1680px] px-4 pb-6 pt-[clamp(1.5rem,14vh,9rem)] sm:px-6 lg:px-8">
        <KanbanBoard />
      </main>

      <SuggestionsDrawer />
      <Toasts />
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
