import { useEffect, useRef, useState } from "react";
import { queryTelemetry, streamTelemetry } from "../api/telemetry.ts";
import type { TelemetryEvent } from "../api/types.ts";

interface Options {
  instanceId: number | null;
  // Optional callbacks for structural events the parent cares about
  onThreadStructureChange?: () => void;
  onPauseChange?: () => void;
  // Initial backfill count
  backfillLimit?: number;
}

// Live telemetry feed for an instance. Returns events ordered newest-first.
// Keeps up to `maxEvents` in memory (older trimmed). Backfills from
// /api/telemetry on mount so the feed isn't empty when the user arrives.
export function useTelemetry({ instanceId, onThreadStructureChange, onPauseChange, backfillLimit = 100 }: Options) {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const eventsRef = useRef<TelemetryEvent[]>([]);
  const seen = useRef(new Set<string>());
  const maxEvents = 500;

  useEffect(() => {
    if (!instanceId) return;
    let cancelled = false;
    eventsRef.current = [];
    seen.current = new Set();
    setEvents([]);
    setConnected(false);

    // 1. Backfill
    queryTelemetry({ instanceId, limit: backfillLimit })
      .then((hist) => {
        if (cancelled) return;
        // Server returns oldest-first from the raw query; we render newest-first.
        const ordered = [...hist].sort((a, b) => +new Date(b.time) - +new Date(a.time));
        for (const ev of ordered) seen.current.add(ev.id);
        eventsRef.current = ordered.slice(0, maxEvents);
        setEvents(eventsRef.current);
      })
      .catch(() => {});

    // 2. Live stream
    const handle = streamTelemetry(instanceId, (ev) => {
      if (seen.current.has(ev.id)) return;
      seen.current.add(ev.id);
      eventsRef.current = [ev, ...eventsRef.current].slice(0, maxEvents);
      setEvents(eventsRef.current);
      setConnected(true);

      if (ev.type === "thread.spawn" || ev.type === "thread.done") onThreadStructureChange?.();
      if (ev.type === "instance.paused" || ev.type === "instance.resumed") onPauseChange?.();
    }, () => {
      // EventSource auto-reconnects; just flag connection state.
      setConnected(false);
    });

    return () => {
      cancelled = true;
      handle.close();
    };
  }, [instanceId, backfillLimit, onThreadStructureChange, onPauseChange]);

  return { events, connected };
}
