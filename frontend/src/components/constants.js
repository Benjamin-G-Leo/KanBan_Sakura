export const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

// Tasks move through COLUMNS in order, one stage at a time (forward or back)
export const getAdjacentStage = (status, direction) => {
  const index = COLUMNS.findIndex((column) => column.id === status);
  return COLUMNS[index + direction] ?? null;
};

export const isAdjacentStage = (from, to) => {
  const fromIndex = COLUMNS.findIndex((column) => column.id === from);
  const toIndex = COLUMNS.findIndex((column) => column.id === to);
  return fromIndex !== -1 && toIndex !== -1 && Math.abs(fromIndex - toIndex) === 1;
};

export const EXPIRY_POLL_MS = 60_000;

const normalizeApiBase = (value) => {
  const raw = (value || 'http://localhost:3001/api').trim();
  return raw.endsWith('/tasks') ? raw.slice(0, -'/tasks'.length) : raw;
};

export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL || 'http://localhost:3001/api');
export const API_URL = `${API_BASE}/tasks`;
