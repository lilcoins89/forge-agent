import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const MODEL = "openai/gpt-oss-120b";
const agentTools = [
  { type: "function", function: { name: "list_files", description: "List files in the current workspace before making changes", parameters: { type: "object", properties: { prefix: { type: "string" } } } } },
  { type: "function", function: { name: "read_file", description: "Read a file before changing it", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } } },
  { type: "function", function: { name: "write_file", description: "Create or replace a file after explaining the change", parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } } },
  { type: "function", function: { name: "create_task", description: "Add a concrete coding task to the project task list", parameters: { type: "object", properties: { title: { type: "string" }, details: { type: "string" } }, required: ["title"] } } },
];

function localAgentApi(env: Record<string, string>): Plugin {
  return {
    name: "forge-local-agent-api",
    configureServer(server) {
      server.middlewares.use("/api/agent", async (request, response) => {
        if (request.method !== "POST") { response.statusCode = 405; response.end(JSON.stringify({ error: "Method not allowed" })); return; }
        if (!env.GROQ_API_KEY) { response.statusCode = 503; response.setHeader("content-type", "application/json"); response.end(JSON.stringify({ error: "GROQ_API_KEY is not configured for the local agent server." })); return; }
        let raw = "";
        for await (const chunk of request) raw += chunk;
        try {
          const body = JSON.parse(raw) as { messages?: unknown[]; workspace?: Record<string, string> };
          if (!Array.isArray(body.messages) || body.messages.length > 40) throw new Error("Invalid conversation");
          const workspace = body.workspace && typeof body.workspace === "object" ? body.workspace : {};
          const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${env.GROQ_API_KEY}` },
            body: JSON.stringify({ model: MODEL, temperature: 0.2, max_completion_tokens: 2048, reasoning_effort: "low", stream: false, tools: agentTools, tool_choice: "auto", messages: [{ role: "system", content: `You are Forge, a friendly senior coding partner. Answer general questions conversationally, help research topics clearly, and help plan and implement coding tasks. Inspect the workspace before proposing edits, preserve existing architecture, explain changes, and never claim to have run a command or changed a file unless a tool result proves it. Workspace files: ${Object.keys(workspace).join(", ") || "none"}.` }, ...body.messages] }),
          });
          const text = await upstream.text();
          response.statusCode = upstream.ok ? 200 : upstream.status === 429 ? 429 : 502;
          response.setHeader("content-type", "application/json; charset=utf-8");
          if (!upstream.ok) { response.end(JSON.stringify({ error: upstream.status === 401 ? "Groq rejected GROQ_API_KEY. Check the server environment variable." : upstream.status === 429 ? "Groq is rate limited. Try again shortly." : "Groq request failed." })); return; }
          const result = JSON.parse(text) as { choices?: Array<{ message?: unknown }> };
          const message = result.choices?.[0]?.message;
          response.end(JSON.stringify({ provider: "groq", model: MODEL, message }));
        } catch (error) {
          response.statusCode = 400;
          response.setHeader("content-type", "application/json; charset=utf-8");
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : "The agent request was invalid." }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return { plugins: [react(), tailwindcss(), localAgentApi(env)], resolve: { alias: { "@": path.resolve(__dirname, "src") } }, server: { host: "0.0.0.0", port: 5173 }, build: { target: "es2022" } };
});
