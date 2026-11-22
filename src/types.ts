export type SportCategory =
  | 'All Sports'
  | 'Basketball'
  | 'American Football'
  | 'Baseball'
  | 'Soccer'
  | 'Volleyball & Court'
  | 'Hockey'
  | 'Combat & Olympic';

export const SPORT_CATEGORIES: readonly SportCategory[] = [
  'All Sports',
  'Basketball',
  'American Football',
  'Baseball',
  'Soccer',
  'Volleyball & Court',
  'Hockey',
  'Combat & Olympic',
] as const;

export type RarityTier = 'Rookie' | 'Starter' | 'All-Star' | 'Deep Cut' | 'Mythic';

export type MatchType =
  | 'EXACT'
  | 'TYPO_CORRECTED'
  | 'ALIAS_SWITCH'
  | 'INVALID'
  | 'TIMEOUT';

export interface RarityMeta {
  tier: RarityTier;
  points: number;
  label: string;
  description: string;
  pickBand: string;
  textClass: string;
  borderClass: string;
  surfaceClass: string;
  accentHex: string;
  rank: number;
}

export const RARITY_ORDER: readonly RarityTier[] = [
  'Rookie',
  'Starter',
  'All-Star',
  'Deep Cut',
  'Mythic',
] as const;

export const RARITY_CONFIG: Record<RarityTier, RarityMeta> = {
  Rookie: {
    tier: 'Rookie',
    points: 100,
    label: 'Rookie',
    description: 'First-instinct household pick',
    pickBand: '20%+ of fans',
    textClass: 'text-[#4B5563]',
    borderClass: 'border-[#D1D5DB]',
    surfaceClass: 'bg-[#F8FAFC]',
    accentHex: '#64748B',
    rank: 1,
  },
  Starter: {
    tier: 'Starter',
    points: 250,
    label: 'Starter',
    description: 'Solid everyday fan pull',
    pickBand: '8%–19% of fans',
    textClass: 'text-[#166534]',
    borderClass: 'border-[#86EFAC]',
    surfaceClass: 'bg-[#F0FDF4]',
    accentHex: '#22C55E',
    rank: 2,
  },
  'All-Star': {
    tier: 'All-Star',
    points: 500,
    label: 'All-Star',
    description: 'Sharp, knowledgeable pick',
    pickBand: '3%–7% of fans',
    textClass: 'text-[#0369A1]',
    borderClass: 'border-[#7DD3FC]',
    surfaceClass: 'bg-[#F0F9FF]',
    accentHex: '#0284C7',
    rank: 3,
  },
  'Deep Cut': {
    tier: 'Deep Cut',
    points: 1000,
    label: 'Deep Cut',
    description: 'Film-room & stat-sheet gem',
    pickBand: '0.8%–2.9% of fans',
    textClass: 'text-[#B45309]',
    borderClass: 'border-[#FCD34D]',
    surfaceClass: 'bg-[#FFFBEB]',
    accentHex: '#D97706',
    rank: 4,
  },
  Mythic: {
    tier: 'Mythic',
    points: 2000,
    label: 'Mythic',
    description: 'One-in-a-million sports lore',
    pickBand: 'Under 0.8% of fans',
    textClass: 'text-[#BE123C]',
    borderClass: 'border-[#FDA4AF]',
    surfaceClass: 'bg-[#FFF1F2]',
    accentHex: '#E11D48',
    rank: 5,
  },
};

export function getMinRarityForRound(roundNumber: number): RarityTier {
  if (roundNumber <= 15) return 'Rookie';
  if (roundNumber <= 30) return 'Starter';
  if (roundNumber <= 45) return 'All-Star';
  if (roundNumber <= 60) return 'Deep Cut';
  return 'Mythic';
}

export function getNextEscalationInfo(roundNumber: number): {
  nextTier: RarityTier;
  roundsUntil: number;
} | null {
  if (roundNumber <= 15) return { nextTier: 'Starter', roundsUntil: 16 - roundNumber };
  if (roundNumber <= 30) return { nextTier: 'All-Star', roundsUntil: 31 - roundNumber };
  if (roundNumber <= 45) return { nextTier: 'Deep Cut', roundsUntil: 46 - roundNumber };
  if (roundNumber <= 60) return { nextTier: 'Mythic', roundsUntil: 61 - roundNumber };
  return null;
}

export interface TierExample {
  tier: RarityTier;
  answer: string;
  pickRate: string;
}

export interface QuestionPrompt {
  id: string;
  sport: string;
  subCategory: string;
  prompt: string;
  tierExamples?: TierExample[];
}

export interface EvaluationResult {
  isValid: boolean;
  belowMinRarity?: boolean;
  detectedRarity?: RarityTier | null;
  matchType: MatchType;
  rawInput: string;
  canonicalAnswer: string | null;
  rarity: RarityTier | null;
  pickRate: string | null;
  basePoints: number;
  streakBonus: number;
  totalPoints: number;
  refereeNote: string;
  tierExamples: TierExample[];
  verifiedSource?: { title: string; url: string } | null;
}

export interface RoundHistoryEntry {
  roundNumber: number;
  question: QuestionPrompt;
  evaluation: EvaluationResult;
  timeUsedSeconds: number | null;
}

export interface SavedRun {
  id: string;
  playedAt: string;
  category: SportCategory;
  timedMode: boolean;
  score: number;
  correctCount: number;
  totalRounds: number;
  bestStreak: number;
  highestRarity: RarityTier | null;
  entries: RoundHistoryEntry[];
}
