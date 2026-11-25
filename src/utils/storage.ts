import { BOOSTERS, CHALLENGES, SKINS, TRAILS } from '../data/gameData';
import {
  BoosterId,
  GameSettings,
  PlayerProgress,
  RunSummary,
  SkinId,
  TrailId,
} from '../types/game';

const STORAGE_KEY = 'panda_bash_progress_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  language: 'bn',
  musicEnabled: true,
  sfxEnabled: true,
  voiceEnabled: true,
  musicVolume: 0.55,
  sfxVolume: 0.75,
  voiceVolume: 0.85,
};

export function createInitialProgress(): PlayerProgress {
  return {
    tutorialCompleted: false,
    bestDistance: 0,
    bestRunScore: 0,
    totalBambooCollected: 0,
    spendableBamboo: 0,
    totalBoosterScore: 0,
    spendableBoosterScore: 0,
    totalBoostersUsed: 0,
    bestBambooCombo: 0,
    totalRuns: 0,
    monkeyEscapes: 0,
    vineSwings: 0,
    unlockedSkins: ['classic_green'],
    equippedSkin: 'classic_green',
    unlockedTrails: ['none'],
    equippedTrail: 'none',
    boosterLevels: {
      magnet: 1,
      bamboo_bonus: 1,
      dash: 1,
      double_score: 1,
      leaf_hover: 1,
      bamboo_feast: 1,
    },
    challengeProgress: {},
    claimedChallenges: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialProgress();
    const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
    const base = createInitialProgress();
    return {
      ...base,
      ...parsed,
      boosterLevels: { ...base.boosterLevels, ...(parsed.boosterLevels || {}) },
      challengeProgress: { ...(parsed.challengeProgress || {}) },
      claimedChallenges: Array.isArray(parsed.claimedChallenges) ? parsed.claimedChallenges : [],
      unlockedSkins: Array.isArray(parsed.unlockedSkins) && parsed.unlockedSkins.length > 0
        ? parsed.unlockedSkins
        : ['classic_green'],
      unlockedTrails: Array.isArray(parsed.unlockedTrails) && parsed.unlockedTrails.length > 0
        ? parsed.unlockedTrails
        : ['none'],
      settings: { ...base.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function resetAllProgress(): PlayerProgress {
  const fresh = createInitialProgress();
  saveProgress(fresh);
  return fresh;
}

export function applyRunToProgress(
  prev: PlayerProgress,
  summary: RunSummary,
  extraMetrics: { boosterBamboo: number; milestonesReached: number }
): PlayerProgress {
  const next: PlayerProgress = {
    ...prev,
    bestDistance: Math.max(prev.bestDistance, summary.distance),
    bestRunScore: Math.max(prev.bestRunScore, summary.runScore),
    totalBambooCollected: prev.totalBambooCollected + summary.bambooCollected,
    spendableBamboo: prev.spendableBamboo + summary.bambooCollected,
    totalBoosterScore: prev.totalBoosterScore + summary.boosterScoreEarned,
    spendableBoosterScore: prev.spendableBoosterScore + summary.boosterScoreEarned,
    totalBoostersUsed: prev.totalBoostersUsed + summary.boostersUsed,
    bestBambooCombo: Math.max(prev.bestBambooCombo, summary.bestBambooCombo),
    totalRuns: prev.totalRuns + 1,
    monkeyEscapes: prev.monkeyEscapes + summary.monkeyEscapes,
    vineSwings: prev.vineSwings + summary.vineSwings,
    challengeProgress: { ...prev.challengeProgress },
  };

  for (const ch of CHALLENGES) {
    const cur = next.challengeProgress[ch.id] || 0;
    let updated = cur;
    switch (ch.metric) {
      case 'bamboo_total':
        updated = cur + summary.bambooCollected;
        break;
      case 'bamboo_run':
        updated = Math.max(cur, summary.bambooCollected);
        break;
      case 'distance_run':
        updated = Math.max(cur, summary.distance);
        break;
      case 'score_run':
        updated = Math.max(cur, summary.runScore);
        break;
      case 'boosters_used':
        updated = cur + summary.boostersUsed;
        break;
      case 'monkey_escapes':
        updated = cur + summary.monkeyEscapes;
        break;
      case 'booster_bamboo':
        updated = cur + extraMetrics.boosterBamboo;
        break;
      case 'vine_swings':
        updated = cur + summary.vineSwings;
        break;
      case 'milestones_reached':
        updated = cur + extraMetrics.milestonesReached;
        break;
    }
    next.challengeProgress[ch.id] = Math.min(ch.target, updated);
  }

  saveProgress(next);
  return next;
}

export function getBoosterDuration(progress: PlayerProgress, id: BoosterId): number {
  const def = BOOSTERS.find((b) => b.id === id);
  if (!def) return 8;
  const level = progress.boosterLevels[id] || 1;
  return Math.min(def.maxCap, def.baseDuration + (level - 1) * 1.5);
}

export function getBoosterUpgradeCost(level: number): number {
  return level * 80;
}

export function upgradeBooster(progress: PlayerProgress, id: BoosterId): PlayerProgress | null {
  const level = progress.boosterLevels[id] || 1;
  if (level >= 5) return null;
  const cost = getBoosterUpgradeCost(level);
  if (progress.spendableBoosterScore < cost) return null;

  const next: PlayerProgress = {
    ...progress,
    spendableBoosterScore: progress.spendableBoosterScore - cost,
    boosterLevels: {
      ...progress.boosterLevels,
      [id]: level + 1,
    },
  };
  saveProgress(next);
  return next;
}

export function unlockOrEquipSkin(progress: PlayerProgress, skinId: SkinId): PlayerProgress | null {
  if (progress.unlockedSkins.includes(skinId)) {
    const next = { ...progress, equippedSkin: skinId };
    saveProgress(next);
    return next;
  }
  const skin = SKINS.find((s) => s.id === skinId);
  if (!skin) return null;
  if (
    progress.spendableBamboo < skin.costBamboo ||
    progress.spendableBoosterScore < skin.costBoosterScore
  ) {
    return null;
  }
  const next: PlayerProgress = {
    ...progress,
    spendableBamboo: progress.spendableBamboo - skin.costBamboo,
    spendableBoosterScore: progress.spendableBoosterScore - skin.costBoosterScore,
    unlockedSkins: [...progress.unlockedSkins, skinId],
    equippedSkin: skinId,
  };
  saveProgress(next);
  return next;
}

export function unlockOrEquipTrail(progress: PlayerProgress, trailId: TrailId): PlayerProgress | null {
  if (progress.unlockedTrails.includes(trailId)) {
    const next = { ...progress, equippedTrail: trailId };
    saveProgress(next);
    return next;
  }
  const trail = TRAILS.find((t) => t.id === trailId);
  if (!trail) return null;
  if (
    progress.spendableBamboo < trail.costBamboo ||
    progress.spendableBoosterScore < trail.costBoosterScore
  ) {
    return null;
  }
  const next: PlayerProgress = {
    ...progress,
    spendableBamboo: progress.spendableBamboo - trail.costBamboo,
    spendableBoosterScore: progress.spendableBoosterScore - trail.costBoosterScore,
    unlockedTrails: [...progress.unlockedTrails, trailId],
    equippedTrail: trailId,
  };
  saveProgress(next);
  return next;
}

export function claimChallengeReward(progress: PlayerProgress, challengeId: string): PlayerProgress | null {
  if (progress.claimedChallenges.includes(challengeId)) return null;
  const ch = CHALLENGES.find((c) => c.id === challengeId);
  if (!ch) return null;
  const current = progress.challengeProgress[challengeId] || 0;
  if (current < ch.target) return null;

  const next: PlayerProgress = {
    ...progress,
    spendableBamboo: progress.spendableBamboo + ch.rewardBamboo,
    totalBoosterScore: progress.totalBoosterScore + ch.rewardBoosterScore,
    spendableBoosterScore: progress.spendableBoosterScore + ch.rewardBoosterScore,
    claimedChallenges: [...progress.claimedChallenges, challengeId],
  };
  saveProgress(next);
  return next;
}
