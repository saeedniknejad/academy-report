import type { PlayerProfile } from "../lib/types";
import { TrendArrow } from "./ui";

interface PlayerCardProps {
  profile: PlayerProfile;
  active: boolean;
  onClick: () => void;
  /** When set, shows a small "compare" toggle affordance. */
  compareActive?: boolean;
}

/** One squad-list item: jersey number, name, position, trend, flag badge. */
export default function PlayerCard({ profile, active, onClick, compareActive }: PlayerCardProps) {
  const { meta, trend, flagged } = profile;
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-[58px] w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
        active
          ? "border-accent-gold bg-bg-card-hover"
          : compareActive
            ? "border-accent-green bg-bg-card-hover"
            : "border-border bg-bg-card hover:border-border-hover"
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-bg-primary font-heading text-sm font-semibold text-accent-gold">
        {meta.number}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-heading text-base leading-tight text-text-primary">
          {meta.name}
        </div>
        <div className="font-mono text-[11px] text-text-muted">{meta.primaryPosition}</div>
      </div>
      {flagged && (
        <span className="rounded bg-accent-red/20 px-1.5 py-0.5 font-mono text-[10px] text-[#E58F86]">
          FLAG
        </span>
      )}
      <TrendArrow trend={trend} />
    </button>
  );
}
