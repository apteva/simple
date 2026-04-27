import type { ActivityItem } from "../lib/ui-types.ts";

const icons: Record<ActivityItem["type"], string> = {
  tool: "\u2699",
  thought: "\u25cb",
  response: "\u2709",
  event: "\u21af",
};

const iconColors: Record<ActivityItem["type"], string> = {
  tool: "bg-accent-light text-accent",
  thought: "bg-purple-light text-purple",
  response: "bg-green-light text-green",
  event: "bg-orange-light text-orange",
};

interface Props {
  items: ActivityItem[];
  mainActor?: string;
}

export function ActivityFeed({ items, mainActor }: Props) {
  return (
    <div className="glass rounded-2xl p-5 fade-up flex flex-col" style={{ height: 380 }}>
      <h2 className="text-xs font-semibold uppercase tracking-wider t-tertiary mb-4 shrink-0">Recent Activity</h2>
      <div className="space-y-0 overflow-y-auto flex-1 pr-1">
        {items.map((item) => (
          <div key={item.id} className="timeline-line flex gap-3 pb-4 fade-up">
            <div className={`shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs ${iconColors[item.type]} ${item.status === "active" ? "tool-breathe" : ""}`}>
              {icons[item.type]}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={`text-sm font-medium ${item.status === "active" ? "text-accent" : "t-primary"}`}>
                  {item.title}
                </span>
                {item.duration && (
                  <span className="text-[11px] t-tertiary">{item.duration}</span>
                )}
                <span className="text-[11px] t-tertiary ml-auto shrink-0">{item.time}</span>
              </div>
              {(item.actor || mainActor) && (
                <div className="mt-1">
                  {item.actor ? (
                    <span className="inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full bg-purple-light text-purple">
                      <span>↳</span> {item.actor}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full bg-accent-light text-accent">
                      <span>●</span> {mainActor}
                    </span>
                  )}
                </div>
              )}
              {item.detail && (
                <p className="text-[13px] t-secondary mt-0.5 leading-relaxed">{item.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
