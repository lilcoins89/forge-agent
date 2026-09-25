export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  GROQ_API_KEY?: string;
  REDIS_URL?: string;
  REDIS_TOKEN?: string;
  UPSTASH_FOR_REDIS_KV_REST_API_URL?: string;
  UPSTASH_FOR_REDIS_KV_REST_API_TOKEN?: string;
  UPSTASH_FOR_REDIS_KV_REST_API_READ_ONLY_TOKEN?: string;
  UPSTASH_FOR_REDIS_REDIS_URL?: string;
  UPSTASH_FOR_REDIS_KV_URL?: string;
  DATABASE_URL?: string;
  ALLOWED_ORIGINS?: string;
  ARTIFACTS?: R2Bucket;
}

type ChatMessage = { role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string };
type FileBody = { path?: unknown; content?: unknown };

const MODEL = "openai/gpt-oss-120b";
const id = () => crypto.randomUUID();
const safePath = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 240 && !value.startsWith("/") && !value.split("/").includes("..") && !/[\\\0]/.test(value);

function headers(request: Request, env: Env): Headers {
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean);
  const result = new Headers({ "content-type": "application/json; charset=utf-8", "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS", "access-control-allow-headers": "content-type,authorization", "vary": "Origin" });
  if (origin && (allowed.length === 0 ? env.ENVIRONMENT !== "production" : allowed.includes(origin))) result.set("access-control-allow-origin", origin);
  return result;
}
function json(request: Request, env: Env, body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: headers(request, env) }); }
function projectKey(projectId: string, path: string) { return `projects/${projectId}/files/${path}`; }

function redisConfig(env: Env): { url?: string; token?: string } {
  // Prefer the Upstash REST variables injected by the integration. REDIS_URL is
  // also supported for self-managed deployments, but may be a redis:// URL that
  // Cloudflare Workers cannot contact directly.
  return {
    url: env.UPSTASH_FOR_REDIS_KV_REST_API_URL || env.UPSTASH_FOR_REDIS_KV_URL || env.REDIS_URL || env.UPSTASH_FOR_REDIS_REDIS_URL,
    token: env.UPSTASH_FOR_REDIS_KV_REST_API_TOKEN || env.REDIS_TOKEN || env.UPSTASH_FOR_REDIS_KV_REST_API_READ_ONLY_TOKEN,
  };
}

async function checkRedis(env: Env): Promise<{ configured: boolean; ok: boolean; error?: string }> {
  const config = redisConfig(env);
  if (!config.url) return { configured: false, ok: false, error: "Upstash Redis is not configured" };
  try {
    const redisUrl = new URL(config.url);
    if (redisUrl.protocol !== "https:") return { configured: true, ok: false, error: "Upstash REST URL must use https" };
    const token = config.token || decodeURIComponent(redisUrl.password);
    if (!token) return { configured: true, ok: false, error: "REDIS_TOKEN is not configured" };
    redisUrl.username = "";
    redisUrl.password = "";
    const response = await fetch(redisUrl, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(["PING"]) });
    if (!response.ok) return { configured: true, ok: false, error: `Redis returned HTTP ${response.status}` };
    const result = await response.json() as { result?: string; error?: string };
    return result.result === "PONG" ? { configured: true, ok: true } : { configured: true, ok: false, error: result.error || "Redis did not return PONG" };
  } catch { return { configured: true, ok: false, error: "Redis URL is invalid or unreachable" }; }
}

async function checkGroq(env: Env): Promise<{ configured: boolean; ok: boolean; model: string; error?: string }> {
  if (!env.GROQ_API_KEY) return { configured: false, ok: false, model: MODEL, error: "GROQ_API_KEY is not configured" };
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", { headers: { authorization: `Bearer ${env.GROQ_API_KEY}` } });
    if (!response.ok) return { configured: true, ok: false, model: MODEL, error: response.status === 401 ? "Groq API key was rejected" : `Groq returned HTTP ${response.status}` };
    return { configured: true, ok: true, model: MODEL };
  } catch { return { configured: true, ok: false, model: MODEL, error: "Groq is unreachable" }; }
}

const tools = [{ type: "function", function: { name: "list_files", description: "List files in the current workspace", parameters: { type: "object", properties: { prefix: { type: "string" } } } } }, { type: "function", function: { name: "read_file", description: "Read a file before changing it", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } } }, { type: "function", function: { name: "write_file", description: "Create or replace a file after explaining the change", parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } } }, { type: "function", function: { name: "delete_file", description: "Delete a file only after explicit user confirmation", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } } }];

export default { async fetch(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(request, env) });
  const url = new URL(request.url);
  try {
    if (url.pathname === "/api/health") return json(request, env, { ok: true, provider: "groq", model: MODEL, environment: env.ENVIRONMENT, storage: { d1: !!env.DB, r2: !!env.ARTIFACTS, neon: !!env.DATABASE_URL, redis: !!env.REDIS_URL } });
    if (url.pathname === "/api/provider-status" && request.method === "GET") {
      const [groq, redis] = await Promise.all([checkGroq(env), checkRedis(env)]);
      return json(request, env, { ok: groq.ok && (!redis.configured || redis.ok), groq, redis, neon: { configured: !!env.DATABASE_URL, note: "Neon credentials are available to the execution service" } });
    }
    if (url.pathname === "/api/projects" && request.method === "GET") { const result = await env.DB.prepare("SELECT id, name, repository, updated_at FROM projects ORDER BY updated_at DESC LIMIT 50").all(); return json(request, env, result.results); }
    if (url.pathname === "/api/projects" && request.method === "POST") { const body = await request.json() as { name?: unknown; ownerId?: unknown; repository?: unknown }; if (typeof body.name !== "string" || body.name.trim().length < 1 || body.name.trim().length > 80) return json(request, env, { error: "Project name must be between 1 and 80 characters" }, 400); const projectId = id(); const name = body.name.trim(); await env.DB.prepare("INSERT INTO projects (id, owner_id, name, repository) VALUES (?, ?, ?, ?)").bind(projectId, typeof body.ownerId === "string" ? body.ownerId : "local", name, typeof body.repository === "string" ? body.repository : null).run(); return json(request, env, { id: projectId, name }, 201); }
    const fileMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/files(?:\/(.*))?$/);
    if (fileMatch) { const projectId = decodeURIComponent(fileMatch[1]); const path = fileMatch[2] ? decodeURIComponent(fileMatch[2]) : ""; if (path && !safePath(path)) return json(request, env, { error: "Invalid file path" }, 400); if (!env.ARTIFACTS) return json(request, env, { error: "R2 file storage is not configured" }, 503); if (request.method === "GET" && path) { const object = await env.ARTIFACTS.get(projectKey(projectId, path)); if (!object) return json(request, env, { error: "File not found" }, 404); return new Response(object.body, { headers: new Headers({ "content-type": object.httpMetadata?.contentType || "text/plain; charset=utf-8", "cache-control": "private, no-store" }) }); } if (request.method === "PUT" && path) { const body = await request.json() as FileBody; if (typeof body.content !== "string" || body.content.length > 2_000_000) return json(request, env, { error: "File content must be text under 2 MB" }, 400); await env.ARTIFACTS.put(projectKey(projectId, path), body.content, { httpMetadata: { contentType: "text/plain; charset=utf-8" } }); return json(request, env, { ok: true, path }); } if (request.method === "DELETE" && path) { await env.ARTIFACTS.delete(projectKey(projectId, path)); return json(request, env, { ok: true }); } return json(request, env, { error: "File path is required" }, 400); }
    if (url.pathname === "/api/agent" && request.method === "POST") { if (!env.GROQ_API_KEY) return json(request, env, { error: "Groq is not configured. Add GROQ_API_KEY as a Worker secret." }, 503); const body = await request.json() as { messages?: ChatMessage[]; workspace?: Record<string, string> }; if (!Array.isArray(body.messages) || body.messages.length > 40) return json(request, env, { error: "Invalid conversation" }, 400); const workspace = body.workspace && typeof body.workspace === "object" ? body.workspace : {}; const system = `You are Forge, a senior autonomous coding agent. Inspect before editing, preserve architecture, explain changes, and never delete files without explicit confirmation. Workspace files: ${Object.keys(workspace).join(", ") || "none"}.`; const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${env.GROQ_API_KEY}` }, body: JSON.stringify({ model: MODEL, temperature: 0.15, max_tokens: 4096, stream: false, messages: [{ role: "system", content: system }, ...body.messages], tools, tool_choice: "auto" }) }); const result = await upstream.json() as { choices?: Array<{ message?: ChatMessage }> }; if (!upstream.ok) return json(request, env, { error: upstream.status === 429 ? "Groq is rate limited. Try again shortly." : "Groq request failed" }, upstream.status >= 500 ? 502 : upstream.status); const message = result.choices?.[0]?.message; if (!message) return json(request, env, { error: "Groq returned no assistant message" }, 502); return json(request, env, { provider: "groq", model: MODEL, message }); }
    return json(request, env, { error: "Not found" }, 404);
  } catch (error) { console.error("[forge-worker] request failed", error); return json(request, env, { error: "The request could not be completed safely" }, 500); }
} }; 

export { safePath };
