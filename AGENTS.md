# Agent Instructions — Hire AI (tuyển dụng + chatbot AI)

## Package Manager

Use **npm** (root `package-lock.json`).

- Install: `npm run install:all`
- Verify before merge: `npm run verify:all` (format check, lint check, tests, client build)
- Dev: `npm run dev:server` (port 5000), `npm run dev:client` (Vite, proxies `/api`)

## Monorepo layout

| Path | Stack |
|------|--------|
| `client/` | React 19, Vite, Tailwind, Radix, Zod, RHF, Vitest, i18next |
| `server/` | Express 5, MySQL (`mysql2`), Prisma client, JWT, Socket.IO, Jest, Swagger |

API: `/api`, auth: `/api/auth`. Business logic in `server/src/services/`, routes in `server/src/routes/`, shared middleware in `server/src/middlewares/`.

## Database

- MySQL; migrations/seeds: `npm --prefix server run db:migrate` / `db:seed` / `db:reset`
- Prisma: `server/prisma/schema.prisma`; `npm --prefix server run prisma:validate` / `prisma:generate`

## Commit Attribution

AI commits MUST include:

```
Co-Authored-By: <model name> <noreply@anthropic.com>
```

(Use the actual tool/model attribution line your environment specifies.)

## File-scoped commands

| Task | Command |
|------|---------|
| Lint one server file | `cd server && npx eslint path/to/file.js` |
| Lint one client file | `cd client && npx eslint path/to/file.jsx` |
| Server tests | `npm --prefix server test -- --runInBand path/to/file.test.js` |
| Client tests | `npm --prefix client test -- path/to/file.test.jsx` |
| Prettier (server) | `cd server && npx prettier --write path/to/file.js` |
| Prettier (client) | `cd client && npx prettier --write "src/path/to/file.jsx"` |

## Domain & safety (bắt buộc)

- **PII / HR data:** Minimize collection; enforce authz on employer/candidate/admin routes; never log passwords, tokens, full CV text, or API keys.
- **AI features:** No key in client; server-only env (`AI_API_KEY`, provider config). Sanitize user input before LLM; avoid sending unnecessary personal data in prompts.
- **Uploads / rich text:** Validate type/size; safe rendering on client (project uses DOMPurify where applicable).
- **Realtime:** Socket.IO with same CORS/JWT patterns as HTTP.

## Reference docs

- `README.md` — architecture, health endpoints, scripts
- `docs/DEPLOYMENT.md` — production, env, proxy

Do not treat `everything-claude-code/` as the app; it is a separate toolkit repo.
