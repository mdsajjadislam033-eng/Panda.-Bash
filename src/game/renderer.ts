import { BiomeConfig, BOOSTERS, SKINS } from '../data/gameData';
import {
  ActiveBoosterState,
  BoosterId,
  ObstacleKind,
  SkinId,
  TrailId,
} from '../types/game';

export interface RenderObstacle {
  id: number;
  kind: ObstacleKind;
  lane: number; // -1, 0, 1 (for broken_bridge covers all 3)
  z: number; // 1.0 (horizon) -> 0 (player) -> -0.2 (behind)
  passed?: boolean;
}

export interface RenderCollectible {
  id: number;
  type: 'bamboo' | 'booster';
  boosterId?: BoosterId;
  lane: number;
  xOffset: number;
  yFloat: number;
  z: number;
  collected: boolean;
}

export interface RenderParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  shape: 'circle' | 'leaf' | 'star' | 'line';
  rot: number;
}

export interface RenderPandaState {
  laneX: number; // smooth -1..1
  laneTilt: number; // -1..1 turning velocity for 3/4 lean
  jumpY: number; // 0..1.5
  isSliding: boolean;
  slideTimer: number;
  isSwinging: boolean;
  swingProgress: number; // 0..1
  isHovering: boolean;
  isFeasting: boolean;
  isDashing: boolean;
  isGameOver: boolean;
  isCelebrating: boolean;
  glanceBackTimer: number; // >0 briefly peeks at monkey behind
  runCycle: number;
  skinId: SkinId;
  trailId: TrailId;
  activeBoosters: ActiveBoosterState[];
}

export interface RenderMonkeyState {
  active: boolean;
  laneX: number;
  proximity: number; // 0..1 (1 = caught panda)
  runCycle: number;
  stealAnimTimer: number;
}

export interface RenderWorldState {
  width: number;
  height: number;
  biome: BiomeConfig;
  nextBiome: BiomeConfig;
  biomeBlend: number;
  scrollDistance: number;
  timeSec: number;
  shakeAmount: number;
  panda: RenderPandaState;
  monkey: RenderMonkeyState;
  obstacles: RenderObstacle[];
  collectibles: RenderCollectible[];
  particles: RenderParticle[];
  vineAngle: number;
  vineActiveZ: number | null;
}

function lerpColor(hexA: string, hexB: string, t: number): string {
  if (t <= 0.01) return hexA;
  if (t >= 0.99) return hexB;
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

export function persp(z: number): number {
  return 1 / (1 + Math.max(-0.22, z) * 3.1);
}

export function projectPoint(
  lanePos: number,
  z: number,
  yHeight: number,
  w: number,
  h: number
): { x: number; y: number; scale: number; halfTrack: number } {
  const horizonY = h * 0.34;
  const playerGroundY = h * 0.81;
  const p = persp(z);
  const pFar = persp(1.0);
  const pNear = persp(0);
  const u = (p - pFar) / (pNear - pFar);
  const baseUnit = Math.min(w, h * 0.72);
  const halfTrack = Math.min(w * 0.44, 240) * p;
  const x = w * 0.5 + lanePos * (halfTrack * 0.64);
  const y = horizonY + u * (playerGroundY - horizonY) - yHeight * p * (baseUnit * 0.25);
  const scale = p * (baseUnit / 360);
  return { x, y, scale, halfTrack };
}

export function renderGameWorld(ctx: CanvasRenderingContext2D, state: RenderWorldState): void {
  const { width: w, height: h, biome, nextBiome, biomeBlend, scrollDistance, timeSec } = state;

  ctx.save();
  if (state.shakeAmount > 0.2) {
    const sx = (Math.random() - 0.5) * state.shakeAmount * 2;
    const sy = (Math.random() - 0.5) * state.shakeAmount * 2;
    ctx.translate(sx, sy);
  }

  const horizonY = h * 0.34;
  const activeBiomeId = biomeBlend > 0.5 ? nextBiome.id : biome.id;
  const skyTop = lerpColor(biome.skyTop, nextBiome.skyTop, biomeBlend);
  const skyBottom = lerpColor(biome.skyBottom, nextBiome.skyBottom, biomeBlend);
  const hillFar = lerpColor(biome.hillFar, nextBiome.hillFar, biomeBlend);
  const hillNear = lerpColor(biome.hillNear, nextBiome.hillNear, biomeBlend);
  const groundOuter = lerpColor(biome.groundOuter, nextBiome.groundOuter, biomeBlend);
  const pathBase = lerpColor(biome.pathBase, nextBiome.pathBase, biomeBlend);
  const pathBorder = lerpColor(biome.pathBorder, nextBiome.pathBorder, biomeBlend);
  const laneStripe = lerpColor(biome.laneStripe, nextBiome.laneStripe, biomeBlend);
  const accentFoliage = lerpColor(biome.accentFoliage, nextBiome.accentFoliage, biomeBlend);

  // 1. Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(1, skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, horizonY + 4);

  // Moon & Stars for Moonlit Forest, or Sun & Clouds for Daytime Biomes
  if (activeBiomeId === 'moonlit_forest') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let i = 0; i < 18; i++) {
      const sx = ((i * 83 + 29) % 100) * (w / 100);
      const sy = ((i * 47 + 15) % 85) * (horizonY / 100);
      const twinkle = 1 + Math.sin(timeSec * 3 + i) * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.3 * twinkle, 0, Math.PI * 2);
      ctx.fill();
    }
    const moonX = w * 0.78;
    const moonY = horizonY * 0.34;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(moonX, moonY, Math.min(w, h) * 0.055, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skyTop;
    ctx.beginPath();
    ctx.arc(moonX + 10, moonY - 5, Math.min(w, h) * 0.045, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const sunX = w * 0.78;
    const sunY = activeBiomeId === 'sunset_valley' ? horizonY * 0.62 : horizonY * 0.35;
    ctx.fillStyle =
      activeBiomeId === 'sunset_valley'
        ? 'rgba(253, 186, 116, 0.5)'
        : 'rgba(255, 250, 220, 0.45)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, Math.min(w, h) * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle =
      activeBiomeId === 'rainy_jungle'
        ? 'rgba(226, 232, 240, 0.7)'
        : 'rgba(255, 252, 235, 0.92)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, Math.min(w, h) * 0.055, 0, Math.PI * 2);
    ctx.fill();

    // Gentle drifting clouds (subtle ambient drift by timeSec, not road speed)
    ctx.fillStyle =
      activeBiomeId === 'rainy_jungle'
        ? 'rgba(148, 163, 184, 0.85)'
        : 'rgba(255, 255, 255, 0.82)';
    for (let i = 0; i < 4; i++) {
      const cx =
        (((w * (0.14 + i * 0.27) + timeSec * (7 + i * 2)) % (w + 160)) + (w + 160)) %
          (w + 160) -
        80;
      const cy = horizonY * (0.24 + (i % 2) * 0.22);
      const cr = 18 + (i % 3) * 6;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.arc(cx + cr * 0.9, cy - 6, cr * 0.85, 0, Math.PI * 2);
      ctx.arc(cx + cr * 1.7, cy + 2, cr * 0.72, 0, Math.PI * 2);
      ctx.fill();
    }

    // Little cartoon birds gliding calmly in the sky
    if (activeBiomeId !== 'rainy_jungle') {
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.55)';
      ctx.lineWidth = 1.8;
      for (let b = 0; b < 3; b++) {
        const bx = ((w * (0.25 + b * 0.22) + timeSec * 14) % (w + 60)) - 30;
        const by = horizonY * (0.3 + b * 0.1) + Math.sin(timeSec * 4 + b) * 4;
        const flap = Math.sin(timeSec * 8 + b * 2) * 3.5;
        ctx.beginPath();
        ctx.moveTo(bx - 7, by + flap);
        ctx.quadraticCurveTo(bx - 3, by - 4, bx, by);
        ctx.quadraticCurveTo(bx + 3, by - 4, bx + 7, by + flap);
        ctx.stroke();
      }
    }
  }

  // 2. Calm Distant Mountains & Hills (very light natural horizontal/breathing parallax, completely stable!)
  ctx.fillStyle = hillFar;
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 2);
  const mountainAmp = activeBiomeId === 'mountain_forest' ? 46 : 24;
  for (let x = 0; x <= w + 32; x += 32) {
    const wave = Math.sin(x * 0.011 + 0.5) * mountainAmp + Math.cos(x * 0.023) * 10;
    ctx.lineTo(x, horizonY - 22 - Math.abs(wave));
  }
  ctx.lineTo(w, horizonY + 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = hillNear;
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 2);
  for (let x = 0; x <= w + 28; x += 28) {
    const wave = Math.sin(x * 0.018 + 1.8) * 16;
    ctx.lineTo(x, horizonY - 8 - Math.abs(wave));
  }
  ctx.lineTo(w, horizonY + 2);
  ctx.closePath();
  ctx.fill();

  // 3. Ground Plane & Calm Static Side Environment (NO bamboo/scenery zooming at camera!)
  ctx.fillStyle = groundOuter;
  ctx.fillRect(0, horizonY, w, h - horizonY);

  drawStaticSideEnvironment(ctx, w, h, horizonY, activeBiomeId, accentFoliage, timeSec, scrollDistance);

  // 4. 3-Lane Perspective Road
  const farP = projectPoint(0, 1.0, 0, w, h);
  const nearP = projectPoint(0, -0.2, 0, w, h);

  // Outer road border / curb
  ctx.fillStyle = pathBorder;
  ctx.beginPath();
  ctx.moveTo(farP.x - farP.halfTrack * 1.09, farP.y);
  ctx.lineTo(farP.x + farP.halfTrack * 1.09, farP.y);
  ctx.lineTo(nearP.x + nearP.halfTrack * 1.09, nearP.y);
  ctx.lineTo(nearP.x - nearP.halfTrack * 1.09, nearP.y);
  ctx.closePath();
  ctx.fill();

  // Road surface
  ctx.fillStyle = pathBase;
  ctx.beginPath();
  ctx.moveTo(farP.x - farP.halfTrack, farP.y);
  ctx.lineTo(farP.x + farP.halfTrack, farP.y);
  ctx.lineTo(nearP.x + nearP.halfTrack, nearP.y);
  ctx.lineTo(nearP.x - nearP.halfTrack, nearP.y);
  ctx.closePath();
  ctx.fill();

  // Subtle road curb markers & wooden bridge planks to convey forward running motion cleanly
  if (activeBiomeId === 'wooden_bridge') {
    const step = 0.065;
    const offset = (scrollDistance * 0.025) % step;
    ctx.strokeStyle = 'rgba(69, 34, 10, 0.55)';
    for (let z = 1.0 - offset; z > -0.16; z -= step) {
      const rp = projectPoint(0, z, 0, w, h);
      ctx.lineWidth = Math.max(1.2, 2.5 * rp.scale);
      ctx.beginPath();
      ctx.moveTo(rp.x - rp.halfTrack, rp.y);
      ctx.lineTo(rp.x + rp.halfTrack, rp.y);
      ctx.stroke();
    }
  } else {
    // Ground-level scrolling pebble/grass dashes right on the curb border (low, flat, never obstructing!)
    const curbStep = 0.14;
    const curbOff = (scrollDistance * 0.025) % curbStep;
    ctx.fillStyle = accentFoliage;
    for (let z = 1.0 - curbOff; z > -0.14; z -= curbStep) {
      const lp = projectPoint(-1.26, z, 0, w, h);
      const rp = projectPoint(1.26, z, 0, w, h);
      ctx.beginPath();
      ctx.ellipse(lp.x, lp.y, 10 * lp.scale, 4 * lp.scale, 0, 0, Math.PI * 2);
      ctx.ellipse(rp.x, rp.y, 10 * rp.scale, 4 * rp.scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Lane divider dashed lines
  const dashStep = 0.12;
  const dashOffset = (scrollDistance * 0.025) % dashStep;
  ctx.strokeStyle = laneStripe;
  for (let z = 1.0 - dashOffset; z > -0.12; z -= dashStep) {
    const z2 = Math.max(-0.18, z - dashStep * 0.52);
    const p1 = projectPoint(-0.5, z, 0, w, h);
    const p2 = projectPoint(-0.5, z2, 0, w, h);
    const q1 = projectPoint(0.5, z, 0, w, h);
    const q2 = projectPoint(0.5, z2, 0, w, h);
    ctx.lineWidth = Math.max(1.5, 3.2 * p2.scale);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.moveTo(q1.x, q1.y);
    ctx.lineTo(q2.x, q2.y);
    ctx.stroke();
  }

  // 5. Road Gaps / Broken Bridges
  for (const obs of state.obstacles) {
    if (obs.kind === 'broken_bridge') {
      drawBrokenBridgeGap(ctx, obs.z, w, h);
    }
  }

  // 6. Sort obstacles & collectibles by depth Z (far to near)
  type DrawItem =
    | { kind: 'obs'; z: number; obs: RenderObstacle }
    | { kind: 'col'; z: number; col: RenderCollectible };

  const items: DrawItem[] = [];
  for (const obs of state.obstacles) {
    if (obs.kind !== 'broken_bridge' && obs.z <= 1.02 && obs.z >= -0.18) {
      items.push({ kind: 'obs', z: obs.z, obs });
    }
  }
  for (const col of state.collectibles) {
    if (!col.collected && col.z <= 1.02 && col.z >= -0.15) {
      items.push({ kind: 'col', z: col.z, col });
    }
  }
  items.sort((a, b) => b.z - a.z);

  // Draw items ahead of panda (z > 0.02)
  for (const item of items) {
    if (item.z > 0.02) {
      if (item.kind === 'obs') drawObstacle(ctx, item.obs, w, h);
      else drawCollectible(ctx, item.col, w, h, timeSec);
    }
  }

  // 7. Hanging Vine Rope
  if (state.vineActiveZ !== null || state.panda.isSwinging) {
    const vz = state.panda.isSwinging ? 0.0 : state.vineActiveZ ?? 0.15;
    drawHangingVine(ctx, vz, state.panda.laneX, state.vineAngle, state.panda.isSwinging, w, h);
  }

  // 8. Forward-Facing Panda Character (z = 0)
  drawPanda(ctx, state.panda, w, h, timeSec);

  // 9. Monkey Villain (বানর মিয়া) sprinting right behind the panda!
  if (state.monkey.active) {
    drawMonkey(ctx, state.monkey, w, h);
  }

  // Draw items that just passed panda (z <= 0.02)
  for (const item of items) {
    if (item.z <= 0.02) {
      if (item.kind === 'obs') drawObstacle(ctx, item.obs, w, h);
      else drawCollectible(ctx, item.col, w, h, timeSec);
    }
  }

  // 10. Particles & Biome Weather (Rainy Jungle raindrops / Moonlit Fireflies)
  drawParticles(ctx, state.particles);

  if (activeBiomeId === 'rainy_jungle') {
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.lineWidth = 1.6;
    for (let r = 0; r < 22; r++) {
      const rx = ((r * 73 + timeSec * 120) % w);
      const ry = ((r * 97 + timeSec * 480) % h);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 4, ry + 16);
      ctx.stroke();
    }
  } else if (activeBiomeId === 'moonlit_forest') {
    for (let f = 0; f < 10; f++) {
      const fx = ((f * 113 + Math.sin(timeSec + f) * 24) % w);
      const fy = horizonY + ((f * 61 + Math.cos(timeSec * 1.4 + f) * 18) % (h - horizonY));
      const glow = 0.4 + 0.5 * Math.sin(timeSec * 4 + f * 2);
      ctx.fillStyle = `rgba(190, 242, 100, ${glow.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(fx, fy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 11. Dash speed lines overlay at outer screen edges
  if (state.panda.isDashing) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const sx = side < 0 ? w * (0.03 + (i % 4) * 0.025) : w * (0.97 - (i % 4) * 0.025);
      const sy = (scrollDistance * 18 + i * 97) % h;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, sy + 42);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawStaticSideEnvironment(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  horizonY: number,
  biomeId: string,
  accentColor: string,
  timeSec: number,
  scrollDistance: number
): void {
  // All side trees, bamboo groves, village huts, and rivers stay calmly anchored outside the road!
  // They gently sway in the breeze without rushing toward the panda or covering lanes.
  const farP = projectPoint(0, 1.0, 0, w, h);
  const midP = projectPoint(0, 0.35, 0, w, h);
  const sway = Math.sin(timeSec * 2.1) * 3;

  // River water bands for Forest River & Wooden Bridge
  if (biomeId === 'forest_river' || biomeId === 'wooden_bridge') {
    ctx.fillStyle = 'rgba(186, 230, 253, 0.32)';
    for (let i = 0; i < 5; i++) {
      const ry = horizonY + 26 + i * ((h - horizonY) * 0.16);
      const rippleX = Math.sin(timeSec * 2 + i) * 14;
      ctx.fillRect(w * 0.06 + rippleX, ry, w * 0.12, 4);
      ctx.fillRect(w * 0.80 - rippleX, ry + 8, w * 0.12, 4);
    }
  }

  // Rice field golden/green rows for Rice Fields
  if (biomeId === 'rice_fields') {
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
    ctx.lineWidth = 3;
    for (let r = 0; r < 6; r++) {
      const y = horizonY + 18 + r * ((h - horizonY) * 0.14);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w * 0.25, y + 12);
      ctx.moveTo(w, y);
      ctx.lineTo(w * 0.75, y + 12);
      ctx.stroke();
    }
  }

  // Static Background Bamboo Groves / Trees positioned cleanly along the horizon & outer margins
  const drawStaticBambooCluster = (cx: number, cy: number, scale: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    for (let b = -1; b <= 1; b++) {
      const bx = b * 12 * scale;
      const bh = (78 + (b === 0 ? 18 : 0)) * scale;
      ctx.fillStyle = b === 0 ? '#22c55e' : '#16a34a';
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 1.6;
      ctx.fillRect(bx - 4.5 * scale, -bh, 9 * scale, bh);
      ctx.strokeRect(bx - 4.5 * scale, -bh, 9 * scale, bh);
      // Leaf tufts swaying gently
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.ellipse(bx - 9 * scale + sway * 0.4, -bh + 12 * scale, 10 * scale, 4 * scale, -0.4, 0, Math.PI * 2);
      ctx.ellipse(bx + 9 * scale + sway * 0.4, -bh + 4 * scale, 10 * scale, 4 * scale, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawStaticTree = (cx: number, cy: number, scale: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-6 * scale, -44 * scale, 12 * scale, 44 * scale);
    ctx.fillStyle = accentColor;
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(sway * 0.25, -56 * scale, 26 * scale, 0, Math.PI * 2);
    ctx.arc(-16 * scale + sway * 0.2, -46 * scale, 18 * scale, 0, Math.PI * 2);
    ctx.arc(16 * scale + sway * 0.2, -46 * scale, 18 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  const drawVillageHut = (cx: number, cy: number, scale: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    // Mud/bamboo hut wall
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.fillRect(-26 * scale, -34 * scale, 52 * scale, 34 * scale);
    ctx.strokeRect(-26 * scale, -34 * scale, 52 * scale, 34 * scale);
    // Door
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-8 * scale, -22 * scale, 16 * scale, 22 * scale);
    // Thatched roof
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(-34 * scale, -32 * scale);
    ctx.lineTo(0, -58 * scale);
    ctx.lineTo(34 * scale, -32 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  const leftOuter = Math.max(28, farP.x - farP.halfTrack * 1.45);
  const rightOuter = Math.min(w - 28, farP.x + farP.halfTrack * 1.45);
  const leftEdge = Math.max(24, midP.x - midP.halfTrack * 1.48);
  const rightEdge = Math.min(w - 24, midP.x + midP.halfTrack * 1.48);

  if (biomeId === 'bamboo_forest' || biomeId === 'deep_jungle' || biomeId === 'rainy_jungle') {
    drawStaticBambooCluster(leftOuter * 0.45, horizonY + 14, 0.9);
    drawStaticBambooCluster(leftOuter * 0.85, horizonY + 28, 1.05);
    drawStaticBambooCluster(w - leftOuter * 0.45, horizonY + 14, 0.9);
    drawStaticBambooCluster(rightOuter + (w - rightOuter) * 0.15, horizonY + 28, 1.05);
    if (w > 520) {
      drawStaticBambooCluster(leftEdge * 0.35, midP.y + 10, 1.15);
      drawStaticBambooCluster(w - leftEdge * 0.35, midP.y + 10, 1.15);
    }
  } else if (biomeId === 'muddy_village' || biomeId === 'sunset_valley' || biomeId === 'rice_fields') {
    drawVillageHut(leftOuter * 0.55, horizonY + 18, 0.9);
    drawStaticTree(rightOuter + (w - rightOuter) * 0.35, horizonY + 20, 0.95);
    drawStaticTree(leftOuter * 0.2, horizonY + 32, 0.85);
    if (w > 520) {
      drawVillageHut(w - leftEdge * 0.45, midP.y - 6, 1.0);
      drawStaticTree(leftEdge * 0.35, midP.y + 8, 1.05);
    }
  } else {
    drawStaticTree(leftOuter * 0.5, horizonY + 16, 0.95);
    drawStaticTree(rightOuter + (w - rightOuter) * 0.45, horizonY + 18, 0.95);
    if (w > 520) {
      drawStaticTree(leftEdge * 0.35, midP.y + 8, 1.05);
      drawStaticTree(w - leftEdge * 0.35, midP.y + 8, 1.05);
    }
  }

  void scrollDistance;
}

function drawBrokenBridgeGap(
  ctx: CanvasRenderingContext2D,
  z: number,
  w: number,
  h: number
): void {
  const zBack = Math.min(1.0, z + 0.085);
  const zFront = Math.max(-0.18, z - 0.045);
  const farP = projectPoint(0, zBack, 0, w, h);
  const nearP = projectPoint(0, zFront, 0, w, h);

  ctx.save();
  const grad = ctx.createLinearGradient(0, farP.y, 0, nearP.y);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#1e293b');
  grad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(farP.x - farP.halfTrack * 1.08, farP.y);
  ctx.lineTo(farP.x + farP.halfTrack * 1.08, farP.y);
  ctx.lineTo(nearP.x + nearP.halfTrack * 1.08, nearP.y);
  ctx.lineTo(nearP.x - nearP.halfTrack * 1.08, nearP.y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#92400e';
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    const px = nearP.x + i * nearP.halfTrack * 0.36;
    ctx.fillRect(px - 10 * nearP.scale, nearP.y - 6 * nearP.scale, 20 * nearP.scale, 10 * nearP.scale);
  }
  ctx.restore();
}

function drawHangingVine(
  ctx: CanvasRenderingContext2D,
  z: number,
  lanePos: number,
  vineAngle: number,
  isGrabbed: boolean,
  w: number,
  h: number
): void {
  const p = projectPoint(isGrabbed ? lanePos : 0, z, 0, w, h);
  const anchorX = p.x;
  const anchorY = 0;
  const ropeLen = isGrabbed ? p.y - 125 * p.scale : p.y - 75 * p.scale;
  const tipX = anchorX + Math.sin(vineAngle) * 58 * p.scale;
  const tipY = Math.max(90, ropeLen);

  ctx.save();
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = Math.max(4, 7 * p.scale);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY);
  ctx.quadraticCurveTo(anchorX + Math.sin(vineAngle) * 24, tipY * 0.5, tipX, tipY);
  ctx.stroke();

  ctx.fillStyle = '#22c55e';
  for (let k = 0.25; k <= 0.8; k += 0.25) {
    const lx = anchorX + Math.sin(vineAngle) * 32 * k;
    const ly = tipY * k;
    ctx.beginPath();
    ctx.ellipse(lx + 10, ly, 10 * p.scale + 3, 5 * p.scale + 2, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(tipX, tipY, Math.max(7, 11 * p.scale), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  obs: RenderObstacle,
  w: number,
  h: number
): void {
  const p = projectPoint(obs.lane, obs.z, 0, w, h);
  const s = p.scale;
  if (s <= 0.05) return;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.lineWidth = Math.max(1.2, 2.4 * s);
  ctx.lineJoin = 'round';

  // Soft ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
  ctx.beginPath();
  ctx.ellipse(0, 4 * s, 44 * s, 12 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  switch (obs.kind) {
    case 'bamboo_fence': {
      ctx.fillStyle = '#15803d';
      ctx.strokeStyle = '#052e16';
      ctx.fillRect(-38 * s, -44 * s, 10 * s, 44 * s);
      ctx.strokeRect(-38 * s, -44 * s, 10 * s, 44 * s);
      ctx.fillRect(28 * s, -44 * s, 10 * s, 44 * s);
      ctx.strokeRect(28 * s, -44 * s, 10 * s, 44 * s);

      ctx.fillStyle = '#4ade80';
      ctx.fillRect(-44 * s, -36 * s, 88 * s, 11 * s);
      ctx.strokeRect(-44 * s, -36 * s, 88 * s, 11 * s);
      ctx.fillRect(-44 * s, -18 * s, 88 * s, 10 * s);
      ctx.strokeRect(-44 * s, -18 * s, 88 * s, 10 * s);
      break;
    }
    case 'bamboo_gate':
    case 'overhead_branch': {
      ctx.fillStyle = obs.kind === 'bamboo_gate' ? '#166534' : '#78350f';
      ctx.strokeStyle = '#1c1917';
      ctx.fillRect(-44 * s, -112 * s, 11 * s, 112 * s);
      ctx.strokeRect(-44 * s, -112 * s, 11 * s, 112 * s);
      ctx.fillRect(33 * s, -112 * s, 11 * s, 112 * s);
      ctx.strokeRect(33 * s, -112 * s, 11 * s, 112 * s);

      ctx.fillStyle = obs.kind === 'bamboo_gate' ? '#22c55e' : '#92400e';
      ctx.fillRect(-48 * s, -108 * s, 96 * s, 50 * s);
      ctx.strokeRect(-48 * s, -108 * s, 96 * s, 50 * s);

      // Clear yellow SLIDE DOWN arrow cue
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(0, -64 * s);
      ctx.lineTo(-12 * s, -80 * s);
      ctx.lineTo(-5 * s, -80 * s);
      ctx.lineTo(-5 * s, -96 * s);
      ctx.lineTo(5 * s, -96 * s);
      ctx.lineTo(5 * s, -80 * s);
      ctx.lineTo(12 * s, -80 * s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'fallen_tree': {
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#451a03';
      ctx.beginPath();
      ctx.roundRect(-48 * s, -32 * s, 96 * s, 30 * s, 14 * s);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(-42 * s, -17 * s, 7 * s, 13 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(12 * s, -32 * s, 14 * s, 6 * s, -0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'haystack': {
      ctx.fillStyle = '#eab308';
      ctx.strokeStyle = '#854d0e';
      ctx.beginPath();
      ctx.moveTo(-44 * s, 0);
      ctx.quadraticCurveTo(-40 * s, -90 * s, 0, -96 * s);
      ctx.quadraticCurveTo(40 * s, -90 * s, 44 * s, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(-18 * s, -12 * s);
      ctx.lineTo(-8 * s, -62 * s);
      ctx.moveTo(14 * s, -14 * s);
      ctx.lineTo(6 * s, -68 * s);
      ctx.stroke();
      break;
    }
    case 'village_cart': {
      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = '#451a03';
      ctx.fillRect(-44 * s, -74 * s, 88 * s, 54 * s);
      ctx.strokeRect(-44 * s, -74 * s, 88 * s, 54 * s);
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(0, -74 * s, 42 * s, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(-28 * s, -16 * s, 16 * s, 0, Math.PI * 2);
      ctx.arc(28 * s, -16 * s, 16 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'rock': {
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-38 * s, 0);
      ctx.lineTo(-28 * s, -36 * s);
      ctx.lineTo(4 * s, -46 * s);
      ctx.lineTo(36 * s, -24 * s);
      ctx.lineTo(40 * s, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(-6 * s, -26 * s, 10 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'tree_root': {
      ctx.fillStyle = '#713f12';
      ctx.strokeStyle = '#422006';
      ctx.beginPath();
      ctx.moveTo(-42 * s, 0);
      ctx.quadraticCurveTo(-20 * s, -44 * s, 0, -24 * s);
      ctx.quadraticCurveTo(22 * s, -46 * s, 44 * s, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'mud_puddle': {
      ctx.fillStyle = '#5c3a21';
      ctx.strokeStyle = '#3b2313';
      ctx.beginPath();
      ctx.ellipse(0, -4 * s, 42 * s, 16 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#855836';
      ctx.beginPath();
      ctx.ellipse(-10 * s, -6 * s, 14 * s, 5 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'pothole': {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.ellipse(0, -4 * s, 38 * s, 15 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'low_barrier':
    default: {
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#78350f';
      ctx.fillRect(-42 * s, -36 * s, 84 * s, 26 * s);
      ctx.strokeRect(-42 * s, -36 * s, 84 * s, 26 * s);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-28 * s, -36 * s, 16 * s, 26 * s);
      ctx.fillRect(12 * s, -36 * s, 16 * s, 26 * s);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-34 * s, -10 * s, 8 * s, 10 * s);
      ctx.fillRect(26 * s, -10 * s, 8 * s, 10 * s);
      break;
    }
  }

  ctx.restore();
}

function drawCollectible(
  ctx: CanvasRenderingContext2D,
  col: RenderCollectible,
  w: number,
  h: number,
  timeSec: number
): void {
  const bob = Math.sin(timeSec * 5.2 + col.id) * 0.14;
  const p = projectPoint(col.lane + col.xOffset, col.z, 0.48 + col.yFloat + bob, w, h);
  const gP = projectPoint(col.lane + col.xOffset, col.z, 0, w, h);
  const s = p.scale;
  if (s <= 0.05) return;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(gP.x, gP.y, 18 * s, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(p.x, p.y);

  if (col.type === 'bamboo') {
    // High-contrast glowing cartoon bamboo collectible
    ctx.rotate(-0.18);
    ctx.fillStyle = 'rgba(253, 224, 71, 0.34)';
    ctx.beginPath();
    ctx.arc(0, 0, 29 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = Math.max(1.8, 3 * s);
    ctx.beginPath();
    ctx.roundRect(-9.5 * s, -24 * s, 19 * s, 48 * s, 6 * s);
    ctx.fill();
    ctx.stroke();

    // Bright highlight & bamboo joints
    ctx.fillStyle = '#bbf7d0';
    ctx.fillRect(-5 * s, -20 * s, 5 * s, 40 * s);
    ctx.beginPath();
    ctx.moveTo(-10 * s, -7 * s);
    ctx.lineTo(10 * s, -7 * s);
    ctx.moveTo(-10 * s, 8 * s);
    ctx.lineTo(10 * s, 8 * s);
    ctx.stroke();

    // Leaf sprout
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.ellipse(13 * s, -15 * s, 11 * s, 5 * s, -0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // Vibrant, unmistakable 2D Cartoon Booster Badge
    const def = BOOSTERS.find((b) => b.id === col.boosterId) || BOOSTERS[0];
    const pulse = 1 + Math.sin(timeSec * 7 + col.id) * 0.09;
    ctx.scale(pulse, pulse);

    // Outer radiant aura
    ctx.fillStyle = `${def.color}44`;
    ctx.beginPath();
    ctx.arc(0, 0, 38 * s, 0, Math.PI * 2);
    ctx.fill();

    // Rotating corner stars
    ctx.fillStyle = '#fde047';
    for (let k = 0; k < 4; k++) {
      const ang = timeSec * 2.5 + k * (Math.PI / 2);
      const sx = Math.cos(ang) * 32 * s;
      const sy = Math.sin(ang) * 32 * s;
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main circular booster medal
    ctx.fillStyle = def.bgColor;
    ctx.strokeStyle = def.color;
    ctx.lineWidth = Math.max(2.4, 4.2 * s);
    ctx.beginPath();
    ctx.arc(0, 0, 27 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glossy inner highlight arc
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(1.5, 2.5 * s);
    ctx.beginPath();
    ctx.arc(0, 0, 21 * s, -Math.PI * 0.85, -Math.PI * 0.2);
    ctx.stroke();

    // Custom vector icon per booster for sharp readability
    drawBoosterIcon(ctx, col.boosterId || 'magnet', def.color, s);
  }

  ctx.restore();
}

function drawBoosterIcon(
  ctx: CanvasRenderingContext2D,
  id: BoosterId,
  color: string,
  s: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (id) {
    case 'magnet': {
      ctx.lineWidth = Math.max(2.5, 5 * s);
      ctx.beginPath();
      ctx.arc(0, -2 * s, 11 * s, 0, Math.PI, false);
      ctx.moveTo(-11 * s, -2 * s);
      ctx.lineTo(-11 * s, -11 * s);
      ctx.moveTo(11 * s, -2 * s);
      ctx.lineTo(11 * s, -11 * s);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-13.5 * s, -13 * s, 5 * s, 5 * s);
      ctx.fillRect(8.5 * s, -13 * s, 5 * s, 5 * s);
      break;
    }
    case 'dash': {
      ctx.beginPath();
      ctx.moveTo(3 * s, -15 * s);
      ctx.lineTo(-9 * s, 2 * s);
      ctx.lineTo(0, 2 * s);
      ctx.lineTo(-3 * s, 15 * s);
      ctx.lineTo(10 * s, -2 * s);
      ctx.lineTo(1 * s, -2 * s);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'double_score': {
      ctx.font = `700 ${Math.round(21 * s)}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('2×', 0, 1 * s);
      break;
    }
    case 'leaf_hover': {
      ctx.beginPath();
      ctx.ellipse(0, 0, 14 * s, 7 * s, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.2, 2 * s);
      ctx.beginPath();
      ctx.moveTo(-9 * s, 5 * s);
      ctx.lineTo(9 * s, -5 * s);
      ctx.stroke();
      break;
    }
    case 'bamboo_bonus': {
      ctx.fillRect(-5 * s, -14 * s, 10 * s, 28 * s);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(8 * s, -10 * s, 6 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'bamboo_feast':
    default: {
      ctx.beginPath();
      ctx.arc(0, 2 * s, 12 * s, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-6 * s, -12 * s, 4 * s, 14 * s);
      ctx.fillRect(2 * s, -14 * s, 4 * s, 16 * s);
      break;
    }
  }
  ctx.restore();
}

function drawPanda(
  ctx: CanvasRenderingContext2D,
  panda: RenderPandaState,
  w: number,
  h: number,
  timeSec: number
): void {
  const skin = SKINS.find((sk) => sk.id === panda.skinId) || SKINS[0];
  const heightY =
    panda.jumpY + (panda.isHovering ? 0.36 + Math.sin(timeSec * 6) * 0.08 : 0);
  const p = projectPoint(panda.laneX, 0, heightY, w, h);
  const gP = projectPoint(panda.laneX, 0, 0, w, h);
  const s = p.scale * 1.18;

  // Ground shadow
  const shadowScale = Math.max(0.45, 1 - heightY * 0.32);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(gP.x, gP.y + 4 * s, 38 * s * shadowScale, 11 * s * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bamboo Leaf Hover swirling leaf cushion under panda
  if (panda.isHovering) {
    ctx.save();
    ctx.translate(p.x, p.y + 12 * s);
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2 * s;
    for (let i = 0; i < 3; i++) {
      const ang = timeSec * 5.5 + i * 2.1;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(ang) * 28 * s,
        Math.sin(ang) * 7 * s,
        18 * s,
        7 * s,
        ang * 0.3,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(p.x, p.y);

  // Matching Booster Aura Effect around Panda
  if (skin.glowColor || panda.isDashing || panda.activeBoosters.length > 0) {
    const activeColor = panda.isDashing
      ? 'rgba(249, 115, 22, 0.32)'
      : panda.activeBoosters.length > 0
      ? `${(BOOSTERS.find((b) => b.id === panda.activeBoosters[0].id)?.color || '#22c55e')}38`
      : skin.glowColor || 'rgba(34, 197, 94, 0.2)';
    ctx.fillStyle = activeColor;
    ctx.beginPath();
    ctx.ellipse(0, -50 * s, 46 * s, 58 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Natural tilt when changing lanes, sliding, swinging, or game over
  if (panda.isSliding) {
    ctx.translate(0, 12 * s);
    ctx.scale(1.18, 0.54);
  } else if (panda.isSwinging) {
    ctx.rotate(Math.sin(panda.swingProgress * Math.PI) * 0.26);
  } else if (panda.isGameOver) {
    ctx.rotate(-0.24);
  } else {
    ctx.rotate(Math.max(-0.22, Math.min(0.22, panda.laneTilt * 0.16)));
  }

  const runSwing = Math.sin(panda.runCycle);
  const bounce = panda.isSliding ? 0 : Math.abs(Math.cos(panda.runCycle)) * 6 * s;
  ctx.translate(0, -bounce);

  ctx.lineWidth = Math.max(2, 2.8 * s);
  ctx.strokeStyle = '#18181b';
  ctx.lineJoin = 'round';

  // Determine facing mode:
  // Normal running = FORWARD-FACING (running down the track away from camera, showing back of head/ears,
  // green scarf with tails streaming backward, white rump & tail puff, kicking pink paw pads, plus subtle
  // 3/4 forward glance on turns!).
  // ONLY shows back-facing face during brief monkey glance (`glanceBackTimer > 0`), Game Over, or Bamboo Feast side-munch!
  const lookingBackAtMonkey = panda.glanceBackTimer > 0 && !panda.isGameOver;

  // --- Legs Striding Forward with Pink Paw Pads Kicking Back Toward Camera ---
  // Left Leg
  ctx.save();
  ctx.translate(-12 * s, -15 * s);
  ctx.rotate(runSwing * 0.45);
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.roundRect(-9 * s, -2 * s, 18 * s, 21 * s, 9 * s);
  ctx.fill();
  ctx.stroke();
  // Visible pink paw pad on upward back-kick!
  if (runSwing > -0.15) {
    ctx.fillStyle = '#f9a8d4';
    ctx.beginPath();
    ctx.ellipse(0, 12 * s, 6 * s, 4.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-3.5 * s, 6 * s, 1.8 * s, 0, Math.PI * 2);
    ctx.arc(0, 5 * s, 1.8 * s, 0, Math.PI * 2);
    ctx.arc(3.5 * s, 6 * s, 1.8 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Right Leg
  ctx.save();
  ctx.translate(12 * s, -15 * s);
  ctx.rotate(-runSwing * 0.45);
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.roundRect(-9 * s, -2 * s, 18 * s, 21 * s, 9 * s);
  ctx.fill();
  ctx.stroke();
  if (-runSwing > -0.15) {
    ctx.fillStyle = '#f9a8d4';
    ctx.beginPath();
    ctx.ellipse(0, 12 * s, 6 * s, 4.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-3.5 * s, 6 * s, 1.8 * s, 0, Math.PI * 2);
    ctx.arc(0, 5 * s, 1.8 * s, 0, Math.PI * 2);
    ctx.arc(3.5 * s, 6 * s, 1.8 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // --- Arms Pumping Forward ---
  ctx.save();
  ctx.translate(-22 * s, -42 * s);
  ctx.rotate(panda.isSwinging ? -2.4 : -runSwing * 0.55 + 0.2);
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.roundRect(-7 * s, 0, 14 * s, 21 * s, 7 * s);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(22 * s, -42 * s);
  ctx.rotate(panda.isSwinging ? -2.5 : runSwing * 0.55 - 0.2);
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.roundRect(-7 * s, 0, 14 * s, 21 * s, 7 * s);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // --- Panda Torso (Black shoulder saddle + white fluffy lower back/hips) ---
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#18181b';
  ctx.beginPath();
  ctx.ellipse(0, -34 * s, 23 * s, 24 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Signature black shoulder band across upper back
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.ellipse(0, -44 * s, 22 * s, 11 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cute round fluffy white panda tail on back!
  if (!panda.isGameOver && !lookingBackAtMonkey) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(0, -18 * s, 7.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // --- Signature Green Scarf Collar + Flowing Twin Tails Trailing Behind ---
  const tailWave = Math.sin(panda.runCycle * 1.4) * 7 * s;
  ctx.fillStyle = skin.scarfShadow;
  ctx.strokeStyle = '#14532d';
  ctx.beginPath();
  ctx.moveTo(-6 * s, -49 * s);
  ctx.quadraticCurveTo(-34 * s, -40 * s + tailWave, -38 * s, -16 * s + tailWave);
  ctx.quadraticCurveTo(-20 * s, -22 * s, -2 * s, -42 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = skin.scarfColor;
  ctx.beginPath();
  ctx.moveTo(4 * s, -49 * s);
  ctx.quadraticCurveTo(30 * s, -36 * s - tailWave * 0.7, 26 * s, -14 * s - tailWave * 0.7);
  ctx.quadraticCurveTo(10 * s, -22 * s, -2 * s, -42 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Scarf collar ring
  ctx.fillStyle = skin.scarfColor;
  ctx.beginPath();
  ctx.ellipse(0, -52 * s, 23 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // --- Panda Head ---
  ctx.strokeStyle = '#18181b';
  // Fuzzy round ears
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(-24 * s, -97 * s, 12.5 * s, 0, Math.PI * 2);
  ctx.arc(24 * s, -97 * s, 12.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Round fluffy white head
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -76 * s, 31 * s, 27 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Top fur tufts
  ctx.beginPath();
  ctx.moveTo(-6 * s, -102 * s);
  ctx.lineTo(-2 * s, -109 * s);
  ctx.lineTo(2 * s, -103 * s);
  ctx.lineTo(6 * s, -109 * s);
  ctx.lineTo(9 * s, -102 * s);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.stroke();

  if (panda.isGameOver || lookingBackAtMonkey) {
    // Brief funny backward glance at Banor Mia OR dizzy Game Over reaction!
    ctx.fillStyle = '#18181b';
    ctx.save();
    ctx.translate(-11 * s, -77 * s);
    ctx.rotate(-0.24);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9 * s, 11 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(12 * s, -77 * s);
    ctx.rotate(0.24);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9 * s, 11 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (panda.isGameOver) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, 2.5 * s);
      [-11 * s, 12 * s].forEach((ex) => {
        ctx.beginPath();
        ctx.moveTo(ex - 4 * s, -81 * s);
        ctx.lineTo(ex + 4 * s, -73 * s);
        ctx.moveTo(ex + 4 * s, -81 * s);
        ctx.lineTo(ex - 4 * s, -73 * s);
        ctx.stroke();
      });
      ctx.strokeStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(0, -56 * s, 5 * s, Math.PI, 0);
      ctx.stroke();
    } else {
      // Surprised wide eyes glancing back at Banor Mia!
      [-11 * s, 12 * s].forEach((ex) => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex, -77 * s, 5.2 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(ex, -76 * s, 2.8 * s, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(0.5 * s, -67 * s, 4.5 * s, 3 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(0.5 * s, -59 * s, 4.5 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // NORMAL RUNNING: Panda faces FORWARD down the track!
    // Subtle 3/4 cheek/eye peek on the turning side so it looks lively and naturally forward-focused.
    const turnDir = Math.abs(panda.laneTilt) > 0.12 ? Math.sign(panda.laneTilt) : 1;
    const peekX = turnDir * 24 * s;
    // Soft cheek/eye-patch edge peeking on side while looking ahead
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(peekX, -77 * s, 4.5 * s, 7.5 * s, turnDir * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(peekX + turnDir * 1.5 * s, -78 * s, 2.1 * s, 0, Math.PI * 2);
    ctx.fill();

    // If Bamboo Feast is active, show a happy green bamboo stick held beside the cheek!
    if (panda.isFeasting) {
      const chomp = Math.sin(timeSec * 18) * 3 * s;
      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = '#14532d';
      ctx.fillRect(18 * s, -68 * s + chomp, 18 * s, 6 * s);
      ctx.strokeRect(18 * s, -68 * s + chomp, 18 * s, 6 * s);
    }
  }

  ctx.restore();
}

function drawMonkey(
  ctx: CanvasRenderingContext2D,
  monkey: RenderMonkeyState,
  w: number,
  h: number
): void {
  // Banor Mia sprints right behind the panda! As proximity increases (0 -> 1), z goes from -0.17 up to -0.02
  const z = -0.17 + monkey.proximity * 0.14;
  const p = projectPoint(monkey.laneX, z, 0, w, h);
  const s = p.scale * 0.92;
  const bounce = Math.abs(Math.sin(monkey.runCycle)) * 6 * s;

  ctx.save();
  ctx.translate(p.x, p.y - bounce);
  ctx.lineWidth = Math.max(1.8, 2.4 * s);
  ctx.strokeStyle = '#451a03';

  // Curly tail
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = Math.max(3, 5 * s);
  ctx.beginPath();
  ctx.moveTo(-14 * s, -22 * s);
  ctx.quadraticCurveTo(-42 * s, -48 * s, -26 * s, -68 * s);
  ctx.stroke();

  // Body
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = Math.max(1.8, 2.4 * s);
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.ellipse(0, -32 * s, 18 * s, 21 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tan belly
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.ellipse(0, -30 * s, 11 * s, 14 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Waving cheeky arms (grabbing at bamboo when stealAnimTimer > 0!)
  const armWave = Math.sin(monkey.runCycle * 1.3) * 0.65;
  const lunge = monkey.stealAnimTimer > 0 ? -0.9 : 0;
  ctx.fillStyle = '#92400e';
  ctx.save();
  ctx.translate(-18 * s, -42 * s);
  ctx.rotate(-0.6 + armWave + lunge);
  ctx.fillRect(-5 * s, -16 * s, 10 * s, 20 * s);
  ctx.strokeRect(-5 * s, -16 * s, 10 * s, 20 * s);
  ctx.restore();

  ctx.save();
  ctx.translate(18 * s, -42 * s);
  ctx.rotate(0.6 - armWave - lunge);
  ctx.fillRect(-5 * s, -16 * s, 10 * s, 20 * s);
  ctx.strokeRect(-5 * s, -16 * s, 10 * s, 20 * s);
  ctx.restore();

  // Big round monkey ears
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.arc(-22 * s, -66 * s, 9 * s, 0, Math.PI * 2);
  ctx.arc(22 * s, -66 * s, 9 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(-22 * s, -66 * s, 5 * s, 0, Math.PI * 2);
  ctx.arc(22 * s, -66 * s, 5 * s, 0, Math.PI * 2);
  ctx.fill();

  // Monkey head
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.arc(0, -66 * s, 20 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tan face mask
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.ellipse(-7 * s, -68 * s, 7 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(7 * s, -68 * s, 7 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(0, -58 * s, 14 * s, 9 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cheeky eyes & grin
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(-6 * s, -68 * s, 3 * s, 0, Math.PI * 2);
  ctx.arc(6 * s, -68 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#451a03';
  ctx.beginPath();
  ctx.arc(0, -58 * s, 7 * s, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // Red mischievous headband
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-19 * s, -81 * s, 38 * s, 6 * s);

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: RenderParticle[]): void {
  for (const pt of particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(pt.x, pt.y);
    ctx.rotate(pt.rot);
    ctx.fillStyle = pt.color;
    if (pt.shape === 'leaf') {
      ctx.beginPath();
      ctx.ellipse(0, 0, pt.size, pt.size * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (pt.shape === 'star') {
      ctx.fillRect(-pt.size * 0.5, -pt.size * 0.5, pt.size, pt.size);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
