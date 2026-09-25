# Forge Agent

Forge is a responsive, installable AI coding workspace for planning changes, editing project files, previewing work, and shipping deployments. The UI is designed for desktop and mobile/PWA use.

## Local development

```bash
npm install
npm run dev
```

Run the Cloudflare API locally with `npm run worker:dev`. The frontend build is validated by `npm run build`.

## Cloudflare setup

1. Create a D1 database: `npx wrangler d1 create forge-agent`.
2. Put the returned database ID in `wrangler.toml`.
3. Apply the schema: `npm run db:migrate`.
4. Deploy: `npm run worker:deploy`.
5. For GitHub Actions, add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets.

The worker currently exposes `/api/health` and project CRUD endpoints. AI provider credentials should be stored as Worker secrets, never in the browser bundle. The chat UI is ready for the agent provider/tool loop to be connected to these endpoints.

## Inspired by OpenChamber

The workspace follows the same agentic development direction as [OpenChamber](https://github.com/openchamber/openchamber), while remaining an independent implementation.
