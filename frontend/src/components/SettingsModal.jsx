import { useEffect, useState } from 'react';

export function SettingsModal({ isOpen, onClose, onSave }) {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const storedKey = localStorage.getItem('openrouter_api_key') || '';
    setApiKey(storedKey);
    setError(null);
  }, [isOpen]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setError('API key is required');
      setIsSaving(false);
      return;
    }

    try {
      localStorage.setItem('openrouter_api_key', trimmedKey);
      onSave(trimmedKey);
      onClose();
    } catch (err) {
      setError('Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative mx-4 w-full max-w-md rounded-2xl border border-white/15 bg-slate-900/90 p-6 text-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-200/90">Secure AI Access</p>
              <h3 className="mt-1 text-xl font-bold">OpenRouter API Key</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-slate-300 hover:bg-white/5 hover:text-white"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Enter your OpenRouter API key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-400 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="sk-or-..."
                autoComplete="off"
                aria-label="OpenRouter API Key"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                Key stays in your browser localStorage and is sent only with your AI requests.
              </p>
              <button
                type="submit"
                disabled={isSaving || !apiKey.trim()}
                className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 font-medium text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save API Key'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
