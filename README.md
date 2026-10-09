# AI-Powered Kanban Board

A responsive Kanban board web app built with React, Vite, Tailwind CSS, and Node.js/Express. Features drag-and-drop task management across four columns with real-time API synchronization.

## Features

- **4-Column Layout**: To Do → In Progress → Review → Done
- **Drag & Drop**: Reorder tasks within and between columns using @dnd-kit
- **Inline Editing**: Click to edit task title and description
- **Priority System**: High (red), Medium (yellow), Low (green) indicators
- **Task CRUD**: Create, read, update, delete tasks via REST API
- **Dark Mode**: Full Tailwind dark mode support
- **Responsive**: Works on desktop and mobile

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS v4 |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Backend | Node.js, Express, CORS |
| State | React hooks + in-memory Express store |

## Project Structure

```
tester/
├── backend/
│   ├── server.js          # Express API (port 3001)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── KanbanBoard.jsx   # Main board + DnD context
│   │   │   ├── Column.jsx        # Sortable column wrapper
│   │   │   ├── TaskCard.jsx      # Task display + inline edit
│   │   │   ├── AddTaskForm.jsx   # Inline create form
│   │   │   └── constants.js      # Column config, API URL
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── postcss.config.js
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

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create task `{title, description?, status?, priority?}` |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

**Valid statuses:** `todo`, `in-progress`, `review`, `done`  
**Valid priorities:** `low`, `medium`, `high`

### Example API Usage

```bash
# Create task
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"New feature","status":"todo","priority":"high"}'

# Move task to Review
curl -X PATCH http://localhost:3001/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"review"}'

# Delete task
curl -X DELETE http://localhost:3001/api/tasks/1
```

## Development

### Frontend Build
```bash
cd frontend
npm run build
# Outputs to dist/
```

### Backend Validation
The server validates:
- Title required on create
- Status must be one of 4 valid values
- Priority must be low/medium/high
- Returns 400 for invalid data, 404 for missing tasks

## Phase Progress

- ✅ **Phase 1**: Config & Scaffolding - Folder structure, Express API, Vite+React+Tailwind
- ✅ **Phase 2**: Core State & Kanban - 4 columns, drag-drop, API sync, dark mode
- 🔄 **Phase 3**: AI Integration (planned) - Task breakdown, smart suggestions

## License

MIT
