import { useMemo, useState } from "react";

type Message = { role: "user" | "assistant"; text: string };

const starterMessages: Message[] = [
  { role: "assistant", text: "Welcome to Forge. Describe what you want to build and I’ll plan the files, implement the change, and keep your workspace ready to ship." },
];

export function App() {
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");
  const [running, setRunning] = useState(false);
  const [files, setFiles] = useState(["src/App.tsx", "src/styles.css", "package.json", "README.md"]);

  const stats = useMemo(() => ({ files: files.length, changes: 12, tests: "Ready" }), [files]);
  const send = () => {
    const value = prompt.trim();
    if (!value || running) return;
    setPrompt("");
    setMessages((current) => [...current, { role: "user", text: value }]);
    setRunning(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, { role: "assistant", text: "I’ve queued this request. Connect an AI provider in Settings to let Forge edit files, run checks, and open a deployment preview." }]);
      setRunning(false);
    }, 500);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">✦</span><span>forge</span><small>WORKSPACE</small></div>
        <div className="project-pill"><span className="status-dot" /> forge-agent <span className="muted">/</span> main</div>
        <div className="top-actions"><button className="icon-button" aria-label="Toggle theme">☼</button><button className="avatar">LC</button></div>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="sidebar-section"><div className="section-label">PROJECT <button onClick={() => setFiles((f) => [...f, "src/new-file.ts"])}>＋</button></div><div className="project-card"><span className="folder">⌘</span><div><strong>forge-agent</strong><small>Local workspace</small></div><span className="chevron">⌄</span></div></div>
          <div className="sidebar-section files"><div className="section-label">EXPLORER <span>{files.length}</span></div>{files.map((file) => <button className="file-row" key={file} onClick={() => setActiveTab("preview")}><span>{file.endsWith(".tsx") ? "◈" : file.endsWith(".css") ? "▦" : "◇"}</span>{file}</button>)}</div>
          <div className="sidebar-footer"><button className="side-link">⚙ <span>Settings</span></button><button className="side-link">? <span>Docs & shortcuts</span></button></div>
        </aside>

        <div className="main-panel">
          <div className="mobile-tabs"><button className={activeTab === "chat" ? "selected" : ""} onClick={() => setActiveTab("chat")}>Agent</button><button className={activeTab === "preview" ? "selected" : ""} onClick={() => setActiveTab("preview")}>Preview</button></div>
          <div className="content-grid">
            <section className={`agent-panel ${activeTab === "preview" ? "mobile-hidden" : ""}`}>
              <div className="panel-heading"><div><span className="eyebrow">AI CODING AGENT</span><h1>Build in conversation.</h1></div><span className="live-badge"><span className="status-dot" /> Ready</span></div>
              <div className="messages">{messages.map((message, index) => <div className={`message ${message.role}`} key={`${message.role}-${index}`}><div className="message-label">{message.role === "assistant" ? "FORGE" : "YOU"}</div><p>{message.text}</p></div>)}{running && <div className="message assistant"><div className="message-label">FORGE</div><p className="thinking">Thinking<span>.</span><span>.</span><span>.</span></p></div>}</div>
              <div className="composer"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Ask Forge to build, fix, or explain..." rows={3} /><div className="composer-bottom"><span className="hint">↵ to send · ⇧↵ for newline</span><button className="send-button" disabled={running || !prompt.trim()} onClick={send}>Send <span>⌘↵</span></button></div></div>
            </section>
            <section className={`preview-panel ${activeTab === "chat" ? "mobile-hidden" : ""}`}><div className="preview-heading"><div><span className="eyebrow">LIVE PREVIEW</span><strong>Browser canvas</strong></div><div className="preview-actions"><button>↗</button><button>⋯</button></div></div><div className="browser-frame"><div className="browser-bar"><span className="browser-dots">● ● ●</span><span className="address">localhost:5173</span><span>↻</span></div><div className="site-preview"><div className="preview-logo">forge<span>.</span></div><div className="preview-hero"><span>YOUR NEXT IDEA</span><h2>Make something<br /><i>remarkable.</i></h2><p>A calm, focused space to turn thoughts into working software.</p><button>Start building →</button></div><div className="preview-grid"><span>01 / CREATE</span><span>02 / SHIP</span></div></div></div></section>
          </div>
          <footer className="statusbar"><span><span className="status-dot" /> All systems operational</span><span className="status-meta">{stats.files} files · {stats.changes} changes · Tests {stats.tests}</span><button className="deploy-button">Deploy <span>↗</span></button></footer>
        </div>
      </section>
      <nav className="mobile-nav"><button>⌂<small>Workspace</small></button><button className="active">✦<small>Agent</small></button><button>◫<small>Preview</small></button><button>⚙<small>Settings</small></button></nav>
    </main>
  );
}
