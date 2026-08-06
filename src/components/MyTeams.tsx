import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import type { Team } from "../lib/types";

interface MyTeamsProps {
  teams: Team[];
  onCreateTeam: (input: {
    name: string;
    clubName: string;
    ageGroup: number;
    seasonStartYear: number;
    seasonEndYear: number;
  }) => Promise<void>;
  onSelectTeam: (team: Team) => void;
  onDeactivateTeam: (teamId: string) => Promise<void>;
}

export default function MyTeams({
  teams,
  onCreateTeam,
  onSelectTeam,
  onDeactivateTeam,
}: MyTeamsProps) {
  const currentYear = new Date().getFullYear();

  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [clubName, setClubName] = useState("");
  const [ageGroup, setAgeGroup] = useState(12);
  const [seasonEndYear, setSeasonEndYear] = useState(currentYear + 1);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);

    if (!name.trim() || !clubName.trim()) {
      setError("Team name and club name are required.");
      return;
    }

    try {
      setSubmitting(true);

      await onCreateTeam({
        name,
        clubName,
        ageGroup,
        seasonStartYear: currentYear,
        seasonEndYear,
      });

      setName("");
      setClubName("");
      setAgeGroup(12);
      setSeasonEndYear(currentYear + 1);
      setCreating(false);
    } catch (err) {
      console.error("Failed to create team:", err);
      setError(
        err instanceof Error ? err.message : "The team could not be created."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-text-primary">My Teams</h1>
          <p className="mt-1 text-sm text-text-muted">
            Select an existing team or create a new one.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreating((value) => !value)}
          className="flex min-h-[40px] items-center gap-2 rounded-md bg-accent-gold px-4 py-2 text-sm font-medium text-bg-primary"
        >
          <Plus size={16} />
          Create Team
        </button>
      </div>

      {creating && (
        <section className="mb-6 rounded-card border border-border bg-bg-card p-5">
          <h2 className="font-heading text-lg text-text-primary">Create Team</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm text-text-secondary">
              Team name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-text-primary outline-none focus:border-border-hover"
              />
            </label>

            <label className="text-sm text-text-secondary">
              Club name
              <input
                value={clubName}
                onChange={(event) => setClubName(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-text-primary outline-none focus:border-border-hover"
              />
            </label>

            <label className="text-sm text-text-secondary">
              Age group
              <select
                value={ageGroup}
                onChange={(event) => setAgeGroup(Number(event.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-text-primary outline-none focus:border-border-hover"
              >
                {Array.from({ length: 15 }, (_, index) => index + 5).map(
                  (age) => (
                    <option key={age} value={age}>
                      U-{age}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="text-sm text-text-secondary">
              Season
              <select
                value={seasonEndYear}
                onChange={(event) =>
                  setSeasonEndYear(Number(event.target.value))
                }
                className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-text-primary outline-none focus:border-border-hover"
              >
                <option value={currentYear}>{currentYear}</option>
                <option value={currentYear + 1}>
                  {currentYear}/{String(currentYear + 1).slice(-2)}
                </option>
              </select>
            </label>
          </div>

          {error && (
            <p className="mt-4 text-sm text-[#E58F86]">{error}</p>
          )}

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting}
              className="flex items-center gap-2 rounded-md bg-accent-gold px-4 py-2 text-sm font-medium text-bg-primary disabled:opacity-60"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Create Team
            </button>
          </div>
        </section>
      )}

      {teams.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-bg-card p-10 text-center">
          <p className="text-text-secondary">No teams yet.</p>
          <p className="mt-1 text-sm text-text-muted">
            Create your first team to continue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-card border border-border bg-bg-card p-5 transition-colors hover:border-border-hover hover:bg-bg-card-hover"
            >
              <button
                type="button"
                onClick={() => onSelectTeam(team)}
                className="w-full text-left"
              >
                <h2 className="font-heading text-lg text-text-primary">
                  {team.name}
                </h2>

                <p className="mt-1 text-sm text-text-secondary">
                  {team.clubName}
                </p>

                <p className="mt-3 font-mono text-[11px] text-text-muted">
                  U-{team.ageGroup} · {team.seasonStartYear}/
                  {String(team.seasonEndYear).slice(-2)}
                </p>
              </button>

              <div className="mt-4 flex justify-end border-t border-border pt-3">
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = window.confirm(
                      `Remove ${team.clubName} ${team.name} U${team.ageGroup} from My Teams?`
                    );

                    if (!confirmed) {
                      return;
                    }

                    try {
                      await onDeactivateTeam(team.id);
                    } catch (error) {
                      console.error("Failed to deactivate team:", error);

                      window.alert(
                        error instanceof Error
                          ? error.message
                          : "The team could not be removed."
                      );
                    }
                  }}
                  className="rounded-md px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}