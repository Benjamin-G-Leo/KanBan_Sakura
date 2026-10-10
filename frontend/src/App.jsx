import { useEffect, useState } from 'react';
import { KanbanBoard } from './components/KanbanBoard';
import { KanbanProvider, useKanban } from './context/KanbanContext';
import { PixelArtBackground } from './components/PixelArtBackground';

function SuggestionsDrawer() {
  const { suggestionsOpen, suggestions, suggestionsLoading, toggleSuggestions } = useKanban();

  if (!suggestionsOpen) return null;

  return (
    <>      <div 
        className="drawer-overlay"
        onClick={toggleSuggestions}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 99,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />
      <aside 
        className="suggestions-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '380px',
          maxWidth: '100vw',
          background: 'var(--glass-bg-column)',
          borderLeft: '1px solid var(--glass-border-column)',
          backdropFilter: 'blur(var(--glass-blur-lg))',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'var(--glass-shadow-column)',
        }}
      >
        <div style={{
          padding: 'var(--space-lg)',
          borderBottom: '1px solid var(--glass-border-column)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}>
            <span style={{ 
              fontSize: '1.25rem',
              color: 'var(--priority-medium)',
            }}>✦</span>
            AI Suggestions
          </h2>
          <button 
            onClick={toggleSuggestions}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--glass-border-card)',
              background: 'var(--glass-bg-card)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.target.style.color = 'var(--text-primary)'; e.target.style.background = 'var(--glass-bg-column)'; }}
            onMouseLeave={(e) => { e.target.style.color = 'var(--text-secondary)'; e.target.style.background = 'var(--glass-bg-card)'; }}
            aria-label="Close suggestions"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>          {suggestionsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: 'var(--space-md)' }}>
              <div className="loading-spinner" style={{ width: '2.5rem', height: '2.5rem' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Generating insights...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--space-xl)',
              color: 'var(--text-muted)',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto var(--space-md)', opacity: 0.5 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <p style={{ fontSize: '0.875rem', marginBottom: 'var(--space-xs)' }}>No suggestions yet</p>
              <p style={{ fontSize: '0.75rem' }}>AI will analyze your board and provide insights</p>
            </div>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>              {suggestions.map((suggestion, index) => (
                <li key={suggestion.id || index} className="suggestion-card" style={{
                  background: 'var(--glass-bg-card)',
                  border: '1px solid var(--glass-border-card)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-md)',
                  backdropFilter: 'blur(var(--glass-blur-sm))',
                  transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                  boxShadow: 'var(--glass-shadow-card)',
                }} onMouseEnter={(e) => { e.target.style.borderColor = 'var(--glass-border-card-hover)'; e.target.style.boxShadow = 'var(--glass-shadow-card-hover)'; }}
                     onMouseLeave={(e) => { e.target.style.borderColor = 'var(--glass-border-card)'; e.target.style.boxShadow = 'var(--glass-shadow-card)'; }}>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start' }}>                    <div style={{ 
                      flexShrink: 0,
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, var(--priority-medium), var(--priority-low))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-inverse)',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'var(--space-xs)', 
                        marginBottom: 'var(--space-xs)' 
                      }}>
                        <span style={{ 
                          fontSize: '0.625rem',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          background: 'var(--glass-bg-column)',
                          border: '1px solid var(--glass-border-card)',
                          color: 'var(--text-muted)',
                        }}>
                          {suggestion.type || 'insight'}
                        </span>
                        {suggestion.priority && (
                          <span style={{ 
                            fontSize: '0.625rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '9999px',
                            background: suggestion.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' : suggestion.priority === 'medium' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                            border: '1px solid ' + (suggestion.priority === 'high' ? 'var(--priority-high)' : suggestion.priority === 'medium' ? 'var(--priority-medium)' : 'var(--priority-low)'),
                            color: suggestion.priority === 'high' ? 'var(--priority-high)' : suggestion.priority === 'medium' ? 'var(--priority-medium)' : 'var(--priority-low)',
                          }}>
                            {suggestion.priority}
                          </span>
                        )}
                      </div>
                      <h4 style={{ 
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: 'var(--space-xs)',
                        lineHeight: 1.4,
                      }}>
                        {suggestion.title || suggestion.text}
                      </h4>
                      <p style={{ 
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}>
                        {suggestion.description || suggestion.detail || suggestion.recommendation || ''}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}

function AppContent() {
  const { toggleSuggestions, suggestionsOpen } = useKanban();
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    return savedTheme;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.dispatchEvent(new CustomEvent('themechange'));
  };

  return (
    <div className="app-wrapper min-h-screen">
      <PixelArtBackground />
      <header className="app-header px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Kanban Board</h1>
            <span style={{ color: 'var(--text-secondary)' }}>AI-Powered Task Management</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSuggestions}
              className="theme-toggle"
              aria-label={suggestionsOpen ? 'Close AI Suggestions' : 'Open AI Suggestions'}
              title={suggestionsOpen ? 'Close AI Suggestions' : 'Open AI Suggestions'}
              style={{
                ...(suggestionsOpen ? { 
                  background: 'var(--glass-bg-card-hover)',
                  borderColor: 'var(--priority-medium)',
                  boxShadow: '0 0 12px rgba(251, 191, 36, 0.3)',
                } : {})
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: suggestionsOpen ? 'var(--priority-medium)' : 'inherit' }}>
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </button>
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Current: Dark. Click to switch to Light.' : 'Current: Light. Click to switch to Dark.'}
            >
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <KanbanBoard />
      </main>
      <SuggestionsDrawer />
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
