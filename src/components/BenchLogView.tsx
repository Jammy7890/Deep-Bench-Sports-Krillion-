import { Trash2 } from 'lucide-react';
import { PACE_CONFIG, RARITY_CONFIG, type SavedRun } from '../types';
import { RarityEmblem } from './RarityEmblem';

interface BenchLogViewProps {
  runs: SavedRun[];
  onClearHistory: () => void;
  onStartPlay: () => void;
}

export function BenchLogView({
  runs,
  onClearHistory,
  onStartPlay,
}: BenchLogViewProps) {
  const bestScore = runs.reduce((max, r) => Math.max(max, r.score), 0);
  const totalCorrect = runs.reduce((sum, r) => sum + r.correctCount, 0);
  const mythicCount = runs.reduce(
    (sum, r) =>
      sum + (r.entries ?? []).filter((e) => e?.evaluation?.rarity === 'Mythic').length,
    0
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-2xl border-2 border-[#E5E7EB] bg-white p-6 md:p-8">
        <div className="flex flex-col gap-4 border-b-2 border-[#F1F5F9] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold text-[#1F2937]">Bench Log</h1>
            <p className="mt-1 text-sm text-[#4B5563]">
              Recent endless runs saved locally in this browser
            </p>
          </div>
          {runs.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="flex min-h-[40px] cursor-pointer items-center gap-2 self-start rounded-xl border-2 border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-bold text-[#4B5563] transition-colors hover:border-[#FDA4AF] hover:text-[#DC2626]"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Clear History
            </button>
          )}
        </div>

        {runs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-base font-bold text-[#1F2937]">
              No completed runs logged yet.
            </p>
            <p className="mt-1 text-sm text-[#4B5563]">
              Play an endless run until 3 strikes to record your box score here.
            </p>
            <button
              type="button"
              onClick={onStartPlay}
              className="mt-6 min-h-[46px] cursor-pointer rounded-xl border-b-4 border-[#135A00] bg-[#1E8200] px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#239300] active:translate-y-0.5 active:border-b-2"
            >
              Start Your First Run
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-3 gap-4 border-b-2 border-[#F1F5F9] pb-6">
              <div>
                <p className="text-xs font-semibold text-[#4B5563]">High Score</p>
                <p className="font-mono-tabular mt-1 text-2xl font-bold text-[#1E8200]">
                  {bestScore.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#4B5563]">Total Correct Pulls</p>
                <p className="font-mono-tabular mt-1 text-2xl font-bold text-[#1F2937]">
                  {totalCorrect}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#4B5563]">Mythic Pulls</p>
                <p className="font-mono-tabular mt-1 text-2xl font-bold text-[#BE123C]">
                  {mythicCount}
                </p>
              </div>
            </div>

            <div className="mt-4 divide-y divide-[#F1F5F9]">
              {runs.map((run) => {
                const dateLabel = new Date(run.playedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const rareMeta = run.highestRarity
                  ? RARITY_CONFIG[run.highestRarity]
                  : null;
                const paceLabel = run.paceMode
                  ? PACE_CONFIG[run.paceMode].shortLabel
                  : run.timedMode
                    ? '25s Clock'
                    : 'Untimed';

                return (
                  <div
                    key={run.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#4B5563]">
                        <span className="text-[#1E8200]">{run.category}</span>
                        <span aria-hidden="true" className="text-[#CBD5E1]">
                          ·
                        </span>
                        <span>{paceLabel}</span>
                        <span aria-hidden="true" className="text-[#CBD5E1]">
                          ·
                        </span>
                        <span>{dateLabel}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#1F2937]">
                        {run.correctCount} correct across {run.totalRounds} rounds · Best
                        streak {run.bestStreak}
                      </p>
                    </div>

                    <div className="flex items-center gap-5">
                      {rareMeta && (
                        <div className="flex items-center gap-1.5">
                          <RarityEmblem tier={rareMeta.tier} size={16} />
                          <span
                            className={`font-display text-base font-bold ${rareMeta.textClass}`}
                          >
                            {rareMeta.label}
                          </span>
                        </div>
                      )}
                      <span className="font-mono-tabular text-lg font-bold text-[#1F2937]">
                        {run.score.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
