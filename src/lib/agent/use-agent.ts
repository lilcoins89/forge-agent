import { useMemo, useState } from "react";
import { executeAgentTool, runAgent } from "@/lib/agent/provider";
import type { AgentMessage } from "@/lib/agent/provider";

export function useAgent() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const transcript = useMemo(() => messages.filter((message) => message.role !== "system"), [messages]);
  const send = async (content: string, workspace?: Record<string, string>) => {
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next); setBusy(true); setError(undefined);
    try {
      const workingWorkspace = { ...(workspace || {}) };
      let conversation = next;
      for (let step = 0; step < 8; step += 1) {
        const result = await runAgent({ messages: conversation, workspace: workingWorkspace });
        if (!result.message) break;
        const assistant = result.message;
        setMessages((current) => current.some((message) => message === assistant) ? current : [...current, assistant]);
        conversation = [...conversation, assistant];
        if (!assistant.tool_calls?.length) break;
        const toolResults = assistant.tool_calls.map((call) => ({ role: "tool" as const, tool_call_id: call.id, name: call.function.name, content: JSON.stringify(executeAgentTool(call.function.name, call.function.arguments, workingWorkspace)) }));
        conversation = [...conversation, ...toolResults];
      }
    } catch (cause) { setError(typeof cause === "string" ? cause : cause instanceof Error ? cause.message : JSON.stringify(cause)); }
    finally { setBusy(false); }
  };
  return { messages: transcript, busy, error, send };
}
