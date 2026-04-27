import { useEffect, useRef, useState } from "react";
import { streamTasks, type Task } from "../api/tasks.ts";

// Live task list for one instance. The SSE stream's backfill on open
// covers history, so we don't pre-fetch via listTasks — saves a
// round-trip and removes the ordering seam between "REST snapshot"
// and "first live event".
export function useTasks(instanceId: number | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [connected, setConnected] = useState(false);
  const byId = useRef(new Map<number, Task>());

  useEffect(() => {
    if (!instanceId) return;
    byId.current = new Map();
    setTasks([]);
    setConnected(false);

    const handle = streamTasks(
      instanceId,
      (ev) => {
        setConnected(true);
        if (ev.kind === "task.deleted") {
          byId.current.delete(ev.task.id);
        } else {
          byId.current.set(ev.task.id, ev.task);
        }
        // Publish a fresh snapshot, sorted newest-first, done last, so
        // the UI feels like a to-do board without extra state.
        const all = Array.from(byId.current.values()).sort((a, b) => {
          const aDone = a.status === "done" || a.status === "cancelled";
          const bDone = b.status === "done" || b.status === "cancelled";
          if (aDone !== bDone) return aDone ? 1 : -1;
          return b.id - a.id;
        });
        setTasks(all);
      },
      () => setConnected(false),
    );
    return () => handle.close();
  }, [instanceId]);

  return { tasks, connected };
}
