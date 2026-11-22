import { useEffect, useRef, type FormEvent } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Heart,
  Loader2,
  SkipForward,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import {
  getNextEscalationInfo,
  RARITY_CONFIG,
  type EvaluationResult,
  type QuestionPrompt,
  type RarityTier,
} from '../types';
import { RarityEmblem } from './RarityEmblem';

interface AttemptFeedback {
  input: string;
  note: string;
  belowMinRarity: boolean;
}

interface PlayViewProps {
  question: QuestionPrompt | null;
  roundNumber: number;
  minRarity: RarityTier;
  lives: number;
  maxLives: number;
  score: number;
  streak: number;
  timedMode: boolean;
  timeRemaining: number;
  maxTime: number;
  answerInput: string;
  onChangeAnswer: (val: string) => void;
  onSubmitAnswer: () => void;
  onSkipQuestion: () => void;
  onNextQuestion: () => void;
  onEndRunEarly: () => void;
  isEvaluating: boolean;
  isLoadingQuestion: boolean;
  evaluation: EvaluationResult | null;
  attemptFeedback: AttemptFeedback | null;
  rejectedGuesses: string[];
  untimedAttemptsUsed: number;
  errorMessage: string | null;
  muted: boolean;
  onToggleMute: () => void;
}

export function PlayView({
  question,
  roundNumber,
  minRarity,
  lives,
  maxLives,
  score,
  streak,
  timedMode,
  timeRemaining,
  maxTime,
  answerInput,
  onChangeAnswer,
  onSubmitAnswer,
  onSkipQuestion,
  onNextQuestion,
  onEndRunEarly,
  isEvaluating,
  isLoadingQuestion,
  evaluation,
  attemptFeedback,
  rejectedGuesses,
  untimedAttemptsUsed,
  errorMessage,
  muted,
  onToggleMute,
}: PlayViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!evaluation && question && !isEvaluating) {
      inputRef.current?.focus();
    }
  }, [question, evaluation, isEvaluating]);

  useEffect(() => {
    if (evaluation) {
      nextBtnRef.current?.focus();
    }
  }, [evaluation]);

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!evaluation && !isEvaluating && answerInput.trim().length > 0) {
      onSubmitAnswer();
    }
  };

  const progressRatio = timedMode ? Math.max(0, Math.min(1, timeRemaining / maxTime)) : 1;
  const isUrgent = timedMode && timeRemaining <= 5 && !evaluation;

  const minMeta = RARITY_CONFIG[minRarity];
  const nextEscalation = getNextEscalationInfo(roundNumber);
  const justEscalated =
    roundNumber === 16 || roundNumber === 31 || roundNumber === 46 || roundNumber === 61;

  // Progress within current 15-round block (1..15)
  const blockProgress = nextEscalation
    ? ((15 - nextEscalation.roundsUntil + 1) / 15) * 100
    : 100;

  const rarityMeta = evaluation?.rarity ? RARITY_CONFIG[evaluation.rarity] : null;
  const wasNormalized =
    evaluation?.isValid &&
    (evaluation.matchType === 'ALIAS_SWITCH' || evaluation.matchType === 'TYPO_CORRECTED');

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 md:py-10">
      {/* Organized Duolingo-Style Top Vitals & Tier Progress Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Escalation Progress Bar */}
        <div className="flex min-w-[220px] flex-1 items-center gap-3">
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]">
            <div
              className="h-full rounded-full bg-[#58CC02] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(7, blockProgress))}%` }}
            />
          </div>
          <span className="font-mono-tabular whitespace-nowrap text-xs font-bold text-[#4B5563]">
            {nextEscalation
              ? `${nextEscalation.nextTier}${nextEscalation.nextTier === 'Mythic' ? ' Only' : '+'} in ${nextEscalation.roundsUntil}`
              : 'Mythic Only'}
          </span>
        </div>

        {/* Vitals & Controls */}
        <div className="flex flex-wrap items-center gap-5">
          <div
            className="flex items-center gap-1.5"
            aria-label={`Lives remaining: ${lives} of ${maxLives}`}
          >
            {Array.from({ length: maxLives }).map((_, idx) => {
              const alive = idx < lives;
              return (
                <Heart
                  key={idx}
                  className={`h-5 w-5 transition-transform duration-150 ${
                    alive
                      ? 'fill-[#EF4444] text-[#EF4444]'
                      : 'fill-[#E5E7EB] text-[#CBD5E1] scale-90'
                  }`}
                  aria-hidden="true"
                />
              );
            })}
            <span className="ml-1 font-mono-tabular text-xs font-bold text-[#374151]">
              {lives}/{maxLives}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Flame
              className={`h-4 w-4 ${streak > 0 ? 'fill-[#F59E0B] text-[#D97706]' : 'text-[#9CA3AF]'}`}
              aria-hidden="true"
            />
            <span className="font-mono-tabular text-xs font-bold text-[#374151]">
              {streak}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-medium text-[#4B5563]">Score</span>
            <span className="font-mono-tabular text-sm font-bold text-[#1F2937]">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Unmute game audio' : 'Mute game audio'}
              className="flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-xl border-2 border-[#E5E7EB] bg-white text-[#4B5563] transition-colors hover:border-[#CBD5E1] hover:text-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02]"
            >
              {muted ? (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={onEndRunEarly}
              className="min-h-[36px] cursor-pointer rounded-xl border-2 border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-bold text-[#4B5563] transition-colors hover:border-[#CBD5E1] hover:text-[#1F2937] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02]"
            >
              End Run
            </button>
          </div>
        </div>
      </div>

      {/* Main Focused Prompt Card */}
      <div className="mt-5 rounded-2xl border-2 border-[#E5E7EB] bg-white p-6 md:p-8">
        {isLoadingQuestion || !question ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-[#4B5563]">
            <Loader2 className="h-7 w-7 animate-spin text-[#58CC02]" aria-hidden="true" />
            <p className="text-sm font-semibold">Generating next sports prompt…</p>
          </div>
        ) : (
          <div>
            {/* Clean Metadata Row & Required Tier */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#4B5563]">
                <span className="font-mono-tabular text-[#1E8200]">
                  Round {String(roundNumber).padStart(2, '0')}
                </span>
                <span aria-hidden="true" className="text-[#CBD5E1]">
                  ·
                </span>
                <span>{question.sport}</span>
                <span aria-hidden="true" className="text-[#CBD5E1]">
                  ·
                </span>
                <span>{question.subCategory}</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-[#4B5563]">Minimum Tier:</span>
                <RarityEmblem tier={minRarity} size={16} />
                <span className={`font-bold ${minMeta.textClass}`}>
                  {minRarity === 'Mythic' ? 'Mythic Only' : `${minMeta.label}+`}
                </span>
              </div>
            </div>

            {/* Shot Clock Bar */}
            {timedMode && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#4B5563]">Shot Clock</span>
                  <span
                    className={`font-mono-tabular font-bold ${
                      isUrgent ? 'text-[#DC2626]' : 'text-[#1F2937]'
                    }`}
                  >
                    {timeRemaining.toFixed(1)}s
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                  <div
                    className={`h-full w-full origin-left transition-transform duration-100 ease-linear ${
                      isUrgent ? 'bg-[#EF4444]' : 'bg-[#58CC02]'
                    }`}
                    style={{ transform: `scaleX(${progressRatio})` }}
                  />
                </div>
              </div>
            )}

            {justEscalated && !evaluation && (
              <div className="mt-4 rounded-xl border-2 border-[#FCD34D] bg-[#FFFBEB] px-4 py-2.5 text-xs font-semibold text-[#92400E]">
                Difficulty Escalated —{' '}
                {minRarity === 'Mythic'
                  ? 'Final tier unlocked: only Mythic answers are accepted now.'
                  : `Answers must now be ${minRarity} or rarer.`}
              </div>
            )}

            {/* Prompt Question */}
            <h2 className="font-display mt-5 text-3xl font-bold leading-tight text-[#1F2937] text-balance md:text-4xl">
              {question.prompt}
            </h2>

            {errorMessage && (
              <div
                role="alert"
                className="mt-4 rounded-xl border-2 border-[#FDA4AF] bg-[#FFF1F2] px-4 py-3 text-sm font-medium text-[#9F1239]"
              >
                {errorMessage}
              </div>
            )}

            {/* Answer Entry Form */}
            {!evaluation ? (
              <form onSubmit={handleFormSubmit} className="mt-7">
                <label htmlFor="sports-answer-input" className="sr-only">
                  Your sports answer
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    ref={inputRef}
                    id="sports-answer-input"
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={isEvaluating}
                    value={answerInput}
                    onChange={(e) => onChangeAnswer(e.target.value)}
                    placeholder={
                      minRarity === 'Rookie'
                        ? 'Type an athlete, play, rule, or team…'
                        : `Type a ${minRarity}${minRarity === 'Mythic' ? '-only' : '+'} answer…`
                    }
                    className="min-h-[54px] flex-1 rounded-xl border-2 border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base font-medium text-[#1F2937] placeholder:text-[#6B7280] focus:border-[#58CC02] focus:bg-white focus:outline-none disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={isEvaluating || answerInput.trim().length === 0}
                    className="flex min-h-[54px] cursor-pointer items-center justify-center gap-2 rounded-xl border-b-4 border-[#135A00] bg-[#1E8200] px-7 text-sm font-bold text-white transition-all hover:bg-[#239300] active:translate-y-0.5 active:border-b-2 disabled:cursor-not-allowed disabled:border-[#CBD5E1] disabled:bg-[#E5E7EB] disabled:text-[#6B7280] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02]"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Checking…
                      </>
                    ) : (
                      'Check Answer'
                    )}
                  </button>
                </div>

                {attemptFeedback && (
                  <div
                    role="status"
                    className={`mt-4 rounded-xl border-2 px-4 py-3 text-sm font-medium ${
                      attemptFeedback.belowMinRarity
                        ? 'border-[#FCD34D] bg-[#FFFBEB] text-[#92400E]'
                        : 'border-[#FDA4AF] bg-[#FFF1F2] text-[#9F1239]'
                    }`}
                  >
                    <span className="font-bold">Keep going:</span>{' '}
                    {attemptFeedback.note}
                    {!timedMode && (
                      <span className="ml-2 font-mono-tabular text-xs font-semibold">
                        (Attempt {untimedAttemptsUsed}/3)
                      </span>
                    )}
                  </div>
                )}

                {rejectedGuesses.length > 0 && (
                  <p className="mt-3 text-xs font-medium text-[#4B5563]">
                    Already tried: {rejectedGuesses.join(' · ')}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#F1F5F9] pt-4 text-xs text-[#4B5563]">
                  <span>
                    {timedMode
                      ? 'Non-matching guesses keep the clock running — keep trying until time runs out'
                      : `Up to 3 attempts per prompt (${3 - untimedAttemptsUsed} left) · Regional terms normalized`}
                  </span>
                  <button
                    type="button"
                    disabled={isEvaluating}
                    onClick={onSkipQuestion}
                    className="flex cursor-pointer items-center gap-1.5 font-bold text-[#4B5563] transition-colors hover:text-[#DC2626] disabled:opacity-50"
                  >
                    <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
                    Pass (-1 Life)
                  </button>
                </div>
              </form>
            ) : (
              /* Post-Answer Duolingo-Style Verdict & Scouting Report */
              <div className="mt-7 space-y-6">
                <div
                  className={`relative overflow-hidden rounded-2xl border-2 p-5 ${
                    evaluation.isValid
                      ? 'border-[#86EFAC] bg-[#EAFCE0]'
                      : 'border-[#FDA4AF] bg-[#FFF1F2]'
                  }`}
                >
                  {evaluation.rarity === 'Mythic' && (
                    <div
                      aria-hidden="true"
                      className="animate-mythic-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    />
                  )}

                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {evaluation.isValid ? (
                          <>
                            <CheckCircle2
                              className="h-5 w-5 text-[#1E8200]"
                              aria-hidden="true"
                            />
                            <span className="text-xs font-bold tracking-wide text-[#145300]">
                              ACCEPTED
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle
                              className="h-5 w-5 text-[#DC2626]"
                              aria-hidden="true"
                            />
                            <span className="text-xs font-bold tracking-wide text-[#9F1239]">
                              STRIKE · -1 LIFE
                            </span>
                          </>
                        )}

                        {evaluation.matchType === 'ALIAS_SWITCH' && (
                          <>
                            <span aria-hidden="true" className="text-[#94A3B8]">
                              ·
                            </span>
                            <span className="text-xs font-bold text-[#0369A1]">
                              Alias / Nickname Switched
                            </span>
                          </>
                        )}
                        {evaluation.matchType === 'TYPO_CORRECTED' && (
                          <>
                            <span aria-hidden="true" className="text-[#94A3B8]">
                              ·
                            </span>
                            <span className="text-xs font-bold text-[#B45309]">
                              Spelling Corrected
                            </span>
                          </>
                        )}
                      </div>

                      {evaluation.isValid && evaluation.canonicalAnswer ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2.5">
                          {wasNormalized && (
                            <>
                              <span className="text-base font-medium text-[#4B5563] line-through">
                                {evaluation.rawInput}
                              </span>
                              <ArrowRight
                                className="h-4 w-4 text-[#4B5563]"
                                aria-hidden="true"
                              />
                            </>
                          )}
                          <span className="font-display text-3xl font-bold text-[#145300]">
                            {evaluation.canonicalAnswer}
                          </span>
                        </div>
                      ) : (
                        <p className="font-display mt-2 text-2xl font-bold text-[#881337]">
                          {evaluation.rawInput === '—'
                            ? 'Time Expired'
                            : `"${evaluation.rawInput}"`}
                        </p>
                      )}

                      <p
                        className={`mt-1.5 text-sm font-medium ${
                          evaluation.isValid ? 'text-[#1F2937]' : 'text-[#881337]'
                        }`}
                      >
                        {evaluation.refereeNote}
                      </p>
                      {evaluation.verifiedSource && (
                        <p className="mt-1.5 text-xs text-[#4B5563]">
                          Live-verified via{' '}
                          <a
                            href={evaluation.verifiedSource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold underline decoration-[#94A3B8] underline-offset-2 hover:text-[#1F2937]"
                          >
                            {evaluation.verifiedSource.title}
                          </a>
                        </p>
                      )}
                    </div>

                    {evaluation.isValid && rarityMeta && (
                      <div className="flex shrink-0 flex-row items-center justify-between gap-4 border-t border-[#BBF7D0] pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                        <div className="flex items-center gap-2">
                          <RarityEmblem tier={rarityMeta.tier} size={24} />
                          <span
                            className={`font-display text-2xl font-bold ${rarityMeta.textClass}`}
                          >
                            {rarityMeta.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono-tabular text-lg font-bold text-[#145300]">
                            +{evaluation.totalPoints.toLocaleString()} pts
                          </div>
                          <div className="font-mono-tabular text-xs font-semibold text-[#166534]">
                            {evaluation.pickRate}
                            {evaluation.streakBonus > 0
                              ? ` · +${evaluation.streakBonus} streak`
                              : ''}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scouting Report: All 5 Rarity Examples */}
                {evaluation.tierExamples.length > 0 && (
                  <div className="border-t-2 border-[#F1F5F9] pt-5">
                    <h3 className="text-xs font-bold tracking-wide text-[#4B5563]">
                      Scouting Report · Valid Picks Across Tiers
                    </h3>
                    <div className="mt-3 divide-y divide-[#F1F5F9]">
                      {evaluation.tierExamples.map((example, idx) => {
                        const meta = RARITY_CONFIG[example.tier];
                        const qualifies = meta.rank >= minMeta.rank;
                        const isYourPick =
                          Boolean(evaluation.canonicalAnswer) &&
                          example.answer.trim().toLowerCase() ===
                            evaluation.canonicalAnswer!.trim().toLowerCase();
                        return (
                          <div
                            key={`${example.tier}-${idx}`}
                            className={`flex items-center justify-between gap-4 py-2.5 text-sm ${
                              qualifies ? '' : 'opacity-45'
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <RarityEmblem tier={example.tier} size={18} />
                              <span
                                className={`w-20 shrink-0 font-display text-base font-bold ${meta.textClass}`}
                              >
                                {meta.label}
                              </span>
                              <span className="truncate font-semibold text-[#1F2937]">
                                {example.answer}
                              </span>
                              {isYourPick && (
                                <span className="shrink-0 text-xs font-bold text-[#1E8200]">
                                  · Your Pick
                                </span>
                              )}
                              {!qualifies && (
                                <span className="shrink-0 text-xs font-medium text-[#6B7280]">
                                  · Below {minRarity}
                                </span>
                              )}
                            </div>
                            <span className="shrink-0 font-mono-tabular text-xs font-semibold text-[#4B5563]">
                              {example.pickRate}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-2">
                  <button
                    ref={nextBtnRef}
                    type="button"
                    onClick={onNextQuestion}
                    className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-xl border-b-4 border-[#135A00] bg-[#1E8200] px-7 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#239300] active:translate-y-0.5 active:border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02]"
                  >
                    {lives <= 0 ? 'View Final Box Score' : 'Continue'}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
