# Anvil

A coding agent with a chatbox that writes real website files, previews them live, and ships the project to GitHub.

Inspired by the tool-loop style of [OpenAI Codex](https://github.com/openai/codex) and the ship-to-GitHub workflow of [Stakpak](https://github.com/stakpak/agent) — implemented from scratch, not installed.

**Live app:** built in Grok App Builder.

## What it does

- Chat with Anvil to describe a site
- The agent writes `index.html`, CSS, JS, and other files in a virtual workspace
- Live preview updates as files change
- Edit any file by hand
- Push the whole workspace to a GitHub repository (creates the repo if needed)

## GitHub shipping

Add a personal access token with `repo` scope in Settings, then use **Ship**. Anvil can also create the repository and commit files when you ask in chat.

## Project repo

This repository: https://github.com/lilcoins89/forge-agent
