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
- `server.js` — task CRUD at `/api/tasks` (GET, POST, PATCH `/:id`, DELETE `/:id`) plus `GET /api/tasks/expired?since=`. Validates status (`todo`, `in-progress`, `review`, `done`) and priority (`low`, `medium`, `high`); 400 on bad input, 404 on missing task.
- Lifecycle: POST always creates in `todo`; PATCH only allows a one-stage status move. Entering `done` sets server-owned `completedAt`; Done tasks older than `DONE_TTL_MS` (default 24h) are purged lazily by middleware on every `/api/tasks` request and logged for the `/expired` endpoint. Don't replace this with timers — serverless instances don't keep them alive.
- Tasks are an **in-memory array** — they reset on every restart, and on Vercel each serverless instance has its own copy. There is no database.
- `routes/aiRoutes.js` — `POST /api/ai/breakdown`, `POST /api/ai/suggestions`. Middleware `requireUserApiKey` reads the key from the `x-user-api-key` header and returns 401 if missing.
- `services/aiService.js` — `callOpenRouter` / `buildCompletionRequest` (model `openrouter/free`, JSON-only system prompt).

**Frontend (`frontend/`, React 19, Vite 8, Tailwind 4, @dnd-kit)**
- `context/KanbanContext.jsx` — central `useReducer` state, API sync, AI mode; `useKanban.js` is the hook, `KanbanContextValue.js` the context object.
- `components/` — `KanbanBoard`, `Column`, `TaskCard` (breakdown + subtasks), `AddTaskForm`, `SettingsModal` (OpenRouter key entry), `PixelArtBackground` (large animated canvas scene), `constants.js` (columns, `API_BASE` from `VITE_API_URL`).
- `services/aiService.js` — client for the AI endpoints.
- `Toasts.jsx` renders `toasts` from the context; `KanbanContext` polls `/api/tasks/expired` every minute and toasts cleared tasks.
- Stage colours are CSS tokens (`--stage-*`) in `index.css`, applied via a `data-stage` attribute on columns, cards and buttons.
- localStorage keys: `openrouter_api_key`, `theme`, `kanban_last_expiry_check`, and the AI-mode key in `KanbanContext.jsx`.

## Rules

- **Never add a server-side API key.** The design is bring-your-own-key: the key lives in the user's browser and is sent per request in `x-user-api-key`. Don't log it.
- Keep `vercel.json` rewrites intact: `/api/(.*)` → backend service, everything else → frontend. In production the frontend uses the same-origin `/api`.
- Keep `README.md` in sync when changing ports, endpoints, components or the AI flow.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
