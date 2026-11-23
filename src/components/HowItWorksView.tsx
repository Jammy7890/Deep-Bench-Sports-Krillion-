import { ArrowRight } from 'lucide-react';
import { RARITY_CONFIG, RARITY_ORDER } from '../types';
import { RarityEmblem } from './RarityEmblem';

interface HowItWorksViewProps {
  onStartPlay: () => void;
}

export function HowItWorksView({ onStartPlay }: HowItWorksViewProps) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-2xl border-2 border-[#E5E7EB] bg-white p-6 md:p-8">
        <h1 className="font-display text-4xl font-bold text-[#1F2937]">
          How Deep Bench Works
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#4B5563]">
          Deep Bench flips standard sports trivia on its head. Every prompt accepts many
          correct answers—the deeper and rarer your valid answer is, the higher it scores.
        </p>

        <div className="mt-8 grid gap-6 border-t-2 border-[#F1F5F9] pt-6 md:grid-cols-3">
          <div>
            <p className="font-mono-tabular text-xs font-bold text-[#1E8200]">01</p>
            <h2 className="font-display mt-1 text-xl font-bold text-[#1F2937]">
              Keep Digging on Misses
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
              If your guess doesn&apos;t match or is too common for the current tier, the
              round continues—keep typing deeper answers until you lock one in, pass, or
              the clock expires (10s Bullet, 25s Shot Clock, or 3 attempts in Untimed).
            </p>
          </div>

          <div>
            <p className="font-mono-tabular text-xs font-bold text-[#1E8200]">02</p>
            <h2 className="font-display mt-1 text-xl font-bold text-[#1F2937]">
              15-Round Rarity Escalation
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
              Rounds 1–15 accept any valid answer (Rookie+). Rounds 16–30 require at least
              Starter, 31–45 require All-Star+, 46–60 require Deep Cut+, and Round 61+
              requires Mythic only. Three missed prompts end the run.
            </p>
          </div>

          <div>
            <p className="font-mono-tabular text-xs font-bold text-[#1E8200]">03</p>
            <h2 className="font-display mt-1 text-xl font-bold text-[#1F2937]">
              Smart Alias Referee
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
              Minor typos, athlete initials, and regional sports names switch to the
              official term—for example, &ldquo;volley&rdquo; normalizes to &ldquo;Set&rdquo;
              and &ldquo;PCA&rdquo; resolves to &ldquo;Pete Crow-Armstrong&rdquo;.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t-2 border-[#F1F5F9] pt-6">
          <h2 className="font-display text-xl font-bold text-[#1F2937]">
            Autocorrect Calibration Examples
          </h2>
          <div className="mt-4 divide-y divide-[#F1F5F9] text-sm">
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[#4B5563]">
                <span>&ldquo;volley&rdquo;</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#0284C7]" aria-hidden="true" />
                <span className="font-bold text-[#1F2937]">Set (Volleyball)</span>
              </div>
              <span className="text-xs font-bold text-[#0369A1]">
                Accepted · Regional Alias Switched
              </span>
            </div>
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[#4B5563]">
                <span>&ldquo;knucleball&rdquo;</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#D97706]" aria-hidden="true" />
                <span className="font-bold text-[#1F2937]">Knuckleball</span>
              </div>
              <span className="text-xs font-bold text-[#B45309]">
                Accepted · Spelling Typo Fixed
              </span>
            </div>
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[#4B5563]">
                <span>&ldquo;throw&rdquo;</span>
                <span>for specific baseball pitch</span>
              </div>
              <span className="text-xs font-bold text-[#DC2626]">
                Strike · Too Vague (Not Over-Corrected)
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t-2 border-[#F1F5F9] pt-6">
          <h2 className="font-display text-xl font-bold text-[#1F2937]">Rarities</h2>
          <div className="mt-4 divide-y divide-[#F1F5F9]">
            {RARITY_ORDER.map((tier) => {
              const meta = RARITY_CONFIG[tier];
              return (
                <div
                  key={tier}
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <RarityEmblem tier={tier} size={20} />
                    <span className={`font-display text-lg font-bold ${meta.textClass}`}>
                      {meta.label}
                    </span>
                    <span className="text-[#4B5563]">{meta.description}</span>
                  </div>
                  <span className="font-mono-tabular font-bold text-[#1F2937]">
                    {meta.points.toLocaleString()} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onStartPlay}
            className="min-h-[46px] cursor-pointer rounded-xl border-b-4 border-[#135A00] bg-[#1E8200] px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#239300] active:translate-y-0.5 active:border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02]"
          >
            Back to Arena
          </button>
        </div>
      </div>
    </div>
  );
}
