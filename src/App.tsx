import { useEffect, useMemo, useState } from "react";
import { Shield, Loader2, Plus, LogOut } from "lucide-react";
import CoachView from "./components/CoachView";
import AssessmentForm from "./components/AssessmentForm";
import AssessmentRecords from "./components/AssessmentRecords";
import Login from "./components/Login";
import { authRequired, supabase } from "./lib/supabase";
import {
  createGoal,
  getAssessments,
  getAttendance,
  getGoals,
  getRoster,
  isLiveDataConfigured,
  saveAssessment,
  toggleGoalStatus,
} from "./lib/data";
import { buildAllProfiles } from "./lib/derive";
import type {
  Assessment,
  AttendanceRecord,
  ExpandedNote,
  Goal,
  PlayerMeta,
  PlayerProfile,
} from "./lib/types";
import { DEFAULT_ATTENDANCE_TOTAL } from "./lib/data";

export default function App() {
  const [loading, setLoading] = useState(true);

  const [roster, setRoster] = useState<PlayerMeta[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const [publishedNotes, setPublishedNotes] = useState<Record<string, ExpandedNote>>({});
  const [activeMonth, setActiveMonth] = useState("Current");
  const [formOpen, setFormOpen] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [assessmentMenuOpen, setAssessmentMenuOpen] = useState(false);

  // ---- Auth (only enforced when VITE_REQUIRE_AUTH=true + Supabase set) ----
  const [authed, setAuthed] = useState(!authRequired());
  const [authChecked, setAuthChecked] = useState(!authRequired());

  useEffect(() => {
    if (!authRequired()) return;
    let sub: { unsubscribe: () => void } | undefined;
    supabase!.auth.getSession().then(({ data }) => {
      setAuthed(Boolean(data.session));
      setAuthChecked(true);
    });
    const { data } = supabase!.auth.onAuthStateChange((_event, session) => {
      setAuthed(Boolean(session));
    });
    sub = data.subscription;
    return () => sub?.unsubscribe();
  }, []);

  useEffect(() => {
    // Wait until Supabase finishes checking the existing session.
    if (!authChecked) {
      return;
    }

    // When authentication is required, do not load academy data
    // until a user has successfully signed in.
    if (authRequired() && !authed) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const [r, a, att, g] = await Promise.all([
          getRoster(),
          getAssessments({ audience: "coach" }),
          getAttendance(),
          getGoals(),
        ]);

        if (cancelled) return;

        setRoster(r);
        setAssessments(a);
        setAttendance(att);
        setGoals(g);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load academy data:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [authChecked, authed]);

  const profiles: PlayerProfile[] = useMemo(
    () => (roster.length ? buildAllProfiles(roster, assessments) : []),
    [roster, assessments]
  );

  const months = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach((p) => p.monthlyProgress.forEach((m) => set.add(m.month)));
    return ["Current", ...[...set]];
  }, [profiles]);

  function publishNote(playerName: string, note: ExpandedNote) {
    setPublishedNotes((prev) => ({ ...prev, [playerName]: note }));
  }

  async function addGoal(
    playerId: string,
    goalText: string
  ): Promise<void> {
    try {
      const savedGoal = await createGoal(playerId, goalText);

      setGoals((previousGoals) => [
        ...previousGoals,
        savedGoal,
      ]);
    } catch (error) {
      console.error("Failed to create goal:", error);
      throw error;
    }
  }

function toggleGoal(id: string) {
  const currentGoal = goals.find((goal) => goal.id === id);

  if (!currentGoal) {
    return;
  }

  const nextStatus: "achieved" | "in-progress" =
    currentGoal.status === "achieved"
      ? "in-progress"
      : "achieved";

  toggleGoalStatus(id, nextStatus)
    .then((updatedGoal) => {
      setGoals((previousGoals) =>
        previousGoals.map((goal) =>
          goal.id === id ? updatedGoal : goal
        )
      );
    })
    .catch((error) => {
      console.error("Failed to persist goal status:", error);
    });
}

  /**
   * Add a coach-entered assessment. Prepending the row means the derived
   * profiles (radars, trends, flags, timeline) recompute automatically. A
   * brand-new player is registered in the roster and seeded with an attendance
   * record so their panels render.
   */
  async function addAssessment(assessment: Assessment, newPlayer?: PlayerMeta) {
    // Persist first when Supabase is configured, so we don't show data that
    // failed to save. In demo mode saveAssessment is a no-op and resolves.
    try {
      await saveAssessment(assessment, newPlayer);
    } catch (err) {
      console.error("Failed to save assessment:", err);
      throw err; // surfaced by the form so the coach can retry
    }

    if (newPlayer) {
      setRoster((prev) => [...prev, newPlayer]);
      setAttendance((prev) => [
        ...prev,
        { playerName: newPlayer.name, attended: 1, total: DEFAULT_ATTENDANCE_TOTAL },
      ]);
    } else {
      // Count the session toward the existing player's attendance.
      setAttendance((prev) =>
        prev.map((a) =>
          a.playerName === assessment.playerName
            ? { ...a, attended: Math.min(a.attended + 1, a.total) }
            : a
        )
      );
    }
    setAssessments((prev) => [...prev, assessment]);
    setFormOpen(false);
  }

  // Auth gate: while checking, show a spinner; if required and not signed in,
  // show the login screen. When auth isn't required this is always satisfied.
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary text-text-muted">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }
  if (authRequired() && !authed) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-bg-primary font-body text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg-primary/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-accent-gold" />
          <span className="font-heading text-xl tracking-wide">ACADEMY REPORT</span>
          {!isLiveDataConfigured() && (
            <span className="ml-2 hidden rounded bg-bg-card px-2 py-0.5 font-mono text-[10px] text-text-muted sm:inline">
              demo data
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setAssessmentMenuOpen((open) => !open)}
              disabled={loading}
              aria-expanded={assessmentMenuOpen}
              aria-haspopup="menu"
              className="flex min-h-[36px] items-center gap-1.5 rounded-full bg-accent-gold px-4 py-1.5 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Plus size={16} />
              Assessment
              <span aria-hidden="true" className="text-xs">
                ▾
              </span>
            </button>

            {assessmentMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-md border border-border bg-bg-card shadow-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAssessmentMenuOpen(false);
                    setFormOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-text-primary transition-colors hover:bg-bg-card-hover"
                >
                  <Plus size={15} className="text-accent-gold" />
                  New Assessment
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAssessmentMenuOpen(false);
                    setRecordsOpen(true);
                  }}
                  className="flex w-full items-center px-4 py-3 text-left text-sm text-text-primary transition-colors hover:bg-bg-card-hover"
                >
                  Assessment Records
                </button>
              </div>
            )}
          </div>

          {authRequired() && (
            <button
              onClick={() => supabase!.auth.signOut()}
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-border-hover hover:text-text-primary"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-32 text-text-muted">
          <Loader2 className="animate-spin" size={18} />
          <span className="font-mono text-sm">Loading squad…</span>
        </div>
      ) : (
        <CoachView
          profiles={profiles}
          attendance={attendance}
          goals={goals}
          months={months}
          activeMonth={activeMonth}
          onMonthChange={setActiveMonth}
          publishedNotes={publishedNotes}
          onPublishNote={publishNote}
          onAddGoal={addGoal}
          onToggleGoal={toggleGoal}
        />
      )}

      {formOpen && (
        <AssessmentForm
          roster={roster}
          onSubmit={addAssessment}
          onClose={() => setFormOpen(false)}
        />
      )}

      {recordsOpen && (
          <AssessmentRecords assessments={assessments} roster={roster} onClose={() => setRecordsOpen(false)} />
      )}
    </div>
  );
}
