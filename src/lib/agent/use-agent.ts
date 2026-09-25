import { useMemo, useState } from "react";
import { runAgent } from "@/lib/agent/provider";
import type { AgentMessage } from "@/lib/agent/provider";

export function useAgent() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const transcript = useMemo(() => messages.filter((message) => message.role !== "system"), [messages]);
  const send = async (content: string, workspace?: Record<string, string>) => {
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next); setBusy(true); setError(undefined);
    try { const result = await runAgent({ messages: next, workspace }); if (result.message) setMessages((current) => [...current, result.message!]); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Agent request failed"); }
    finally { setBusy(false); }
  };
  return { messages: transcript, busy, error, send };
}
