import express from 'express';
import cors from 'cors';
import aiRoutes from './routes/aiRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;
const VALID_STATUSES = ['todo', 'in-progress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

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
  { id: 1, title: 'Set up project structure', description: 'Create frontend and backend folders', status: 'done', priority: 'high' },
  { id: 2, title: 'Configure Express backend', description: 'Set up API routes and middleware', status: 'done', priority: 'high' },
  { id: 3, title: 'Scaffold Vite + React + Tailwind', description: 'Initialize frontend with build tools', status: 'in-progress', priority: 'high' },
  { id: 4, title: 'Create Kanban board component', description: 'Build drag-and-drop board UI', status: 'todo', priority: 'medium' },
  { id: 5, title: 'Add task CRUD operations', description: 'Implement create, read, update, delete', status: 'todo', priority: 'medium' },
  { id: 6, title: 'Implement drag and drop', description: 'Add @dnd-kit for column/task reordering', status: 'review', priority: 'medium' },
  { id: 7, title: 'Add AI task suggestions', description: 'Integrate AI for task breakdown', status: 'todo', priority: 'low' },
  { id: 8, title: 'Polish responsive design', description: 'Ensure mobile/desktop layouts work', status: 'todo', priority: 'low' },
  { id: 9, title: 'Auto-generate task breakdown', description: 'AI-generated subtasks for complex features', status: 'todo', priority: 'high', isAI: true },
  { id: 10, title: 'Smart priority sorting', description: 'AI-powered task prioritization based on deadlines', status: 'in-progress', priority: 'medium', isAI: true },
  { id: 11, title: 'Automated code review', description: 'AI-generated code quality suggestions', status: 'review', priority: 'high', isAI: true },
  { id: 12, title: 'Predictive timeline estimation', description: 'AI-generated sprint velocity predictions', status: 'done', priority: 'low', isAI: true },
];

let nextId = 13;

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

app.post('/api/tasks', (req, res) => {
  const validation = validateTaskData(req.body, { requireTitle: true });
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { title, description = '', status = 'todo', priority = 'medium', isAI = false } = validation.value;
  const task = {
    id: nextId++,
    title: normalizeString(title),
    description: normalizeString(description, ''),
    status: VALID_STATUSES.includes(status) ? status : 'todo',
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

  const updatedTask = { ...tasks[index], ...validation.value };
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
