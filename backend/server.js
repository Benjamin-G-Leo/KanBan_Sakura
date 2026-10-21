import express from 'express';
import cors from 'cors';
import aiRoutes from './routes/aiRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;
// Order matters: tasks move one step at a time through this lifecycle
const VALID_STATUSES = ['todo', 'in-progress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
// How long a task stays in Done before it is cleared. Overridable for testing.
const DONE_TTL_MS = Number(process.env.DONE_TTL_MS) || 24 * 60 * 60 * 1000;
const EXPIRED_LOG_LIMIT = 100;

// CORS configuration for frontend integration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-API-Key']
}));
app.use(express.json());

// Mount AI routes
app.use('/api/ai', aiRoutes);

let tasks = [
  { id: 1, title: 'Sample Task 1', description: 'This is a placeholder description.', status: 'todo', priority: 'medium' },
  { id: 2, title: 'Sample Task 2', description: 'Task currently being worked on.', status: 'in-progress', priority: 'medium' },
  { id: 3, title: 'Sample Task 3', description: 'Task awaiting review.', status: 'review', priority: 'medium' },
  { id: 4, title: 'Sample Task 4', description: 'Completed sample task.', status: 'done', priority: 'low', completedAt: Date.now() },
];

let nextId = 5;

// Tasks cleared from Done, kept briefly so clients can notify about them
let expiredLog = [];

// Expiry is checked lazily on each request rather than with a timer, because
// serverless instances can be frozen or recycled between requests.
const purgeExpiredTasks = () => {
  const now = Date.now();
  const expired = tasks.filter((t) => t.status === 'done' && t.completedAt && now - t.completedAt >= DONE_TTL_MS);
  if (expired.length === 0) return;

  const expiredIds = new Set(expired.map((t) => t.id));
  tasks = tasks.filter((t) => !expiredIds.has(t.id));
  expiredLog = [
    ...expiredLog,
    ...expired.map((t) => ({ id: t.id, title: t.title, expiredAt: now })),
  ].slice(-EXPIRED_LOG_LIMIT);
};

app.use('/api/tasks', (req, res, next) => {
  purgeExpiredTasks();
  next();
});

const normalizeString = (value, fallback = '') => typeof value === 'string' ? value.trim() : fallback;

const validateTaskData = (payload = {}, { requireTitle = false } = {}) => {
  const nextPayload = { ...payload };

  if (requireTitle && (!nextPayload.title || !normalizeString(nextPayload.title))) {
    return { error: 'Title is required' };
  }

  if (nextPayload.title !== undefined && !normalizeString(nextPayload.title)) {
    return { error: 'Title cannot be empty' };
  }

  if (nextPayload.status !== undefined && !VALID_STATUSES.includes(nextPayload.status)) {
    return { error: 'Invalid status' };
  }

  if (nextPayload.priority !== undefined && !VALID_PRIORITIES.includes(nextPayload.priority)) {
    return { error: 'Invalid priority' };
  }

  return { value: nextPayload };
};

app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

// Tasks auto-cleared from Done since `since` (ms timestamp). Returns the server
// time so the client can use it as the next `since` without clock skew.
app.get('/api/tasks/expired', (req, res) => {
  const since = Number(req.query.since) || 0;
  res.json({
    now: Date.now(),
    ttlMs: DONE_TTL_MS,
    expired: expiredLog.filter((entry) => entry.expiredAt > since),
  });
});

app.post('/api/tasks', (req, res) => {
  const validation = validateTaskData(req.body, { requireTitle: true });
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { title, description = '', priority = 'medium', isAI = false } = validation.value;
  const task = {
    id: nextId++,
    title: normalizeString(title),
    description: normalizeString(description, ''),
    // New tasks always start the lifecycle in To Do
    status: 'todo',
    priority: VALID_PRIORITIES.includes(priority) ? priority : 'medium',
    isAI: Boolean(isAI),
  };

  tasks.push(task);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) return res.status(404).json({ error: 'Task not found' });

  const validation = validateTaskData(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  // completedAt is server-owned; clients can't set it directly
  const { completedAt: _ignored, ...changes } = validation.value;
  const currentStatus = tasks[index].status;
  if (changes.status !== undefined && changes.status !== currentStatus) {
    const step = VALID_STATUSES.indexOf(changes.status) - VALID_STATUSES.indexOf(currentStatus);
    if (Math.abs(step) !== 1) {
      return res.status(400).json({ error: 'Tasks can only move one stage at a time' });
    }
  }

  const updatedTask = { ...tasks[index], ...changes };
  if (updatedTask.status !== currentStatus) {
    updatedTask.completedAt = updatedTask.status === 'done' ? Date.now() : null;
  }
  if (updatedTask.title !== undefined) updatedTask.title = normalizeString(updatedTask.title);
  if (updatedTask.description !== undefined) updatedTask.description = normalizeString(updatedTask.description, '');
  if (updatedTask.status !== undefined) updatedTask.status = VALID_STATUSES.includes(updatedTask.status) ? updatedTask.status : tasks[index].status;
  if (updatedTask.priority !== undefined) updatedTask.priority = VALID_PRIORITIES.includes(updatedTask.priority) ? updatedTask.priority : tasks[index].priority;
  if (updatedTask.isAI !== undefined) updatedTask.isAI = Boolean(updatedTask.isAI);

  tasks[index] = updatedTask;
  res.json(tasks[index]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const taskExists = tasks.some(t => t.id === id);
  if (!taskExists) return res.status(404).json({ error: 'Task not found' });

  tasks = tasks.filter(t => t.id !== id);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
