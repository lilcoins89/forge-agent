export type AgentProvider = "groq";
export type AgentRole = "system" | "user" | "assistant" | "tool";

export interface AgentToolCall { id: string; type: "function"; function: { name: string; arguments: string }; }
export interface AgentMessage { role: AgentRole; content: string; tool_call_id?: string; tool_calls?: AgentToolCall[]; name?: string; }
export interface AgentRequest { messages: AgentMessage[]; projectId?: string; workspace?: Record<string, string>; }

export function executeAgentTool(name: string, rawArguments: string, workspace: Record<string, string>) {
  let args: { path?: string; prefix?: string; content?: string; title?: string; details?: string } = {};
  try { args = JSON.parse(rawArguments) as typeof args; } catch { return { ok: false, error: "Tool arguments were not valid JSON." }; }
  if (name === "list_files") return { ok: true, files: Object.keys(workspace).filter((path) => !args.prefix || path.startsWith(args.prefix)).sort() };
  if (name === "read_file") return args.path && Object.hasOwn(workspace, args.path) ? { ok: true, path: args.path, content: workspace[args.path] } : { ok: false, error: `File not found: ${args.path || "(missing path)"}` };
  if (name === "write_file") {
    if (!args.path || args.path.includes("..") || args.path.startsWith("/")) return { ok: false, error: "File path must be relative and cannot contain '..'." };
    if (typeof args.content !== "string" || args.content.length > 2_000_000) return { ok: false, error: "File content must be text under 2 MB." };
    workspace[args.path] = args.content;
    return { ok: true, path: args.path, bytes: args.content.length, action: "written" };
  }
  if (name === "create_task") return { ok: true, task: { title: args.title || "Untitled task", details: args.details || "" } };
  return { ok: false, error: `Unknown tool: ${name}` };
}
export interface AgentResponse { message?: AgentMessage; error?: string; provider: AgentProvider; model: string; }

function agentEndpoint() {
  const configured = (import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL;
  if (!configured) return "/api/agent";
  const base = configured.trim().endsWith("/") ? configured.trim().slice(0, -1) : configured.trim();
  return `${base}/api/agent`;
}

async function readAgentResponse(response: Response): Promise<AgentResponse> {
  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();
  if (!contentType.includes("application/json")) {
    const detail = body.replace(/\\s+/g, " ").trim().slice(0, 180);
    throw new Error(response.status === 404
      ? "The agent API endpoint was not found. Start the Cloudflare Worker or configure VITE_API_BASE_URL."
      : `The agent API returned ${response.status || "an invalid"} non-JSON data${detail ? `: ${detail}` : "."}`);
  }
  try {
    return JSON.parse(body) as AgentResponse;
  } catch {
    throw new Error("The agent API returned malformed JSON. Check the Worker response.");
  }
}

export async function runAgent(request: AgentRequest): Promise<AgentResponse> {
  let response: Response;
  try {
    response = await fetch(agentEndpoint(), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error("Could not reach the agent API. Start the Cloudflare Worker or check VITE_API_BASE_URL.");
  }
  const data = await readAgentResponse(response);
  if (!response.ok) throw new Error(data.error || "The agent request failed");
  if (!data.message) throw new Error("The agent API returned no assistant message.");
  return data;
}
