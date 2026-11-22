import { ArrowRight, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import {
  RARITY_CONFIG,
  type RarityTier,
  type RoundHistoryEntry,
  type SportCategory,
} from '../types';
import { RarityEmblem } from './RarityEmblem';

interface GameOverViewProps {
  score: number;
  category: SportCategory;
  bestStreak: number;
  highestRarity: RarityTier | null;
  entries: RoundHistoryEntry[];
  onPlayAgain: () => void;
  onOpenBenchLog: () => void;
}

export function GameOverView({
  score,
  category,
  bestStreak,
  highestRarity,
  entries,
  onPlayAgain,
  onOpenBenchLog,
}: GameOverViewProps) {
  const correctCount = entries.filter((e) => e.evaluation.isValid).length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-2xl border-2 border-[#E5E7EB] bg-white p-6 md:p-8">
        <div className="flex flex-col gap-6 border-b-2 border-[#F1F5F9] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold text-[#DC2626]">
              Three Strikes · Final Box Score · {category}
            </p>
            <h1 className="font-display mt-2 text-4xl font-bold text-[#1F2937] sm:text-5xl">
              Run Complete
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenBenchLog}
              className="min-h-[44px] cursor-pointer rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-2 text-sm font-bold text-[#374151] transition-colors hover:border-[#CBD5E1] hover:bg-[#F9FAFB] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02]"
            >
              View Bench Log
            </button>
            <button
              type="button"
              onClick={onPlayAgain}
              className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border-b-4 border-[#135A00] bg-[#1E8200] px-5 py-2 text-sm font-bold text-white transition-all hover:bg-[#239300] active:translate-y-0.5 active:border-b-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Play Again
            </button>
          </div>
        </div>

        {/* 4-Column Summary Strip */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="border-r border-[#E5E7EB] pr-4">
            <p className="text-xs font-semibold text-[#4B5563]">Final Score</p>
            <p className="font-mono-tabular mt-1 text-2xl font-bold text-[#1E8200]">
              {score.toLocaleString()}
            </p>
          </div>
          <div className="sm:border-r sm:border-[#E5E7EB] sm:pr-4">
            <p className="text-xs font-semibold text-[#4B5563]">Correct Pulls</p>
            <p className="font-mono-tabular mt-1 text-2xl font-bold text-[#1F2937]">
              {correctCount}/{entries.length}
            </p>
          </div>
          <div className="border-r border-[#E5E7EB] pr-4">
            <p className="text-xs font-semibold text-[#4B5563]">Best Streak</p>
            <p className="font-mono-tabular mt-1 text-2xl font-bold text-[#1F2937]">
              {bestStreak}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#4B5563]">Rarest Hit</p>
            {highestRarity ? (
              <div className="mt-1 flex items-center gap-2">
                <RarityEmblem tier={highestRarity} size={20} />
                <span
                  className={`font-display text-2xl font-bold ${RARITY_CONFIG[highestRarity].textClass}`}
                >
                  {highestRarity}
                </span>
              </div>
            ) : (
              <p className="mt-1 text-lg font-bold text-[#6B7280]">None</p>
            )}
          </div>
        </div>

        {/* Full Play-by-Play Box Score */}
        <div className="mt-8 border-t-2 border-[#F1F5F9] pt-6">
          <h2 className="font-display text-xl font-bold text-[#1F2937]">
            Round-by-Round Box Score
          </h2>

          <div className="mt-4 divide-y divide-[#F1F5F9]">
            {entries.map((entry) => {
              const { evaluation, question, roundNumber } = entry;
              const tierMeta = evaluation.rarity
                ? RARITY_CONFIG[evaluation.rarity]
                : null;
              const normalized =
                evaluation.isValid &&
                (evaluation.matchType === 'ALIAS_SWITCH' ||
                  evaluation.matchType === 'TYPO_CORRECTED');

              return (
                <div
                  key={`${roundNumber}-${question.id}`}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#4B5563]">
                      <span className="font-mono-tabular text-[#1E8200]">
                        #{String(roundNumber).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true" className="text-[#CBD5E1]">
                        ·
                      </span>
                      <span>{question.sport}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#1F2937]">
                      {question.prompt}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      {evaluation.isValid ? (
                        <CheckCircle2
                          className="h-3.5 w-3.5 text-[#1E8200]"
                          aria-hidden="true"
                        />
                      ) : (
                        <XCircle
                          className="h-3.5 w-3.5 text-[#DC2626]"
                          aria-hidden="true"
                        />
                      )}

                      {normalized && (
                        <>
                          <span className="text-[#6B7280] line-through">
                            {evaluation.rawInput}
                          </span>
                          <ArrowRight
                            className="h-3 w-3 text-[#6B7280]"
                            aria-hidden="true"
                          />
                        </>
                      )}

                      <span className="font-bold text-[#1F2937]">
                        {evaluation.canonicalAnswer ??
                          (evaluation.rawInput === '—'
                            ? 'Time Expired'
                            : evaluation.rawInput)}
                      </span>

                      <span aria-hidden="true" className="text-[#CBD5E1]">
                        ·
                      </span>
                      <span className="text-[#4B5563]">{evaluation.refereeNote}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                    {tierMeta ? (
                      <div className="flex items-center gap-1.5">
                        <RarityEmblem tier={tierMeta.tier} size={16} />
                        <span
                          className={`font-display text-base font-bold ${tierMeta.textClass}`}
                        >
                          {tierMeta.label}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-[#DC2626]">Strike</span>
                    )}
                    <span className="font-mono-tabular text-sm font-bold text-[#1F2937]">
                      +{evaluation.totalPoints.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
