# Anvil

A coding agent with a chatbox that writes real website files, previews them live, and ships the project to GitHub.

Inspired by the tool-loop style of [OpenAI Codex](https://github.com/openai/codex) and the ship-to-GitHub workflow of [Stakpak](https://github.com/stakpak/agent) — implemented from scratch, not installed.

## What it does

- Chat with Anvil to describe a site
- The agent writes `index.html`, CSS, JS, and other files in a virtual workspace
- Live preview updates as files change
- Edit any file by hand
- Push the whole workspace to a GitHub repository (creates the repo if needed)

## Setup

```bash
npm install
npm run dev
```

Open the app, then **Settings**:

1. **xAI API key** — from [console.x.ai](https://console.x.ai) (stored in `localStorage` as `anvil.xai.key`, or set `VITE_XAI_API_KEY`)
2. **GitHub token** — classic or fine-grained PAT with `repo` scope

## GitHub shipping

Use **Ship** in the top bar, or ask the agent to push. Anvil can create the repository and commit every workspace file via the Git Data API.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Zustand (workspace + chat persistence)
- xAI Chat Completions with tool calling (`grok-4.5`)
- GitHub REST + Git Data API for create/push

## License

MIT
