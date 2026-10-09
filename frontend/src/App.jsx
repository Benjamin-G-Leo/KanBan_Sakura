import { KanbanBoard } from './components/KanbanBoard';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kanban Board</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">AI-Powered Task Management</span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <KanbanBoard />
      </main>
    </div>
  );
}

export default App;
