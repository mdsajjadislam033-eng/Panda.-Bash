import { getLinesFor, VOICE_LINES } from '../data/voiceLines';
import { BiomeId, GameSettings, Language } from '../types/game';

const VOICE_CACHE_NAME = 'panda-bash-voices-v2';

const BUNDLED_BN_IDS = new Set([
  'panda_bamboo_1',
  'panda_bamboo_2',
  'panda_bamboo_3',
  'panda_dodge_1',
  'panda_dodge_2',
  'panda_dash_1',
  'panda_booster_1',
  'panda_chase_1',
  'panda_gameover_1',
  'panda_highscore_1',
  'monkey_appear_1',
  'monkey_appear_2',
  'monkey_appear_3',
]);

const STATIC_FALLBACK_ID: Record<string, string> = {
  panda_chase_2: 'panda_chase_1',
  panda_gameover_2: 'panda_gameover_1',
  monkey_taunt_1: 'monkey_appear_2',
  monkey_taunt_2: 'monkey_appear_3',
};

class AudioManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;

  private settings: GameSettings = {
    language: 'bn',
    musicEnabled: true,
    sfxEnabled: true,
    voiceEnabled: true,
    musicVolume: 0.55,
    sfxVolume: 0.75,
    voiceVolume: 0.85,
  };

  private musicTimer: number | null = null;
  private musicStep = 0;
  private isMusicRunning = false;
  private isDucked = false;
  private currentBiome: BiomeId = 'bamboo_forest';

  // Expressive Gemini TTS cartoon voice buffer cache & playback state
  private voiceBufferCache = new Map<string, AudioBuffer>();
  private voiceLoadPromises = new Map<string, Promise<AudioBuffer | null>>();
  private activeVoiceSource: AudioBufferSourceNode | null = null;
  private isVoicePlaying = false;
  private lastVoiceTime = 0;
  private lastPlayedLineId: string | null = null;
  private voiceSessionToken = 0;
  private prefetchedLangs = new Set<Language>();
  private backendAvailable: boolean | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.voiceGain = this.ctx.createGain();

      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
      this.voiceGain.connect(this.ctx.destination);
      this.syncGains();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private syncGains(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(now);
      const duckMult = this.isDucked ? 0.5 : 1;
      this.musicGain.gain.setTargetAtTime(
        this.settings.musicEnabled ? this.settings.musicVolume * duckMult : 0,
        now,
        0.05
      );
    }
    if (this.sfxGain) {
      this.sfxGain.gain.cancelScheduledValues(now);
      this.sfxGain.gain.setTargetAtTime(
        this.settings.sfxEnabled ? this.settings.sfxVolume : 0,
        now,
        0.02
      );
    }
    if (this.voiceGain) {
      this.voiceGain.gain.cancelScheduledValues(now);
      this.voiceGain.gain.setTargetAtTime(
        this.settings.voiceEnabled ? this.settings.voiceVolume : 0,
        now,
        0.02
      );
    }
  }

  private setMusicDuck(ducked: boolean): void {
    if (this.isDucked === ducked) return;
    this.isDucked = ducked;
    this.syncGains();
  }

  public unlock(): void {
    this.ensureContext();
  }

  public updateSettings(next: GameSettings): void {
    const prevLang = this.settings.language;
    this.settings = { ...next };
    this.syncGains();
    if (!next.musicEnabled && this.isMusicRunning) {
      this.stopMusic(false);
    }
    if (!next.voiceEnabled) {
      this.stopActiveVoice();
    }
    if (next.language !== prevLang && next.voiceEnabled) {
      void this.prefetchVoices(next.language);
    }
  }

  public setBiomeAmbience(biome: BiomeId): void {
    this.currentBiome = biome;
  }

  public startMusic(): void {
    if (!this.settings.musicEnabled || this.isMusicRunning) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;
    this.isMusicRunning = true;
    this.syncGains();

    // Energetic 16-step cartoon jungle adventure theme (pentatonic C-major / D-dorian bounce)
    const melody = [
      523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33,
      523.25, 659.25, 783.99, 1046.5, 880.0, 783.99, 659.25, 587.33,
    ];
    const bass = [
      130.81, 0, 196.0, 0, 174.61, 0, 196.0, 146.83,
      130.81, 0, 196.0, 0, 164.81, 0, 146.83, 196.0,
    ];

    this.musicTimer = window.setInterval(() => {
      if (!this.settings.musicEnabled || !this.isMusicRunning) return;
      const c = this.ensureContext();
      if (!c || c.state !== 'running' || !this.musicGain) return;

      const idx = this.musicStep % melody.length;
      const now = c.currentTime;

      const leadFreq = melody[idx];
      if (leadFreq > 0) {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(leadFreq, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.14, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.19);
      }

      const bassFreq = bass[idx];
      if (bassFreq > 0) {
        const bOsc = c.createOscillator();
        const bGain = c.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(bassFreq, now);
        bGain.gain.setValueAtTime(0.001, now);
        bGain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
        bOsc.connect(bGain);
        bGain.connect(this.musicGain);
        bOsc.start(now);
        bOsc.stop(now + 0.23);
      }

      if (idx % 2 === 1) {
        const pOsc = c.createOscillator();
        const pGain = c.createGain();
        pOsc.type = 'sine';
        pOsc.frequency.setValueAtTime(idx % 4 === 3 ? 1120 : 880, now);
        pOsc.frequency.exponentialRampToValueAtTime(420, now + 0.035);
        pGain.gain.setValueAtTime(0.045, now);
        pGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        pOsc.connect(pGain);
        pGain.connect(this.musicGain);
        pOsc.start(now);
        pOsc.stop(now + 0.045);
      }

      if ((this.currentBiome === 'rainy_jungle' || this.currentBiome === 'forest_river') && idx % 3 === 0) {
        const aOsc = c.createOscillator();
        const aGain = c.createGain();
        aOsc.type = 'sine';
        aOsc.frequency.setValueAtTime(
          this.currentBiome === 'rainy_jungle' ? 1400 + Math.random() * 600 : 620 + Math.random() * 200,
          now
        );
        aGain.gain.setValueAtTime(0.018, now);
        aGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        aOsc.connect(aGain);
        aGain.connect(this.musicGain);
        aOsc.start(now);
        aOsc.stop(now + 0.08);
      }

      this.musicStep++;
    }, 185);
  }

  public stopMusic(fadeOut = false): void {
    this.isMusicRunning = false;
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (fadeOut && this.ctx && this.musicGain) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0.001, now + 0.35);
    }
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainScale = 0.24
  ): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
    }

    gain.gain.setValueAtTime(gainScale, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playSwipe(): void {
    this.playTone(340, 520, 0.075, 'sine', 0.16);
  }

  public playJump(): void {
    this.playTone(270, 680, 0.16, 'triangle', 0.25);
  }

  public playSlide(): void {
    this.playTone(420, 145, 0.14, 'sawtooth', 0.13);
  }

  public playBamboo(combo = 1): void {
    const pitchBoost = Math.min(combo, 12) * 30;
    this.playTone(600 + pitchBoost, 920 + pitchBoost, 0.11, 'sine', 0.26);
  }

  public playBooster(): void {
    if (!this.settings.sfxEnabled) return;
    this.playTone(523, 659, 0.1, 'triangle', 0.25);
    setTimeout(() => this.playTone(659, 784, 0.1, 'triangle', 0.25), 70);
    setTimeout(() => this.playTone(784, 1046, 0.16, 'triangle', 0.28), 140);
  }

  public playVineGrab(): void {
    this.playTone(320, 780, 0.14, 'triangle', 0.26);
  }

  public playVineRelease(): void {
    this.playTone(700, 380, 0.13, 'sine', 0.23);
    setTimeout(() => this.playTone(540, 820, 0.12, 'triangle', 0.22), 85);
  }

  public playMilestone(): void {
    if (!this.settings.sfxEnabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, freq, 0.14, 'triangle', 0.23), i * 75);
    });
  }

  public playMonkeyAlert(): void {
    if (!this.settings.sfxEnabled) return;
    [660, 820, 620, 880].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, freq * 1.18, 0.08, 'square', 0.12), i * 80);
    });
  }

  public playGameOver(): void {
    if (!this.settings.sfxEnabled) return;
    this.playTone(420, 130, 0.28, 'sawtooth', 0.25);
    setTimeout(() => this.playTone(230, 90, 0.34, 'triangle', 0.26), 150);
  }

  // --- Expressive Gemini TTS Cartoon Voice System ---

  private getVoiceCacheKey(lang: Language, lineId: string): string {
    return `${lang}:${lineId}`;
  }

  private async checkBackendAvailable(): Promise<boolean> {
    if (this.backendAvailable !== null) return this.backendAvailable;
    try {
      const res = await fetch('/api/health', { method: 'GET' });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = (await res.json()) as { ok?: boolean };
        this.backendAvailable = Boolean(data?.ok);
        return this.backendAvailable;
      }
    } catch {
      // Static hosting without Node backend
    }
    this.backendAvailable = false;
    return false;
  }

  private async loadVoiceBuffer(lang: Language, lineId: string): Promise<AudioBuffer | null> {
    const key = this.getVoiceCacheKey(lang, lineId);
    const cached = this.voiceBufferCache.get(key);
    if (cached) return cached;

    const existing = this.voiceLoadPromises.get(key);
    if (existing) return existing;

    const promise = (async (): Promise<AudioBuffer | null> => {
      const ctx = this.ensureContext();
      if (!ctx) return null;

      // Resolve static pre-baked MP3 asset first so static free hosts work with 0 server/API calls
      const mappedStaticId = BUNDLED_BN_IDS.has(lineId)
        ? lineId
        : STATIC_FALLBACK_ID[lineId] || null;
      const staticUrl =
        lang === 'bn' && BUNDLED_BN_IDS.has(lineId)
          ? `/assets/audio/voices/bn/${lineId}.mp3`
          : mappedStaticId
          ? `/assets/audio/voices/bn/${mappedStaticId}.mp3`
          : null;
      const apiUrl = `/api/voice/${lang}/${lineId}`;

      try {
        let arrayBuf: ArrayBuffer | null = null;

        // If exact bundled static MP3 exists for Bengali, prefer it immediately
        if (lang === 'bn' && BUNDLED_BN_IDS.has(lineId) && staticUrl) {
          if (typeof window !== 'undefined' && 'caches' in window) {
            try {
              const cache = await window.caches.open(VOICE_CACHE_NAME);
              const cachedResp = await cache.match(staticUrl);
              if (cachedResp && cachedResp.ok) {
                arrayBuf = await cachedResp.arrayBuffer();
              }
            } catch {
              // Cache storage optional
            }
          }
          if (!arrayBuf) {
            const resp = await fetch(staticUrl);
            if (resp.ok && (resp.headers.get('content-type') || '').includes('audio/')) {
              if (typeof window !== 'undefined' && 'caches' in window) {
                try {
                  const cache = await window.caches.open(VOICE_CACHE_NAME);
                  await cache.put(staticUrl, resp.clone());
                } catch {
                  // Ignore quota errors
                }
              }
              arrayBuf = await resp.arrayBuffer();
            }
          }
        } else {
          // Try backend API ONLY if backend server is actually running; otherwise use static MP3 fallback cleanly
          const hasBackend = await this.checkBackendAvailable();
          if (hasBackend) {
            const resp = await fetch(apiUrl);
            if (resp.ok && (resp.headers.get('content-type') || '').includes('audio/')) {
              arrayBuf = await resp.arrayBuffer();
            }
          }
          if (!arrayBuf && staticUrl) {
            const resp = await fetch(staticUrl);
            if (resp.ok && (resp.headers.get('content-type') || '').includes('audio/')) {
              arrayBuf = await resp.arrayBuffer();
            }
          }
        }

        if (!arrayBuf) return null;

        const audioBuffer = await ctx.decodeAudioData(arrayBuf.slice(0));
        this.voiceBufferCache.set(key, audioBuffer);
        return audioBuffer;
      } catch {
        return null;
      } finally {
        this.voiceLoadPromises.delete(key);
      }
    })();

    this.voiceLoadPromises.set(key, promise);
    return promise;
  }

  public async prefetchVoices(lang: Language): Promise<void> {
    if (typeof window === 'undefined' || !this.settings.voiceEnabled) return;
    if (this.prefetchedLangs.has(lang)) return;
    this.prefetchedLangs.add(lang);

    // Preload high-frequency & priority lines first in gentle batches of 2 (never auto-playing)
    const priorityOrder = [
      'panda_bamboo_1',
      'panda_bamboo_2',
      'monkey_appear_1',
      'monkey_appear_2',
      'panda_dodge_1',
      'panda_gameover_1',
      'panda_highscore_1',
    ];
    const orderedIds = [
      ...priorityOrder,
      ...VOICE_LINES.map((l) => l.id).filter((id) => !priorityOrder.includes(id)),
    ];

    for (let i = 0; i < orderedIds.length; i += 2) {
      if (!this.settings.voiceEnabled) break;
      const batch = orderedIds.slice(i, i + 2);
      await Promise.all(batch.map((id) => this.loadVoiceBuffer(lang, id)));
    }
  }

  public stopActiveVoice(): void {
    this.voiceSessionToken++;
    if (this.activeVoiceSource) {
      try {
        this.activeVoiceSource.onended = null;
        this.activeVoiceSource.stop();
      } catch {
        // Ignore already-stopped source
      }
      this.activeVoiceSource = null;
    }
    this.isVoicePlaying = false;
    this.setMusicDuck(false);
  }

  public isVoiceCurrentlyPlaying(): boolean {
    return this.isVoicePlaying;
  }

  public canSpeak(priority = false): boolean {
    if (!this.settings.voiceEnabled) return true; // Allows silent text bubble when voice muted
    if (priority) return true;
    return !this.isVoicePlaying && Date.now() - this.lastVoiceTime >= 4200;
  }

  public pickNonRepeatingLine<T extends { id: string }>(lines: readonly T[]): T {
    if (lines.length <= 1) return lines[0];
    const candidates = lines.filter((l) => l.id !== this.lastPlayedLineId);
    const pool = candidates.length > 0 ? candidates : lines;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private playVoiceBuffer(buffer: AudioBuffer, token: number): void {
    if (token !== this.voiceSessionToken || !this.settings.voiceEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.voiceGain) return;

    if (this.activeVoiceSource) {
      try {
        this.activeVoiceSource.onended = null;
        this.activeVoiceSource.stop();
      } catch {
        // Ignore already-stopped source
      }
      this.activeVoiceSource = null;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.voiceGain);

    this.activeVoiceSource = source;
    this.isVoicePlaying = true;
    this.setMusicDuck(true);

    source.onended = () => {
      if (this.activeVoiceSource === source) {
        this.activeVoiceSource = null;
        this.isVoicePlaying = false;
        this.setMusicDuck(false);
      }
    };

    source.start();
  }

  public speakLine(lineId: string, priority = false): boolean {
    if (!this.settings.voiceEnabled) return false;
    const now = Date.now();
    if (!priority && (this.isVoicePlaying || now - this.lastVoiceTime < 4200)) {
      return false;
    }
    if (!priority && this.lastPlayedLineId === lineId) {
      return false;
    }

    this.lastVoiceTime = now;
    this.lastPlayedLineId = lineId;
    const token = ++this.voiceSessionToken;

    if (priority && this.activeVoiceSource) {
      try {
        this.activeVoiceSource.onended = null;
        this.activeVoiceSource.stop();
      } catch {
        // Ignore
      }
      this.activeVoiceSource = null;
      this.isVoicePlaying = false;
    }

    const lang = this.settings.language;
    const key = this.getVoiceCacheKey(lang, lineId);
    const cached = this.voiceBufferCache.get(key);
    if (cached) {
      this.playVoiceBuffer(cached, token);
      return true;
    }

    const triggeredAt = now;
    void this.loadVoiceBuffer(lang, lineId).then((buf) => {
      if (!buf) return;
      // Do not play stale non-priority clips if they took too long to fetch
      if (!priority && Date.now() - triggeredAt > 1800) return;
      this.playVoiceBuffer(buf, token);
    });

    return true;
  }

  public previewVoice(speaker: 'panda' | 'monkey'): void {
    this.unlock();
    const lines =
      speaker === 'panda'
        ? [...getLinesFor('panda', 'bamboo'), ...getLinesFor('panda', 'dash')]
        : [...getLinesFor('monkey', 'appear'), ...getLinesFor('monkey', 'taunt')];
    const line = this.pickNonRepeatingLine(lines);
    if (line) {
      this.speakLine(line.id, true);
    }
  }
}

export const audioManager = new AudioManager();
