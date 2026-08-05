import type { PlayerProfile } from "../lib/types";
import { TrendArrow } from "./ui";

interface PlayerCardProps {
  profile: PlayerProfile;
  active: boolean;
  onClick: () => void;
  /** When set, shows a small "compare" toggle affordance. */
  compareActive?: boolean;
  onDeactivate?: (playerId: string) => void;
}

/** One squad-list item: jersey number, name, position, trend, flag badge. */
export default function PlayerCard({ profile, active, onClick, compareActive, onDeactivate }: PlayerCardProps) {
  const { meta, trend, flagged } = profile;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      aria-pressed={active}
      className={`flex min-h-[78px] w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${
        active
          ? "border-accent-gold bg-bg-card-hover"
          : compareActive
            ? "border-accent-green bg-bg-card-hover"
            : "border-border bg-bg-card hover:border-border-hover"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-bg-primary font-heading text-sm font-semibold text-accent-gold">
        {meta.number}
      </div>

      <div className="min-w-0 flex-1">
        {/* Line 1: player name */}
        <div className="truncate font-heading text-base leading-tight text-text-primary">
          {meta.name}
        </div>

        {/* Line 2: position */}
        <div className="mt-0.5 truncate font-mono text-[11px] text-text-muted">
          {meta.primaryPosition}
        </div>

        {/* Line 3: flag, remove and trend */}
        <div className="mt-1 flex min-h-[20px] items-center gap-2">
          {flagged && (
            <span className="flex items-center gap-1 rounded bg-accent-red/20 px-1.5 py-0.5 font-mono text-[10px] text-[#E58F86]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E58F86]" />
              Flag
            </span>
          )}

          {onDeactivate && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();

                if (
                  confirm(`Remove ${meta.name} from the active squad?`)
                ) {
                  if (meta.id) {
                    onDeactivate(meta.id);
                  }
                }
              }}
              className="rounded px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-500/10"
            >
              Remove
            </button>
          )}

          <span className="ml-auto flex shrink-0 items-center">
            <TrendArrow trend={trend} />
          </span>
        </div>
      </div>
    </div>
  );
}
