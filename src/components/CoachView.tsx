import { useMemo, useState } from "react";
import { FileDown, Sparkles, Loader2, Users } from "lucide-react";
import RadarChart from "./RadarChart";
import ProgressChart from "./ProgressChart";
import SquadList from "./SquadList";
import CoachNoteExpander from "./CoachNoteExpander";
import { AttendancePanel, GoalsPanel, TimelinePanel } from "./panels";
import { Badge, Card, CardTitle, SectionLabel } from "./ui";
import { buildComparisonRadar, buildTeamRadar } from "../lib/derive";
import { expandCoachNote } from "../lib/ai";
import {
  SKILL_LABELS,
  type AttendanceRecord,
  type ExpandedNote,
  type Goal,
  type PlayerProfile,
} from "../lib/types";

interface CoachViewProps {
  profiles: PlayerProfile[];
  attendance: AttendanceRecord[];
  goals: Goal[];
  months: string[];
  activeMonth: string;
  onMonthChange: (m: string) => void;
  publishedNotes: Record<string, ExpandedNote>;
  onPublishNote: (playerName: string, note: ExpandedNote) => void;
  onAddGoal: (playerId: string, goalText: string) => Promise<void>;
  onToggleGoal: (id: string) => void;
}

export default function CoachView({
  profiles,
  attendance,
  goals,
  months,
  activeMonth,
  onMonthChange,
  publishedNotes,
  onPublishNote,
  onAddGoal,
  onToggleGoal,
}: CoachViewProps) {
  const [selectedName, setSelectedName] = useState(profiles[0]?.meta.name ?? "");
  const [compareMode, setCompareMode] = useState(false);
  const [compareName, setCompareName] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchDone, setBatchDone] = useState(0);

  const selected = profiles.find((p) => p.meta.name === selectedName) ?? profiles[0];
  const comparePlayer = profiles.find((p) => p.meta.name === compareName) ?? null;

  const teamRadar = useMemo(() => buildTeamRadar(profiles), [profiles]);

  const playerAttendance = attendance.find((a) => a.playerName === selected?.meta.name);
  const playerGoals = goals.filter((g) => g.playerId === selected?.meta.id);

  const comparisonRadar =
    compareMode && comparePlayer && selected
      ? buildComparisonRadar(selected, comparePlayer)
      : null;

  /** Batch: expand + publish a note for every player using their latest area-to-develop. */
  async function runBatch() {
    setBatchRunning(true);
    setBatchDone(0);
    for (const p of profiles) {
      if (!p.meta.id) {
        console.warn(`Player ${p.meta.name} is missing an ID.`);
        continue;
      }

      const note = await expandCoachNote({
        playerId: p.meta.id,
        observation: p.latestAreaToDevelop ?? "overall development this month",
        playerName: p.meta.name,
        ageGroup: p.meta.ageGroup,
        position: p.latestPosition,
      });
      onPublishNote(p.meta.name, note);
      setBatchDone((n) => n + 1);
    }
    setBatchRunning(false);
  }

  if (!selected) return null;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      {/* Toolbar: month selector + batch + export */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Period
          <select
            value={activeMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="rounded-md border border-border bg-bg-card px-2 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-border-hover"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={runBatch}
          disabled={batchRunning}
          className="flex min-h-[40px] items-center gap-1.5 rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover disabled:opacity-60"
        >
          {batchRunning ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-accent-gold" />}
          {batchRunning ? `Generating ${batchDone}/${profiles.length}…` : "Generate all reports"}
        </button>

        <button
          onClick={() => window.print()}
          className="flex min-h-[40px] items-center gap-1.5 rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover"
        >
          <FileDown size={14} /> Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Squad list */}
        <div className="md:col-span-1">
          <SquadList
            profiles={profiles}
            selectedName={selectedName}
            onSelect={(n) => {
              setSelectedName(n);
              if (compareName === n) setCompareName(null);
            }}
            compareMode={compareMode}
            compareName={compareName}
            onToggleCompareMode={() => {
              setCompareMode((v) => !v);
              setCompareName(null);
            }}
            onSelectCompare={setCompareName}
          />
        </div>

        {/* Main content */}
        <div className="space-y-5 md:col-span-2">
          {/* Team profile */}
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-accent-green" />
                <CardTitle>Team Profile — Last 4 Weeks</CardTitle>
              </div>
              <span className="font-mono text-[11px] text-text-muted">avg across squad</span>
            </div>
            <RadarChart data={teamRadar} color="#4DA3FF" />
          </Card>

          {/* Individual / comparison profile */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <CardTitle>
                {compareMode && comparePlayer
                  ? `${selected.meta.name} vs ${comparePlayer.meta.name}`
                  : `${selected.meta.name} — Individual Profile`}
              </CardTitle>
              <div className="flex items-center gap-2">
                {selected.flagged && <Badge tone="red">FLAG</Badge>}
                <Badge>
                  #{selected.meta.number} · {selected.latestPosition}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {comparisonRadar ? (
                <RadarChart
                  data={comparisonRadar}
                  color="#F2A93B"
                  primaryName={selected.meta.name}
                  overlay={{ name: `vs ${comparePlayer!.meta.name}`, color: "#4DA3FF" }}
                  showLegend
                />
              ) : (
                <RadarChart data={selected.currentRadar} color="#F2A93B" height={220}/>
              )}

              <div className="flex flex-col justify-center">
                <SectionLabel>Progress trend</SectionLabel>
                <ProgressChart data={selected.monthlyProgress} height={220}/>
                {selected.droppedSkills.length > 0 && (
                  <p className="mt-2 font-mono text-[10px] leading-relaxed text-[#E58F86]">
                    ↓ dropped this month:{" "}
                    {selected.droppedSkills.map((k) => SKILL_LABELS[k]).join(", ")}
                  </p>
                )}
              </div>
            </div>

            {selected.latestHighlight && (
              <div className="mt-4 rounded-md border border-border bg-bg-primary p-3">
                <SectionLabel>Latest highlight</SectionLabel>
                <p className="text-sm text-text-note">{selected.latestHighlight}</p>
              </div>
            )}
          </Card>

          {/* AI note expansion */}
          {!compareMode && (
            <CoachNoteExpander
              player={selected}
              publishedNote={publishedNotes[selected.meta.name] ?? null}
              onPublish={(note) => onPublishNote(selected.meta.name, note)}
            />
          )}

          {/* Attendance + goals */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <AttendancePanel record={playerAttendance} />

              {selected.meta.id && (
                <GoalsPanel
                    playerId={selected.meta.id}
                    goals={playerGoals}
                    onAdd={onAddGoal}
                    onToggle={onToggleGoal}
                />
            )}
          </div>

          <TimelinePanel profile={selected} />
        </div>
      </div>
    </div>
  );
}
