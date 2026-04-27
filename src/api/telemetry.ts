import { apiFetch, sseUrl } from "./client.ts";
import type { TelemetryEvent } from "./types.ts";

export function queryTelemetry(params: {
  instanceId: number;
  type?: string;
  threadId?: string;
  since?: string;
  limit?: number;
}): Promise<TelemetryEvent[]> {
  const q = new URLSearchParams();
  q.set("instance_id", String(params.instanceId));
  if (params.type) q.set("type", params.type);
  if (params.threadId) q.set("thread_id", params.threadId);
  if (params.since) q.set("since", params.since);
  if (params.limit) q.set("limit", String(params.limit));
  return apiFetch<TelemetryEvent[]>(`/telemetry?${q.toString()}`);
}

export interface StreamHandle {
  close: () => void;
}

export function streamTelemetry(
  instanceId: number,
  onEvent: (ev: TelemetryEvent) => void,
  onError?: (err: Event) => void,
): StreamHandle {
  const url = sseUrl("/telemetry/stream", { instance_id: instanceId });
  const es = new EventSource(url, { withCredentials: true });
  es.onmessage = (msg) => {
    if (!msg.data) return;
    try {
      const ev = JSON.parse(msg.data) as TelemetryEvent;
      // Server sometimes emits `data` as RawMessage-stringified JSON — normalize.
      if (typeof ev.data === "string") {
        try { ev.data = JSON.parse(ev.data); } catch { /* leave as-is */ }
      }
      onEvent(ev);
    } catch {
      // drop malformed frame
    }
  };
  if (onError) es.onerror = onError;
  return { close: () => es.close() };
}
