// UI types. These were previously in src/mock.ts; now they're derived
// from real server data by the mappers in this folder.

export interface ActivityItem {
  id: string;
  type: "tool" | "thought" | "response" | "event";
  title: string;
  detail?: string;
  time: string;
  status: "done" | "active" | "error";
  duration?: string;
  actor?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  time: string;
  streaming?: boolean;
}

export interface SubAgent {
  id: string;
  name: string;
  directive: string;
  kind: "permanent" | "temp";
  status: "idle" | "working" | "done";
}

export type RunStatus = "working" | "idle" | "paused" | "stopped";
