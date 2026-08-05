import { GitCompare } from "lucide-react";
import type { PlayerProfile } from "../lib/types";
import PlayerCard from "./PlayerCard";

interface SquadListProps {
  profiles: PlayerProfile[];
  teamTitle: string;
  selectedName: string;
  onSelect: (name: string) => void;
  /** Comparison mode: the second selected player (or null). */
  compareName?: string | null;
  compareMode?: boolean;
  onToggleCompareMode?: () => void;
  onSelectCompare?: (name: string) => void;
  onDeactivate?: (playerId: string) => void;
}

/**
 * Squad selection list. On desktop it's a vertical sidebar; on mobile it
 * becomes a horizontal scroller (handled by the parent layout classes).
 */
export default function SquadList({
  profiles,
  teamTitle,
  selectedName,
  onSelect,
  compareName,
  compareMode,
  onToggleCompareMode,
  onSelectCompare,
  onDeactivate,
}: SquadListProps) {
  const flaggedCount = profiles.filter((p) => p.flagged).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-1 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          {teamTitle} · {profiles.length} players
          {flaggedCount > 0 && <span className="text-[#E58F86]"> · {flaggedCount} flagged</span>}
        </div>
        {onToggleCompareMode && (
          <button
            onClick={onToggleCompareMode}
            title="Compare two players"
            className={`flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[10px] transition-colors ${
              compareMode
                ? "border-accent-green bg-accent-green/15 text-[#8FC7FF]"
                : "border-border text-text-muted hover:border-border-hover"
            }`}
          >
            <GitCompare size={12} /> compare
          </button>
        )}
      </div>

      {/* Horizontal scroll on mobile, vertical stack on md+. */}
      <div className="scroll-thin flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
        {profiles.map((p) => {
          const isPrimary = p.meta.name === selectedName;
          const isCompare = compareMode && p.meta.name === compareName;
          return (
            <div key={p.meta.number} className="w-[190px] shrink-0 md:w-auto md:min-w-0">
              <PlayerCard
                profile={p}
                active={isPrimary}
                compareActive={Boolean(isCompare)}
                onDeactivate={onDeactivate}
                onClick={() => {
                  if (compareMode && !isPrimary && onSelectCompare) onSelectCompare(p.meta.name);
                  else onSelect(p.meta.name);
                }}
              />
            </div>
          );
        })}
      </div>

      {compareMode && (
        <p className="mt-1 font-mono text-[10px] leading-relaxed text-text-muted">
          Comparing <span className="text-accent-gold">{selectedName}</span>
          {compareName ? (
            <>
              {" "}
              vs <span className="text-accent-green">{compareName}</span>. Tap another player to
              swap.
            </>
          ) : (
            <> — tap a second player to overlay.</>
          )}
        </p>
      )}
    </div>
  );
}
