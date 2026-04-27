import { useState } from "react";
import type { SubAgent } from "../lib/ui-types.ts";

interface Props {
  items: SubAgent[];
  onChatWith?: (subAgent: SubAgent) => void;
}

const statusDot: Record<SubAgent["status"], string> = {
  working: "bg-accent tool-breathe",
  idle: "bg-gray-400",
  done: "bg-green",
};

const statusLabel: Record<SubAgent["status"], string> = {
  working: "active",
  idle: "idle",
  done: "done",
};

const statusPill: Record<SubAgent["status"], string> = {
  working: "bg-accent-light text-accent",
  idle: "glass-inset t-tertiary",
  done: "bg-green-light text-green",
};

export function SubAgentsCard({ items, onChatWith }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="glass rounded-2xl p-5 fade-up flex flex-col" style={{ height: 240 }}>
      <h2 className="text-xs font-semibold uppercase tracking-wider t-tertiary mb-4 shrink-0">
        Sub-agents <span className="t-tertiary font-normal normal-case">· {items.length}</span>
      </h2>
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {items.map((sa) => {
          const isOpen = expanded === sa.id;
          return (
            <div
              key={sa.id}
              onClick={() => setExpanded(isOpen ? null : sa.id)}
              className={`rounded-xl px-3 py-2 cursor-pointer transition-all duration-200 ${
                sa.kind === "temp" ? "border border-dashed" : "glass-inset"
              }`}
              style={sa.kind === "temp" ? { borderColor: "var(--border)" } : undefined}
            >
              <div className="flex items-center gap-2.5">
                <span className={`shrink-0 w-2 h-2 rounded-full ${statusDot[sa.status]}`} />
                <span className="text-sm font-medium t-primary truncate flex-1">{sa.name}</span>
                {sa.kind === "temp" && (
                  <span className="text-[10px] t-tertiary shrink-0">⏱ temp</span>
                )}
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusPill[sa.status]} shrink-0`}>
                  {statusLabel[sa.status]}
                </span>
                {onChatWith && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onChatWith(sa); }}
                    title={`Chat with ${sa.name}`}
                    className="shrink-0 w-6 h-6 rounded-full glass-inset flex items-center justify-center t-tertiary hover:text-accent transition-colors"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                )}
              </div>
              {isOpen && (
                <p className="text-[12.5px] t-secondary mt-1.5 leading-relaxed">
                  {sa.directive}
                </p>
              )}
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-sm t-tertiary text-center py-4">No sub-agents</p>
        )}
      </div>
    </div>
  );
}
