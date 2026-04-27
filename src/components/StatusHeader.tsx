const statusLabels = {
  working: "Working",
  idle: "Idle",
  paused: "Paused",
  stopped: "Stopped",
} as const;

const statusColors = {
  working: "bg-green",
  idle: "bg-orange",
  paused: "bg-orange",
  stopped: "bg-red",
} as const;

const statusPillBg = {
  working: "bg-green-light",
  idle: "bg-orange-light",
  paused: "bg-orange-light",
  stopped: "bg-red-light",
} as const;

const statusTextColor = {
  working: "text-green",
  idle: "text-orange",
  paused: "text-orange",
  stopped: "text-red",
} as const;

const pulseColors = {
  working: "status-pulse-green",
  idle: "",
  paused: "status-pulse-orange",
  stopped: "",
} as const;

interface Props {
  name: string;
  directive: string;
  status: "working" | "idle" | "paused" | "stopped";
  currentThought: string;
  dark: boolean;
  onToggleDark: () => void;
}

export function StatusHeader({ name, directive, status, currentThought, dark, onToggleDark }: Props) {
  return (
    <div className="glass rounded-2xl p-5 fade-up flex flex-col justify-between" style={{ minHeight: 140 }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight truncate t-primary">{name}</h1>
          <p className="text-sm t-secondary mt-0.5 line-clamp-2">{directive}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleDark}
            className="w-8 h-8 rounded-full glass-inset flex items-center justify-center t-tertiary hover:t-primary transition-colors hidden"
          >
            {dark ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <div className={`flex items-center gap-2 rounded-full ${statusPillBg[status]} px-3 py-1.5 transition-colors duration-500`}>
            <span className={`relative w-2 h-2 rounded-full ${statusColors[status]} ${status === "working" ? "status-pulse " + pulseColors[status] : ""} transition-colors duration-500`} />
            <span className={`text-xs font-medium ${statusTextColor[status]} transition-colors duration-500`}>{statusLabels[status]}</span>
          </div>
        </div>
      </div>

      {currentThought && (
        <div className="mt-4 flex justify-center">
          <div className="inline-flex items-center gap-2 bg-accent-light rounded-full px-4 py-1.5 transition-all duration-300">
            <span className="w-1.5 h-1.5 rounded-full bg-accent tool-breathe" />
            <span className="text-[13px] text-accent font-medium truncate max-w-[400px]">{currentThought}</span>
          </div>
        </div>
      )}
    </div>
  );
}
