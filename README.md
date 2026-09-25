# Forge Agent

Forge is a responsive AI coding workspace powered by Groq and designed for Cloudflare Workers. It combines an agent chat, project explorer, editor, preview canvas, terminal output, activity state, settings, PWA shell, D1 persistence, and optional R2 storage.

## Local development

```bash
pnpm install
pnpm dev
```

The frontend runs on Vite. The Worker API can be run separately with `pnpm worker:dev` and exposes `/api/health`, `/api/projects`, and `/api/agent`.

## Configuration

Copy `.env.example` into your secret manager. Keep `GROQ_API_KEY` server-side; it is read only by the Worker. Configure the D1 database id in `wrangler.toml`, then apply migrations with `pnpm db:migrate`.

Required production resources:

- Cloudflare Workers for the API/runtime
- D1 database bound as `DB`
- R2 bucket bound as `ARTIFACTS` when storing project objects
- `GROQ_API_KEY` as a Worker secret

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

GitHub Actions runs the build and Cloudflare deployment workflow. Set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets. GitHub and deployment actions are intentionally represented as explicit configuration surfaces until credentials are connected; the UI never reports an unperformed operation as successful.

## Security model

Workspace paths are validated against traversal and control characters at the Worker boundary. D1 records are related with foreign keys and cascading deletes. API credentials never enter client bundles, and errors returned to clients are sanitized. Add an authenticated identity layer and rate limiting before exposing project mutations publicly.
