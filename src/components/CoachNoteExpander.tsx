import { useState } from "react";
import { MessageSquareText, Sparkles, ChevronRight, Loader2, Check, Send } from "lucide-react";
import { expandCoachNote, saveAiNote, isAiConfigured } from "../lib/ai";
import type { ExpandedNote, PlayerProfile } from "../lib/types";
import { Card, CardTitle } from "./ui";

interface CoachNoteExpanderProps {
  player: PlayerProfile;
  /** Called when the coach saves the (possibly edited) note for this player. */
  onPublish?: (note: ExpandedNote) => void;
  publishedNote?: ExpandedNote | null;
}

/**
 * Coach types a short bullet observation → AI expands it into a parent-friendly
 * paragraph + "try at home" drill + a technical coach drill. The coach can edit
 * every field before saving the note to the player's record.
 */
export default function CoachNoteExpander({
  player,
  onPublish,
  publishedNote,
}: CoachNoteExpanderProps) {
  const [observation, setObservation] = useState(
    player.latestAreaToDevelop ?? "weak first touch under pressure"
  );
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<ExpandedNote | null>(null);
  const [justPublished, setJustPublished] = useState(false);

  async function handleExpand() {
    const playerId = player.meta.id;

    if (!playerId) {
      console.error("Cannot generate AI note: player ID is missing.");
      return;
    }

    setLoading(true);
    setJustPublished(false);

    try {
      const result = await expandCoachNote({
        playerId,
        observation,
        playerName: player.meta.name,
        ageGroup: player.meta.ageGroup,
        position: player.latestPosition,
      });

      setNote(result);
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: keyof ExpandedNote, value: string) {
    if (!note) return;
    setNote({ ...note, [field]: value });
  }

  async function handlePublish() {
    if (!note) return;

    const playerId = player.meta.id;

    if (!playerId) {
      console.error("Cannot save AI note: player ID is missing.");
      return;
    }

    try {
      await saveAiNote({
        playerId,
        observation,
        playerName: player.meta.name,
        ageGroup: player.meta.ageGroup,
        position: player.latestPosition,
        note,
      });

      onPublish?.(note);
      setJustPublished(true);
    } catch (error) {
      console.error("Failed to save AI note:", error);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <MessageSquareText size={16} className="text-accent-gold" />
        <CardTitle>Coach Note → AI Expansion</CardTitle>
        {!isAiConfigured() && (
          <span className="ml-auto font-mono text-[10px] text-text-muted">demo mode</span>
        )}
      </div>

      {/* Input + expand button */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="e.g. hesitant to shoot outside the box"
          className="min-h-[44px] flex-1 rounded-md border border-border bg-bg-primary px-3 py-2 font-mono text-sm text-text-secondary outline-none transition-colors placeholder:text-text-muted focus:border-border-hover"
        />
        <button
          onClick={handleExpand}
          disabled={loading || !observation.trim()}
          className="flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-md bg-accent-gold px-4 py-2 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {loading ? "expanding…" : "expand"}
        </button>
      </div>

      {/* Output */}
      {note && (
        <div className="space-y-3">
          <EditableBlock
            label="Parent note"
            value={note.parentNote}
            onChange={(v) => updateField("parentNote", v)}
          />
          <DrillRow
            label="Try at home"
            value={note.tryAtHome}
            onChange={(v) => updateField("tryAtHome", v)}
          />
          <DrillRow
            label="Suggested drill (coach)"
            value={note.coachDrill}
            onChange={(v) => updateField("coachDrill", v)}
          />

          {onPublish && (
            <div className="flex items-center gap-3 pt-1">
              <button
                type={"button"}
                onClick={handlePublish}
                className="flex min-h-[40px] items-center gap-1.5 rounded-md border border-accent-green bg-accent-green/15 px-3 py-2 text-sm font-medium text-[#8FC7FF] transition-colors hover:bg-accent-green/25"
              >
                {justPublished ? <Check size={14} /> : <Send size={14} />}
                {justPublished ? "Note saved" : "Save note"}
              </button>
              {publishedNote && !justPublished && (
                <span className="font-mono text-[10px] text-text-muted">
                  a note is already saved for {player.meta.name}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function EditableBlock({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-md border border-border-hover bg-bg-primary p-4">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full resize-y bg-transparent text-sm leading-relaxed text-text-note outline-none"
      />
    </div>
  );
}

function DrillRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-bg-primary p-3">
      <ChevronRight size={14} className="mt-1 shrink-0 text-accent-gold" />
      <div className="flex-1">
        <span className="font-medium text-accent-gold">{label}: </span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="mt-1 w-full resize-y bg-transparent text-sm leading-relaxed text-text-note outline-none"
        />
      </div>
    </div>
  );
}
