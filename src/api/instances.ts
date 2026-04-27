import { apiFetch } from "./client.ts";
import type { Instance, InstanceStatus, Thread, ChannelInfo, ChatHistoryMessage } from "./types.ts";

export function getInstance(id: number): Promise<Instance> {
  return apiFetch<Instance>(`/instances/${id}`);
}

export function getStatus(id: number): Promise<InstanceStatus> {
  return apiFetch<InstanceStatus>(`/instances/${id}/status`);
}

export function getThreads(id: number): Promise<Thread[]> {
  return apiFetch<Thread[]>(`/instances/${id}/threads`);
}

export function getChannels(id: number): Promise<ChannelInfo[]> {
  return apiFetch<ChannelInfo[]>(`/instances/${id}/channels`);
}

export function getChatHistory(id: number, limit = 50): Promise<ChatHistoryMessage[]> {
  return apiFetch<ChatHistoryMessage[]>(`/instances/${id}/chat-history?limit=${limit}`);
}
