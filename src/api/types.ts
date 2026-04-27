// Shapes mirror what apteva/server returns. Keep field names exact.

export interface User {
  user_id: number;
  email?: string;
}

export interface Project {
  id: string;
  user_id: number;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

export interface Instance {
  id: number;
  user_id: number;
  name: string;
  directive: string;
  mode: string;
  config: string;
  port: number;
  pid: number;
  status: "running" | "stopped";
  project_id?: string;
  created_at: string;
}

export interface InstanceStatus {
  iteration: number;
  rate: string;
  model: string;
  paused: boolean;
  threads: number;
  memories: number;
  uptime_seconds: number;
  mode: string;
}

export interface Thread {
  id: string;
  parent_id?: string;
  depth: number;
  directive: string;
  tools?: string[];
  mcp_names?: string[];
  iteration: number;
  rate: string;
  model: string;
  age: string;
}

export interface ChannelInfo {
  name: string;
  type: string;
  connected: boolean;
}

export type TelemetryType =
  | "llm.start"
  | "llm.done"
  | "llm.error"
  | "tool.call"
  | "tool.result"
  | "tool.pending"
  | "tool.approved"
  | "tool.rejected"
  | "thread.spawn"
  | "thread.done"
  | "event.received"
  | "mode.changed"
  | "instance.paused"
  | "instance.resumed"
  | "directive.evolved"
  | string;

export interface TelemetryEvent {
  id: string;
  instance_id: number;
  thread_id: string;
  type: TelemetryType;
  time: string; // RFC3339
  data: Record<string, any>;
}

export interface ChatHistoryMessage {
  id: string;
  role: "user" | "agent" | "tool" | "status";
  text: string;
  time: string;
  tool_name?: string;
  tool_done?: boolean;
  tool_duration_ms?: number;
  tool_success?: boolean;
}

export interface ChannelChat {
  id: number;
  instance_id: number;
  name: string;
  created_at: string;
}

export interface ChannelChatMessage {
  id: number;
  chat_id: number;
  role: "user" | "agent";
  content: string;
  created_at: string;
}
