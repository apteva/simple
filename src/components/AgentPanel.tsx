import { useMemo, useState } from "react";
import { StatusHeader } from "./StatusHeader.tsx";
import { ActivityFeed } from "./ActivityFeed.tsx";
import { SubAgentsCard } from "./SubAgentsCard.tsx";
import { TasksCard } from "./TasksCard.tsx";
import { ChatPopup } from "./ChatPopup.tsx";
import { useInstance } from "../hooks/useInstance.ts";
import { useTelemetry } from "../hooks/useTelemetry.ts";
import { useTasks } from "../hooks/useTasks.ts";
import { useAgentStatus } from "../hooks/useAgentStatus.ts";
import { mapTelemetry, deriveCurrentThought } from "../lib/mapTelemetry.ts";
import type { SubAgent, RunStatus } from "../lib/ui-types.ts";

interface Props {
  instanceId: number;
  dark: boolean;
  onToggleDark: () => void;
}

function deriveRunStatus(paused: boolean, rate: string | undefined, running: boolean): RunStatus {
  if (!running) return "stopped";
  if (paused) return "paused";
  if (rate && rate !== "" && rate !== "idle") return "working";
  return "idle";
}

export function AgentPanel({ instanceId, dark, onToggleDark }: Props) {
  const [chatTargetThread, setChatTargetThread] = useState<string | null>(null);
  const { instance, status, threads, channels, refreshThreads, refreshStatus } = useInstance(instanceId);
  const { events } = useTelemetry({
    instanceId,
    onThreadStructureChange: refreshThreads,
    onPauseChange: refreshStatus,
  });
  const { tasks } = useTasks(instanceId);
  const agentStatus = useAgentStatus(instanceId);

  const mainThreadId = "main";
  const children = threads.filter((t) => t.id !== mainThreadId);

  const activity = useMemo(
    () => events.map((e) => mapTelemetry(e, mainThreadId)).filter((x): x is NonNullable<typeof x> => !!x),
    [events],
  );

  const derivedThought = useMemo(() => deriveCurrentThought(events), [events]);
  // Prefer the agent-authored status (via `status_set` MCP) when set;
  // otherwise fall back to the latest telemetry-derived thought.
  const currentThought = agentStatus?.message
    ? (agentStatus.emoji ? `${agentStatus.emoji} ${agentStatus.message}` : agentStatus.message)
    : derivedThought;

  const chatEnabled = channels.some((c) => c.name === "chat" || c.type === "chat");
  const running = instance?.status === "running";
  const runStatus = deriveRunStatus(status?.paused ?? false, status?.rate, running);

  const subAgents: SubAgent[] = children.map((t) => ({
    id: t.id,
    name: t.id,
    directive: t.directive,
    kind: "permanent",
    status: t.rate === "" || t.rate === "idle" ? "idle" : "working",
  }));

  return (
    <div className="space-y-4">
      <StatusHeader
        name={instance?.name ?? "Agent"}
        directive={instance?.directive ?? ""}
        status={runStatus}
        currentThought={currentThought}
        dark={dark}
        onToggleDark={onToggleDark}
      />

      <ActivityFeed items={activity} mainActor={children.length > 0 ? instance?.name : undefined} />

      {tasks.length > 0 && <TasksCard tasks={tasks} />}

      {children.length > 0 && (
        <SubAgentsCard
          items={subAgents}
          onChatWith={() => {}}
        />
      )}

      <div className="flex justify-center">
        <button
          onClick={() => chatEnabled && setChatTargetThread(mainThreadId)}
          disabled={!chatEnabled}
          title={chatEnabled ? undefined : "Chat channel not connected"}
          className={`glass rounded-full px-5 py-2.5 flex items-center gap-2.5 transition-transform ${
            chatEnabled ? "hover:scale-[1.02] active:scale-[0.98]" : "opacity-45 cursor-not-allowed"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={chatEnabled ? "text-accent" : "t-tertiary"}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className={`text-sm font-medium ${chatEnabled ? "t-primary" : "t-tertiary"}`}>
            {chatEnabled ? `Chat with ${instance?.name ?? "agent"}` : "Chat (disabled)"}
          </span>
        </button>
      </div>

      <ChatPopup
        key={chatTargetThread ?? "closed"}
        open={chatTargetThread !== null}
        onClose={() => setChatTargetThread(null)}
        title={instance?.name ?? "Chat"}
        instanceId={instanceId}
      />
    </div>
  );
}
