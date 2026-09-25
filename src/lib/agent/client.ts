import type { AgentRequest, AgentResponse } from "@/lib/agent/provider";

export interface AgentClient { complete(request: AgentRequest): Promise<AgentResponse>; }
export const groqClient: AgentClient = { complete: (request) => fetch("/api/agent", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(request) }).then(async (response) => { const data = await response.json() as AgentResponse; if (!response.ok) throw new Error(data.error || "Groq request failed"); return data; }) };
