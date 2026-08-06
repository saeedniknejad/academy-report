import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { PlayerMeta, Position, Team } from "../lib/types";

type RosterPlayerInput = {
  name: string;
  number: string;
  primaryPosition: Position;
};

interface AddRosterProps {
  team: Team;
  onSave: (players: PlayerMeta[]) => Promise<void>;
  onSkip: () => Promise<void>;
}

const EMPTY_PLAYER: RosterPlayerInput = {
  name: "",
  number: "",
  primaryPosition: "Midfielder",
};

export default function AddRoster({
  team,
  onSave,
  onSkip,
}: AddRosterProps) {
  const [players, setPlayers] = useState<RosterPlayerInput[]>([
    { ...EMPTY_PLAYER },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updatePlayer(
    index: number,
    field: keyof RosterPlayerInput,
    value: string
  ) {
    setPlayers((current) =>
      current.map((player, playerIndex) =>
        playerIndex === index
          ? { ...player, [field]: value }
          : player
      )
    );
  }

  function addPlayerRow() {
    setPlayers((current) => [
      ...current,
      { ...EMPTY_PLAYER },
    ]);
  }

  function removePlayerRow(index: number) {
    setPlayers((current) =>
      current.filter((_, playerIndex) => playerIndex !== index)
    );
  }

  async function handleSave() {
    setError(null);

    const completedPlayers = players.filter(
      (player) =>
        player.name.trim() ||
        player.number.trim()
    );

    if (completedPlayers.length === 0) {
      setError("Add at least one player or choose Skip for Now.");
      return;
    }

    for (const player of completedPlayers) {
      if (!player.name.trim()) {
        setError("Every player must have a name.");
        return;
      }

      const number = Number(player.number);

      if (
        !Number.isInteger(number) ||
        number < 0 ||
        number > 99
      ) {
        setError(
          "Every jersey number must be a whole number from 0 to 99."
        );
        return;
      }
    }

    const jerseyNumbers = completedPlayers.map((player) =>
      Number(player.number)
    );

    if (new Set(jerseyNumbers).size !== jerseyNumbers.length) {
      setError("Jersey numbers must be unique within the team.");
      return;
    }

    const roster: PlayerMeta[] = completedPlayers.map((player) => ({
      name: player.name.trim(),
      number: Number(player.number),
      primaryPosition: player.primaryPosition,
      ageGroup: `U${team.ageGroup}`,
    }));

    try {
      setSaving(true);
      await onSave(roster);
    } catch (err) {
      console.error("Failed to save roster:", err);
      setError(
        err instanceof Error
          ? err.message
          : "The roster could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-2xl text-text-primary">
          Add Players
        </h1>

        <p className="mt-1 text-sm text-text-muted">
          {team.clubName} {team.name} U{team.ageGroup}
        </p>
      </div>

      <section className="mt-6 space-y-3">
        {players.map((player, index) => (
          <div
            key={index}
            className="rounded-card border border-border bg-bg-card p-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_110px_180px_auto] sm:items-end">
              <label className="text-sm text-text-secondary">
                Player name
                <input
                  value={player.name}
                  onChange={(event) =>
                    updatePlayer(index, "name", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-text-primary outline-none focus:border-border-hover"
                />
              </label>

              <label className="text-sm text-text-secondary">
                Jersey #
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={player.number}
                  onChange={(event) =>
                    updatePlayer(index, "number", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-text-primary outline-none focus:border-border-hover"
                />
              </label>

              <label className="text-sm text-text-secondary">
                Preferred position
                <select
                  value={player.primaryPosition}
                  onChange={(event) =>
                    updatePlayer(
                      index,
                      "primaryPosition",
                      event.target.value
                    )
                  }
                  className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-text-primary outline-none focus:border-border-hover"
                >
                  <option value="Goalkeeper">Goalkeeper</option>
                  <option value="Defender">Defender</option>
                  <option value="Midfielder">Midfielder</option>
                  <option value="Forward">Forward</option>
                  <option value="Mixed-Training">Mixed-Training</option>
                </select>
              </label>

              <button
                type="button"
                onClick={() => removePlayerRow(index)}
                disabled={players.length === 1}
                aria-label={`Remove player row ${index + 1}`}
                className="flex min-h-[40px] items-center justify-center rounded-md border border-border px-3 text-text-muted transition-colors hover:border-border-hover hover:text-text-primary disabled:opacity-30"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </section>

      <button
        type="button"
        onClick={addPlayerRow}
        className="mt-4 flex min-h-[40px] items-center gap-2 rounded-md border border-border bg-bg-card px-4 py-2 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
      >
        <Plus size={16} />
        Add Another Player
      </button>

      {error && (
        <p className="mt-4 text-sm text-[#E58F86]">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onSkip}
          disabled={saving}
          className="min-h-[44px] rounded-md border border-border px-5 py-2.5 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary disabled:opacity-50"
        >
          Skip for Now
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-accent-gold px-5 py-2.5 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving && (
            <Loader2 size={16} className="animate-spin" />
          )}
          Save Roster
        </button>
      </div>
    </main>
  );
}