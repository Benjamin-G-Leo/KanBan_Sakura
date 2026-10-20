# CLAUDE.md

AI-powered Kanban board: React + Vite frontend, Express backend, deployed on Vercel as a multi-service app. Users bring their own OpenRouter key for the AI features (task breakdown, smart suggestions).

## Commands

```bash
npm install && npm --prefix backend install && npm --prefix frontend install
npm run dev               # both services via concurrently: backend :3002, frontend :5173 (VITE_API_URL=http://localhost:3002/api)
npm run dev:backend       # backend only (node --watch, PORT=3002)
npm run dev:frontend      # frontend only
npm run build             # frontend production build → frontend/dist
npm --prefix frontend run lint   # oxlint
vercel dev -L             # run both services with Vercel routing
```

No test suite. Note: the root scripts use port **3002**; running `backend` directly defaults to **3001**, which is also the frontend's fallback `VITE_API_URL`.

## Architecture

**Backend (`backend/`, ESM, Express 4)**
- `server.js` — task CRUD at `/api/tasks` (GET, POST, PATCH `/:id`, DELETE `/:id`). Validates status (`todo`, `in-progress`, `review`, `done`) and priority (`low`, `medium`, `high`); 400 on bad input, 404 on missing task.
- Tasks are an **in-memory array** — they reset on every restart, and on Vercel each serverless instance has its own copy. There is no database.
- `routes/aiRoutes.js` — `POST /api/ai/breakdown`, `POST /api/ai/suggestions`. Middleware `requireUserApiKey` reads the key from the `x-user-api-key` header and returns 401 if missing.
- `services/aiService.js` — `callOpenRouter` / `buildCompletionRequest` (model `openrouter/free`, JSON-only system prompt).

**Frontend (`frontend/`, React 19, Vite 8, Tailwind 4, @dnd-kit)**
- `context/KanbanContext.jsx` — central `useReducer` state, API sync, AI mode; `useKanban.js` is the hook, `KanbanContextValue.js` the context object.
- `components/` — `KanbanBoard`, `Column`, `TaskCard` (breakdown + subtasks), `AddTaskForm`, `SettingsModal` (OpenRouter key entry), `PixelArtBackground` (large animated canvas scene), `constants.js` (columns, `API_BASE` from `VITE_API_URL`).
- `services/aiService.js` — client for the AI endpoints.
- localStorage keys: `openrouter_api_key`, `theme`, and the AI-mode key in `KanbanContext.jsx`.

## Rules

- **Never add a server-side API key.** The design is bring-your-own-key: the key lives in the user's browser and is sent per request in `x-user-api-key`. Don't log it.
- Keep `vercel.json` rewrites intact: `/api/(.*)` → backend service, everything else → frontend. In production the frontend uses the same-origin `/api`.
- Keep `README.md` in sync when changing ports, endpoints, components or the AI flow.
