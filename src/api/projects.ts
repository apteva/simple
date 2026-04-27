import { apiFetch } from "./client.ts";
import type { Project, Instance } from "./types.ts";

export function listProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/projects");
}

export function getProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/projects/${encodeURIComponent(id)}`);
}

export function listInstances(projectId?: string): Promise<Instance[]> {
  const q = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
  return apiFetch<Instance[]>(`/instances${q}`);
}

// Resolve a user-supplied "project" value (from URL param or build env)
// to the canonical opaque project id. The server's timestamped ids are
// unguessable, so we let the UI accept the project name too and look
// up the real id here. Case-insensitive. Returns null if nothing matches.
export async function resolveProjectId(input: string): Promise<string | null> {
  const all = await listProjects().catch(() => [] as Project[]);
  // Exact id match first (cheapest, and covers the canonical case)
  if (all.some((p) => p.id === input)) return input;
  // Fall back to case-insensitive name match
  const want = input.trim().toLowerCase();
  const byName = all.find((p) => p.name.trim().toLowerCase() === want);
  return byName ? byName.id : null;
}
