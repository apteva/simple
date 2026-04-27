import type { TelemetryEvent } from "../api/types.ts";
import type { ActivityItem } from "./ui-types.ts";

// Format an ISO timestamp as HH:MM (user's locale) for the feed.
function shortTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function duration(ms: number | undefined): string | undefined {
  if (!ms || ms <= 0) return undefined;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function truncate(s: string | undefined, max: number): string {
  if (!s) return "";
  const one = s.replace(/\s+/g, " ").trim();
  return one.length > max ? one.slice(0, max - 1) + "…" : one;
}

function formatArgs(args: any): string | undefined {
  if (!args) return undefined;
  if (typeof args === "string") return truncate(args, 120);
  if (typeof args === "object") {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(args)) {
      const val = typeof v === "string" ? v : JSON.stringify(v);
      parts.push(`${k}=${truncate(val, 40)}`);
      if (parts.join(", ").length > 120) break;
    }
    return parts.join(", ");
  }
  return undefined;
}

// Map one server telemetry event to an ActivityItem. Returns null for
// events that don't make sense to render in the feed. `actor` is set
// to the child thread id when the event doesn't belong to main.
export function mapTelemetry(ev: TelemetryEvent, mainThreadId = "main"): ActivityItem | null {
  const d = ev.data ?? {};
  const t = shortTime(ev.time);
  const actor = ev.thread_id && ev.thread_id !== "" && ev.thread_id !== mainThreadId ? ev.thread_id : undefined;
  const base = { id: ev.id, time: t, actor };

  switch (ev.type) {
    case "llm.start":
      return { ...base, type: "thought", title: `Thinking`, detail: d.model ? `model: ${d.model}` : undefined, status: "active" };

    case "llm.done":
      return {
        ...base,
        type: "thought",
        title: truncate(d.message, 80) || "Response",
        detail: d.tokens_in || d.tokens_out
          ? `↑${d.tokens_in ?? 0} ↓${d.tokens_out ?? 0}${d.cost_usd ? ` · $${Number(d.cost_usd).toFixed(4)}` : ""}`
          : undefined,
        status: "done",
        duration: duration(d.duration_ms),
      };

    case "llm.error":
      return { ...base, type: "thought", title: "LLM error", detail: truncate(d.error, 200), status: "error" };

    case "tool.call": {
      const name = d.name ?? "tool";
      const args = formatArgs(d.args);
      return { ...base, type: "tool", title: name, detail: args, status: "active" };
    }

    case "tool.result": {
      const name = d.name ?? "tool";
      const success = d.success !== false;
      return {
        ...base,
        type: "tool",
        title: name,
        detail: truncate(d.result, 120),
        status: success ? "done" : "error",
        duration: duration(d.duration_ms),
      };
    }

    case "tool.pending":
      return { ...base, type: "tool", title: `${d.name ?? "tool"} · awaiting approval`, status: "active" };
    case "tool.approved":
      return { ...base, type: "tool", title: `${d.name ?? "tool"} approved`, status: "done" };
    case "tool.rejected":
      return { ...base, type: "tool", title: `${d.name ?? "tool"} rejected`, status: "error" };

    case "thread.spawn":
      return {
        ...base,
        type: "event",
        title: `Thread spawned: ${d.id ?? ev.thread_id}`,
        detail: truncate(d.directive, 120),
        status: "done",
      };
    case "thread.done":
      return {
        ...base,
        type: "event",
        title: `Thread done: ${d.id ?? ev.thread_id}`,
        detail: truncate(d.result, 120),
        status: "done",
      };

    case "event.received":
      return {
        ...base,
        type: "response",
        title: `Event · ${d.source ?? "incoming"}`,
        detail: truncate(d.message, 160),
        status: "done",
      };

    case "instance.paused":
      return { ...base, type: "event", title: "Instance paused", status: "done" };
    case "instance.resumed":
      return { ...base, type: "event", title: "Instance resumed", status: "done" };
    case "mode.changed":
      return { ...base, type: "event", title: `Mode → ${d.mode}`, status: "done" };
    case "directive.evolved":
      return { ...base, type: "event", title: "Directive evolved", detail: truncate(d.directive, 160), status: "done" };

    default:
      return null;
  }
}

// Derive the current "thought" chip text from the latest telemetry.
export function deriveCurrentThought(recent: TelemetryEvent[]): string {
  for (const ev of recent) {
    if (ev.type === "tool.call") return `⚡ ${ev.data?.name ?? "tool"}`;
    if (ev.type === "llm.start") return `⟳ thinking${ev.data?.model ? ` · ${ev.data.model}` : ""}`;
    if (ev.type === "llm.done") return truncate(ev.data?.message, 60);
  }
  return "";
}
