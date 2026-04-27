import type { Task } from "../api/tasks.ts";

interface Props {
  tasks: Task[];
}

const statusDot: Record<Task["status"], string> = {
  open: "bg-gray-400",
  in_progress: "bg-accent tool-breathe",
  blocked: "bg-orange",
  done: "bg-green",
  cancelled: "bg-gray-400",
};

const statusLabel: Record<Task["status"], string> = {
  open: "open",
  in_progress: "in progress",
  blocked: "blocked",
  done: "done",
  cancelled: "cancelled",
};

const statusPill: Record<Task["status"], string> = {
  open: "glass-inset t-tertiary",
  in_progress: "bg-accent-light text-accent",
  blocked: "bg-orange-light text-orange",
  done: "bg-green-light text-green",
  cancelled: "glass-inset t-tertiary",
};

const progressColor: Record<Task["status"], string> = {
  open: "bg-gray-400",
  in_progress: "bg-accent",
  blocked: "bg-orange",
  done: "bg-green",
  cancelled: "bg-gray-400",
};

function countBy(tasks: Task[], status: Task["status"]): number {
  return tasks.reduce((n, t) => n + (t.status === status ? 1 : 0), 0);
}

export function TasksCard({ tasks }: Props) {
  const active = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const doneCount = countBy(tasks, "done");

  return (
    <div className="glass rounded-2xl p-5 fade-up flex flex-col" style={{ height: 280 }}>
      <div className="flex items-baseline justify-between mb-4 shrink-0">
        <h2 className="text-xs font-semibold uppercase tracking-wider t-tertiary">
          Tasks <span className="t-tertiary font-normal normal-case">· {active.length} active</span>
        </h2>
        {doneCount > 0 && (
          <span className="text-[10px] t-tertiary">{doneCount} completed</span>
        )}
      </div>
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="rounded-xl px-3 py-2 glass-inset"
          >
            <div className="flex items-center gap-2.5">
              <span className={`shrink-0 w-2 h-2 rounded-full ${statusDot[t.status]}`} />
              <span className={`text-sm font-medium truncate flex-1 ${t.status === "done" || t.status === "cancelled" ? "t-tertiary line-through" : "t-primary"}`}>
                {t.title}
              </span>
              {t.reward_xp > 0 && (
                <span className="text-[10px] t-tertiary shrink-0">+{t.reward_xp} xp</span>
              )}
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusPill[t.status]} shrink-0`}>
                {statusLabel[t.status]}
              </span>
            </div>
            {t.status !== "done" && t.status !== "cancelled" && (t.progress > 0 || t.note) && (
              <div className="mt-1.5 space-y-1">
                {t.progress > 0 && (
                  <div className="h-[3px] rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${progressColor[t.status]} transition-all duration-500`}
                      style={{ width: `${t.progress}%` }}
                    />
                  </div>
                )}
                {t.note && (
                  <p className="text-[11px] t-secondary truncate leading-snug">{t.note}</p>
                )}
              </div>
            )}
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-sm t-tertiary text-center py-6">No tasks yet</p>
        )}
      </div>
    </div>
  );
}
