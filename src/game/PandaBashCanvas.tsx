import React, { useEffect, useRef } from 'react';
import {
  DISTANCE_MILESTONES,
  getBiomeTransition,
  MONKEY_LINES,
  PANDA_LINES,
  TRAILS,
  TUTORIAL_STEPS,
} from '../data/gameData';
import { VoiceLineDef } from '../data/voiceLines';
import {
  ActiveBoosterState,
  BoosterId,
  HudSnapshot,
  ObstacleKind,
  PlayerProgress,
  RunSummary,
  ScreenState,
} from '../types/game';
import { audioManager } from '../utils/audio';
import { getBoosterDuration } from '../utils/storage';
import {
  projectPoint,
  RenderCollectible,
  renderGameWorld,
  RenderObstacle,
  RenderParticle,
} from './renderer';

interface PandaBashCanvasProps {
  screen: ScreenState;
  runKey: number;
  isTutorial: boolean;
  progress: PlayerProgress;
  onHudUpdate: (hud: HudSnapshot) => void;
  onTogglePause: () => void;
  onTutorialComplete: () => void;
  onGameOver: (summary: RunSummary, extra: { boosterBamboo: number; milestonesReached: number }) => void;
}

const LOW_GROUND_HAZARDS: ObstacleKind[] = ['mud_puddle', 'pothole', 'tree_root'];
const JUMPABLE_OBSTACLES: ObstacleKind[] = [
  'bamboo_fence',
  'fallen_tree',
  'rock',
  'low_barrier',
  ...LOW_GROUND_HAZARDS,
];
const SLIDEABLE_OBSTACLES: ObstacleKind[] = ['bamboo_gate', 'overhead_branch'];
const BLOCKING_OBSTACLES: ObstacleKind[] = ['haystack', 'village_cart'];
const ALL_BOOSTER_IDS: BoosterId[] = [
  'magnet',
  'bamboo_bonus',
  'dash',
  'double_score',
  'leaf_hover',
  'bamboo_feast',
];

export const PandaBashCanvas: React.FC<PandaBashCanvasProps> = ({
  screen,
  runKey,
  isTutorial,
  progress,
  onHudUpdate,
  onTogglePause,
  onTutorialComplete,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const screenRef = useRef(screen);
  screenRef.current = screen;

  const callbacksRef = useRef({
    onHudUpdate,
    onTogglePause,
    onTutorialComplete,
    onGameOver,
  });
  callbacksRef.current = {
    onHudUpdate,
    onTogglePause,
    onTutorialComplete,
    onGameOver,
  };

  // Mutable simulation state stored outside React state for 60fps performance
  const simRef = useRef({
    running: false,
    isTutorial: false,
    distance: 0,
    runScore: 0,
    bambooCount: 0,
    boosterScore: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    boostersUsed: 0,
    boosterBamboo: 0,
    milestonesReached: 0,
    nextMilestoneIdx: 0,
    monkeyEscapes: 0,
    vineSwings: 0,

    // Player movement
    targetLane: 0, // -1, 0, 1
    laneX: 0,
    laneTilt: 0,
    jumpY: 0,
    jumpVel: 0,
    isSliding: false,
    slideTimer: 0,
    runCycle: 0,
    glanceBackTimer: 0,
    glanceCooldown: 0,

    // Vine swing state
    isSwinging: false,
    swingProgress: 0,
    swingSpeed: 0.92,
    vineAngle: 0,
    vineGapId: -1,

    // Active boosters & fair shuffled bag
    activeBoosters: [] as ActiveBoosterState[],
    boosterBag: [...ALL_BOOSTER_IDS] as BoosterId[],
    wavesSinceBooster: 0,

    // Monkey villain (বানর মিয়া)
    monkeyActive: false,
    monkeyTimer: 0,
    monkeyProximity: 0.25,
    monkeyLaneX: 0,
    monkeyRunCycle: 0,
    monkeyStealAnimTimer: 0,
    nextMonkeyDistance: 100,
    monkeyTauntSaid: false,
    monkeyWarning: null as string | null,
    monkeyWarningTimer: 0,

    // World scrolling & spawners
    scrollDistance: 0,
    timeSec: 0,
    spawnCooldownZ: 0.35,
    nextEntityId: 1,
    obstacles: [] as RenderObstacle[],
    collectibles: [] as RenderCollectible[],
    particles: [] as RenderParticle[],
    shakeAmount: 0,
    hitstopTimer: 0,

    // Feedback banners
    milestoneText: null as string | null,
    milestoneTimer: 0,
    speechBubble: null as { speaker: 'panda' | 'monkey'; text: string } | null,
    speechTimer: 0,

    // Tutorial state
    tutorialStep: 0,
    tutorialStepTimer: 0,
    tutorialSpawnedForStep: false,
    tutorialHint: null as string | null,
    tutorialHintTimer: 0,
    tutorialDone: false,

    // Game over flag
    ended: false,
  });

  // Reset simulation on fresh run
  useEffect(() => {
    const s = simRef.current;
    s.running = true;
    s.isTutorial = isTutorial;
    s.distance = 0;
    s.runScore = 0;
    s.bambooCount = 0;
    s.boosterScore = 0;
    s.combo = 0;
    s.comboTimer = 0;
    s.bestCombo = 0;
    s.boostersUsed = 0;
    s.boosterBamboo = 0;
    s.milestonesReached = 0;
    s.nextMilestoneIdx = 0;
    s.monkeyEscapes = 0;
    s.vineSwings = 0;

    s.targetLane = 0;
    s.laneX = 0;
    s.laneTilt = 0;
    s.jumpY = 0;
    s.jumpVel = 0;
    s.isSliding = false;
    s.slideTimer = 0;
    s.runCycle = 0;
    s.glanceBackTimer = 0;
    s.glanceCooldown = 0;

    s.isSwinging = false;
    s.swingProgress = 0;
    s.vineAngle = 0;
    s.vineGapId = -1;

    s.activeBoosters = [];
    s.boosterBag = [...ALL_BOOSTER_IDS].sort(() => Math.random() - 0.5);
    s.wavesSinceBooster = 1;

    s.monkeyActive = false;
    s.monkeyTimer = 0;
    s.monkeyProximity = 0.24;
    s.monkeyLaneX = 0;
    s.monkeyRunCycle = 0;
    s.monkeyStealAnimTimer = 0;
    s.nextMonkeyDistance = 100;
    s.monkeyTauntSaid = false;
    s.monkeyWarning = null;
    s.monkeyWarningTimer = 0;

    s.scrollDistance = 0;
    s.timeSec = 0;
    s.spawnCooldownZ = isTutorial ? 0.8 : 0.26;
    s.obstacles = [];
    s.collectibles = [];
    s.particles = [];
    s.shakeAmount = 0;
    s.hitstopTimer = 0;

    s.milestoneText = null;
    s.milestoneTimer = 0;
    s.speechBubble = null;
    s.speechTimer = 0;

    s.tutorialStep = 0;
    s.tutorialStepTimer = 0;
    s.tutorialSpawnedForStep = false;
    s.tutorialHint = null;
    s.tutorialHintTimer = 0;
    s.tutorialDone = false;

    s.ended = false;
  }, [runKey, isTutorial]);

  // Action triggers (shared by keyboard & touch swipes)
  const triggerAction = (action: 'left' | 'right' | 'jump' | 'slide') => {
    const s = simRef.current;
    if (s.ended || screenRef.current === 'PAUSED' || screenRef.current === 'GAME_OVER') return;
    audioManager.unlock();

    const lang = progressRef.current.settings.language;

    if (action === 'left') {
      if (s.isSwinging) return;
      if (s.targetLane > -1) {
        s.targetLane -= 1;
        audioManager.playSwipe();
      }
      if (s.isTutorial && TUTORIAL_STEPS[s.tutorialStep]?.action === 'left') {
        advanceTutorialStep();
      }
    } else if (action === 'right') {
      if (s.isSwinging) return;
      if (s.targetLane < 1) {
        s.targetLane += 1;
        audioManager.playSwipe();
      }
      if (s.isTutorial && TUTORIAL_STEPS[s.tutorialStep]?.action === 'right') {
        advanceTutorialStep();
      }
    } else if (action === 'jump') {
      // Forgiving vine grab window!
      const gap = s.obstacles.find(
        (o) => o.kind === 'broken_bridge' && o.z <= 0.50 && o.z >= 0.01
      );
      if (gap && !s.isSwinging) {
        s.isSwinging = true;
        s.swingProgress = 0;
        s.vineGapId = gap.id;
        s.isSliding = false;
        s.jumpY = 0.65;
        s.jumpVel = 0;
        audioManager.playVineGrab();
        if (s.isTutorial && TUTORIAL_STEPS[s.tutorialStep]?.action === 'vine_grab') {
          advanceTutorialStep();
        }
        return;
      }

      if (!s.isSwinging && s.jumpY <= 0.06) {
        s.jumpVel = 4.55;
        s.isSliding = false;
        s.slideTimer = 0;
        audioManager.playJump();
        spawnDustBurst(s.laneX, 5, '#e7d5be');
      }
    } else if (action === 'slide') {
      if (s.isSwinging) {
        if (s.swingProgress >= 0.30) {
          s.isSwinging = false;
          s.jumpY = 0.36;
          s.jumpVel = -0.6;
          s.vineSwings += 1;
          s.runScore += 80;
          s.boosterScore += 25;
          s.obstacles = s.obstacles.filter((o) => o.id !== s.vineGapId);
          s.vineGapId = -1;
          audioManager.playVineRelease();
          spawnDustBurst(s.laneX, 8, '#4ade80');
          if (s.isTutorial && TUTORIAL_STEPS[s.tutorialStep]?.action === 'vine_release') {
            advanceTutorialStep();
          }
        } else if (s.isTutorial) {
          s.tutorialHint = lang === 'bn' ? 'আরেকটু সামনে গিয়ে ছাড়ো!' : 'Wait until RELEASE flashes!';
          s.tutorialHintTimer = 2.0;
        }
        return;
      }

      if (!s.isSliding) {
        s.isSliding = true;
        s.slideTimer = 0.85;
        if (s.jumpY > 0.1) {
          s.jumpVel = -6.0;
        }
        audioManager.playSlide();
      }
    }
  };

  const advanceTutorialStep = () => {
    const s = simRef.current;
    s.tutorialStep += 1;
    s.tutorialStepTimer = 0;
    s.tutorialSpawnedForStep = false;
    s.tutorialHint = null;
    audioManager.playMilestone();

    if (s.tutorialStep >= TUTORIAL_STEPS.length) {
      s.tutorialDone = true;
      s.isTutorial = false;
      s.obstacles = [];
      s.collectibles = [];
      s.monkeyActive = false;
      callbacksRef.current.onTutorialComplete();
    }
  };

  const spawnDustBurst = (lanePos: number, count: number, color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const p = projectPoint(lanePos, 0, 0, w, h);
    const s = simRef.current;
    if (s.particles.length > 60) return;

    for (let i = 0; i < count; i++) {
      s.particles.push({
        x: p.x + (Math.random() - 0.5) * 26,
        y: p.y - 4,
        vx: (Math.random() - 0.5) * 90,
        vy: -20 - Math.random() * 55,
        size: 5 + Math.random() * 6,
        life: 0.42,
        maxLife: 0.42,
        color,
        shape: 'circle',
        rot: 0,
      });
    }
  };

  // Desktop keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space') {
        if (screenRef.current === 'PLAYING' || screenRef.current === 'PAUSED') {
          e.preventDefault();
          callbacksRef.current.onTogglePause();
        }
        return;
      }
      if (screenRef.current !== 'PLAYING' && screenRef.current !== 'TUTORIAL') return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          triggerAction('left');
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          triggerAction('right');
          break;
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          triggerAction('jump');
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          triggerAction('slide');
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // Main 60fps simulation & render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();
    let hudAccumulator = 0;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = parent.clientWidth;
      const ch = parent.clientHeight;
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const hasBooster = (id: BoosterId) =>
      simRef.current.activeBoosters.some((b) => b.id === id && b.remaining > 0);

    const nextVariedBooster = (): BoosterId => {
      const s = simRef.current;
      if (s.boosterBag.length === 0) {
        s.boosterBag = [...ALL_BOOSTER_IDS].sort(() => Math.random() - 0.5);
      }
      return s.boosterBag.pop() || 'magnet';
    };

    const activateBooster = (id: BoosterId) => {
      const s = simRef.current;
      const dur = getBoosterDuration(progressRef.current, id);
      const existing = s.activeBoosters.find((b) => b.id === id);
      if (existing) {
        existing.remaining = Math.min(dur * 1.6, existing.remaining + dur * 0.75);
        existing.duration = Math.max(existing.duration, existing.remaining);
      } else {
        s.activeBoosters.push({ id, remaining: dur, duration: dur });
      }
      s.boostersUsed += 1;
      s.boosterScore += 35;
      audioManager.playBooster();

      if (id === 'dash') {
        const line = PANDA_LINES.dash[0];
        if (line) showSpeech(line, false);
      } else {
        if (Math.random() < 0.45 && PANDA_LINES.booster[0]) {
          showSpeech(PANDA_LINES.booster[0], false);
        }
        if (id === 'leaf_hover') {
          // Predefined scenic safe stretch + floating bamboo trail (collision rule still applies!)
          s.obstacles = s.obstacles.filter((o) => o.z > 0.72 || o.z < -0.05);
          for (let i = 0; i < 5; i++) {
            s.collectibles.push({
              id: s.nextEntityId++,
              type: 'bamboo',
              lane: s.targetLane,
              xOffset: 0,
              yFloat: 0.24,
              z: 0.25 + i * 0.11,
              collected: false,
            });
          }
        }
      }
    };

    const showSpeech = (line: VoiceLineDef, priority = false) => {
      if (!priority && !audioManager.canSpeak(false)) return;
      const s = simRef.current;
      const lang = progressRef.current.settings.language;
      s.speechBubble = { speaker: line.speaker, text: lang === 'bn' ? line.bn : line.en };
      s.speechTimer = 2.7;
      audioManager.speakLine(line.id, priority);
    };

    const triggerGameOver = (reason: 'obstacle' | 'gap' | 'monkey') => {
      const s = simRef.current;
      if (s.ended) return;
      s.ended = true;
      s.shakeAmount = 14;
      s.hitstopTimer = 0.06;
      audioManager.playGameOver();
      audioManager.stopMusic(true);

      const line = audioManager.pickNonRepeatingLine(PANDA_LINES.gameOver);
      const distInt = Math.floor(s.distance);
      const scoreInt = Math.floor(s.runScore);

      // Only celebrate New Best / Champion when beating a genuine existing record or hitting high score (>= 800)!
      const prevBestDist = progressRef.current.bestDistance;
      const prevBestScore = progressRef.current.bestRunScore;
      const isNewBestDist =
        (prevBestDist >= 50 && distInt > prevBestDist) || (prevBestDist === 0 && distInt >= 120);
      const isNewBestScore =
        (prevBestScore >= 300 && scoreInt > prevBestScore) || (prevBestScore === 0 && scoreInt >= 800);

      const finalLine = isNewBestScore ? PANDA_LINES.highScore[0] : line;

      const summary: RunSummary = {
        distance: distInt,
        runScore: scoreInt,
        bambooCollected: s.bambooCount,
        boosterScoreEarned: Math.floor(s.boosterScore),
        bestBambooCombo: s.bestCombo,
        boostersUsed: s.boostersUsed,
        monkeyEscapes: s.monkeyEscapes,
        vineSwings: s.vineSwings,
        isNewBestDistance: isNewBestDist,
        isNewBestScore: isNewBestScore,
        deathReason: reason,
        reactionLineBn: finalLine.bn,
        reactionLineEn: finalLine.en,
      };

      audioManager.speakLine(finalLine.id, true);

      setTimeout(() => {
        callbacksRef.current.onGameOver(summary, {
          boosterBamboo: s.boosterBamboo,
          milestonesReached: s.milestonesReached,
        });
      }, 420);
    };

    const spawnNormalWave = (dist: number) => {
      const s = simRef.current;
      const { current: biome } = getBiomeTransition(dist);

      // Broken bridge vine-swing gap occasionally after 75m!
      if (dist > 75 && Math.random() < 0.13 && !s.obstacles.some((o) => o.kind === 'broken_bridge')) {
        s.obstacles.push({
          id: s.nextEntityId++,
          kind: 'broken_bridge',
          lane: 0,
          z: 1.0,
        });
        s.spawnCooldownZ = 0.72;
        return;
      }

      // Varied obstacle pool tailored to biome
      const pool: ObstacleKind[] = [...JUMPABLE_OBSTACLES, ...SLIDEABLE_OBSTACLES];
      if (biome.id === 'muddy_village' || biome.id === 'rice_fields' || biome.id === 'sunset_valley') {
        pool.push('haystack', 'village_cart');
      } else if (biome.id === 'deep_jungle' || biome.id === 'rainy_jungle') {
        pool.push('overhead_branch', 'tree_root', 'mud_puddle');
      } else {
        pool.push(...BLOCKING_OBSTACLES);
      }

      const lanes = [-1, 0, 1];
      // Fair obstacle count: 1 lane early, up to 2 lanes later — ALWAYS leaving at least 1 completely clear escape lane!
      const numObstacles = dist > 150 && Math.random() < 0.48 ? 2 : 1;
      const shuffled = [...lanes].sort(() => Math.random() - 0.5);
      const chosenLanes = shuffled.slice(0, numObstacles);

      const spawnedObstacles: { lane: number; kind: ObstacleKind }[] = [];
      for (const lane of chosenLanes) {
        const kind = pool[Math.floor(Math.random() * pool.length)];
        s.obstacles.push({
          id: s.nextEntityId++,
          kind,
          lane,
          z: 1.0,
        });
        spawnedObstacles.push({ lane, kind });
      }

      // Rich Bamboo Patterns in EVERY wave!
      const freeLane = shuffled[numObstacles] ?? 0;
      const patternRoll = Math.random();

      if (patternRoll < 0.45) {
        // Straight generous bamboo line along the safe lane (4–6 stalks)
        const count = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          s.collectibles.push({
            id: s.nextEntityId++,
            type: 'bamboo',
            lane: freeLane,
            xOffset: 0,
            yFloat: 0,
            z: 0.94 + i * 0.068,
            collected: false,
          });
        }
      } else if (patternRoll < 0.78) {
        // Curved / lane-change bamboo trail starting safely on freeLane and sweeping across!
        const dir = freeLane === -1 ? 1 : freeLane === 1 ? -1 : Math.random() < 0.5 ? 1 : -1;
        for (let i = 0; i < 5; i++) {
          const laneStep = i < 2 ? freeLane : Math.max(-1, Math.min(1, freeLane + dir));
          s.collectibles.push({
            id: s.nextEntityId++,
            type: 'bamboo',
            lane: laneStep,
            xOffset: 0,
            yFloat: 0,
            z: 0.95 + i * 0.072,
            collected: false,
          });
        }
      } else {
        // Arc bamboo over a jumpable obstacle OR bonus double-lane bamboo!
        const jumpObs = spawnedObstacles.find((o) => JUMPABLE_OBSTACLES.includes(o.kind));
        if (jumpObs) {
          for (let i = -1; i <= 1; i++) {
            s.collectibles.push({
              id: s.nextEntityId++,
              type: 'bamboo',
              lane: jumpObs.lane,
              xOffset: 0,
              yFloat: i === 0 ? 0.65 : 0.35,
              z: 1.0 + i * 0.065,
              collected: false,
            });
          }
        }
        // Plus safe-lane stalks
        for (let i = 0; i < 4; i++) {
          s.collectibles.push({
            id: s.nextEntityId++,
            type: 'bamboo',
            lane: freeLane,
            xOffset: 0,
            yFloat: 0,
            z: 0.94 + i * 0.07,
            collected: false,
          });
        }
      }

      // Steady, varied Booster spawns in guaranteed open lane (every 3–4 waves)
      s.wavesSinceBooster += 1;
      if (s.wavesSinceBooster >= 3 && Math.random() < 0.55) {
        s.wavesSinceBooster = 0;
        const boosterId = nextVariedBooster();
        s.collectibles.push({
          id: s.nextEntityId++,
          type: 'booster',
          boosterId,
          lane: freeLane,
          xOffset: 0,
          yFloat: 0.12,
          z: 0.85,
          collected: false,
        });
      }

      // Smooth fair wave spacing
      const difficultyTighten = Math.min(0.14, dist * 0.00011);
      s.spawnCooldownZ = 0.45 - difficultyTighten + Math.random() * 0.12;
    };

    const runTutorialTick = (dt: number) => {
      const s = simRef.current;
      const step = TUTORIAL_STEPS[s.tutorialStep];
      if (!step) return;
      const lang = progressRef.current.settings.language;

      s.tutorialStepTimer += dt;

      if (step.action === 'auto') {
        if (s.tutorialStepTimer > 2.6) advanceTutorialStep();
      } else if (step.action === 'jump' && !s.tutorialSpawnedForStep) {
        s.tutorialSpawnedForStep = true;
        s.obstacles.push({
          id: s.nextEntityId++,
          kind: 'bamboo_fence',
          lane: s.targetLane,
          z: 0.8,
        });
      } else if (step.action === 'slide' && !s.tutorialSpawnedForStep) {
        s.tutorialSpawnedForStep = true;
        s.obstacles.push({
          id: s.nextEntityId++,
          kind: 'bamboo_gate',
          lane: s.targetLane,
          z: 0.8,
        });
      } else if (step.action === 'bamboo' && !s.tutorialSpawnedForStep) {
        s.tutorialSpawnedForStep = true;
        const bLane = s.targetLane === 0 ? 1 : 0;
        for (let i = 0; i < 4; i++) {
          s.collectibles.push({
            id: s.nextEntityId++,
            type: 'bamboo',
            lane: bLane,
            xOffset: 0,
            yFloat: 0,
            z: 0.65 + i * 0.085,
            collected: false,
          });
        }
      } else if (step.action === 'vine_grab' && !s.tutorialSpawnedForStep) {
        s.tutorialSpawnedForStep = true;
        s.obstacles.push({
          id: s.nextEntityId++,
          kind: 'broken_bridge',
          lane: 0,
          z: 0.74,
        });
      } else if (step.action === 'booster' && !s.tutorialSpawnedForStep) {
        s.tutorialSpawnedForStep = true;
        s.collectibles.push({
          id: s.nextEntityId++,
          type: 'booster',
          boosterId: 'magnet',
          lane: s.targetLane,
          xOffset: 0,
          yFloat: 0.12,
          z: 0.68,
          collected: false,
        });
        for (let i = 0; i < 3; i++) {
          s.collectibles.push({
            id: s.nextEntityId++,
            type: 'bamboo',
            lane: i - 1,
            xOffset: 0,
            yFloat: 0,
            z: 0.86,
            collected: false,
          });
        }
      } else if (step.action === 'monkey') {
        if (!s.tutorialSpawnedForStep) {
          s.tutorialSpawnedForStep = true;
          s.monkeyActive = true;
          s.monkeyProximity = 0.35;
          s.glanceBackTimer = 0.7;
          showSpeech(audioManager.pickNonRepeatingLine(MONKEY_LINES.appear), true);
        }
        if (s.tutorialStepTimer > 3.0) {
          advanceTutorialStep();
        }
      }

      // Tutorial safety checks (no Game Over allowed!)
      for (const obs of s.obstacles) {
        if (obs.kind === 'broken_bridge') {
          if (obs.z < 0.03 && !s.isSwinging && step.action === 'vine_grab') {
            obs.z = 0.64;
            s.tutorialHint = lang === 'bn' ? step.hintBn : step.hintEn;
            s.tutorialHintTimer = 2.2;
          }
          continue;
        }
        if (obs.z < 0.06 && obs.z > -0.04 && !obs.passed) {
          const sameLane = Math.abs(s.laneX - obs.lane) < 0.42;
          if (sameLane) {
            if (obs.kind === 'bamboo_fence' && s.jumpY <= 0.35) {
              obs.z = 0.78;
              s.tutorialHint = lang === 'bn' ? step.hintBn : step.hintEn;
              s.tutorialHintTimer = 2.2;
              continue;
            }
            if (obs.kind === 'bamboo_gate' && !s.isSliding) {
              obs.z = 0.78;
              s.tutorialHint = lang === 'bn' ? step.hintBn : step.hintEn;
              s.tutorialHintTimer = 2.2;
              continue;
            }
          }
          obs.passed = true;
          if (
            (step.action === 'jump' && obs.kind === 'bamboo_fence') ||
            (step.action === 'slide' && obs.kind === 'bamboo_gate')
          ) {
            advanceTutorialStep();
          }
        }
      }

      if (step.action === 'bamboo' && s.collectibles.every((c) => c.collected || c.z < -0.1)) {
        s.tutorialSpawnedForStep = false;
        s.tutorialHint = lang === 'bn' ? step.hintBn : step.hintEn;
        s.tutorialHintTimer = 1.8;
      }
    };

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      const s = simRef.current;
      const isPaused = screenRef.current === 'PAUSED' || screenRef.current === 'HOME';
      const activePlay =
        screenRef.current === 'PLAYING' ||
        screenRef.current === 'TUTORIAL' ||
        screenRef.current === 'GAME_OVER';

      if (activePlay && !isPaused) {
        s.timeSec += dt;

        if (s.hitstopTimer > 0) {
          s.hitstopTimer -= dt;
        } else {
          s.shakeAmount = Math.max(0, s.shakeAmount - dt * 32);

          if (!s.ended) {
            const isDash = hasBooster('dash');
            const isHover = hasBooster('leaf_hover');
            const isMagnet = hasBooster('magnet');
            const isBonus = hasBooster('bamboo_bonus');
            const isDouble = hasBooster('double_score');
            const isFeast = hasBooster('bamboo_feast');

            // Smooth, predictable speed curve
            const baseZSpeed = s.isTutorial
              ? 0.28
              : Math.min(0.84, 0.37 + s.distance * 0.00022);
            const zSpeed = baseZSpeed * (isDash ? 1.46 : 1.0);
            const metersPerSec = zSpeed * 28;

            if (!s.isTutorial) {
              s.distance += metersPerSec * dt;
              const scoreRate = (isDouble ? 2 : 1) * (isDash ? 1.5 : 1) * 10;
              s.runScore += metersPerSec * scoreRate * 0.1 * dt;
            }
            s.scrollDistance += zSpeed * dt * 110;

            // Smooth lane interpolation & lean tilt
            const laneDiff = s.targetLane - s.laneX;
            s.laneX += laneDiff * Math.min(1, dt * 14);
            s.laneTilt += (laneDiff * 1.4 - s.laneTilt) * Math.min(1, dt * 12);

            // Jump physics
            if (!s.isSwinging) {
              if (s.jumpY > 0 || s.jumpVel !== 0) {
                s.jumpY += s.jumpVel * dt;
                s.jumpVel -= 11.0 * dt;
                if (s.jumpY <= 0) {
                  s.jumpY = 0;
                  s.jumpVel = 0;
                  spawnDustBurst(s.laneX, 4, '#d6c3a5');
                }
              }
            } else {
              const swingRate =
                s.isTutorial &&
                TUTORIAL_STEPS[s.tutorialStep]?.action === 'vine_release' &&
                s.swingProgress > 0.52
                  ? 0.22
                  : s.swingSpeed;
              s.swingProgress += dt * swingRate;
              s.jumpY = 0.62 + Math.sin(s.swingProgress * Math.PI) * 0.42;
              s.vineAngle = -0.7 + s.swingProgress * 1.4;

              if (s.swingProgress >= 1.0) {
                if (s.isTutorial) {
                  s.swingProgress = 0.45;
                  const lang = progressRef.current.settings.language;
                  s.tutorialHint =
                    lang === 'bn' ? 'এখন নিচে সোয়াইপ করে ছাড়ো!' : 'Swipe DOWN now to release!';
                  s.tutorialHintTimer = 2.0;
                } else {
                  triggerGameOver('gap');
                }
              }
            }

            if (s.isSliding) {
              s.slideTimer -= dt;
              if (s.slideTimer <= 0) s.isSliding = false;
            }

            if (s.glanceBackTimer > 0) s.glanceBackTimer -= dt;
            if (s.glanceCooldown > 0) s.glanceCooldown -= dt;
            if (s.monkeyStealAnimTimer > 0) s.monkeyStealAnimTimer -= dt;

            // Running animation cycle + trail particles
            s.runCycle += dt * (11 + zSpeed * 10);
            if (Math.random() < dt * 14 && s.jumpY < 0.1 && !s.isSwinging) {
              const w = canvas.clientWidth;
              const h = canvas.clientHeight;
              const pp = projectPoint(s.laneX, 0, 0, w, h);
              const trail =
                TRAILS.find((t) => t.id === progressRef.current.equippedTrail) || TRAILS[0];
              if (s.particles.length < 55) {
                s.particles.push({
                  x: pp.x + (Math.random() - 0.5) * 18,
                  y: pp.y - 4,
                  vx: (Math.random() - 0.5) * 28,
                  vy: 15 + Math.random() * 20,
                  size: trail.id === 'none' ? 5 : 6.5,
                  life: 0.35,
                  maxLife: 0.35,
                  color: isHover ? '#22c55e' : trail.color,
                  shape:
                    trail.id === 'bamboo_leaves' || isHover
                      ? 'leaf'
                      : trail.id === 'golden_sparks'
                      ? 'star'
                      : 'circle',
                  rot: Math.random() * Math.PI,
                });
              }
            }

            // Booster timers
            for (const b of s.activeBoosters) {
              b.remaining -= dt;
            }
            s.activeBoosters = s.activeBoosters.filter((b) => b.remaining > 0);

            // Combo timer
            if (s.combo > 0) {
              s.comboTimer -= dt;
              if (s.comboTimer <= 0) s.combo = 0;
            }

            // Distance Milestones
            if (!s.isTutorial && s.nextMilestoneIdx < DISTANCE_MILESTONES.length) {
              const targetM = DISTANCE_MILESTONES[s.nextMilestoneIdx];
              if (s.distance >= targetM) {
                s.nextMilestoneIdx += 1;
                s.milestonesReached += 1;
                s.boosterScore += 40;
                const lang = progressRef.current.settings.language;
                s.milestoneText =
                  lang === 'bn'
                    ? `দারুণ! ${targetM} মিটার অতিক্রম!`
                    : `Milestone! ${targetM}m Reached!`;
                s.milestoneTimer = 2.6;
                audioManager.playMilestone();
              }
            }

            // Monkey Villain (বানর মিয়া) Chase Trigger & Logic
            if (!s.isTutorial && !s.monkeyActive && s.distance >= s.nextMonkeyDistance) {
              s.monkeyActive = true;
              s.monkeyTimer = 11.5;
              s.monkeyProximity = 0.28;
              s.monkeyTauntSaid = false;
              s.nextMonkeyDistance += 230 + Math.random() * 100;
              const lang = progressRef.current.settings.language;
              s.monkeyWarning =
                lang === 'bn'
                  ? 'সাবধান! বানর মিয়া পিছু নিয়েছে!'
                  : 'Warning! Banor Mia is chasing you!';
              s.monkeyWarningTimer = 3.2;
              audioManager.playMonkeyAlert();
              const line = audioManager.pickNonRepeatingLine(MONKEY_LINES.appear);
              showSpeech(line, true);
            }

            if (s.monkeyActive && !s.isTutorial) {
              s.monkeyRunCycle += dt * 15;
              s.monkeyLaneX += (s.laneX - s.monkeyLaneX) * Math.min(1, dt * 4.5);
              s.monkeyTimer -= dt;

              // Freeze proximity gain while swinging across a vine so chase stays 100% fair
              if (!s.isSwinging) {
                const deltaProx = isDash ? -0.25 : 0.042;
                s.monkeyProximity = Math.max(0.08, s.monkeyProximity + deltaProx * dt);
              }

              // Mid-chase cheeky taunt from Banor Mia
              if (!s.monkeyTauntSaid && s.monkeyTimer <= 6.2 && s.monkeyProximity < 0.68) {
                s.monkeyTauntSaid = true;
                const tLine = audioManager.pickNonRepeatingLine(MONKEY_LINES.taunt);
                showSpeech(tLine, false);
              }

              // Brief intentional backward glance ONLY when Banor Mia creeps very close!
              if (s.monkeyProximity > 0.70 && s.glanceCooldown <= 0) {
                s.glanceBackTimer = 0.65;
                s.glanceCooldown = 4.5;
                s.monkeyStealAnimTimer = 0.6;
                const pLine = PANDA_LINES.monkeyChase[0];
                if (pLine) showSpeech(pLine, false);
              }

              if (s.monkeyProximity >= 1.0) {
                triggerGameOver('monkey');
              } else if (s.monkeyTimer <= 0) {
                s.monkeyActive = false;
                s.monkeyEscapes += 1;
                s.runScore += 150;
                s.boosterScore += 60;
                const line = PANDA_LINES.monkeyChase[1];
                if (line) showSpeech(line, false);
              }
            } else if (s.monkeyActive && s.isTutorial) {
              s.monkeyRunCycle += dt * 12;
              s.monkeyLaneX += (s.laneX - s.monkeyLaneX) * Math.min(1, dt * 4);
            }

            // Move Obstacles & Check Collisions (STRICT COLLISION RULE, FAIR HITBOXES!)
            const worldAdvance = zSpeed * dt;
            for (const obs of s.obstacles) {
              obs.z -= worldAdvance;
            }
            s.vineAngle = Math.sin(now * 0.004) * 0.35;

            if (!s.isTutorial) {
              for (const obs of s.obstacles) {
                if (obs.kind === 'broken_bridge') {
                  // Auto-latch if player jumped early over the gap
                  if (obs.z <= 0.16 && obs.z >= 0.02 && s.jumpY > 0.25 && !s.isSwinging) {
                    s.isSwinging = true;
                    s.swingProgress = 0.08;
                    s.vineGapId = obs.id;
                    s.jumpY = 0.65;
                    s.jumpVel = 0;
                    audioManager.playVineGrab();
                    continue;
                  }
                  if (obs.z <= 0.02 && !s.isSwinging && !obs.passed) {
                    triggerGameOver('gap');
                  }
                  continue;
                }

                // Tight, fair depth & lane hitbox so there are zero ghost collisions
                if (obs.z <= 0.045 && obs.z >= -0.035) {
                  const inLane = Math.abs(s.laneX - obs.lane) < 0.34;
                  if (inLane) {
                    let safe = false;
                    if (LOW_GROUND_HAZARDS.includes(obs.kind)) {
                      safe = s.jumpY > 0.30 || s.isSwinging;
                    } else if (JUMPABLE_OBSTACLES.includes(obs.kind)) {
                      safe = s.jumpY > 0.42 || s.isSwinging;
                    } else if (SLIDEABLE_OBSTACLES.includes(obs.kind)) {
                      safe = s.isSliding || s.isSwinging;
                    } else {
                      safe = s.isSwinging;
                    }

                    if (!safe) {
                      triggerGameOver('obstacle');
                    } else if (!obs.passed) {
                      obs.passed = true;
                      if (Math.random() < 0.14) {
                        const dLine = audioManager.pickNonRepeatingLine(PANDA_LINES.dodge);
                        showSpeech(dLine, false);
                      }
                    }
                  }
                }
              }
            }

            // Move & Collect Collectibles
            for (const col of s.collectibles) {
              if (col.collected) continue;
              col.z -= worldAdvance;

              if (isMagnet && col.type === 'bamboo' && col.z < 0.56 && col.z > -0.05) {
                const targetOff = s.laneX - col.lane;
                col.xOffset += (targetOff - col.xOffset) * Math.min(1, dt * 11);
              }

              if (col.z <= 0.08 && col.z >= -0.06) {
                const effLane = col.lane + col.xOffset;
                if (Math.abs(s.laneX - effLane) < 0.50) {
                  col.collected = true;
                  if (col.type === 'bamboo') {
                    s.bambooCount += 1;
                    s.combo += 1;
                    s.comboTimer = 2.4;
                    s.bestCombo = Math.max(s.bestCombo, s.combo);
                    if (s.activeBoosters.length > 0) {
                      s.boosterBamboo += 1;
                    }

                    const scoreMult = isDouble ? 2 : 1;
                    const bonusBoostMult = (isBonus ? 2.5 : 1) * (isFeast ? 1.8 : 1);
                    s.runScore += 15 * scoreMult;
                    s.boosterScore += Math.round(5 * bonusBoostMult + Math.min(s.combo, 10));

                    if (s.monkeyActive) {
                      s.monkeyProximity = Math.max(0.08, s.monkeyProximity - 0.12);
                    }

                    audioManager.playBamboo(s.combo);
                    spawnDustBurst(effLane, 6, '#4ade80');

                    if (s.bambooCount % 16 === 0 && !s.isTutorial) {
                      const bLine = audioManager.pickNonRepeatingLine(PANDA_LINES.bamboo);
                      showSpeech(bLine, false);
                    }

                    if (s.isTutorial && TUTORIAL_STEPS[s.tutorialStep]?.action === 'bamboo') {
                      advanceTutorialStep();
                    }
                  } else if (col.boosterId) {
                    activateBooster(col.boosterId);
                    spawnDustBurst(effLane, 10, '#facc15');
                    if (s.isTutorial && TUTORIAL_STEPS[s.tutorialStep]?.action === 'booster') {
                      advanceTutorialStep();
                    }
                  }
                }
              }
            }

            s.obstacles = s.obstacles.filter((o) => o.z > -0.22);
            s.collectibles = s.collectibles.filter((c) => !c.collected && c.z > -0.2);

            if (!s.isTutorial) {
              s.spawnCooldownZ -= worldAdvance;
              if (s.spawnCooldownZ <= 0) {
                spawnNormalWave(s.distance);
              }
            } else {
              runTutorialTick(dt);
            }
          }

          for (const pt of s.particles) {
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.rot += dt * 4;
            pt.life -= dt;
          }
          s.particles = s.particles.filter((pt) => pt.life > 0);

          if (s.milestoneTimer > 0) {
            s.milestoneTimer -= dt;
            if (s.milestoneTimer <= 0) s.milestoneText = null;
          }
          if (s.monkeyWarningTimer > 0) {
            s.monkeyWarningTimer -= dt;
            if (s.monkeyWarningTimer <= 0) s.monkeyWarning = null;
          }
          if (s.speechTimer > 0) {
            s.speechTimer -= dt;
            if (s.speechTimer <= 0) s.speechBubble = null;
          }
          if (s.tutorialHintTimer > 0) {
            s.tutorialHintTimer -= dt;
            if (s.tutorialHintTimer <= 0) s.tutorialHint = null;
          }
        }
      }

      // Render world
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const { current: curBiome, next: nextBiome, blend: biomeBlend } = getBiomeTransition(
        s.distance
      );
      audioManager.setBiomeAmbience(curBiome.id);

      const vineObs = s.obstacles.find((o) => o.kind === 'broken_bridge' && o.z <= 0.65);
      let vinePrompt: 'none' | 'swing' | 'release' = 'none';
      if (s.isSwinging) {
        if (s.swingProgress >= 0.30) vinePrompt = 'release';
      } else if (vineObs && vineObs.z <= 0.50 && vineObs.z >= 0.01) {
        vinePrompt = 'swing';
      }

      renderGameWorld(ctx, {
        width: cw,
        height: ch,
        biome: curBiome,
        nextBiome,
        biomeBlend,
        scrollDistance: s.scrollDistance,
        timeSec: s.timeSec,
        shakeAmount: s.shakeAmount,
        panda: {
          laneX: s.laneX,
          laneTilt: s.laneTilt,
          jumpY: s.jumpY,
          isSliding: s.isSliding,
          slideTimer: s.slideTimer,
          isSwinging: s.isSwinging,
          swingProgress: s.swingProgress,
          isHovering: hasBooster('leaf_hover'),
          isFeasting: hasBooster('bamboo_feast'),
          isDashing: hasBooster('dash'),
          isGameOver: s.ended,
          isCelebrating: false,
          glanceBackTimer: s.glanceBackTimer,
          runCycle: s.runCycle,
          skinId: progressRef.current.equippedSkin,
          trailId: progressRef.current.equippedTrail,
          activeBoosters: s.activeBoosters,
        },
        monkey: {
          active: s.monkeyActive,
          laneX: s.monkeyLaneX,
          proximity: s.monkeyProximity,
          runCycle: s.monkeyRunCycle,
          stealAnimTimer: s.monkeyStealAnimTimer,
        },
        obstacles: s.obstacles,
        collectibles: s.collectibles,
        particles: s.particles,
        vineAngle: s.vineAngle,
        vineActiveZ: vineObs ? vineObs.z : null,
      });

      hudAccumulator += dt;
      if (hudAccumulator >= 0.065) {
        hudAccumulator = 0;
        callbacksRef.current.onHudUpdate({
          distance: Math.floor(s.distance),
          runScore: Math.floor(s.runScore),
          bambooCount: s.bambooCount,
          boosterScore: Math.floor(s.boosterScore),
          combo: s.combo,
          biome: curBiome.id,
          activeBoosters: s.activeBoosters.map((b) => ({ ...b })),
          monkeyActive: s.monkeyActive,
          monkeyProximity: s.monkeyProximity,
          monkeyWarning: s.monkeyWarning,
          vinePrompt,
          milestoneText: s.milestoneText,
          speechBubble: s.speechBubble,
          tutorialStepIndex: s.tutorialStep,
          tutorialHint: s.tutorialHint,
          tutorialCompletedBanner: s.tutorialDone,
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Touch & Mouse Swipe Gesture Handling
  const gestureRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    consumed: boolean;
  }>({ active: false, startX: 0, startY: 0, consumed: false });

  const handlePointerStart = (x: number, y: number) => {
    gestureRef.current = { active: true, startX: x, startY: y, consumed: false };
    audioManager.unlock();
  };

  const handlePointerMove = (x: number, y: number) => {
    const g = gestureRef.current;
    if (!g.active || g.consumed) return;
    const dx = x - g.startX;
    const dy = y - g.startY;
    const threshold = 24;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

    g.consumed = true;
    if (Math.abs(dx) > Math.abs(dy)) {
      triggerAction(dx < 0 ? 'left' : 'right');
    } else {
      triggerAction(dy < 0 ? 'jump' : 'slide');
    }
  };

  const handlePointerEnd = () => {
    const g = gestureRef.current;
    if (g.active && !g.consumed && simRef.current.isTutorial) {
      const step = TUTORIAL_STEPS[simRef.current.tutorialStep];
      if (step?.action === 'auto' || step?.action === 'monkey') {
        advanceTutorialStep();
      }
    }
    gestureRef.current.active = false;
    gestureRef.current.consumed = false;
  };

  return (
    <div
      className="relative w-full h-full touch-none select-none overflow-hidden"
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          handlePointerStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length > 0) {
          handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchEnd={() => handlePointerEnd()}
      onMouseDown={(e) => handlePointerStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
      onMouseUp={() => handlePointerEnd()}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
