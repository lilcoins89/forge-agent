export type AgentProvider = "groq";
export type AgentRole = "system" | "user" | "assistant" | "tool";

export interface AgentMessage { role: AgentRole; content: string; tool_call_id?: string; }
export interface AgentRequest { messages: AgentMessage[]; projectId?: string; workspace?: Record<string, string>; }
export interface AgentResponse { message?: AgentMessage; error?: string; provider: AgentProvider; model: string; }

export async function runAgent(request: AgentRequest): Promise<AgentResponse> {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });
  const data = await response.json() as AgentResponse;
  if (!response.ok) throw new Error(data.error || "The agent request failed");
  return data;
}
