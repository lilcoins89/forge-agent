# Anvil agent backend

The browser calls `/api/agent`; the Worker calls Groq using the server-only `GROQ_API_KEY`. The frontend never receives the provider secret. The tool schema supports project inspection and file operations (`list_files`, `read_file`, `write_file`, and `delete_file`) and is designed for a subsequent workspace executor backed by D1/R2.

Configure locally with `npx wrangler secret put GROQ_API_KEY`. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to GitHub Actions for deployment.
