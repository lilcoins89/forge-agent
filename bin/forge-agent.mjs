#!/usr/bin/env node

const [, , command = "help", ...args] = process.argv;
const baseUrl = (process.env.FORGE_AGENT_URL || "http://localhost:8787").replace(/\/$/, "");

function usage() {
  console.log(`Forge Agent CLI\n\nUsage:\n  forge-agent health\n  forge-agent status\n  forge-agent ask <prompt>\n\nEnvironment:\n  FORGE_AGENT_URL  Worker URL (default: http://localhost:8787)\n`);
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { accept: "application/json", "content-type": "application/json", ...(options.headers || {}) },
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Forge returned HTTP ${response.status} with non-JSON output: ${text.slice(0, 160)}`); }
  if (!response.ok) throw new Error(data.error || `Forge returned HTTP ${response.status}`);
  return data;
}

try {
  if (command === "help" || command === "--help" || command === "-h") { usage(); process.exit(0); }
  if (command === "health") { console.log(JSON.stringify(await request("/api/health"), null, 2)); process.exit(0); }
  if (command === "status") { console.log(JSON.stringify(await request("/api/provider-status"), null, 2)); process.exit(0); }
  if (command === "ask") {
    const prompt = args.join(" ").trim();
    if (!prompt) throw new Error("A prompt is required. Example: forge-agent ask 'Explain this project'");
    const result = await request("/api/agent", { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }) });
    console.log(result.message?.content || "The agent returned no message.");
    process.exit(0);
  }
  usage(); process.exit(1);
} catch (error) {
  console.error(`forge-agent: ${error instanceof Error ? error.message : "request failed"}`);
  process.exit(1);
}

export {};

// Keep this file executable in source checkouts; npm exposes it through the bin map.
// No credentials are read by the CLI: the Worker owns provider secrets.
