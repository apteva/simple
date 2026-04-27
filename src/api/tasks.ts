import { apiFetch, sseUrl } from "./client.ts";

export interface Task {
  id: number;
  instance_id: number;
  title: string;
  description: string;
  status: "open" | "in_progress" | "blocked" | "done" | "cancelled";
  assigned_thread?: string;
  parent_task_id?: number;
  created_by_thread?: string;
  created_by_user?: number;
  reward_xp: number;
  progress: number;
  note: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export type TaskEventKind = "task.created" | "task.updated" | "task.deleted";

export interface TaskStreamEvent {
  kind: TaskEventKind;
  task: Task;
}

export function listTasks(params: {
  instanceId: number;
  status?: string;
  thread?: string;
  limit?: number;
}): Promise<Task[]> {
  const q = new URLSearchParams();
  q.set("instance_id", String(params.instanceId));
  if (params.status) q.set("status", params.status);
  if (params.thread) q.set("thread", params.thread);
  if (params.limit) q.set("limit", String(params.limit));
  return apiFetch<Task[]>(`/apps/tasks/tasks?${q.toString()}`);
}

export function createTask(body: {
  instance_id: number;
  title: string;
  description?: string;
  assigned_thread?: string;
  parent_task_id?: number;
  reward_xp?: number;
}): Promise<Task> {
  return apiFetch<Task>(`/apps/tasks/tasks`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateTask(
  id: number,
  body: Partial<Pick<Task, "title" | "description" | "status" | "progress" | "note" | "assigned_thread">>,
): Promise<Task> {
  return apiFetch<Task>(`/apps/tasks/task?id=${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteTask(id: number): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/apps/tasks/task?id=${id}`, { method: "DELETE" });
}

export interface TaskStreamHandle {
  close: () => void;
}

export function streamTasks(
  instanceId: number,
  onEvent: (ev: TaskStreamEvent) => void,
  onError?: (err: Event) => void,
): TaskStreamHandle {
  const url = sseUrl("/apps/tasks/stream", { instance_id: instanceId });
  const es = new EventSource(url, { withCredentials: true });
  es.onmessage = (msg) => {
    if (!msg.data) return;
    try {
      onEvent(JSON.parse(msg.data) as TaskStreamEvent);
    } catch {}
  };
  if (onError) es.onerror = onError;
  return { close: () => es.close() };
}
