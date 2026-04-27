// Soft-dependency helper for static UI apps.
//
// apteva-server injects `window.__APTEVA_APP__.installed_apps` into
// every served `index.html` for kind=static apps (see server's
// apps_static.go). The list is the live set of running apps + the
// in-process built-in framework apps. This module reads it and
// exposes a simple "is X installed?" check for hooks/components
// that call optional-dep app endpoints.
//
// Returns:
//   true   — the named app is installed and reachable
//   false  — apteva-server told us it's NOT installed (skip the call)
//   null   — we don't know (no injection seen, e.g. running outside
//            apteva-server). Caller should treat as "try, may fail".

declare global {
  interface Window {
    __APTEVA_APP__?: {
      installed_apps?: string[];
      [k: string]: unknown;
    };
  }
}

export function isAppInstalled(name: string): boolean | null {
  if (typeof window === "undefined") return null;
  const meta = window.__APTEVA_APP__;
  if (!meta || !Array.isArray(meta.installed_apps)) return null;
  // Normalise: lowercase + collapse separators so "Tasks" / "tasks" /
  // "app-tasks" all match. apteva-server applies the same rule when
  // building the list.
  const norm = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, "");
  const target = norm(name);
  return meta.installed_apps.some((n) => norm(n) === target);
}

// Convenience helper for use in render code where "missing app" and
// "unknown" should both render the disabled state.
export function appPresentOrUnknown(name: string): boolean {
  return isAppInstalled(name) !== false;
}
