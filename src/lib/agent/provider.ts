export type AgentProvider = "groq";
export type AgentRole = "system" | "user" | "assistant" | "tool";

export interface AgentMessage { role: AgentRole; content: string; tool_call_id?: string; }
export interface AgentRequest { messages: AgentMessage[]; projectId?: string; workspace?: Record<string, string>; }
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
