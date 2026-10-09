export const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

const normalizeApiBase = (value) => {
  const raw = (value || 'http://localhost:3001/api').trim();
  return raw.endsWith('/tasks') ? raw.slice(0, -'/tasks'.length) : raw;
};

export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL || 'http://localhost:3001/api');
export const API_URL = `${API_BASE}/tasks`;
