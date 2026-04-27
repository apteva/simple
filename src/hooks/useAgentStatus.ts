import { useEffect, useState } from "react";
import { streamStatus, type AgentStatus } from "../api/status.ts";

// Live subscription to the agent-authored status line for one instance.
// The SSE handler emits the current row as its first frame, so no
// separate GET is needed on mount.
export function useAgentStatus(instanceId: number | null): AgentStatus | null {
  const [status, setStatus] = useState<AgentStatus | null>(null);

  useEffect(() => {
    if (!instanceId) { setStatus(null); return; }
    setStatus(null);
    const handle = streamStatus(instanceId, setStatus);
    return () => handle.close();
  }, [instanceId]);

  return status;
}
