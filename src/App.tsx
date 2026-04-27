import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./hooks/useAuth.ts";
import { Login } from "./pages/Login.tsx";
import { AgentPanel } from "./components/AgentPanel.tsx";
import { listInstances, getProject, resolveProjectId } from "./api/projects.ts";
import type { Instance, Project } from "./api/types.ts";

declare const __DEFAULT_PROJECT__: string | undefined;

function paramInt(name: string): number | null {
  const v = new URLSearchParams(window.location.search).get(name);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function paramStr(name: string): string | null {
  const v = new URLSearchParams(window.location.search).get(name);
  return v && v.length > 0 ? v : null;
}

export function App() {
  const [dark, setDark] = useState(false);
  const auth = useAuth();

  useEffect(() => { document.body.classList.toggle("dark", dark); }, [dark]);

  const initialInstance = useMemo(() => paramInt("instance"), []);
  const initialProject = useMemo(() => {
    // Precedence: ?project=... > runtime window.__DEFAULT_PROJECT__
    // (server-injected) > build-time __DEFAULT_PROJECT__ > null.
    const fromUrl = paramStr("project");
    if (fromUrl) return fromUrl;
    if (typeof window !== "undefined") {
      const w = (window as any).__DEFAULT_PROJECT__;
      if (typeof w === "string" && w) return w;
    }
    if (typeof __DEFAULT_PROJECT__ !== "undefined" && __DEFAULT_PROJECT__) {
      return __DEFAULT_PROJECT__;
    }
    return null;
  }, []);

  if (auth.loading) {
    return <div className="min-h-dvh grid place-items-center t-tertiary text-sm">Loading…</div>;
  }
  if (!auth.user) {
    return <Login onLogin={auth.login} error={auth.error} loading={auth.loading} />;
  }

  const toggleDark = () => setDark((d) => !d);
  const onLogout = auth.kiosk ? null : auth.logout;

  return (
    <Shell onLogout={onLogout}>
      {initialInstance !== null ? (
        <AgentPanel instanceId={initialInstance} dark={dark} onToggleDark={toggleDark} />
      ) : (
        <InstancePicker projectId={initialProject} dark={dark} onToggleDark={toggleDark} />
      )}
    </Shell>
  );
}

function Shell({
  onLogout,
  children,
}: {
  onLogout: (() => void) | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {children}
        <div className="flex items-center justify-center gap-3 text-[11px] t-tertiary py-2">
          <span>Apteva</span>
          {onLogout && (
            <>
              <span>·</span>
              <button onClick={onLogout} className="hover:t-primary transition-colors">
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InstancePicker({
  projectId,
  dark,
  onToggleDark,
}: {
  projectId: string | null;
  dark: boolean;
  onToggleDark: () => void;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [instances, setInstances] = useState<Instance[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Accept either an opaque project id or the project name.
        // If resolution fails, fall through and list all instances.
        let realId: string | undefined;
        if (projectId) {
          realId = (await resolveProjectId(projectId)) ?? undefined;
        }
        const [proj, insts] = await Promise.all([
          realId ? getProject(realId).catch(() => null) : Promise.resolve(null),
          listInstances(realId),
        ]);
        if (cancelled) return;
        setProject(proj);
        setInstances(insts);
        if (insts.length === 1) setSelected(insts[0]!.id);
      } catch (err: any) {
        if (!cancelled) setError(err?.body ?? String(err));
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  if (selected !== null) {
    return <AgentPanel instanceId={selected} dark={dark} onToggleDark={onToggleDark} />;
  }
  if (error) {
    return <div className="glass rounded-2xl p-6 text-sm text-red">{error}</div>;
  }
  if (!instances) {
    return <div className="glass rounded-2xl p-6 text-sm t-tertiary">Loading instances…</div>;
  }
  if (instances.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-sm t-secondary">
        No instances available{project ? ` in project "${project.name}"` : ""}.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] uppercase tracking-wider t-tertiary font-medium">Pick an instance</div>
        {project && <h1 className="text-xl font-semibold t-primary mt-0.5">{project.name}</h1>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {instances.map((inst) => (
          <button
            key={inst.id}
            onClick={() => setSelected(inst.id)}
            className="glass rounded-2xl p-4 text-left hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${inst.status === "running" ? "bg-green" : "bg-gray-400"}`} />
              <h3 className="text-sm font-semibold t-primary">{inst.name}</h3>
              <span className="ml-auto text-[10px] t-tertiary uppercase tracking-wider">{inst.status}</span>
            </div>
            <p className="text-xs t-secondary line-clamp-3 leading-relaxed">
              {inst.directive || <em className="t-tertiary">no directive</em>}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
