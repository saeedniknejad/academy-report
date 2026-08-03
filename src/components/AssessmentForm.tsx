import { useEffect, useState } from "react";
import { X, ClipboardList, Loader2, UserPlus } from "lucide-react";
import {
  POSITIONS,
  SCALE_LABELS,
  SESSION_TYPES,
  SKILL_KEYS,
  SKILL_LABELS,
  type Assessment,
  type PlayerMeta,
  type Position,
  type SessionType,
  type SkillKey,
} from "../lib/types";
import { getAssessmentByIdentity} from "../lib/data";

interface AssessmentFormProps {
  roster: PlayerMeta[];
  initialAssessment?: Assessment | null;
  /**
   * Persist the new assessment (and, if provided, register a brand-new player).
   * May be async and may throw — the form shows the error and lets the coach
   * retry rather than closing.
   */
  onSubmit: (assessment: Assessment, newPlayer?: PlayerMeta) => void | Promise<void>;
  onClose: () => void;
}

const ADD_NEW = "__add_new__";

/** Local YYYY-MM-DD for the date input default (no Date.now dependency issues). */
function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * In-app coach data entry. A single modal captures one assessment row matching
 * the data model exactly: player, date, session, position, all ten 1–5 skill
 * ratings, plus highlight / area-to-develop / internal (coach-only) notes.
 * Submitting feeds the charts live — no second app or page.
 */
export default function AssessmentForm({ roster, initialAssessment, onSubmit, onClose }: AssessmentFormProps) {
  const [playerSelect, setPlayerSelect] = useState(roster[0]?.id ?? ADD_NEW);
  const [newName, setNewName] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newPosition, setNewPosition] = useState<Position>("Midfielder");

  const [date, setDate] = useState(todayISO());
  const [sessionType, setSessionType] = useState<SessionType>("Training");
  const [assessedBy, setAssessedBy] = useState("Head Coach");
  const [position, setPosition] = useState<Position>("Midfielder");

  const [scores, setScores] = useState<Record<SkillKey, number>>(() => {
    const s = {} as Record<SkillKey, number>;
    SKILL_KEYS.forEach((k) => (s[k] = 3));
    return s;
  });

  const [highlight, setHighlight] = useState("");
  const [areaToDevelop, setAreaToDevelop] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingAssessment, setExistingAssessment] =
  useState<Assessment | null>(null);

  const [checkingExisting, setCheckingExisting] = useState(false);

  const isNewPlayer = playerSelect === ADD_NEW;

  const selectedPlayerName = roster.find((player) => player.id === playerSelect)?.name ?? "";

  //NEW useEffect (add this)
  useEffect(() => {
    if (!initialAssessment) {
      return;
    }

    if (initialAssessment.playerId) {
      setPlayerSelect(initialAssessment.playerId);
    }

    setDate(initialAssessment.date);
    setSessionType(initialAssessment.sessionType);
    setExistingAssessment(initialAssessment);
  }, [initialAssessment]);

  useEffect(() => {
    if (isNewPlayer || !playerSelect || !date) {
      setExistingAssessment(null);
      setCheckingExisting(false);
      return;
    }

    let cancelled = false;

  async function checkExistingAssessment() {
    setCheckingExisting(true);
    setError(null);

    try {
      const existing = await getAssessmentByIdentity(
        playerSelect,
        date,
        sessionType
      );

      if (cancelled) return;

      setExistingAssessment(existing);

      if (existing) {
        setAssessedBy(existing.assessedBy);
        setPosition(existing.position);
        setScores(existing.scores);
        setHighlight(existing.highlight ?? "");
        setAreaToDevelop(existing.areaToDevelop ?? "");
        setInternalNotes(existing.internalNotes ?? "");
      } else {
        const selectedPlayer = roster.find(
          (player) => player.id === playerSelect
        );

        const defaultScores = {} as Record<SkillKey, number>;
        SKILL_KEYS.forEach((key) => {
          defaultScores[key] = 3;
        });

        setAssessedBy("Head Coach")
        setPosition((selectedPlayer?.primaryPosition ?? "Midfielder") as Position);
        setScores(defaultScores);
        setHighlight("");
        setAreaToDevelop("");
        setInternalNotes("");
      }
    } catch (error) {
      if (cancelled) return;

      console.error("Existing assessment lookup failed:", error);
      setExistingAssessment(null);
      setError(
        "The app could not check whether this assessment already exists."
      );
    } finally {
      if (!cancelled) {
        setCheckingExisting(false);
      }
    }
  }

  checkExistingAssessment();

  return () => {
    cancelled = true;
  };
}, [playerSelect, date, sessionType, isNewPlayer, roster]);

  function setScore(key: SkillKey, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Resolve the player (existing selection or a new roster entry).
    let playerId: string | undefined;
    let playerName: string;
    let newPlayer: PlayerMeta | undefined;

    if (isNewPlayer) {
      const trimmed = newName.trim();
      if (!trimmed) return setError("Enter the new player's name.");
      const num = Number(newNumber);
      if (!newNumber || Number.isNaN(num)) return setError("Enter a jersey number for the new player.");
      if (roster.some((m) => m.name.toLowerCase() === trimmed.toLowerCase()))
        return setError("A player with that name already exists — pick them from the list.");
      if (roster.some((m) => m.number === num))
        return setError(`Jersey #${num} is already taken.`);
      playerName = trimmed;
      newPlayer = {
        name: trimmed,
        number: num,
        primaryPosition: newPosition,
        ageGroup: roster[0]?.ageGroup ?? "U12",
      };
    } else {
       const selectedPlayer = roster.find(
        (player) => player.id === playerSelect
       );

       if (!selectedPlayer) {
         return setError("The selected player could not be found.");
       }

       playerId = selectedPlayer.id;
       playerName = selectedPlayer.name;
    }

    if (!date) return setError("Pick the session date.");

    const assessment: Assessment = {
      id: existingAssessment?.id,
      createdAt: existingAssessment?.createdAt,
      updatedAt: existingAssessment?.updatedAt,
      timestamp: new Date().toISOString(),
      playerId,
      playerName,
      date,
      sessionType,
      assessedBy: assessedBy.trim() || "Coach",
      position: isNewPlayer ? newPosition : position,
      scores,
      highlight: highlight.trim() || undefined,
      areaToDevelop: areaToDevelop.trim() || undefined,
      internalNotes: internalNotes.trim() || undefined,
    };

    setSubmitting(true);
    try {
      await onSubmit(assessment, newPlayer);
      // On success the parent closes the modal; nothing more to do here.
    } catch (err) {
      console.error("Assessment save failed:", err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" &&
              err !== null &&
              "message" in err
            ? String(err.message)
            : "Unknown database error.";

        setError(`The assessment could not be saved: ${message}`);
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="my-4 w-full max-w-2xl rounded-card border border-border bg-bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-accent-gold" />
            <h2 className="font-heading text-xl">{existingAssessment ? "Edit Assessment" : "New Assessment"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-card-hover hover:text-text-primary"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5">
          {!isNewPlayer && (
            <div
              className={`rounded-md border px-4 py-3 ${
                existingAssessment
                  ? "border-accent-gold/50 bg-accent-gold/10"
                  : "border-accent-green/50 bg-accent-green/10"
              }`}
            >
              <p
                className={`font-mono text-[11px] font-medium uppercase tracking-wider ${
                  existingAssessment
                    ? "text-accent-gold"
                    : "text-accent-green"
                }`}
              >
                {checkingExisting
                  ? "Checking assessment…"
                  : existingAssessment
                    ? "Editing Existing Assessment"
                    : "New Assessment"}
              </p>

              {!checkingExisting && (
                <p className="mt-1 text-sm text-text-secondary">
                  {selectedPlayerName} ·{" "}
                  {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  · {sessionType}
                </p>
              )}

              {existingAssessment && !checkingExisting && (
                <p className="mt-1 font-mono text-[10px] text-text-muted">
                  An assessment already exists for this player, date, and session
                  type. Changes will update the existing record.
                </p>
              )}
            </div>
          )}

          {/* Session details */}
          <fieldset className="space-y-3">
            <Legend>Session details</Legend>

            <Field label="Player">
              <select
                value={playerSelect}
                onChange={(e) => setPlayerSelect(e.target.value)}
                className={inputClass}
              >
                {roster.map((m) => (
                  <option key={m.id ?? m.number} value={m.id ?? m.name}>
                    #{m.number} · {m.name} ({m.primaryPosition})
                  </option>
                ))}
                <option value={ADD_NEW}>➕ Add new player…</option>
              </select>
            </Field>

            {isNewPlayer && (
              <div className="rounded-md border border-border-hover bg-bg-primary p-3">
                <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-accent-gold">
                  <UserPlus size={12} /> New player
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Name">
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Leo M."
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Jersey #">
                    <input
                      value={newNumber}
                      onChange={(e) => setNewNumber(e.target.value.replace(/[^0-9]/g, ""))}
                      inputMode="numeric"
                      placeholder="e.g. 8"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Primary position">
                    <select
                      value={newPosition}
                      onChange={(e) => setNewPosition(e.target.value as Position)}
                      className={inputClass}
                    >
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Session type">
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value as SessionType)}
                  className={inputClass}
                >
                  {SESSION_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Assessed by">
                <input
                  value={assessedBy}
                  onChange={(e) => setAssessedBy(e.target.value)}
                  placeholder="Coach name"
                  className={inputClass}
                />
              </Field>
              {!isNewPlayer && (
                <Field label="Position played">
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as Position)}
                    className={inputClass}
                  >
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
          </fieldset>

          {/* Skill ratings */}
          <fieldset className="space-y-3">
            <Legend>Skill ratings — 1 (Emerging) to 5 (Excelling)</Legend>
            <div className="space-y-2">
              {SKILL_KEYS.map((key) => (
                <RatingRow
                  key={key}
                  label={SKILL_LABELS[key]}
                  value={scores[key]}
                  onChange={(v) => setScore(key, v)}
                />
              ))}
            </div>
          </fieldset>

          {/* Notes */}
          <fieldset className="space-y-3">
            <Legend>Notes</Legend>
            <Field label="Highlight (optional)">
              <textarea
                value={highlight}
                onChange={(e) => setHighlight(e.target.value)}
                rows={2}
                placeholder="Something that went well this session…"
                className={inputClass}
              />
            </Field>
            <Field label="Area to develop (optional)">
              <textarea
                value={areaToDevelop}
                onChange={(e) => setAreaToDevelop(e.target.value)}
                rows={2}
                placeholder="The next challenge to work on…"
                className={inputClass}
              />
            </Field>
            <Field
              label="Internal coach notes (optional)"
              hint="Private — never shown to parents"
            >
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
                placeholder="Coach-only notes…"
                className={inputClass}
              />
            </Field>
          </fieldset>

          {error && (
            <p className="rounded-md border border-accent-red/40 bg-accent-red/10 px-3 py-2 font-mono text-xs text-[#E58F86]">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-md border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || checkingExisting}
            className="flex min-h-[40px] items-center gap-1.5 rounded-md bg-accent-gold px-4 py-2 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {(submitting || checkingExisting) && (<Loader2 size={14} className="animate-spin" />)}
            {checkingExisting
              ? "Checking..."
              : submitting
                ? existingAssessment
                  ? "Updating..."
                  : "Saving..."
              : existingAssessment
                ? "Update Assessment"
                : "Save Assessment"
            }
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-border-hover";

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <legend className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
      {children}
    </legend>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-sm text-text-secondary">
        {label}
        {hint && <span className="font-mono text-[10px] text-text-muted">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}

/** A 1–5 segmented rating selector with a live word label. */
function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-sm text-text-note">{label}</span>
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            className={`flex h-9 flex-1 items-center justify-center rounded-md border font-mono text-sm transition-colors ${
              value === n
                ? "border-accent-gold bg-accent-gold/20 text-accent-gold"
                : "border-border bg-bg-primary text-text-muted hover:border-border-hover"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <span className="hidden w-20 shrink-0 text-right font-mono text-[10px] text-text-muted sm:block">
        {SCALE_LABELS[value]}
      </span>
    </div>
  );
}
