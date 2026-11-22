export type NavTab = 'play' | 'how-it-works' | 'bench-log';

interface TopBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onStartNewRun: () => void;
  isPlaying: boolean;
}

export function TopBar({
  activeTab,
  onSelectTab,
  onStartNewRun,
  isPlaying,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-[#E5E7EB] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-3.5">
        <button
          type="button"
          onClick={() => onSelectTab('play')}
          className="font-display text-2xl font-bold tracking-tight text-[#1E8200] whitespace-nowrap shrink-0 cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02]"
        >
          Deep Bench
        </button>

        <nav
          aria-label="Primary"
          className="flex items-center gap-6 text-sm font-semibold"
        >
          <button
            type="button"
            onClick={() => onSelectTab('play')}
            className={`whitespace-nowrap shrink-0 cursor-pointer py-1.5 transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] ${
              activeTab === 'play'
                ? 'border-[#58CC02] text-[#166534]'
                : 'border-transparent text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            Arena
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('how-it-works')}
            className={`whitespace-nowrap shrink-0 cursor-pointer py-1.5 transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] ${
              activeTab === 'how-it-works'
                ? 'border-[#58CC02] text-[#166534]'
                : 'border-transparent text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('bench-log')}
            className={`whitespace-nowrap shrink-0 cursor-pointer py-1.5 transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] ${
              activeTab === 'bench-log'
                ? 'border-[#58CC02] text-[#166534]'
                : 'border-transparent text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            Bench Log
          </button>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onStartNewRun}
            className="whitespace-nowrap shrink-0 cursor-pointer rounded-xl border-b-4 border-[#135A00] bg-[#1E8200] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#239300] active:translate-y-0.5 active:border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02]"
          >
            {isPlaying ? 'Restart Run' : 'Start Run'}
          </button>
        </div>
      </div>
    </header>
  );
}
