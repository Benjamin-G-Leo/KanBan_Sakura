export const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'review', title: 'Review', color: 'bg-purple-100 dark:bg-purple-900/30' },
  { id: 'done', title: 'Done', color: 'bg-green-100 dark:bg-green-900/30' },
];

export const PRIORITY_COLORS = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/tasks';