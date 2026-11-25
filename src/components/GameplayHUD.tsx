import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Volume2, VolumeX } from 'lucide-react';
import { BIOMES, BOOSTERS, TUTORIAL_STEPS } from '../data/gameData';
import { HudSnapshot, Language } from '../types/game';

interface GameplayHUDProps {
  hud: HudSnapshot;
  lang: Language;
  isTutorial: boolean;
  isMuted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onSkipTutorial: () => void;
}

export const GameplayHUD: React.FC<GameplayHUDProps> = ({
  hud,
  lang,
  isTutorial,
  isMuted,
  onPause,
  onToggleMute,
  onSkipTutorial,
}) => {
  const biome = BIOMES.find((b) => b.id === hud.biome) || BIOMES[0];
  const tutStep = TUTORIAL_STEPS[hud.tutorialStepIndex];

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-4">
      {/* Top Perimeter Cluster */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          {/* Distance & Run Score */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-950/80 px-3.5 py-2 text-white shadow-lg border border-white/15 tabular-nums">
              <div>
                <div className="text-[10px] font-semibold text-emerald-300 leading-none">
                  {lang === 'bn' ? 'দূরত্ব' : 'DISTANCE'}
                </div>
                <div className="font-display text-lg sm:text-xl font-bold leading-tight">
                  {hud.distance}m
                </div>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <div className="text-[10px] font-semibold text-amber-300 leading-none">
                  {lang === 'bn' ? 'রান স্কোর' : 'SCORE'}
                </div>
                <div className="font-display text-lg sm:text-xl font-bold leading-tight">
                  {hud.runScore}
                </div>
              </div>
            </div>

            {/* Secondary Bamboo + Booster Score + Biome line */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-950/70 px-3 py-1 text-xs font-bold text-white shadow tabular-nums w-fit">
              <span className="text-green-400">🎋 {hud.bambooCount}</span>
              <span aria-hidden="true" className="text-white/30">·</span>
              <span className="text-orange-300">⚡ {hud.boosterScore}</span>
              {hud.combo > 1 && (
                <>
                  <span aria-hidden="true" className="text-white/30">·</span>
                  <span className="text-yellow-300">{hud.combo}×</span>
                </>
              )}
              <span aria-hidden="true" className="text-white/30">·</span>
              <span className="text-sky-200 font-medium">
                {lang === 'bn' ? biome.nameBn : biome.nameEn}
              </span>
            </div>
          </div>

          {/* Right Action Buttons (clickable) */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              aria-label="Toggle Sound"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950/80 text-white shadow-lg border border-white/15 hover:bg-slate-900 active:scale-95 transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPause();
              }}
              aria-label="Pause Game"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-slate-950 shadow-lg border border-amber-200 hover:bg-amber-300 active:scale-95 transition cursor-pointer"
            >
              <Pause className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        {/* Active Booster Timers */}
        {hud.activeBoosters.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hud.activeBoosters.map((ab) => {
              const def = BOOSTERS.find((b) => b.id === ab.id);
              if (!def) return null;
              const pct = Math.max(5, Math.min(100, (ab.remaining / ab.duration) * 100));
              return (
                <div
                  key={ab.id}
                  className="flex items-center gap-2 rounded-xl bg-slate-950/85 px-2.5 py-1 text-xs font-bold text-white shadow border border-white/15 tabular-nums"
                >
                  <span>{def.iconLabel}</span>
                  <span>{lang === 'bn' ? def.nameBn : def.nameEn}</span>
                  <div className="w-12 h-2 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-100"
                      style={{ width: `${pct}%`, backgroundColor: def.color }}
                    />
                  </div>
                  <span>{Math.ceil(ab.remaining)}s</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Monkey Chase Alert & Proximity */}
        {hud.monkeyActive && (
          <div className="mx-auto flex items-center gap-2.5 rounded-xl bg-rose-600/95 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white shadow-lg border border-rose-300">
            <span>🐒</span>
            <span>
              {hud.monkeyWarning ||
                (lang === 'bn'
                  ? 'বানর মিয়া তাড়া করছে! বাঁশ তুলে পালাও!'
                  : 'Banor Mia is chasing! Grab bamboo to escape!')}
            </span>
            <div className="w-16 h-2.5 rounded-full bg-black/35 overflow-hidden">
              <div
                className="h-full bg-amber-300"
                style={{ width: `${Math.round(hud.monkeyProximity * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Center Callouts (Vine Swing, Milestone, Speech Bubble, Tutorial Card) */}
      <div className="flex flex-col items-center justify-center gap-2.5 my-auto">
        {hud.milestoneText && (
          <div className="rounded-2xl bg-amber-400 px-5 py-2 text-sm sm:text-base font-display font-bold text-slate-950 shadow-xl border-2 border-white animate-bounce">
            🎉 {hud.milestoneText}
          </div>
        )}

        {hud.vinePrompt === 'swing' && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-base sm:text-lg font-display font-bold text-white shadow-2xl border-2 border-yellow-300 animate-pulse">
            <ArrowUp className="w-6 h-6" />
            <span>
              {lang === 'bn' ? 'SWING! উপরে সোয়াইপ করো!' : 'SWING! Swipe UP!'}
            </span>
          </div>
        )}

        {hud.vinePrompt === 'release' && (
          <div className="flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-base sm:text-lg font-display font-bold text-white shadow-2xl border-2 border-yellow-200 animate-pulse">
            <ArrowDown className="w-6 h-6" />
            <span>
              {lang === 'bn' ? 'RELEASE! নিচে সোয়াইপ করো!' : 'RELEASE! Swipe DOWN!'}
            </span>
          </div>
        )}

        {hud.speechBubble && (
          <div
            className={`rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold shadow-lg border-2 ${
              hud.speechBubble.speaker === 'monkey'
                ? 'bg-amber-100 text-amber-950 border-amber-500'
                : 'bg-white text-emerald-950 border-emerald-500'
            }`}
          >
            {hud.speechBubble.speaker === 'monkey' ? '🐒 ' : '🐼 '}
            “{hud.speechBubble.text}”
          </div>
        )}
      </div>

      {/* Tutorial Guided Instruction Card at Bottom */}
      {isTutorial && tutStep && (
        <div className="pointer-events-auto mx-auto w-full max-w-md rounded-2xl bg-white/95 p-3.5 shadow-2xl border-2 border-emerald-500 text-slate-900">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-700 tabular-nums">
              {lang === 'bn'
                ? `টিউটোরিয়াল ধাপ ${hud.tutorialStepIndex + 1} / ${TUTORIAL_STEPS.length}`
                : `Tutorial Step ${hud.tutorialStepIndex + 1} / ${TUTORIAL_STEPS.length}`}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSkipTutorial();
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              {lang === 'bn' ? 'এড়িয়ে যাও (Skip)' : 'Skip'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 animate-bounce">
              {tutStep.action === 'left' && <ArrowLeft className="w-6 h-6" />}
              {tutStep.action === 'right' && <ArrowRight className="w-6 h-6" />}
              {(tutStep.action === 'jump' || tutStep.action === 'vine_grab') && (
                <ArrowUp className="w-6 h-6" />
              )}
              {(tutStep.action === 'slide' || tutStep.action === 'vine_release') && (
                <ArrowDown className="w-6 h-6" />
              )}
              {(tutStep.action === 'auto' ||
                tutStep.action === 'bamboo' ||
                tutStep.action === 'booster' ||
                tutStep.action === 'monkey') && <span className="text-xl">🐼</span>}
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold text-emerald-950">
                {lang === 'bn' ? tutStep.titleBn : tutStep.titleEn}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-700 leading-snug">
                {lang === 'bn' ? tutStep.instructionBn : tutStep.instructionEn}
              </p>
            </div>
          </div>
          {hud.tutorialHint && (
            <div className="mt-2 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
              💡 {hud.tutorialHint}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
