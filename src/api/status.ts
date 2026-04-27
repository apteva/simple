import { apiFetch, sseUrl } from "./client.ts";

export type StatusTone = "info" | "working" | "warn" | "error" | "success" | "idle" | "";

export interface AgentStatus {
  instance_id: number;
  message: string;
  emoji?: string;
  tone: StatusTone;
  set_by_thread?: string;
  updated_at?: string;
}

export function getStatus(instanceId: number): Promise<AgentStatus> {
  return apiFetch<AgentStatus>(`/apps/status/status?instance_id=${instanceId}`);
}

export interface StatusStreamHandle {
  close: () => void;
}

export function streamStatus(
  instanceId: number,
  onUpdate: (s: AgentStatus) => void,
  onError?: (err: Event) => void,
): StatusStreamHandle {
  const url = sseUrl("/apps/status/stream", { instance_id: instanceId });
  const es = new EventSource(url, { withCredentials: true });
  es.onmessage = (msg) => {
    if (!msg.data) return;
    try {
      onUpdate(JSON.parse(msg.data) as AgentStatus);
    } catch {}
  };
  if (onError) es.onerror = onError;
  return { close: () => es.close() };
}
