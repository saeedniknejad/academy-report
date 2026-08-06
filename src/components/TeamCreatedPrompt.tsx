import { CheckCircle2, Users } from "lucide-react";
import type { Team } from "../lib/types";

interface TeamCreatedPromptProps {
  team: Team;
  onAddPlayersNow: () => void;
  onAddPlayersLater: () => void;
}

export default function TeamCreatedPrompt({
  team,
  onAddPlayersNow,
  onAddPlayersLater,
}: TeamCreatedPromptProps) {
  return (
    <main className="mx-auto flex max-w-xl justify-center p-4 py-12 sm:p-6 sm:py-20">
      <section className="w-full rounded-card border border-border bg-bg-card p-6 text-center">
        <CheckCircle2
          size={36}
          className="mx-auto text-accent-green"
        />

        <h1 className="mt-4 font-heading text-2xl text-text-primary">
          Team Created
        </h1>

        <p className="mt-2 text-sm text-text-secondary">
          {team.clubName} {team.name} U{team.ageGroup}
        </p>

        <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-text-muted">
          Would you like to add players to the roster now?
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onAddPlayersNow}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-accent-gold px-5 py-2.5 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90"
          >
            <Users size={16} />
            Add Players Now
          </button>

          <button
            type="button"
            onClick={onAddPlayersLater}
            className="min-h-[44px] rounded-md border border-border px-5 py-2.5 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
          >
            Do It Later
          </button>
        </div>
      </section>
    </main>
  );
}