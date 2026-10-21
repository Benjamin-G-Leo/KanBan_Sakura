# AI-Powered Kanban Board

A responsive Kanban board web app built with React, Vite, Tailwind CSS, and Node.js/Express. Features drag-and-drop task management across four columns with real-time API synchronization and **AI-powered task breakdown & smart suggestions** using your own OpenRouter API key.

## Features

- **4-Column Layout**: To Do → In Progress → Review → Done, each with its own stage colour (sky, amber, violet, emerald)
- **Controlled Lifecycle**: Tasks are created in To Do only and move one stage at a time, forward or back, via the card's `←` / `Next →` buttons or drag-and-drop (@dnd-kit). Drags that skip a stage are rejected.
- **Done Auto-Clear**: Tasks are removed 24 hours after entering Done, with an in-app toast (tasks cleared while the app was closed are reported on next load)
- **Inline Editing**: Click to edit task title and description
- **Priority Pills**: High / Med / Low tag on each card
- **Task CRUD**: Create, read, update, delete tasks via REST API
- **Dark Mode**: Full Tailwind dark mode support with persistence
- **Animated Background**: Pixel-art canvas scene behind the board
- **Responsive**: Works on desktop and mobile
- **AI Mode** (toggle in the header, requires an OpenRouter key):
  - **Task Breakdown**: Click "Breakdown" on any task to generate 3–5 subtasks (with a glass shimmer loading overlay)
  - **Smart Suggestions**: "Open Insights" slide-out drawer with three workflow tips for bottlenecks, idle columns and priority backlogs

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8, Tailwind CSS v4, oxlint |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Backend | Node.js, Express, CORS |
| State Management | React Context + useReducer (centralized) |
| AI | OpenRouter (`openrouter/free` model), bring-your-own key |
| Deployment | Vercel (multi-service: backend + frontend) |

## Project Structure

```
KanBan_Sakura/
├── backend/
│   ├── server.js              # Express API entry point + in-memory task store
│   ├── routes/
│   │   └── aiRoutes.js        # AI endpoints: /breakdown, /suggestions
│   ├── services/
│   │   └── aiService.js       # OpenRouter client
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── KanbanBoard.jsx         # Main board + DnD context
│   │   │   ├── Column.jsx              # Sortable column wrapper
│   │   │   ├── TaskCard.jsx            # Task display, stage moves, breakdown + subtasks
│   │   │   ├── AddTaskForm.jsx         # Inline create form (To Do column only)
│   │   │   ├── Toasts.jsx              # In-app notifications (e.g. Done auto-clear)
│   │   │   ├── SettingsModal.jsx       # OpenRouter API key settings
│   │   │   ├── PixelArtBackground.jsx  # Animated canvas background
│   │   │   └── constants.js            # Column config + stage helpers, API URL
│   │   ├── context/
│   │   │   ├── KanbanContext.jsx       # Centralized state (useReducer)
│   │   │   ├── KanbanContextValue.js   # Context object
│   │   │   └── useKanban.js            # Hook for consuming the context
│   │   ├── services/
│   │   │   └── aiService.js       # API client for AI endpoints
│   │   ├── App.jsx                # Providers, header, suggestions drawer
│   │   ├── main.jsx
│   │   └── index.css              # Animations, shimmer, drawer styles
│   ├── package.json
│   ├── postcss.config.js
│   └── vite.config.js
├── package.json                 # Root scripts (runs both services)
├── vercel.json                  # Vercel multi-service config
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- An [OpenRouter](https://openrouter.ai) API key (optional — only needed for AI features)

### Run Locally (single terminal)
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
npm run dev
# Backend on http://localhost:3002, frontend on http://localhost:5173 (or 5174 if 5173 is in use)
```

### Run services separately
```bash
npm run dev:backend    # backend on :3002
npm run dev:frontend   # frontend, pointed at http://localhost:3002/api
```

Running `npm run dev` inside `backend/` directly uses port **3001**, which is also the frontend's default API URL when `VITE_API_URL` is not set.

### Enable AI features
Open the app, click the settings button, and paste your OpenRouter API key. The key is stored only in your browser's `localStorage` and sent with each AI request in the `x-user-api-key` header; the server never stores it. Then switch on **AI Mode**.

## API Endpoints

### Task Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create task `{title, description?, priority?, isAI?}` — always created in `todo` |
| PATCH | `/api/tasks/:id` | Update task; `status` may only move one stage forward or back |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/expired?since=<ms>` | Tasks auto-cleared from Done since `since`: `{now, ttlMs, expired: [{id, title, expiredAt}]}` |

**Valid statuses (in lifecycle order):** `todo`, `in-progress`, `review`, `done`
**Valid priorities:** `low`, `medium`, `high`

Entering `done` stamps a server-owned `completedAt`; leaving it clears the stamp. Expired Done tasks are purged lazily on each `/api/tasks` request (no timers, so it works on serverless). The TTL defaults to 24 hours and can be shortened for testing with `DONE_TTL_MS` (e.g. `DONE_TTL_MS=60000 npm run dev`).

Tasks are kept in memory, so they reset whenever the backend restarts.

### AI Endpoints

Both require the header `x-user-api-key: <your OpenRouter key>`; without it they return `401`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/breakdown` | Generate subtasks for a task `{taskId, title, description?}` |
| POST | `/api/ai/suggestions` | Analyze board state for workflow tips `{boardState}` |

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
    "Define column and card component structure",
    "Wire up drag-and-drop with @dnd-kit",
    "Add responsive styling"
  ]
}
```

#### `/api/ai/suggestions`

**Request:**
```json
{
  "boardState": {
    "columns": {"todo": 5, "in-progress": 0, "review": 3, "done": 2},
    "tasks": []
  }
}
```

**Response:** three suggestions. If the model's reply can't be parsed, the backend falls back to built-in rules (To Do > 4, In Progress > 3, Review > 3, empty In Progress, high-priority backlog, column imbalance).
```json
{
  "suggestions": [
    "Pull the highest-priority To Do task into In Progress to restore flow.",
    "Review has 3 tasks waiting — clear reviews before starting new work.",
    "Break large To Do items into smaller tasks."
  ]
}
```

### Example API Usage

```bash
# Create task
curl -X POST http://localhost:3002/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"New feature","status":"todo","priority":"high"}'

# Trigger AI breakdown
curl -X POST http://localhost:3002/api/ai/breakdown \
  -H "Content-Type: application/json" \
  -H "x-user-api-key: $OPENROUTER_API_KEY" \
  -d '{"taskId":4,"title":"Design database schema","description":"Create tables"}'
```

## Development

### Frontend Build & Lint
```bash
npm run build                    # outputs to frontend/dist/
npm --prefix frontend run lint   # oxlint
```

### Backend Validation
- Title required on create
- Status must be one of 4 valid values, and changes may only move one stage at a time
- Priority must be low/medium/high
- Returns 400 for invalid data, 404 for missing tasks

## Deployment (Vercel)

This project is configured for **Vercel multi-service deployment** via `vercel.json`:

- **`backend` service**: Express API, exposed through the `/api/*` rewrite
- **`frontend` service**: Vite SPA, exposed through the catch-all `/*` rewrite

The frontend calls the backend from the browser using the same-origin `/api` path. The backend does not make server-to-server calls, so no Vercel service binding is needed. The frontend's `VITE_API_URL` is set to `/api` in its Vercel build and development commands. No server-side API keys are needed.

### Deploy
```bash
vercel
# or
vercel --prod
```

### Local Development with Vercel CLI
```bash
vercel dev -L
# Runs both services locally with proper routing
```

## Phase Progress

- ✅ **Phase 1**: Config & Scaffolding - Folder structure, Express API, Vite+React+Tailwind
- ✅ **Phase 2**: Core State & Kanban - 4 columns, drag-drop, API sync, dark mode
- ✅ **Phase 3**: AI Integration - Task breakdown, smart suggestions, centralized state
- ✅ **Phase 4**: DevOps - Vercel multi-service config, CI/CD ready
- ✅ **Phase 5**: Bring-your-own OpenRouter key, AI mode toggle, pixel-art background

## License

MIT
