import { Infinity as InfinityIcon, Play, Timer } from 'lucide-react';
import {
  RARITY_CONFIG,
  RARITY_ORDER,
  SPORT_CATEGORIES,
  type SavedRun,
  type SportCategory,
} from '../types';
import { RarityEmblem } from './RarityEmblem';

interface TitleViewProps {
  selectedCategory: SportCategory;
  onSelectCategory: (cat: SportCategory) => void;
  timedMode: boolean;
  onToggleTimedMode: (timed: boolean) => void;
  onStartGame: () => void;
  isStarting: boolean;
  errorMessage: string | null;
  savedRuns: SavedRun[];
}

const ESCALATION_STEPS: Array<{ rounds: string; tier: (typeof RARITY_ORDER)[number]; rule: string }> = [
  { rounds: 'Rounds 1–15', tier: 'Rookie', rule: 'Any valid answer' },
  { rounds: 'Rounds 16–30', tier: 'Starter', rule: 'Starter or rarer' },
  { rounds: 'Rounds 31–45', tier: 'All-Star', rule: 'All-Star or rarer' },
  { rounds: 'Rounds 46–60', tier: 'Deep Cut', rule: 'Deep Cut or rarer' },
  { rounds: 'Round 61+', tier: 'Mythic', rule: 'Mythic only' },
];

export function TitleView({
  selectedCategory,
  onSelectCategory,
  timedMode,
  onToggleTimedMode,
  onStartGame,
  isStarting,
  errorMessage,
  savedRuns,
}: TitleViewProps) {
  const bestScore = savedRuns.reduce((max, r) => Math.max(max, r.score), 0);
  const bestStreak = savedRuns.reduce((max, r) => Math.max(max, r.bestStreak), 0);

  return (
    <div className="bg-white">
      {/* Zone 1: Clean White Hero & Organized Run Builder */}
      <section className="border-b-2 border-[#E5E7EB] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            {/* Left Primary Hero & Clean Rules Summary */}
            <div className="lg:col-span-7">
              <p className="text-sm font-bold text-[#1E8200]">
                Endless Sports Rarity Trivia · 3 Lives · Smart Alias Referee
              </p>
              <h1 className="font-display mt-2.5 text-5xl font-bold tracking-tight text-[#1F2937] text-balance sm:text-6xl">
                Dig past the obvious play.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#4B5563]">
                Name any valid sports answer before the clock runs out. Non-matching guesses
                keep the round going so you can keep digging—and every 15 questions, the
                minimum rarity climbs all the way to Mythic-only.
              </p>

              {/* Organized 3-Rule Breakdown (Whitespace + Hairlines, No Nested Cards) */}
              <div className="mt-8 grid gap-6 border-t-2 border-[#F1F5F9] pt-6 sm:grid-cols-3">
                <div>
                  <p className="font-mono-tabular text-xs font-bold text-[#1E8200]">01</p>
                  <h2 className="mt-1 text-sm font-bold text-[#1F2937]">
                    Keep Digging on Misses
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">
                    Misses don&apos;t end the round immediately—keep guessing until you hit
                    the tier or time runs out.
                  </p>
                </div>
                <div>
                  <p className="font-mono-tabular text-xs font-bold text-[#1E8200]">02</p>
                  <h2 className="mt-1 text-sm font-bold text-[#1F2937]">
                    15-Round Tier Climb
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">
                    Minimum rarity steps up every 15 rounds: Starter+, All-Star+, Deep Cut+,
                    then Mythic-only.
                  </p>
                </div>
                <div>
                  <p className="font-mono-tabular text-xs font-bold text-[#1E8200]">03</p>
                  <h2 className="mt-1 text-sm font-bold text-[#1F2937]">
                    Smart Alias Referee
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">
                    Normalizes typos, nicknames, and regional terms like &ldquo;volley&rdquo;
                    → &ldquo;Set&rdquo; or &ldquo;PCA&rdquo;.
                  </p>
                </div>
              </div>

              {savedRuns.length > 0 && (
                <div className="mt-7 flex flex-wrap items-center gap-5 border-t-2 border-[#F1F5F9] pt-5 text-sm text-[#4B5563]">
                  <div>
                    <span>Personal Best</span>{' '}
                    <span className="font-mono-tabular font-bold text-[#1F2937]">
                      {bestScore.toLocaleString()} pts
                    </span>
                  </div>
                  <span aria-hidden="true" className="text-[#CBD5E1]">
                    ·
                  </span>
                  <div>
                    <span>Longest Streak</span>{' '}
                    <span className="font-mono-tabular font-bold text-[#1F2937]">
                      {bestStreak}
                    </span>
                  </div>
                  <span aria-hidden="true" className="text-[#CBD5E1]">
                    ·
                  </span>
                  <div>
                    <span>Runs Logged</span>{' '}
                    <span className="font-mono-tabular font-bold text-[#1F2937]">
                      {savedRuns.length}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Organized Setup Card */}
            <div className="rounded-2xl border-2 border-[#E5E7EB] bg-white p-6 lg:col-span-5">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-[#1F2937]">
                    1. Choose Sport Focus
                  </label>
                  <span className="text-xs font-semibold text-[#1E8200]">
                    {selectedCategory}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {SPORT_CATEGORIES.map((category) => {
                    const active = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => onSelectCategory(category)}
                        className={`min-h-[42px] cursor-pointer truncate rounded-xl border-2 px-3 py-2 text-left text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] ${
                          active
                            ? 'border-[#58CC02] bg-[#EAFCE0] text-[#145300]'
                            : 'border-[#E5E7EB] bg-white text-[#374151] hover:border-[#CBD5E1] hover:bg-[#F9FAFB]'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 border-t border-[#E5E7EB] pt-5">
                <span className="block text-sm font-bold text-[#1F2937]">
                  2. Choose Pace
                </span>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleTimedMode(true)}
                    className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-bold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] ${
                      timedMode
                        ? 'border-[#58CC02] bg-[#EAFCE0] text-[#145300]'
                        : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#CBD5E1] hover:text-[#1F2937]'
                    }`}
                  >
                    <Timer className="h-4 w-4" aria-hidden="true" />
                    25s Shot Clock
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleTimedMode(false)}
                    className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-bold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] ${
                      !timedMode
                        ? 'border-[#58CC02] bg-[#EAFCE0] text-[#145300]'
                        : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#CBD5E1] hover:text-[#1F2937]'
                    }`}
                  >
                    <InfinityIcon className="h-4 w-4" aria-hidden="true" />
                    Untimed Chill
                  </button>
                </div>
              </div>

              <div className="mt-6">
                {errorMessage && (
                  <div
                    role="alert"
                    className="mb-3 rounded-xl border-2 border-[#FDA4AF] bg-[#FFF1F2] px-3.5 py-2.5 text-xs font-medium text-[#9F1239]"
                  >
                    {errorMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={onStartGame}
                  disabled={isStarting}
                  className="flex min-h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-b-4 border-[#135A00] bg-[#1E8200] px-5 py-3 text-sm font-bold text-white transition-all hover:bg-[#239300] active:translate-y-0.5 active:border-b-2 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02]"
                >
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  {isStarting ? 'Scouting First Prompt…' : 'Start Endless Run'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zone 2: Structured Progression & Rarity Ladder on Light Gray Band */}
      <section className="bg-[#F7F8F7] py-10">
        <div className="mx-auto max-w-6xl px-6 space-y-10">
          {/* 15-Round Escalation Path */}
          <div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#1F2937]">
                Endless Escalation Path
              </h2>
              <p className="text-sm text-[#4B5563]">
                Every 15 rounds raises the minimum acceptable rarity tier
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {ESCALATION_STEPS.map((step, idx) => {
                const meta = RARITY_CONFIG[step.tier];
                return (
                  <div
                    key={step.rounds}
                    className="flex items-center gap-3 rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3"
                  >
                    <RarityEmblem tier={step.tier} size={22} />
                    <div className="min-w-0">
                      <p className="font-mono-tabular text-xs font-bold text-[#4B5563]">
                        {idx + 1}. {step.rounds}
                      </p>
                      <p className={`text-sm font-bold ${meta.textClass}`}>{step.rule}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rarity Scoring Ladder */}
          <div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#1F2937]">
                Rarity Scoring Ladder
              </h2>
              <p className="text-sm text-[#4B5563]">
                Rarer valid picks earn higher base points plus up to +500 streak bonus
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {RARITY_ORDER.map((tierName) => {
                const meta = RARITY_CONFIG[tierName];
                return (
                  <div
                    key={tierName}
                    className="flex flex-col justify-between rounded-xl border-2 border-[#E5E7EB] bg-white p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <RarityEmblem tier={tierName} size={20} />
                          <span className={`font-display text-lg font-bold ${meta.textClass}`}>
                            {meta.label}
                          </span>
                        </div>
                        <span className="font-mono-tabular text-sm font-bold text-[#1F2937]">
                          {meta.points.toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-[#4B5563]">
                        {meta.description}
                      </p>
                    </div>
                    <p className="mt-3 border-t border-[#F1F5F9] pt-2.5 font-mono-tabular text-xs font-medium text-[#4B5563]">
                      {meta.pickBand}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
