# AI-Powered Kanban Board

A responsive Kanban board web app built with React, Vite, Tailwind CSS, and Node.js/Express. Features drag-and-drop task management across four columns with real-time API synchronization and **AI-powered task breakdown & smart suggestions**.

## Features

- **4-Column Layout**: To Do → In Progress → Review → Done
- **Drag & Drop**: Reorder tasks within and between columns using @dnd-kit
- **Inline Editing**: Click to edit task title and description
- **Priority System**: High (red), Medium (yellow), Low (green) indicators
- **Task CRUD**: Create, read, update, delete tasks via REST API
- **Dark Mode**: Full Tailwind dark mode support with persistence
- **Responsive**: Works on desktop and mobile
- **🤖 AI Task Breakdown**: Click "✦ Breakdown" on any task to generate contextual subtasks (with glass shimmer loading overlay) and auto-spawn related AI tasks into To Do column
- **🧠 Smart Suggestions**: Slide-out glassmorphic drawer analyzing board state for bottlenecks, idle columns, priority backlogs, and workflow insights

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS v4 |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Backend | Node.js, Express, CORS |
| State Management | React Context + useReducer (centralized) |
| AI Endpoints | `/api/ai/breakdown`, `/api/ai/suggestions` |
| Deployment | Vercel (multi-service: backend + frontend) |

## Project Structure

```
tester/
├── backend/
│   ├── server.js              # Express API entry point
│   ├── routes/
│   │   └── aiRoutes.js        # AI endpoints: /breakdown, /suggestions
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── KanbanBoard.jsx    # Main board + DnD context
│   │   │   ├── Column.jsx         # Sortable column wrapper
│   │   │   ├── TaskCard.jsx       # Task display + breakdown + subtasks
│   │   │   ├── AddTaskForm.jsx    # Inline create form
│   │   │   ├── AISuggestionsDrawer.jsx  # Smart suggestions panel
│   │   │   └── constants.js       # Column config, API URL
│   │   ├── context/
│   │   │   └── KanbanContext.jsx  # Centralized state (useReducer)
│   │   ├── services/
│   │   │   └── aiService.js       # API client for AI endpoints
│   │   ├── App.jsx                # Providers + drawer integration
│   │   ├── main.jsx
│   │   └── index.css              # Animations, shimmer, drawer styles
│   ├── package.json
│   ├── postcss.config.js
│   └── vite.config.js
├── vercel.json                  # Vercel multi-service config
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Run Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173 (or 5174 if 5173 in use)
```

Open the frontend URL in your browser.

### Run with Concurrently (Single Terminal)
```bash
npm install
npm run dev
# Starts both backend (3001) and frontend (5173/5174)
```

## API Endpoints

### Task Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create task `{title, description?, status?, priority?, isAI?}` |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

**Valid statuses:** `todo`, `in-progress`, `review`, `done`  
**Valid priorities:** `low`, `medium`, `high`

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/breakdown` | Generate subtasks + standalone AI tasks `{taskId, title, description}` |
| POST | `/api/ai/suggestions` | Analyze board state for workflow insights `{boardState}` |

#### `/api/ai/breakdown`

**Request:**
```json
{
  "taskId": 4,
  "title": "Create Kanban board component",
  "description": "Build drag-and-drop board UI"
}
```

**Response:**
```json
{
  "subtasks": [
    "Create component architecture for ...",
    "Implement responsive design patterns",
    "Add accessibility (a11y) attributes",
    "Write component unit tests"
  ],
  "standaloneTasks": [
    {"text": "Refactor: Create Kanban board component", "isAI": true},
    {"text": "Review: Create Kanban board component", "isAI": true}
  ]
}
```

- **1.5s simulated latency** (replaceable with real LLM call)
- **Context-aware templates**: database, auth, UI, API-specific subtasks
- **`standaloneTasks`** auto-spawn as new cards in To Do with `isAI: true`

#### `/api/ai/suggestions`

**Request:**
```json
{
  "boardState": {
    "columns": {"todo": 5, "in-progress": 0, "review": 3, "done": 2},
    "tasks": [{...}]
  }
}
```

**Response:**
```json
[
  {
    "id": "suggestion-...",
    "title": "To Do Column Bottleneck",
    "priority": "high",
    "recommendation": "AI Suggestion: 'To Do' has 5 tasks (threshold: 4). Consider prioritizing or breaking down large tasks to restore column flow."
  },
  {
    "id": "suggestion-...",
    "title": "In Progress Idle",
    "priority": "medium",
    "recommendation": "AI Suggestion: 'In Progress' is empty while To Do has work. Pull the highest-priority task to maintain flow."
  }
]
```

- **1s simulated latency** (replaceable with real LLM call)
- **Detects**: To Do >4, In Progress >3, Review >3, empty In Progress, high-priority backlog, AI tasks pending, column imbalance (>50%)
- Returns top 3 most relevant suggestions

### Example API Usage

```bash
# Create task
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"New feature","status":"todo","priority":"high"}'

# Trigger AI breakdown
curl -X POST http://localhost:3001/api/ai/breakdown \
  -H "Content-Type: application/json" \
  -d '{"taskId":4,"title":"Design database schema","description":"Create tables"}'

# Get AI suggestions
curl -X POST http://localhost:3001/api/ai/suggestions \
  -H "Content-Type: application/json" \
  -d '{"boardState":{"columns":{"todo":5,"in-progress":0,"review":3,"done":2},"tasks":[]}}'
```

## Development

### Frontend Build
```bash
cd frontend
npm run build
# Outputs to dist/
```

### Backend Validation
- Title required on create
- Status must be one of 4 valid values
- Priority must be low/medium/high
- Returns 400 for invalid data, 404 for missing tasks

## Deployment (Vercel)

This project is configured for **Vercel multi-service deployment** via `vercel.json`:

- **`backend` service** (internal): Express API at `/api/*`
- **`frontend` service** (public): Vite SPA at `/*`

### Deploy
```bash
vercel
# or
vercel --prod
```

### Local Development with Vercel CLI
```bash
vercel dev
# Runs both services locally with proper routing
```

### Environment Variables

| Variable | Frontend (VITE_API_URL) | Backend |
|----------|------------------------|---------|
| Local | `http://localhost:3001/api` | CORS: localhost:5173/5174 |
| Production | `/api` (relative) | Same-origin via rewrite |

> **Note**: In production, the frontend uses relative `/api/*` paths which Vercel rewrites to the backend service. No CORS config needed for production URL since both services share the same domain.

## Phase Progress

- ✅ **Phase 1**: Config & Scaffolding - Folder structure, Express API, Vite+React+Tailwind
- ✅ **Phase 2**: Core State & Kanban - 4 columns, drag-drop, API sync, dark mode
- ✅ **Phase 3**: AI Integration - Task breakdown, smart suggestions, centralized state
- ✅ **Phase 4**: DevOps - Vercel multi-service config, CI/CD ready

## License

MIT
