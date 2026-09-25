export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  GROQ_API_KEY: string;
  ARTIFACTS?: R2Bucket;
  AGENT_SESSIONS?: DurableObjectNamespace;
}

type ChatMessage = { role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string };
const headers = { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type,authorization" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const tools = [
  { type:"function", function:{ name:"list_files", description:"List files in the current workspace", parameters:{ type:"object", properties:{ prefix:{type:"string"}}, required:[] } } },
  { type:"function", function:{ name:"read_file", description:"Read a file before changing it", parameters:{ type:"object", properties:{ path:{type:"string"}}, required:["path"] } } },
  { type:"function", function:{ name:"write_file", description:"Create or replace a file in the workspace", parameters:{ type:"object", properties:{ path:{type:"string"}, content:{type:"string"}}, required:["path","content"] } } },
  { type:"function", function:{ name:"delete_file", description:"Delete a file from the workspace", parameters:{ type:"object", properties:{ path:{type:"string"}}, required:["path"] } } },
];

export default { async fetch(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { headers });
  const url = new URL(request.url);
  if (url.pathname === "/api/health") return json({ ok:true, provider:"groq", model:"llama-3.3-70b-versatile", environment:env.ENVIRONMENT });
  if (url.pathname === "/api/agent" && request.method === "POST") {
    if (!env.GROQ_API_KEY) return json({ error:"GROQ_API_KEY is not configured" }, 503);
    const body = await request.json<{messages?:ChatMessage[]; workspace?:Record<string,string>}>();
    const workspace = body.workspace || {};
    const system = `You are Anvil, an autonomous senior coding agent. Work across the entire project. Before editing, inspect relevant files. Make minimal, production-quality changes, explain your plan, debug errors, and use the workspace tools. Current workspace files: ${Object.keys(workspace).join(", ") || "none provided"}.`;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method:"POST", headers:{"content-type":"application/json", authorization:`Bearer ${env.GROQ_API_KEY}`}, body:JSON.stringify({ model:"llama-3.3-70b-versatile", temperature:.15, messages:[{role:"system",content:system}, ...(body.messages || [])], tools, tool_choice:"auto" }) });
    const result = await response.json();
    if (!response.ok) return json({ error:"Groq API request failed", details:result }, response.status);
    return json({ provider:"groq", model:"llama-3.3-70b-versatile", message:(result as {choices?:Array<{message?:ChatMessage}>}).choices?.[0]?.message });
  }
  if (url.pathname === "/api/projects" && request.method === "GET") { const {results} = await env.DB.prepare("SELECT * FROM projects ORDER BY updated_at DESC LIMIT 50").all(); return json(results); }
  return new Response("Not found", { status:404, headers });
} };
