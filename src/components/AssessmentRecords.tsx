import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Assessment, PlayerMeta } from "../lib/types";

type AssessmentRecordsProps = {
  assessments: Assessment[];
  roster: PlayerMeta[];
  onClose: () => void;
};

export default function AssessmentRecords({
  assessments,
  roster,
  onClose,
}: AssessmentRecordsProps) {
    const [searchText, setSearchText] = useState("");
    const playerNameById = new Map(
    roster
      .filter((player) => player.id)
      .map((player) => [player.id as string, player.name])
  );

  const filteredAssessments = useMemo(() => {
      const normalizedSearch = searchText.trim().toLowerCase();

      return [...assessments]
        .filter((assessment) => {
          if (!normalizedSearch) {
            return true;
          }

          const playerName = assessment.playerId
            ? playerNameById.get(assessment.playerId)
            : assessment.playerName;

          return (playerName ?? "")
            .toLowerCase()
            .includes(normalizedSearch);
        })
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        );
    }, [assessments, playerNameById, searchText]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assessment-records-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="my-4 w-full max-w-2xl rounded-card border border-border bg-bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2
              id="assessment-records-title"
              className="font-heading text-xl"
            >
              Assessment Records
            </h2>

            <p className="mt-1 text-sm text-text-muted">
              Review and edit previously saved assessments.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close assessment records"
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-card-hover hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
        <input
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search player..."
          className="mb-4 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-border-hover"
        />
          {filteredAssessments.length === 0 ? (
            <p className="rounded-md border border-border bg-bg-primary px-4 py-6 text-center text-sm text-text-muted">
              No assessment records found.
            </p>
          ) : (
            <ul className="space-y-2">
              {filteredAssessments.map((assessment, index) => {
                const playerName =
                  assessment.playerId
                    ? playerNameById.get(assessment.playerId)
                    : assessment.playerName;

                const assessmentDate =
                  assessment.timestamp.slice(0, 10);

                return (
                  <li
                    key={
                      assessment.id ??
                      `${assessment.playerId}-${assessmentDate}-${assessment.sessionType}-${index}`
                    }
                    className="rounded-md border border-border bg-bg-primary px-4 py-3"
                  >
                    <p className="text-sm font-medium text-text-primary">
                      {playerName || "Unknown player"}
                    </p>

                    <p className="mt-1 font-mono text-[11px] text-text-muted">
                      {new Date(
                        `${assessmentDate}T12:00:00`
                      ).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" · "}
                      {assessment.sessionType}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}