import { Target, CalendarCheck, Star, CalendarDays } from "lucide-react";
import type { AttendanceRecord, Goal, PlayerProfile } from "../lib/types";
import { Card, CardTitle, ProgressBar, SectionLabel } from "./ui";

/** Attendance summary with a percentage bar. */
export function AttendancePanel({ record }: { record?: AttendanceRecord }) {
  if (!record) return null;
  const pct = Math.round((record.attended / record.total) * 100);
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <CalendarCheck size={16} className="text-accent-gold" />
        <CardTitle>Attendance</CardTitle>
      </div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-sm text-text-secondary">
          {record.attended} of {record.total} sessions attended
        </span>
        <span className="font-heading text-2xl text-accent-green">{pct}%</span>
      </div>
      <ProgressBar value={record.attended} max={record.total} />
    </Card>
  );
}

/** Goals list with status chips. */
export function GoalsPanel({
  goals,
  onToggle,
}: {
  goals: Goal[];
  onToggle?: (id: string) => void;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Target size={16} className="text-accent-gold" />
        <CardTitle>Goals</CardTitle>
      </div>
      {goals.length === 0 ? (
        <p className="font-mono text-xs text-text-muted">No goals set yet.</p>
      ) : (
        <ul className="space-y-2">
          {goals.map((g) => {
            const done = g.status === "achieved";
            const inner = (
              <>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                    done
                      ? "border-accent-green bg-accent-green/20 text-[#8FC7FF]"
                      : "border-border text-text-muted"
                  }`}
                >
                  {done ? "✓" : "•"}
                </span>
                <span
                  className={`text-sm ${done ? "text-text-muted line-through" : "text-text-note"}`}
                >
                  {g.text}
                </span>
                <span
                  className={`ml-auto shrink-0 font-mono text-[10px] ${
                    done ? "text-[#8FC7FF]" : "text-accent-gold"
                  }`}
                >
                  {done ? "achieved" : "in progress"}
                </span>
              </>
            );
            return (
              <li key={g.id}>
                {onToggle ? (
                  <button
                    onClick={() => onToggle(g.id)}
                    className="flex w-full items-center gap-2 rounded-md p-1 text-left transition-colors hover:bg-bg-card-hover"
                  >
                    {inner}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-1">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/** Star rating for a 0–100 value (used for effort / teamwork). */
function Stars({ value }: { value: number }) {
  const filled = Math.round((value / 100) * 5);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={16}
          className={i <= filled ? "text-accent-gold" : "text-border"}
          fill={i <= filled ? "#F2A93B" : "none"}
        />
      ))}
    </div>
  );
}

/** Effort & attitude star ratings — a parent favourite. */
export function EffortStarsPanel({ profile }: { profile: PlayerProfile }) {
  return (
    <Card>
      <SectionLabel>Effort &amp; Attitude</SectionLabel>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Effort</span>
          <Stars value={profile.currentAverage.effort} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Teamwork</span>
          <Stars value={profile.currentAverage.teamwork} />
        </div>
      </div>
    </Card>
  );
}

/** Horizontal season timeline of assessment dates. */
export function TimelinePanel({ profile }: { profile: PlayerProfile }) {
  if (profile.timeline.length === 0) return null;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <CalendarDays size={16} className="text-accent-gold" />
        <CardTitle>Season Timeline</CardTitle>
      </div>
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 right-0 top-1.5 h-0.5 bg-border" />
        {profile.timeline.map((t, i) => (
          <div key={i} className="relative flex flex-col items-center gap-2">
            <div className="h-3 w-3 rounded-full border-2 border-accent-gold bg-bg-primary" />
            <span className="font-mono text-[10px] text-text-muted">{fmt(t.date)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
