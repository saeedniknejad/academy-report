import { useState } from "react";
import { Target, CalendarCheck, Star, CalendarDays, Plus, Loader2 } from "lucide-react";
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

/** Player goal creation and status management. */
export function GoalsPanel({
    playerName,
    goals,
    onAdd,
    onToggle,
}: {
    playerName: string;
    goals: Goal[];
    onAdd?: (
        playerName: string,
        goalText: string
    ) => Promise<void>;
    onToggle?: (id: string) => void;
}) {
    const [goalText, setGoalText] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleAddGoal(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const cleanText = goalText.trim();

        if (!cleanText || !onAdd) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await onAdd(playerName, cleanText);
            setGoalText("");
        } catch (error) {
            console.error("Goal creation failed:", error);
            setError("The goal could not be saved. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Card>
            <div className="mb-3 flex items-center gap-2">
                <Target size={16} className="text-accent-gold" />
                <CardTitle>Goals</CardTitle>
            </div>

            {onAdd && (
                <form
                    onSubmit={handleAddGoal}
                    className="mb-4 space-y-2"
                >
                    <label
                        htmlFor={`goal-${playerName}`}
                        className="block font-mono text-[10px] uppercase tracking-wider text-text-muted"
                    >
                        Add a development goal
                    </label>

                    <textarea
                        id={`goal-${playerName}`}
                        value={goalText}
                        onChange={(event) => setGoalText(event.target.value)}
                        placeholder="Example: Scan before receiving the ball"
                        rows={2}
                        maxLength={300}
                        disabled={saving}
                        className="w-full resize-none rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-border-hover disabled:opacity-60"
                    />

                    <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[10px] text-text-muted">
                            {goalText.length}/300
                        </span>

                        <button
                            type="submit"
                            disabled={saving || !goalText.trim()}
                            className="flex min-h-[36px] items-center gap-1.5 rounded-md bg-accent-gold px-3 py-1.5 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Plus size={14} />
                            )}

                            {saving ? "Saving…" : "Add goal"}
                        </button>
                    </div>

                    {error && (
                        <p className="font-mono text-xs text-[#E58F86]">
                            {error}
                        </p>
                    )}
                </form>
            )}

            {goals.length === 0 ? (
                <p className="font-mono text-xs text-text-muted">
                    No goals set yet.
                </p>
            ) : (
                <ul className="space-y-2">
                    {goals.map((goal) => {
                        const achieved = goal.status === "achieved";

                        const content = (
                            <>
                                <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                                        achieved
                                            ? "border-accent-green bg-accent-green/20 text-[#8FC7FF]"
                                            : "border-border text-text-muted"
                                    }`}
                                >
                                    {achieved ? "✓" : "•"}
                                </span>

                                <span
                                    className={`text-sm ${
                                        achieved
                                            ? "text-text-muted line-through"
                                            : "text-text-note"
                                    }`}
                                >
                                    {goal.text}
                                </span>

                                <span
                                    className={`ml-auto shrink-0 font-mono text-[10px] ${
                                        achieved
                                            ? "text-[#8FC7FF]"
                                            : "text-accent-gold"
                                    }`}
                                >
                                    {achieved ? "achieved" : "in progress"}
                                </span>
                            </>
                        );

                        return (
                            <li key={goal.id}>
                                {onToggle ? (
                                    <button
                                        type="button"
                                        onClick={() => onToggle(goal.id)}
                                        className="flex w-full items-center gap-2 rounded-md p-1 text-left transition-colors hover:bg-bg-card-hover"
                                    >
                                        {content}
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 p-1">
                                        {content}
                                    </div>
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
