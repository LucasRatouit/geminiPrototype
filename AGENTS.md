# AGENTS.md

## Architecture

Two-package monorepo (no workspace tooling — each package is independent):
- **back/** — Express 5 API, plain JS (ESM), not TypeScript
- **front/** — Vite + React 19 + Tailwind CSS + shadcn/ui (TypeScript)

Text-based narrative RPG: player interacts with AI narrating stories for character Élysia.

### Ports & proxying

- Back: port 3000. Front dev server: port 4000.
- Vite proxies `/api` → `http://back:3000` (Docker network hostname). For local dev without Docker, change the proxy target to `http://localhost:3000` in `front/vite.config.ts`.

### AI response contract

Both Gemini and Ollama clients must return JSON matching: `{ story: string, actions: string[], xp: number }`.

Gemini endpoint: `POST /api/ai/generate/gemini` — full response.
Ollama endpoint: `GET /api/ai/generate/ollama/stream` — SSE stream.

### State

Messages are stored in-memory (`messageList` array in `back/index.js`). All state is lost on server restart.

## Commands

```bash
# Back (from back/)
npm run dev          # nodemon with hot reload
npm start            # node index.js

# Front (from front/)
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build
npm run lint         # eslint .
npm run preview      # Vite preview built app
```

No test runner is configured (back test script is a placeholder, front has none).

## Type checking

```bash
# Front only (back is plain JS)
cd front && npx tsc -b
```

**Important**: `tsconfig.app.json` has `strict: false`, `noImplicitAny: false`. CLAUDE.md mentions "TypeScript strict partout" but the actual config is lenient. Trust the tsconfig.

## Front conventions

- Path alias `@/` maps to `src/` (configured in vite.config.ts and tsconfig.json).
- shadcn/ui components live in `src/components/ui/` (new-york style, tsx).
- Tailwind v4 with `@tailwindcss/vite` plugin — no `tailwind.config.*` file.
- Mobile-first: write mobile styles first, then `md:` / `lg:` breakpoints.

## Docker

```bash
docker compose up          # dev targets with hot reload
```

- Back Dockerfile: `dev` target uses nodemon; production target uses `npm start`.
- Front Dockerfile: `dev` target runs Vite dev server; production multi-stage builds to nginx.
- Ollama client connects to `http://host.docker.internal:11434` — only works inside Docker. Change this for local-only runs.

## CI

`.github/workflows/docker-image.yml` — builds and pushes Docker images to Docker Hub (`rlucasfr/gemini-prototype-front`, `rlucasfr/gemini-prototype-back`) on push to `main`. No test/lint step in CI.

## Env vars

- `GEMINI_API_KEY` — required for Gemini client (loaded via dotenv in back)
- `OLLAMA_MODEL` — defaults to `qwen3.5:9b` if unset
- `PORT` — back server port, defaults to 3000