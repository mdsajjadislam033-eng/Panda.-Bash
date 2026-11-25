export type Language = 'bn' | 'en';

export type ScreenState =
  | 'HOME'
  | 'TUTORIAL'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAME_OVER'
  | 'PANDA_BOARD'
  | 'BOOSTER_SCORE'
  | 'CHALLENGES'
  | 'UPGRADES'
  | 'SKINS'
  | 'SETTINGS'
  | 'HOW_TO_PLAY';

export type BiomeId =
  | 'bamboo_forest'
  | 'deep_jungle'
  | 'muddy_village'
  | 'rice_fields'
  | 'forest_river'
  | 'wooden_bridge'
  | 'mountain_forest'
  | 'rainy_jungle'
  | 'sunset_valley'
  | 'moonlit_forest';

export type BoosterId =
  | 'magnet'
  | 'bamboo_bonus'
  | 'dash'
  | 'double_score'
  | 'leaf_hover'
  | 'bamboo_feast';

export type SkinId =
  | 'classic_green'
  | 'golden_scarf'
  | 'jungle_emerald'
  | 'sky_breeze'
  | 'crimson_fest';

export type TrailId =
  | 'none'
  | 'bamboo_leaves'
  | 'golden_sparks'
  | 'wind_ribbons'
  | 'lotus_petals';

export type ObstacleKind =
  | 'bamboo_fence'     // Jump over
  | 'bamboo_gate'      // Slide under
  | 'fallen_tree'      // Jump over
  | 'haystack'         // Switch lane
  | 'village_cart'     // Switch lane (tall)
  | 'rock'             // Jump over or switch lane
  | 'tree_root'        // Jump over
  | 'mud_puddle'       // Jump over or switch lane
  | 'pothole'          // Jump over or switch lane
  | 'low_barrier'      // Jump over
  | 'overhead_branch'  // Slide under
  | 'broken_bridge';   // Full-width gap -> Vine swing!

export type ChallengeCategory = 'daily' | 'weekly' | 'achievement';

export interface ChallengeDefinition {
  id: string;
  category: ChallengeCategory;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  target: number;
  metric:
    | 'bamboo_run'
    | 'bamboo_total'
    | 'distance_run'
    | 'score_run'
    | 'boosters_used'
    | 'monkey_escapes'
    | 'booster_bamboo'
    | 'vine_swings'
    | 'milestones_reached';
  rewardBamboo: number;
  rewardBoosterScore: number;
}

export interface GameSettings {
  language: Language;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  voiceEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
}

export interface PlayerProgress {
  tutorialCompleted: boolean;
  bestDistance: number;
  bestRunScore: number;
  totalBambooCollected: number;
  spendableBamboo: number;
  totalBoosterScore: number;
  spendableBoosterScore: number;
  totalBoostersUsed: number;
  bestBambooCombo: number;
  totalRuns: number;
  monkeyEscapes: number;
  vineSwings: number;
  unlockedSkins: SkinId[];
  equippedSkin: SkinId;
  unlockedTrails: TrailId[];
  equippedTrail: TrailId;
  boosterLevels: Record<BoosterId, number>; // 1 to 5
  challengeProgress: Record<string, number>;
  claimedChallenges: string[];
  settings: GameSettings;
}

export interface ActiveBoosterState {
  id: BoosterId;
  remaining: number;
  duration: number;
}

export interface HudSnapshot {
  distance: number;
  runScore: number;
  bambooCount: number;
  boosterScore: number;
  combo: number;
  biome: BiomeId;
  activeBoosters: ActiveBoosterState[];
  monkeyActive: boolean;
  monkeyProximity: number; // 0..1
  monkeyWarning: string | null;
  vinePrompt: 'none' | 'swing' | 'release';
  milestoneText: string | null;
  speechBubble: { speaker: 'panda' | 'monkey'; text: string } | null;
  tutorialStepIndex: number;
  tutorialHint: string | null;
  tutorialCompletedBanner: boolean;
}

export interface RunSummary {
  distance: number;
  runScore: number;
  bambooCollected: number;
  boosterScoreEarned: number;
  bestBambooCombo: number;
  boostersUsed: number;
  monkeyEscapes: number;
  vineSwings: number;
  isNewBestDistance: boolean;
  isNewBestScore: boolean;
  deathReason: 'obstacle' | 'gap' | 'monkey';
  reactionLineBn: string;
  reactionLineEn: string;
}
