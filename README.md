# apteva-simple

Read-only UI for watching an Apteva agent work. Intended for client-facing
deployments: clients log in (or open a kiosk URL with an API key) and see
their agent's directive, live thoughts, tool calls, sub-agents, and chat.

No agent editing, no hiring, no team management — pure observation.

## Endpoints consumed

All under `/api`, session cookie or `X-API-Key` auth:

| Area       | Endpoints                                              |
|------------|--------------------------------------------------------|
| Auth       | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Projects   | `GET /projects`, `GET /projects/{id}`                  |
| Instances  | `GET /instances`, `GET /instances/{id}`                |
| Instance   | `/status`, `/threads`, `/channels`, `/chat-history`    |
| Telemetry  | `GET /telemetry?...`, **`GET /telemetry/stream` (SSE)** |
| Chat       | `/apps/channel-chat/{chats,messages,stream}`           |

## URL parameters

| Param        | Effect                                                   |
|--------------|----------------------------------------------------------|
| `?instance=N`| Deep-link straight to instance N, skip instance picker   |
| `?project=ID`| Filter the instance picker to one project                |
| `?api_key=X` | Kiosk mode — no login screen, send `X-API-Key` header    |

## Development

```bash
bun install
API_BASE=http://localhost:8080/api bun run dev
```

## Build-time env

| Var               | Default | What it does                      |
|-------------------|---------|-----------------------------------|
| `API_BASE`        | `/api`  | Base URL for all server calls     |
| `DEFAULT_PROJECT` | ``      | Default project id for the picker |

## Three ways to deploy

### 1. Standalone Docker container (reverse-proxy mode)

```bash
docker build -t apteva-simple .
docker run -p 8088:80 -e APTEVA_SERVER_URL=http://your-server:8080 apteva-simple
```

The container is nginx serving the static bundle and reverse-proxying
`/api` to the server — same-origin, so the session cookie flows
naturally and SSE works without CORS.

### 2. Full stack locally via compose

```bash
docker compose up --build
# open http://localhost:8088
```

### 3. Baked into apteva-server

`apteva-server`'s `main.go` serves `$DATA_DIR/dashboard` as its SPA
fallback — so if you drop the built `dist/` there, the UI is available
directly at the server's own root URL:

```bash
DATA_DIR=~/.apteva/data ./scripts/install-into-server.sh
# Then restart apteva-server
```

No separate container, no proxy, same origin → cookie + SSE both just work.

## Architecture

```
src/
├── api/             ─ fetch wrapper + typed server clients
│   ├── client.ts       credentials:"include", 401 handling, SSE URL builder
│   ├── auth.ts         /auth/{login,logout,me}
│   ├── projects.ts     /projects, /instances
│   ├── instances.ts    /instances/{id}/{status,threads,channels,chat-history}
│   ├── telemetry.ts    /telemetry + /telemetry/stream SSE
│   ├── chat.ts         /apps/channel-chat/{chats,messages,stream}
│   └── types.ts        mirrors Go types from apteva/server
├── hooks/           ─ stateful glue
│   ├── useAuth.ts      bootstrap session or API key
│   ├── useInstance.ts  instance + status + threads + channels
│   ├── useTelemetry.ts backfill + live SSE, trimmed ring buffer
│   └── useChat.ts      chat history + live stream + send
├── lib/
│   ├── ui-types.ts     internal render types
│   └── mapTelemetry.ts TelemetryEvent → ActivityItem
├── pages/
│   └── Login.tsx
├── components/      ─ unchanged visual layer (StatusHeader, ActivityFeed,
│   │                  SubAgentsCard, ChatPopup, AgentPanel)
└── App.tsx          ─ auth gate, URL routing, instance picker
```
