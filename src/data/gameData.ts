import {
  BiomeId,
  BoosterId,
  ChallengeDefinition,
  SkinId,
  TrailId,
} from '../types/game';
import { getLinesFor } from './voiceLines';

export interface BiomeConfig {
  id: BiomeId;
  nameBn: string;
  nameEn: string;
  minDistance: number;
  skyTop: string;
  skyBottom: string;
  horizonColor: string;
  hillFar: string;
  hillNear: string;
  groundOuter: string;
  pathBase: string;
  pathBorder: string;
  laneStripe: string;
  accentFoliage: string;
}

export const BIOMES: BiomeConfig[] = [
  {
    id: 'bamboo_forest',
    nameBn: 'বাঁশবন',
    nameEn: 'Bamboo Forest',
    minDistance: 0,
    skyTop: '#56ccf2',
    skyBottom: '#d9f9ec',
    horizonColor: '#a7e8bd',
    hillFar: '#4ea874',
    hillNear: '#2f855a',
    groundOuter: '#4aa954',
    pathBase: '#d89b56',
    pathBorder: '#9b642c',
    laneStripe: '#be7d3b',
    accentFoliage: '#22c55e',
  },
  {
    id: 'deep_jungle',
    nameBn: 'গভীর জঙ্গল',
    nameEn: 'Deep Jungle',
    minDistance: 140,
    skyTop: '#248277',
    skyBottom: '#9ae6c1',
    horizonColor: '#489d76',
    hillFar: '#1b5e45',
    hillNear: '#124230',
    groundOuter: '#1b5e36',
    pathBase: '#8c6239',
    pathBorder: '#573b1f',
    laneStripe: '#724d29',
    accentFoliage: '#10b981',
  },
  {
    id: 'muddy_village',
    nameBn: 'গ্রামের মেঠোপথ',
    nameEn: 'Village Road',
    minDistance: 290,
    skyTop: '#4ea9e8',
    skyBottom: '#fef3c7',
    horizonColor: '#b8d89c',
    hillFar: '#6ea35a',
    hillNear: '#4d7c3f',
    groundOuter: '#6b943e',
    pathBase: '#be8852',
    pathBorder: '#7c532d',
    laneStripe: '#a16f3f',
    accentFoliage: '#84cc16',
  },
  {
    id: 'rice_fields',
    nameBn: 'সবুজ ধানক্ষেত',
    nameEn: 'Rice Fields',
    minDistance: 460,
    skyTop: '#38bdf8',
    skyBottom: '#ecfccb',
    horizonColor: '#bef264',
    hillFar: '#65a30d',
    hillNear: '#4d7c0f',
    groundOuter: '#84cc16',
    pathBase: '#d9a76a',
    pathBorder: '#a16f38',
    laneStripe: '#bf8b4e',
    accentFoliage: '#eab308',
  },
  {
    id: 'forest_river',
    nameBn: 'বনের নদী',
    nameEn: 'Forest River',
    minDistance: 650,
    skyTop: '#0ea5e9',
    skyBottom: '#cffafe',
    horizonColor: '#67e8f9',
    hillFar: '#0f766e',
    hillNear: '#115e59',
    groundOuter: '#0284c7',
    pathBase: '#cba06e',
    pathBorder: '#78522d',
    laneStripe: '#b48755',
    accentFoliage: '#14b8a6',
  },
  {
    id: 'wooden_bridge',
    nameBn: 'কাঠের সেতু',
    nameEn: 'Wooden Bridge',
    minDistance: 860,
    skyTop: '#0284c7',
    skyBottom: '#bae6fd',
    horizonColor: '#7dd3fc',
    hillFar: '#1e6b5c',
    hillNear: '#145347',
    groundOuter: '#0369a1',
    pathBase: '#a46838',
    pathBorder: '#693d1c',
    laneStripe: '#7f4c24',
    accentFoliage: '#f59e0b',
  },
  {
    id: 'mountain_forest',
    nameBn: 'পাহাড়ি অরণ্য',
    nameEn: 'Mountain Forest',
    minDistance: 1080,
    skyTop: '#3b82f6',
    skyBottom: '#e0f2fe',
    horizonColor: '#93c5fd',
    hillFar: '#475569',
    hillNear: '#1e463a',
    groundOuter: '#2d6a4f',
    pathBase: '#9c8b7a',
    pathBorder: '#57534e',
    laneStripe: '#78716c',
    accentFoliage: '#34d399',
  },
  {
    id: 'rainy_jungle',
    nameBn: 'বর্ষার জঙ্গল',
    nameEn: 'Rainy Jungle',
    minDistance: 1320,
    skyTop: '#334155',
    skyBottom: '#94a3b8',
    horizonColor: '#64748b',
    hillFar: '#1e3a3a',
    hillNear: '#0f2926',
    groundOuter: '#14532d',
    pathBase: '#6b5344',
    pathBorder: '#3f2e24',
    laneStripe: '#543f32',
    accentFoliage: '#4ade80',
  },
  {
    id: 'sunset_valley',
    nameBn: 'গোধূলি গ্রাম',
    nameEn: 'Sunset Village',
    minDistance: 1580,
    skyTop: '#ea580c',
    skyBottom: '#fde68a',
    horizonColor: '#fdba74',
    hillFar: '#9a3412',
    hillNear: '#7c2d12',
    groundOuter: '#65a30d',
    pathBase: '#d49456',
    pathBorder: '#854d1e',
    laneStripe: '#b7793d',
    accentFoliage: '#f97316',
  },
  {
    id: 'moonlit_forest',
    nameBn: 'জ্যোৎস্না রাতের বন',
    nameEn: 'Moonlit Forest',
    minDistance: 1860,
    skyTop: '#0f172a',
    skyBottom: '#1e3a8a',
    horizonColor: '#3b82f6',
    hillFar: '#1e293b',
    hillNear: '#0f3d2e',
    groundOuter: '#134e4a',
    pathBase: '#7c6f64',
    pathBorder: '#44403c',
    laneStripe: '#a8a29e',
    accentFoliage: '#2dd4bf',
  },
];

const BIOME_CYCLE_LEN = 2160;

export function getBiomeForDistance(distance: number): BiomeConfig {
  const cycleDist = distance >= BIOME_CYCLE_LEN ? distance % BIOME_CYCLE_LEN : distance;
  let current = BIOMES[0];
  for (const b of BIOMES) {
    if (cycleDist >= b.minDistance) current = b;
  }
  return current;
}

export function getBiomeTransition(distance: number): {
  current: BiomeConfig;
  next: BiomeConfig;
  blend: number;
} {
  const cycleDist = distance >= BIOME_CYCLE_LEN ? distance % BIOME_CYCLE_LEN : distance;
  let idx = 0;
  for (let i = 0; i < BIOMES.length; i++) {
    if (cycleDist >= BIOMES[i].minDistance) idx = i;
  }
  const current = BIOMES[idx];
  const nextIdx = (idx + 1) % BIOMES.length;
  const next = BIOMES[nextIdx];
  const nextStart = nextIdx === 0 ? BIOME_CYCLE_LEN : next.minDistance;
  const transitionWindow = 28;
  const distToNext = nextStart - cycleDist;
  const blend = distToNext < transitionWindow ? Math.max(0, Math.min(1, 1 - distToNext / transitionWindow)) : 0;
  return { current, next, blend };
}

export interface BoosterDefinition {
  id: BoosterId;
  nameBn: string;
  nameEn: string;
  descBn: string;
  descEn: string;
  baseDuration: number;
  maxCap: number;
  color: string;
  bgColor: string;
  iconLabel: string;
}

export const BOOSTERS: BoosterDefinition[] = [
  {
    id: 'magnet',
    nameBn: 'বাঁশ চুম্বক',
    nameEn: 'Bamboo Magnet',
    descBn: 'তিন লেন থেকেই সব বাঁশ টেনে আনে!',
    descEn: 'Pulls bamboo from all three lanes toward the panda.',
    baseDuration: 8,
    maxCap: 16,
    color: '#ef4444',
    bgColor: '#fee2e2',
    iconLabel: '🧲',
  },
  {
    id: 'bamboo_bonus',
    nameBn: 'বাঁশ বোনাস',
    nameEn: 'Bamboo Bonus',
    descBn: 'বাঁশ তুললে বাড়তি বুস্টার স্কোর দেয়! (বাঁধা থেকে রক্ষা করে না)',
    descEn: 'Grants extra Booster Score per bamboo. Does not block collisions.',
    baseDuration: 10,
    maxCap: 18,
    color: '#16a34a',
    bgColor: '#dcfce7',
    iconLabel: '🎋',
  },
  {
    id: 'dash',
    nameBn: 'পান্ডা ড্যাশ',
    nameEn: 'Panda Dash',
    descBn: 'দ্রুত গতিতে ছোটে ও বোনাস স্কোর দেয়! (সাবধানে বাঁধা এড়াও)',
    descEn: 'Boosts speed & bonus score. Collisions still end the run!',
    baseDuration: 5,
    maxCap: 10,
    color: '#f97316',
    bgColor: '#ffedd5',
    iconLabel: '⚡',
  },
  {
    id: 'double_score',
    nameBn: 'ডাবল স্কোর',
    nameEn: 'Double Score',
    descBn: 'রান স্কোর দ্বিগুণ করে দেয়!',
    descEn: 'Doubles all Run Score earned while active.',
    baseDuration: 10,
    maxCap: 18,
    color: '#eab308',
    bgColor: '#fef9c3',
    iconLabel: '2×',
  },
  {
    id: 'leaf_hover',
    nameBn: 'পাতা ভাসা',
    nameEn: 'Bamboo Leaf Hover',
    descBn: 'সবুজ পাতার ওপর ভেসে সুন্দর পথ পাড়ি দেয়! (বাঁধা এড়িয়ে চলো)',
    descEn: 'Glides smoothly on swirling leaves. Collisions still cause Game Over!',
    baseDuration: 6,
    maxCap: 12,
    color: '#06b6d4',
    bgColor: '#cffafe',
    iconLabel: '🍃',
  },
  {
    id: 'bamboo_feast',
    nameBn: 'বাঁশ ভোজ',
    nameEn: 'Bamboo Feast',
    descBn: 'মজার বাঁশ খাওয়ার অ্যানিমেশন আর বাড়তি বাঁশ স্কোর!',
    descEn: 'Funny bamboo-munching spree with extra bamboo Booster Score!',
    baseDuration: 8,
    maxCap: 15,
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    iconLabel: '😋',
  },
];

export interface SkinDefinition {
  id: SkinId;
  nameBn: string;
  nameEn: string;
  descBn: string;
  descEn: string;
  scarfColor: string;
  scarfShadow: string;
  glowColor: string | null;
  costBamboo: number;
  costBoosterScore: number;
}

export const SKINS: SkinDefinition[] = [
  {
    id: 'classic_green',
    nameBn: 'আসল সবুজ স্কার্ফ',
    nameEn: 'Classic Green Scarf',
    descBn: 'অরিজিনাল সবুজ স্কার্ফ পরা আমাদের প্রিয় পান্ডা।',
    descEn: 'The signature cute panda with its iconic green scarf.',
    scarfColor: '#22c55e',
    scarfShadow: '#15803d',
    glowColor: null,
    costBamboo: 0,
    costBoosterScore: 0,
  },
  {
    id: 'golden_scarf',
    nameBn: 'সোনালী চ্যাম্পিয়ন স্কার্ফ',
    nameEn: 'Golden Champion Scarf',
    descBn: 'চকচকে সোনালী স্কার্ফে রাজকীয় পান্ডা।',
    descEn: 'Radiant golden scarf for bamboo champions.',
    scarfColor: '#facc15',
    scarfShadow: '#ca8a04',
    glowColor: 'rgba(250, 204, 21, 0.35)',
    costBamboo: 60,
    costBoosterScore: 150,
  },
  {
    id: 'jungle_emerald',
    nameBn: 'জঙ্গল এমারেল্ড স্কার্ফ',
    nameEn: 'Jungle Emerald Scarf',
    descBn: 'গভীর অরণ্যের উজ্জ্বল পান্না রঙের স্কার্ফ।',
    descEn: 'Vibrant emerald scarf inspired by the deep forest.',
    scarfColor: '#10b981',
    scarfShadow: '#047857',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    costBamboo: 100,
    costBoosterScore: 250,
  },
  {
    id: 'sky_breeze',
    nameBn: 'আকাশী বাতাস স্কার্ফ',
    nameEn: 'Sky Breeze Scarf',
    descBn: 'শীতল আকাশী স্কার্ফ আর হালকা ঝিলিক।',
    descEn: 'Cool sky-blue scarf for swift runners.',
    scarfColor: '#38bdf8',
    scarfShadow: '#0284c7',
    glowColor: 'rgba(56, 189, 248, 0.3)',
    costBamboo: 140,
    costBoosterScore: 350,
  },
  {
    id: 'crimson_fest',
    nameBn: 'উৎসব লাল স্কার্ফ',
    nameEn: 'Festival Crimson Scarf',
    descBn: 'আনন্দের লাল উৎসব স্কার্ফে দারুণ লুক।',
    descEn: 'Festive red scarf for celebratory runs.',
    scarfColor: '#f43f5e',
    scarfShadow: '#be123c',
    glowColor: 'rgba(244, 63, 94, 0.3)',
    costBamboo: 200,
    costBoosterScore: 500,
  },
];

export interface TrailDefinition {
  id: TrailId;
  nameBn: string;
  nameEn: string;
  descBn: string;
  descEn: string;
  color: string;
  costBamboo: number;
  costBoosterScore: number;
}

export const TRAILS: TrailDefinition[] = [
  {
    id: 'none',
    nameBn: 'সাধারণ ধুলো',
    nameEn: 'Classic Dust',
    descBn: 'দৌড়ানোর সময় হালকা ধুলোর মেঘ।',
    descEn: 'Classic cartoon dust puffs while sprinting.',
    color: '#e7d5be',
    costBamboo: 0,
    costBoosterScore: 0,
  },
  {
    id: 'bamboo_leaves',
    nameBn: 'বাঁশপাতার ট্রেইল',
    nameEn: 'Bamboo Leaf Trail',
    descBn: 'পেছনে ঝরে পড়ে তাজা সবুজ বাঁশপাতা।',
    descEn: 'Fresh green bamboo leaves flutter behind you.',
    color: '#22c55e',
    costBamboo: 45,
    costBoosterScore: 100,
  },
  {
    id: 'golden_sparks',
    nameBn: 'সোনালী ঝিলিক',
    nameEn: 'Golden Spark Trail',
    descBn: 'দৌড়ের পথে ছড়ায় সোনালী তারার ঝিলিক।',
    descEn: 'Shimmering golden sparks trail every stride.',
    color: '#facc15',
    costBamboo: 90,
    costBoosterScore: 220,
  },
  {
    id: 'wind_ribbons',
    nameBn: 'বাতাসের ফিতা',
    nameEn: 'Wind Ribbon Trail',
    descBn: 'দ্রুত বাতাসের সাদা-নীল রেখা।',
    descEn: 'Crisp sky-blue wind streaks behind the panda.',
    color: '#38bdf8',
    costBamboo: 130,
    costBoosterScore: 320,
  },
  {
    id: 'lotus_petals',
    nameBn: 'পদ্মপাপড়ি',
    nameEn: 'Lotus Petal Trail',
    descBn: 'গোলাপি ফুলের পাপড়ির রঙিন ট্রেইল।',
    descEn: 'Playful pink petals floating along your path.',
    color: '#f472b6',
    costBamboo: 180,
    costBoosterScore: 450,
  },
];

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'daily_bamboo_50',
    category: 'daily',
    titleBn: 'বাঁশ শিকারি',
    titleEn: 'Bamboo Gatherer',
    descBn: 'এক দৌড়ে ৫০টি বাঁশ সংগ্রহ করো',
    descEn: 'Collect 50 bamboo in runs (cumulative progress)',
    target: 50,
    metric: 'bamboo_total',
    rewardBamboo: 25,
    rewardBoosterScore: 80,
  },
  {
    id: 'daily_run_300',
    category: 'daily',
    titleBn: 'গ্রামের দৌড়বিদ',
    titleEn: 'Village Sprinter',
    descBn: 'এক দৌড়ে ৩০০ মিটার অতিক্রম করো',
    descEn: 'Reach 300m in a single run',
    target: 300,
    metric: 'distance_run',
    rewardBamboo: 30,
    rewardBoosterScore: 100,
  },
  {
    id: 'daily_boosters_3',
    category: 'daily',
    titleBn: 'বুস্টার মাস্টার',
    titleEn: 'Booster User',
    descBn: 'মোট ৩টি বুস্টার ব্যবহার করো',
    descEn: 'Use 3 boosters across runs',
    target: 3,
    metric: 'boosters_used',
    rewardBamboo: 20,
    rewardBoosterScore: 90,
  },
  {
    id: 'weekly_bamboo_100',
    category: 'weekly',
    titleBn: 'বাঁশ বাগানের রাজা',
    titleEn: 'Bamboo Collector',
    descBn: 'মোট ১০০টি বাঁশ সংগ্রহ করো',
    descEn: 'Collect 100 total bamboo',
    target: 100,
    metric: 'bamboo_total',
    rewardBamboo: 50,
    rewardBoosterScore: 180,
  },
  {
    id: 'weekly_run_500',
    category: 'weekly',
    titleBn: '৫০০ মিটার চ্যালেঞ্জ',
    titleEn: '500m Explorer',
    descBn: 'এক দৌড়ে ৫০০ মিটার পাড়ি দাও',
    descEn: 'Run 500 meters in one run',
    target: 500,
    metric: 'distance_run',
    rewardBamboo: 60,
    rewardBoosterScore: 220,
  },
  {
    id: 'weekly_score_2000',
    category: 'weekly',
    titleBn: '২০০০ স্কোর ক্লাব',
    titleEn: '2000 Score Target',
    descBn: 'এক দৌড়ে ২০০০ রান স্কোর অর্জন করো',
    descEn: 'Reach 2000 Run Score in a single run',
    target: 2000,
    metric: 'score_run',
    rewardBamboo: 75,
    rewardBoosterScore: 260,
  },
  {
    id: 'ach_monkey_escape',
    category: 'achievement',
    titleBn: 'বানর মিয়াকে বোকা বানাও',
    titleEn: 'Outrun Banor Mia',
    descBn: 'বানর মিয়ার তাড়া থেকে সফলভাবে পালাও',
    descEn: 'Successfully escape a Monkey Chase event',
    target: 1,
    metric: 'monkey_escapes',
    rewardBamboo: 40,
    rewardBoosterScore: 150,
  },
  {
    id: 'ach_booster_bamboo',
    category: 'achievement',
    titleBn: 'বুস্টারে বাঁশ সংগ্রহ',
    titleEn: 'Powered Bamboo',
    descBn: 'বুস্টার চালু থাকা অবস্থায় ২৫টি বাঁশ তোলো',
    descEn: 'Collect 25 bamboo while any booster is active',
    target: 25,
    metric: 'booster_bamboo',
    rewardBamboo: 45,
    rewardBoosterScore: 160,
  },
  {
    id: 'ach_vine_acrobat',
    category: 'achievement',
    titleBn: 'লতা দোলানো বীর',
    titleEn: 'Vine Acrobat',
    descBn: 'সফলভাবে ৫টি লতা পার হও',
    descEn: 'Complete 5 successful vine swings',
    target: 5,
    metric: 'vine_swings',
    rewardBamboo: 50,
    rewardBoosterScore: 180,
  },
  {
    id: 'ach_milestone_1000',
    category: 'achievement',
    titleBn: 'হাজার মিটারের নায়ক',
    titleEn: '1000m Hero',
    descBn: '১০০০ মিটার মাইলফলকে পৌঁছাও',
    descEn: 'Reach the 1000m distance milestone',
    target: 1000,
    metric: 'distance_run',
    rewardBamboo: 120,
    rewardBoosterScore: 400,
  },
];

export const DISTANCE_MILESTONES = [50, 100, 200, 300, 500, 1000, 1500, 2000, 3000, 5000];

export const PANDA_LINES = {
  bamboo: getLinesFor('panda', 'bamboo'),
  dodge: getLinesFor('panda', 'dodge'),
  dash: getLinesFor('panda', 'dash'),
  booster: getLinesFor('panda', 'booster'),
  monkeyChase: getLinesFor('panda', 'monkeyChase'),
  gameOver: getLinesFor('panda', 'gameOver'),
  highScore: getLinesFor('panda', 'highScore'),
};

export const MONKEY_LINES = {
  appear: getLinesFor('monkey', 'appear'),
  taunt: getLinesFor('monkey', 'taunt'),
};

export interface TutorialStepDef {
  id: string;
  action: 'auto' | 'left' | 'right' | 'jump' | 'slide' | 'bamboo' | 'vine_grab' | 'vine_release' | 'booster' | 'monkey';
  titleBn: string;
  titleEn: string;
  instructionBn: string;
  instructionEn: string;
  hintBn: string;
  hintEn: string;
}

export const TUTORIAL_STEPS: TutorialStepDef[] = [
  {
    id: 'intro',
    action: 'auto',
    titleBn: 'পান্ডা ব্যাশে স্বাগতম!',
    titleEn: 'Welcome to Panda Bash!',
    instructionBn: 'পান্ডা নিজেই সামনের দিকে দৌড়াচ্ছে! চলো খেলাটা শিখে নিই।',
    instructionEn: 'The panda runs forward automatically! Let us learn the moves.',
    hintBn: 'শুরু করতে একটু অপেক্ষা করো বা নিচে ট্যাপ করো',
    hintEn: 'Wait a moment or tap Continue',
  },
  {
    id: 'left',
    action: 'left',
    titleBn: 'বামে যাও',
    titleEn: 'Move Left',
    instructionBn: 'বামের লেনে যেতে বাম দিকে সোয়াইপ করো (বা ← / A চাপো)',
    instructionEn: 'Swipe Left (or press ← / A) to move to the left lane.',
    hintBn: 'আঙুল দিয়ে বাম দিকে টেনে নাও!',
    hintEn: 'Swipe left across the screen!',
  },
  {
    id: 'right',
    action: 'right',
    titleBn: 'ডানে যাও',
    titleEn: 'Move Right',
    instructionBn: 'ডানের লেনে যেতে ডান দিকে সোয়াইপ করো (বা → / D চাপো)',
    instructionEn: 'Swipe Right (or press → / D) to move to the right lane.',
    hintBn: 'আঙুল দিয়ে ডান দিকে টেনে নাও!',
    hintEn: 'Swipe right across the screen!',
  },
  {
    id: 'jump',
    action: 'jump',
    titleBn: 'বাঁধার ওপর দিয়ে লাফ দাও',
    titleEn: 'Jump Over Obstacle',
    instructionBn: 'বাঁশের বেড়া পার হতে উপরে সোয়াইপ করো (বা ↑ / W চাপো)',
    instructionEn: 'Swipe Up (or press ↑ / W) to jump over the fence!',
    hintBn: 'উপরে সোয়াইপ করে লাফ দাও!',
    hintEn: 'Swipe up just before the fence!',
  },
  {
    id: 'slide',
    action: 'slide',
    titleBn: 'নিচু হয়ে স্লাইড করো',
    titleEn: 'Slide Under Gate',
    instructionBn: 'উঁচু গেটের নিচ দিয়ে যেতে নিচে সোয়াইপ করো (বা ↓ / S চাপো)',
    instructionEn: 'Swipe Down (or press ↓ / S) to slide under the gate!',
    hintBn: 'নিচে সোয়াইপ করে নিচু হও!',
    hintEn: 'Swipe down to slide under!',
  },
  {
    id: 'bamboo',
    action: 'bamboo',
    titleBn: 'বাঁশ সংগ্রহ করো',
    titleEn: 'Collect Bamboo',
    instructionBn: 'লেন বদলে রাস্তা থেকে সবুজ বাঁশগুলো তুলে নাও!',
    instructionEn: 'Switch lanes to collect the green bamboo stalks!',
    hintBn: 'বাঁশের লেনে চলে যাও!',
    hintEn: 'Move into the lane with bamboo!',
  },
  {
    id: 'vine_grab',
    action: 'vine_grab',
    titleBn: 'ঝুলন্ত লতা ধরো (SWING)',
    titleEn: 'Grab Hanging Vine',
    instructionBn: 'ভাঙা পথ পার হতে SWING দেখালে উপরে সোয়াইপ করো!',
    instructionEn: 'When SWING appears at a gap, Swipe Up (or ↑ / W) to grab the vine!',
    hintBn: 'ভাঙা রাস্তার কাছে এসে উপরে সোয়াইপ করো!',
    hintEn: 'Swipe up when SWING lights up!',
  },
  {
    id: 'vine_release',
    action: 'vine_release',
    titleBn: 'সঠিক সময়ে ছাড়ো (RELEASE)',
    titleEn: 'Release Vine Safely',
    instructionBn: 'ওপারে নামতে RELEASE দেখালে নিচে সোয়াইপ করো!',
    instructionEn: 'When RELEASE appears, Swipe Down (or ↓ / S) to land safely!',
    hintBn: 'RELEASE দেখলেই নিচে সোয়াইপ করো!',
    hintEn: 'Swipe down when RELEASE flashes!',
  },
  {
    id: 'booster',
    action: 'booster',
    titleBn: 'বুস্টার ব্যবহার করো',
    titleEn: 'Pick Up a Booster',
    instructionBn: 'চুম্বক বা বিশেষ বুস্টার তুলে নাও—তবে সাবধান, বাঁধায় ধাক্কা লাগলে খেলা শেষ!',
    instructionEn: 'Grab the booster orb! Remember: boosters never block collisions.',
    hintBn: 'উজ্জ্বল বুস্টারটি সংগ্রহ করো!',
    hintEn: 'Move to collect the glowing booster!',
  },
  {
    id: 'monkey',
    action: 'monkey',
    titleBn: 'বানর মিয়া থেকে সাবধান!',
    titleEn: 'Watch Out for Banor Mia!',
    instructionBn: '১০০ মিটারে বানর মিয়া তাড়া করবে! বাঁধা এড়িয়ে ও বাঁশ তুলে পালিয়ে যাও!',
    instructionEn: 'Banor Mia chases you at 100m! Dodge obstacles & gather bamboo to escape!',
    hintBn: 'চলো আসল দৌড় শুরু করি!',
    hintEn: 'Ready for the real run!',
  },
];
