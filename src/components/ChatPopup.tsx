import { useRef, useEffect, useState } from "react";
import { useChat } from "../hooks/useChat.ts";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  instanceId: number;
}

export function ChatPopup({ open, onClose, title = "Chat", instanceId }: Props) {
  const { messages, ready, send } = useChat(open ? instanceId : null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, messages.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    send(text);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overlay-enter">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg glass rounded-3xl flex flex-col overflow-hidden chat-popup-enter" style={{ height: "min(540px, 80dvh)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold t-primary">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full glass-inset flex items-center justify-center t-tertiary hover:t-primary transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {!ready && (
            <p className="text-sm t-tertiary text-center py-8">Loading conversation…</p>
          )}
          {ready && messages.length === 0 && (
            <p className="text-sm t-tertiary text-center py-8">Send a message to start</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.role === "user"
                  ? "bg-accent text-white rounded-br-lg"
                  : "glass-inset rounded-bl-lg"
              }`}>
                <p className={`text-[13.5px] leading-relaxed whitespace-pre-wrap ${msg.role === "agent" ? "t-primary" : ""}`}>
                  {msg.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-end gap-2 glass-inset rounded-2xl px-4 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-sm t-primary focus:outline-none resize-none leading-relaxed"
              placeholder="Message..."
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !ready}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-accent hover:bg-accent/90 disabled:opacity-25 disabled:cursor-not-allowed text-white transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
