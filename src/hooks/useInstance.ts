import { useEffect, useState } from "react";
import * as instancesApi from "../api/instances.ts";
import type { Instance, InstanceStatus, Thread, ChannelInfo } from "../api/types.ts";

interface Result {
  instance: Instance | null;
  status: InstanceStatus | null;
  threads: Thread[];
  channels: ChannelInfo[];
  loading: boolean;
  error: string | null;
  refreshStatus: () => void;
  refreshThreads: () => void;
}

// Fetches instance meta + status + threads + channels. Status and
// threads poll gently as a fallback when SSE events we don't re-fetch
// on (e.g. iteration counters) change. Caller can also trigger a
// manual refresh on SSE hints like thread.spawn / thread.done.
export function useInstance(instanceId: number | null): Result {
  const [instance, setInstance] = useState<Instance | null>(null);
  const [status, setStatus] = useState<InstanceStatus | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusTick, setStatusTick] = useState(0);
  const [threadsTick, setThreadsTick] = useState(0);

  useEffect(() => {
    if (!instanceId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      instancesApi.getInstance(instanceId),
      instancesApi.getStatus(instanceId).catch(() => null),
      instancesApi.getThreads(instanceId).catch(() => [] as Thread[]),
      instancesApi.getChannels(instanceId).catch(() => [] as ChannelInfo[]),
    ])
      .then(([inst, st, thr, ch]) => {
        if (cancelled) return;
        setInstance(inst);
        setStatus(st);
        setThreads(thr);
        setChannels(ch);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.body ?? String(err));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [instanceId]);

  // Gentle background refresh for status (iteration counter drifts even
  // when SSE is quiet because /status aggregates non-telemetry state).
  useEffect(() => {
    if (!instanceId) return;
    const id = setInterval(() => setStatusTick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, [instanceId]);

  useEffect(() => {
    if (!instanceId || statusTick === 0) return;
    let cancelled = false;
    instancesApi.getStatus(instanceId).then((st) => { if (!cancelled) setStatus(st); }).catch(() => {});
    return () => { cancelled = true; };
  }, [instanceId, statusTick]);

  useEffect(() => {
    if (!instanceId || threadsTick === 0) return;
    let cancelled = false;
    instancesApi.getThreads(instanceId).then((t) => { if (!cancelled) setThreads(t); }).catch(() => {});
    return () => { cancelled = true; };
  }, [instanceId, threadsTick]);

  return {
    instance,
    status,
    threads,
    channels,
    loading,
    error,
    refreshStatus: () => setStatusTick((n) => n + 1),
    refreshThreads: () => setThreadsTick((n) => n + 1),
  };
}
