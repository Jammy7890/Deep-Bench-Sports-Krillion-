import { RARITY_CONFIG, type RarityTier, type SavedRun } from '../types';

const STORAGE_KEY = 'deep_bench_runs_v1';
const MAX_SAVED_RUNS = 25;

export function loadSavedRuns(): SavedRun[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedRun[]) : [];
  } catch {
    return [];
  }
}

export function saveRunToLog(run: SavedRun): SavedRun[] {
  const existing = loadSavedRuns();
  const next = [run, ...existing].slice(0, MAX_SAVED_RUNS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota errors cleanly
  }
  return next;
}

export function clearSavedRuns(): SavedRun[] {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
  return [];
}

export function pickHighestRarity(
  a: RarityTier | null,
  b: RarityTier | null
): RarityTier | null {
  if (!a) return b;
  if (!b) return a;
  return RARITY_CONFIG[a].rank >= RARITY_CONFIG[b].rank ? a : b;
}
