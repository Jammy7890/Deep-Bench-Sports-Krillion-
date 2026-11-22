import { useCallback, useEffect, useRef, useState } from 'react';
import { BenchLogView } from './components/BenchLogView';
import { GameOverView } from './components/GameOverView';
import { HowItWorksView } from './components/HowItWorksView';
import { PlayView } from './components/PlayView';
import { TitleView } from './components/TitleView';
import { TopBar, type NavTab } from './components/TopBar';
import {
  getMinRarityForRound,
  type EvaluationResult,
  type QuestionPrompt,
  type RarityTier,
  type RoundHistoryEntry,
  type SavedRun,
  type SportCategory,
} from './types';
import { playStrikeSound, playTickSound, playValidSound } from './utils/sound';
import {
  clearSavedRuns,
  loadSavedRuns,
  pickHighestRarity,
  saveRunToLog,
} from './utils/storage';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';

const MAX_LIVES = 3;
const SHOT_CLOCK_SECONDS = 25;

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('play');
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');

  const [selectedCategory, setSelectedCategory] =
    useState<SportCategory>('All Sports');
  const [timedMode, setTimedMode] = useState<boolean>(true);
  const [muted, setMuted] = useState<boolean>(false);

  const [savedRuns, setSavedRuns] = useState<SavedRun[]>(() => loadSavedRuns());

  // Active run state
  const [lives, setLives] = useState<number>(MAX_LIVES);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [highestRarity, setHighestRarity] = useState<RarityTier | null>(null);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [history, setHistory] = useState<RoundHistoryEntry[]>([]);

  const [questionQueue, setQuestionQueue] = useState<QuestionPrompt[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionPrompt | null>(
    null
  );
  const [answerInput, setAnswerInput] = useState<string>('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(SHOT_CLOCK_SECONDS);

  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptFeedback, setAttemptFeedback] = useState<{
    input: string;
    note: string;
    belowMinRarity: boolean;
  } | null>(null);
  const [rejectedGuesses, setRejectedGuesses] = useState<string[]>([]);
  const [untimedAttemptsUsed, setUntimedAttemptsUsed] = useState<number>(0);

  const usedPromptsRef = useRef<string[]>([]);
  const prefetchingRef = useRef<boolean>(false);
  const prewarmedRef = useRef<Partial<Record<SportCategory, QuestionPrompt[]>>>({});
  const prewarmingCategoryRef = useRef<SportCategory | null>(null);
  const timeoutFiredRef = useRef<boolean>(false);
  const lastWarningSecondRef = useRef<number>(-1);
  const runSavedRef = useRef<boolean>(false);

  const fetchQuestionBatch = useCallback(
    async (category: SportCategory, count = 4): Promise<QuestionPrompt[]> => {
      const res = await fetch('/api/questions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          count,
          previousPrompts: usedPromptsRef.current.slice(-35),
        }),
      });
      const data = (await res.json()) as {
        questions?: QuestionPrompt[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate sports questions.');
      }
      const list = data.questions ?? [];
      for (const q of list) {
        usedPromptsRef.current.push(q.prompt);
      }
      return list;
    },
    []
  );

  // Pre-warm questions for the currently selected sport while on Title Menu
  useEffect(() => {
    if (gameState !== 'TITLE_MENU') return;
    if ((prewarmedRef.current[selectedCategory]?.length ?? 0) > 0) return;
    if (prewarmingCategoryRef.current === selectedCategory) return;

    prewarmingCategoryRef.current = selectedCategory;
    fetchQuestionBatch(selectedCategory, 4)
      .then((batch) => {
        if (batch.length > 0) {
          prewarmedRef.current[selectedCategory] = batch;
        }
      })
      .catch(() => {
        // Silent pre-warm failure; startNewRun will fetch explicitly and surface any error
      })
      .finally(() => {
        if (prewarmingCategoryRef.current === selectedCategory) {
          prewarmingCategoryRef.current = null;
        }
      });
  }, [gameState, selectedCategory, fetchQuestionBatch]);

  // Background prefetch to keep Endless Mode instant
  useEffect(() => {
    if (
      gameState !== 'PLAYING' ||
      questionQueue.length > 3 ||
      prefetchingRef.current
    ) {
      return;
    }

    prefetchingRef.current = true;
    fetchQuestionBatch(selectedCategory, 4)
      .then((batch) => {
        setQuestionQueue((prev) => [...prev, ...batch]);
      })
      .catch((err) => {
        console.error('Prefetch batch failed:', err);
      })
      .finally(() => {
        prefetchingRef.current = false;
      });
  }, [gameState, questionQueue.length, selectedCategory, fetchQuestionBatch]);

  const finalizeAndSaveRun = useCallback(
    (
      finalScore: number,
      finalBestStreak: number,
      finalHighestRarity: RarityTier | null,
      finalEntries: RoundHistoryEntry[]
    ) => {
      if (runSavedRef.current || finalEntries.length === 0) return;
      runSavedRef.current = true;
      const run: SavedRun = {
        id: `run-${Date.now()}`,
        playedAt: new Date().toISOString(),
        category: selectedCategory,
        timedMode,
        score: finalScore,
        correctCount: finalEntries.filter((e) => e.evaluation.isValid).length,
        totalRounds: finalEntries.length,
        bestStreak: finalBestStreak,
        highestRarity: finalHighestRarity,
        entries: finalEntries,
      };
      const updated = saveRunToLog(run);
      setSavedRuns(updated);
    },
    [selectedCategory, timedMode]
  );

  const startNewRun = useCallback(async () => {
    setErrorMessage(null);
    setActiveTab('play');

    runSavedRef.current = false;
    timeoutFiredRef.current = false;
    lastWarningSecondRef.current = -1;

    const cached = prewarmedRef.current[selectedCategory];
    if (cached && cached.length > 0) {
      delete prewarmedRef.current[selectedCategory];
      const [first, ...rest] = cached;
      usedPromptsRef.current = cached.map((q) => q.prompt);
      setLives(MAX_LIVES);
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setHighestRarity(null);
      setRoundNumber(1);
      setHistory([]);
      setCurrentQuestion(first);
      setQuestionQueue(rest);
      setAnswerInput('');
      setEvaluation(null);
      setAttemptFeedback(null);
      setRejectedGuesses([]);
      setUntimedAttemptsUsed(0);
      setTimeRemaining(SHOT_CLOCK_SECONDS);
      setGameState('PLAYING');
      return;
    }

    setIsStarting(true);
    usedPromptsRef.current = [];

    try {
      const batch = await fetchQuestionBatch(selectedCategory, 4);
      const [first, ...rest] = batch;
      if (!first) {
        throw new Error('No questions returned. Check server configuration.');
      }

      setLives(MAX_LIVES);
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setHighestRarity(null);
      setRoundNumber(1);
      setHistory([]);
      setCurrentQuestion(first);
      setQuestionQueue(rest);
      setAnswerInput('');
      setEvaluation(null);
      setAttemptFeedback(null);
      setRejectedGuesses([]);
      setUntimedAttemptsUsed(0);
      setTimeRemaining(SHOT_CLOCK_SECONDS);
      setGameState('PLAYING');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not start endless run.'
      );
    } finally {
      setIsStarting(false);
    }
  }, [fetchQuestionBatch, selectedCategory]);

  const minRarity = getMinRarityForRound(roundNumber);

  const handleEvaluate = useCallback(
    async (options?: { timedOut?: boolean; skipped?: boolean }) => {
      if (!currentQuestion || isEvaluating || evaluation) return;

      const timedOut = Boolean(options?.timedOut);
      const skipped = Boolean(options?.skipped);
      const submittedText = skipped ? '' : answerInput.trim();

      setErrorMessage(null);

      // Instant local resolution on timeout or skip when tierExamples are already attached
      if ((timedOut || skipped) && currentQuestion.tierExamples?.length) {
        const instantResult: EvaluationResult = {
          isValid: false,
          belowMinRarity: false,
          detectedRarity: null,
          matchType: timedOut ? 'TIMEOUT' : 'INVALID',
          rawInput: skipped ? 'Skipped' : '—',
          canonicalAnswer: null,
          rarity: null,
          pickRate: null,
          basePoints: 0,
          streakBonus: 0,
          totalPoints: 0,
          refereeNote: skipped
            ? 'Passed on this prompt (-1 Life).'
            : 'Shot clock expired before locking in a matching answer.',
          tierExamples: currentQuestion.tierExamples,
        };
        const timeUsed = timedMode
          ? Number((SHOT_CLOCK_SECONDS - timeRemaining).toFixed(1))
          : null;
        playStrikeSound(muted);
        setLives((prev) => Math.max(0, prev - 1));
        setStreak(0);
        setHistory((prev) => [
          ...prev,
          {
            roundNumber,
            question: currentQuestion,
            evaluation: instantResult,
            timeUsedSeconds: timeUsed,
          },
        ]);
        setEvaluation(instantResult);
        return;
      }

      if (
        !timedOut &&
        !skipped &&
        rejectedGuesses.some((g) => g.toLowerCase() === submittedText.toLowerCase())
      ) {
        setAttemptFeedback({
          input: submittedText,
          note: `Already tried "${submittedText}" — try a different answer!`,
          belowMinRarity: false,
        });
        setAnswerInput('');
        return;
      }

      setIsEvaluating(true);

      try {
        const res = await fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: currentQuestion.prompt,
            sport: currentQuestion.sport,
            subCategory: currentQuestion.subCategory,
            userAnswer: skipped ? '' : submittedText,
            currentStreak: streak,
            minRarity,
            timedOut: timedOut || skipped,
            tierExamples: currentQuestion.tierExamples,
          }),
        });

        const data = (await res.json()) as EvaluationResult & { error?: string };
        if (!res.ok) {
          throw new Error(data.error || 'Referee evaluation failed.');
        }

        const finalResult: EvaluationResult = skipped
          ? {
              ...data,
              matchType: 'INVALID',
              rawInput: 'Skipped',
              refereeNote: 'Passed on this prompt (-1 Life).',
            }
          : data;

        // If the guess doesn't match (or is below required rarity) and wasn't a timeout/skip:
        // keep the round & clock going so the player can try another answer!
        // In Untimed mode, allow up to 3 attempts before counting as a strike on the question.
        const nextUntimedCount = untimedAttemptsUsed + 1;
        const canContinueGuessing =
          !finalResult.isValid &&
          !timedOut &&
          !skipped &&
          (timedMode || nextUntimedCount < 3);

        if (canContinueGuessing) {
          playStrikeSound(muted);
          setAttemptFeedback({
            input: submittedText,
            note: finalResult.refereeNote,
            belowMinRarity: Boolean(finalResult.belowMinRarity),
          });
          setRejectedGuesses((prev) => [...prev, submittedText]);
          setAnswerInput('');
          if (!timedMode) {
            setUntimedAttemptsUsed(nextUntimedCount);
          }
          return;
        }

        const timeUsed = timedMode
          ? Number((SHOT_CLOCK_SECONDS - timeRemaining).toFixed(1))
          : null;

        if (finalResult.isValid && finalResult.rarity) {
          playValidSound(finalResult.rarity, muted);
          const nextStreak = streak + 1;
          setScore((prev) => prev + finalResult.totalPoints);
          setStreak(nextStreak);
          setBestStreak((prev) => Math.max(prev, nextStreak));
          setHighestRarity((prev) => pickHighestRarity(prev, finalResult.rarity));
        } else {
          playStrikeSound(muted);
          setLives((prev) => Math.max(0, prev - 1));
          setStreak(0);
        }

        const entry: RoundHistoryEntry = {
          roundNumber,
          question: currentQuestion,
          evaluation: finalResult,
          timeUsedSeconds: timeUsed,
        };
        setHistory((prev) => [...prev, entry]);
        setEvaluation(finalResult);
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Unable to reach AI referee. Please try again.'
        );
      } finally {
        setIsEvaluating(false);
      }
    },
    [
      answerInput,
      currentQuestion,
      evaluation,
      isEvaluating,
      minRarity,
      muted,
      rejectedGuesses,
      roundNumber,
      streak,
      timeRemaining,
      timedMode,
      untimedAttemptsUsed,
    ]
  );

  // Shot clock countdown loop
  useEffect(() => {
    if (
      gameState !== 'PLAYING' ||
      activeTab !== 'play' ||
      !timedMode ||
      !currentQuestion ||
      evaluation !== null ||
      isEvaluating ||
      isLoadingQuestion
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimeRemaining((prev) => {
        const next = Math.max(0, Number((prev - 0.1).toFixed(1)));
        const wholeSec = Math.ceil(next);
        if (wholeSec <= 5 && wholeSec >= 1 && wholeSec !== lastWarningSecondRef.current) {
          lastWarningSecondRef.current = wholeSec;
          playTickSound(muted);
        }
        if (next <= 0 && !timeoutFiredRef.current) {
          timeoutFiredRef.current = true;
          queueMicrotask(() => {
            handleEvaluate({ timedOut: true });
          });
        }
        return next;
      });
    }, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    activeTab,
    currentQuestion,
    evaluation,
    gameState,
    handleEvaluate,
    isEvaluating,
    isLoadingQuestion,
    muted,
    timedMode,
  ]);

  const handleNextQuestion = useCallback(async () => {
    if (lives <= 0) {
      finalizeAndSaveRun(score, bestStreak, highestRarity, history);
      setGameState('GAME_OVER');
      return;
    }

    setErrorMessage(null);
    setEvaluation(null);
    setAttemptFeedback(null);
    setRejectedGuesses([]);
    setUntimedAttemptsUsed(0);
    setAnswerInput('');
    timeoutFiredRef.current = false;
    lastWarningSecondRef.current = -1;
    setTimeRemaining(SHOT_CLOCK_SECONDS);
    setRoundNumber((prev) => prev + 1);

    if (questionQueue.length > 0) {
      const [nextQ, ...rest] = questionQueue;
      setCurrentQuestion(nextQ);
      setQuestionQueue(rest);
      return;
    }

    setIsLoadingQuestion(true);
    try {
      const batch = await fetchQuestionBatch(selectedCategory, 4);
      const [first, ...rest] = batch;
      if (!first) {
        throw new Error('Could not generate the next question.');
      }
      setCurrentQuestion(first);
      setQuestionQueue(rest);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to load next question.'
      );
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [
    bestStreak,
    fetchQuestionBatch,
    finalizeAndSaveRun,
    highestRarity,
    history,
    lives,
    questionQueue,
    score,
    selectedCategory,
  ]);

  const handleEndRunEarly = useCallback(() => {
    if (history.length > 0) {
      finalizeAndSaveRun(score, bestStreak, highestRarity, history);
      setGameState('GAME_OVER');
    } else {
      setGameState('TITLE_MENU');
    }
  }, [bestStreak, finalizeAndSaveRun, highestRarity, history, score]);

  const handleTopBarNewRun = useCallback(() => {
    if (gameState === 'PLAYING') {
      setGameState('TITLE_MENU');
      setActiveTab('play');
    } else {
      startNewRun();
    }
  }, [gameState, startNewRun]);

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#1F2937] flex flex-col">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onStartNewRun={handleTopBarNewRun}
        isPlaying={gameState === 'PLAYING'}
      />

      <main className="flex-1">
        {activeTab === 'how-it-works' ? (
          <HowItWorksView onStartPlay={() => setActiveTab('play')} />
        ) : activeTab === 'bench-log' ? (
          <BenchLogView
            runs={savedRuns}
            onClearHistory={() => setSavedRuns(clearSavedRuns())}
            onStartPlay={() => setActiveTab('play')}
          />
        ) : gameState === 'TITLE_MENU' ? (
          <TitleView
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            timedMode={timedMode}
            onToggleTimedMode={setTimedMode}
            onStartGame={startNewRun}
            isStarting={isStarting}
            errorMessage={errorMessage}
            savedRuns={savedRuns}
          />
        ) : gameState === 'PLAYING' ? (
          <PlayView
            question={currentQuestion}
            roundNumber={roundNumber}
            minRarity={minRarity}
            lives={lives}
            maxLives={MAX_LIVES}
            score={score}
            streak={streak}
            timedMode={timedMode}
            timeRemaining={timeRemaining}
            maxTime={SHOT_CLOCK_SECONDS}
            answerInput={answerInput}
            onChangeAnswer={setAnswerInput}
            onSubmitAnswer={() => handleEvaluate()}
            onSkipQuestion={() => handleEvaluate({ skipped: true })}
            onNextQuestion={handleNextQuestion}
            onEndRunEarly={handleEndRunEarly}
            isEvaluating={isEvaluating}
            isLoadingQuestion={isLoadingQuestion}
            evaluation={evaluation}
            attemptFeedback={attemptFeedback}
            rejectedGuesses={rejectedGuesses}
            untimedAttemptsUsed={untimedAttemptsUsed}
            errorMessage={errorMessage}
            muted={muted}
            onToggleMute={() => setMuted((prev) => !prev)}
          />
        ) : (
          <GameOverView
            score={score}
            category={selectedCategory}
            bestStreak={bestStreak}
            highestRarity={highestRarity}
            entries={history}
            onPlayAgain={startNewRun}
            onOpenBenchLog={() => setActiveTab('bench-log')}
          />
        )}
      </main>
    </div>
  );
}
