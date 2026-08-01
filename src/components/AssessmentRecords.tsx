import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Assessment, PlayerMeta } from "../lib/types";

type AssessmentRecordsProps = {
  assessments: Assessment[];
  roster: PlayerMeta[];
  onClose: () => void;
  onSelect?: (assessment: Assessment) => void;
};

export default function AssessmentRecords({
  assessments,
  roster,
  onClose,
  onSelect,
}: AssessmentRecordsProps) {
    const [searchText, setSearchText] = useState("");
    const [sessionFilter, setSessionFilter] = useState("All");
    const playerNameById = new Map(
    roster
      .filter((player) => player.id)
      .map((player) => [player.id as string, player.name])
  );

  const filteredAssessments = useMemo(() => {
      const normalizedSearch = searchText.trim().toLowerCase();

      const uniqueAssessments = Array.from(
        new Map(
          assessments.map((assessment) => {
            const assessmentDate = assessment.timestamp.slice(0, 10);

            const identity =
              assessment.id ??
              `${assessment.playerId}-${assessmentDate}-${assessment.sessionType}`;

            return [identity, assessment];
          })
        ).values()
      );

      return uniqueAssessments
        .filter((assessment) => {
          const playerName = assessment.playerId
            ? playerNameById.get(assessment.playerId)
            : assessment.playerName;

          const matchesSearch =
            !normalizedSearch ||
            (playerName ?? "")
              .toLowerCase()
              .includes(normalizedSearch);

          const matchesSession =
            sessionFilter === "All" ||
            assessment.sessionType === sessionFilter;

          return matchesSearch && matchesSession;
        })
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        );
    }, [assessments, playerNameById, searchText, sessionFilter]);

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
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search player..."
            className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-border-hover"
          />

          <select
            value={sessionFilter}
            onChange={(event) => setSessionFilter(event.target.value)}
            className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-border-hover"
          >
            <option value="All">All session types</option>
            <option value="Training">Training</option>
            <option value="Match">Match</option>
            <option value="Tournament">Tournament</option>
          </select>
        </div>
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
                  >
                      <button
                        type="button"
                        onClick={() => onSelect?.(assessment)}
                        className="flex w-full items-center justify-between rounded-md border border-border bg-bg-primary px-4 py-3 text-left transition-colors hover:border-border-hover hover:bg-bg-card-hover"
                      >
                        <div>
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
                        </div>

                        <span
                          aria-hidden="true"
                          className="ml-4 text-lg text-text-muted"
                        >
                          ›
                        </span>
                      </button>
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