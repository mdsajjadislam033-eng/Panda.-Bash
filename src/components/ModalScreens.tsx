import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Home,
  Play,
  RotateCcw,
  Trash2,
  Trophy,
  Volume2,
  Zap,
} from 'lucide-react';
import { BOOSTERS, CHALLENGES, SKINS, TRAILS } from '../data/gameData';
import {
  BoosterId,
  ChallengeCategory,
  GameSettings,
  Language,
  PlayerProgress,
  RunSummary,
  ScreenState,
  SkinId,
  TrailId,
} from '../types/game';
import { audioManager } from '../utils/audio';
import { getBoosterDuration, getBoosterUpgradeCost } from '../utils/storage';

interface ModalWrapperProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({
  title,
  onClose,
  children,
  headerRight,
}) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-3 sm:p-5">
    <div className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white shadow-2xl border-2 border-emerald-200 overflow-hidden text-slate-900">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-emerald-50 border-b border-emerald-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-900 shadow-sm border border-emerald-200 hover:bg-emerald-100 active:scale-95 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-display text-lg sm:text-xl font-bold text-emerald-950">{title}</h2>
        </div>
        {headerRight}
      </div>
      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6">{children}</div>
    </div>
  </div>
);

export const PauseModal: React.FC<{
  lang: Language;
  settings: GameSettings;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onUpdateSettings: (next: GameSettings) => void;
}> = ({ lang, settings, onResume, onRestart, onHome, onUpdateSettings }) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4">
    <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-emerald-200 text-slate-900">
      <h2 className="font-display text-2xl font-bold text-center text-emerald-950 mb-4">
        {lang === 'bn' ? 'খেলা বিরতি (Paused)' : 'Game Paused'}
      </h2>

      <div className="flex items-center justify-around gap-2 rounded-2xl bg-slate-50 p-3 mb-5 border border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => onUpdateSettings({ ...settings, musicEnabled: !settings.musicEnabled })}
          className={`px-3 py-2 rounded-xl cursor-pointer ${
            settings.musicEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
          }`}
        >
          🎵 {lang === 'bn' ? 'মিউজিক' : 'Music'}
        </button>
        <button
          type="button"
          onClick={() => onUpdateSettings({ ...settings, sfxEnabled: !settings.sfxEnabled })}
          className={`px-3 py-2 rounded-xl cursor-pointer ${
            settings.sfxEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
          }`}
        >
          🔊 SFX
        </button>
        <button
          type="button"
          onClick={() => onUpdateSettings({ ...settings, voiceEnabled: !settings.voiceEnabled })}
          className={`px-3 py-2 rounded-xl cursor-pointer ${
            settings.voiceEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
          }`}
        >
          🗣️ {lang === 'bn' ? 'ভয়েস' : 'Voice'}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onResume}
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-base font-bold text-white shadow hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{lang === 'bn' ? 'আবার শুরু করো (Resume)' : 'Resume'}</span>
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3 text-base font-bold text-slate-950 shadow hover:bg-amber-300 active:scale-95 transition cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{lang === 'bn' ? 'নতুন দৌড় (Restart)' : 'Restart'}</span>
        </button>
        <button
          type="button"
          onClick={onHome}
          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-base font-bold text-slate-800 hover:bg-slate-200 active:scale-95 transition cursor-pointer"
        >
          <Home className="w-5 h-5" />
          <span>{lang === 'bn' ? 'হোম স্ক্রিন (Home)' : 'Home'}</span>
        </button>
      </div>
    </div>
  </div>
);

export const GameOverModal: React.FC<{
  lang: Language;
  summary: RunSummary;
  bestDistance: number;
  onRestart: () => void;
  onHome: () => void;
  onPandaBoard: () => void;
}> = ({ lang, summary, bestDistance, onRestart, onHome, onPandaBoard }) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4">
    <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border-2 border-amber-300 text-slate-900">
      <div className="text-center mb-3">
        {(summary.isNewBestDistance || summary.isNewBestScore) && (
          <div className="inline-block rounded-xl bg-amber-400 px-3 py-1 text-xs font-extrabold text-slate-950 mb-2 animate-bounce">
            🏆 {lang === 'bn' ? 'নতুন সেরা রেকর্ড! (NEW BEST!)' : 'NEW BEST RECORD!'}
          </div>
        )}
        <h2 className="font-display text-3xl font-bold text-rose-600">
          {lang === 'bn' ? 'খেলা শেষ!' : 'GAME OVER'}
        </h2>
        <div className="mt-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm font-bold text-emerald-950">
          🐼 “{lang === 'bn' ? summary.reactionLineBn : summary.reactionLineEn}”
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-5 tabular-nums">
        <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200">
          <div className="text-xs font-semibold text-slate-500">
            {lang === 'bn' ? 'রান স্কোর' : 'Run Score'}
          </div>
          <div className="font-display text-2xl font-bold text-slate-900">{summary.runScore}</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200">
          <div className="text-xs font-semibold text-slate-500">
            {lang === 'bn' ? 'দূরত্ব' : 'Distance'}
          </div>
          <div className="font-display text-2xl font-bold text-emerald-700">
            {summary.distance}m
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            {lang === 'bn' ? `সেরা: ${bestDistance}m` : `Best: ${bestDistance}m`}
          </div>
        </div>
        <div className="rounded-2xl bg-green-50 p-3 border border-green-200">
          <div className="text-xs font-semibold text-green-700">
            {lang === 'bn' ? 'বাঁশ সংগ্রহ' : 'Bamboo Collected'}
          </div>
          <div className="font-display text-xl font-bold text-green-900">
            🎋 {summary.bambooCollected}
          </div>
        </div>
        <div className="rounded-2xl bg-orange-50 p-3 border border-orange-200">
          <div className="text-xs font-semibold text-orange-700">
            {lang === 'bn' ? 'বুস্টার স্কোর' : 'Booster Score'}
          </div>
          <div className="font-display text-xl font-bold text-orange-900">
            ⚡ +{summary.boosterScoreEarned}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onRestart}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-green-500 to-emerald-700 border-b-4 border-emerald-900 py-3.5 text-lg font-display font-bold text-white shadow-lg hover:brightness-105 active:translate-y-0.5 transition cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{lang === 'bn' ? 'আবার খেলুন (Restart)' : 'Restart'}</span>
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onHome}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-800 hover:bg-slate-200 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{lang === 'bn' ? 'হোম' : 'Home'}</span>
          </button>
          <button
            type="button"
            onClick={onPandaBoard}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-100 py-3 text-sm font-bold text-amber-950 hover:bg-amber-200 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            <span>{lang === 'bn' ? 'পান্ডা বোর্ড' : 'Panda Board'}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

export const PandaBoardModal: React.FC<{
  progress: PlayerProgress;
  onClose: () => void;
}> = ({ progress, onClose }) => {
  const lang = progress.settings.language;
  const stats = [
    {
      labelBn: 'সেরা দূরত্ব (Best Distance)',
      labelEn: 'Best Distance',
      value: `${progress.bestDistance}m`,
      accent: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    },
    {
      labelBn: 'সেরা রান স্কোর (Best Run Score)',
      labelEn: 'Best Run Score',
      value: progress.bestRunScore.toLocaleString(),
      accent: 'bg-amber-50 border-amber-200 text-amber-900',
    },
    {
      labelBn: 'মোট সংগৃহীত বাঁশ',
      labelEn: 'Total Bamboo Collected',
      value: `🎋 ${progress.totalBambooCollected}`,
      accent: 'bg-green-50 border-green-200 text-green-900',
    },
    {
      labelBn: 'মোট বুস্টার স্কোর',
      labelEn: 'Total Booster Score',
      value: `⚡ ${progress.totalBoosterScore}`,
      accent: 'bg-orange-50 border-orange-200 text-orange-900',
    },
    {
      labelBn: 'মোট বুস্টার ব্যবহার',
      labelEn: 'Boosters Used',
      value: progress.totalBoostersUsed,
      accent: 'bg-sky-50 border-sky-200 text-sky-900',
    },
    {
      labelBn: 'সেরা বাঁশ কম্বো',
      labelEn: 'Best Bamboo Combo',
      value: `${progress.bestBambooCombo}×`,
      accent: 'bg-purple-50 border-purple-200 text-purple-900',
    },
    {
      labelBn: 'সম্পন্ন চ্যালেঞ্জ',
      labelEn: 'Challenges Completed',
      value: `${progress.claimedChallenges.length} / ${CHALLENGES.length}`,
      accent: 'bg-rose-50 border-rose-200 text-rose-900',
    },
    {
      labelBn: 'মোট দৌড় / বানর পালানো',
      labelEn: 'Total Runs / Monkey Escapes',
      value: `${progress.totalRuns} / ${progress.monkeyEscapes}`,
      accent: 'bg-slate-50 border-slate-200 text-slate-900',
    },
  ];

  return (
    <ModalWrapper title={lang === 'bn' ? 'পান্ডা বোর্ড (Panda Board)' : 'Panda Board'} onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 tabular-nums">
        {stats.map((st, idx) => (
          <div key={idx} className={`rounded-2xl border p-4 ${st.accent}`}>
            <div className="text-xs font-bold opacity-75">{lang === 'bn' ? st.labelBn : st.labelEn}</div>
            <div className="font-display text-2xl font-bold mt-1">{st.value}</div>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );
};

export const BoosterScoreModal: React.FC<{
  progress: PlayerProgress;
  onClose: () => void;
  onNavigate: (s: ScreenState) => void;
}> = ({ progress, onClose, onNavigate }) => {
  const lang = progress.settings.language;
  return (
    <ModalWrapper
      title={lang === 'bn' ? 'বুস্টার স্কোর (Booster Score)' : 'Booster Score'}
      onClose={onClose}
    >
      <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white shadow-lg mb-4 tabular-nums">
        <div className="text-xs font-bold opacity-90">
          {lang === 'bn' ? 'খরচযোগ্য বুস্টার স্কোর' : 'Available Booster Score'}
        </div>
        <div className="font-display text-4xl font-bold mt-1">
          ⚡ {progress.spendableBoosterScore}
        </div>
        <div className="text-xs font-medium opacity-90 mt-1">
          {lang === 'bn'
            ? `মোট অর্জিত বুস্টার স্কোর: ${progress.totalBoosterScore}`
            : `Lifetime Booster Score Earned: ${progress.totalBoosterScore}`}
        </div>
      </div>

      <h3 className="font-bold text-sm text-slate-800 mb-2">
        {lang === 'bn' ? 'কীভাবে বুস্টার স্কোর পাবেন?' : 'How to earn Booster Score'}
      </h3>
      <ul className="space-y-2 text-sm text-slate-700 mb-5">
        <li className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5">
          🎋 {lang === 'bn' ? 'বাঁশ সংগ্রহ এবং লম্বা বাঁশ কম্বো করলে (+৫ থেকে +১৫)' : 'Collecting bamboo & chaining combos'}
        </li>
        <li className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5">
          ⚡ {lang === 'bn' ? 'যেকোনো বুস্টার (বিশেষ করে বাঁশ বোনাস / বাঁশ ভোজ) ব্যবহার করলে' : 'Activating Boosters (especially Bamboo Bonus & Feast)'}
        </li>
        <li className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5">
          🏆 {lang === 'bn' ? 'চ্যালেঞ্জ সম্পন্ন করলে ও দূরত্ব মাইলফলকে পৌঁছালে' : 'Completing Challenges & hitting distance milestones'}
        </li>
      </ul>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('UPGRADES')}
          className="rounded-xl bg-emerald-600 py-3 px-4 text-sm font-bold text-white hover:bg-emerald-700 cursor-pointer"
        >
          {lang === 'bn' ? 'বুস্টার আপগ্রেড' : 'Upgrade Boosters'}
        </button>
        <button
          type="button"
          onClick={() => onNavigate('SKINS')}
          className="rounded-xl bg-sky-600 py-3 px-4 text-sm font-bold text-white hover:bg-sky-700 cursor-pointer"
        >
          {lang === 'bn' ? 'পান্ডা স্কিন ও ট্রেইল' : 'Skins & Trails'}
        </button>
      </div>
    </ModalWrapper>
  );
};

export const ChallengesModal: React.FC<{
  progress: PlayerProgress;
  onClaim: (id: string) => void;
  onClose: () => void;
}> = ({ progress, onClaim, onClose }) => {
  const lang = progress.settings.language;
  const [tab, setTab] = useState<ChallengeCategory>('daily');
  const filtered = CHALLENGES.filter((c) => c.category === tab);

  return (
    <ModalWrapper title={lang === 'bn' ? 'চ্যালেঞ্জ ও অর্জন' : 'Challenges & Achievements'} onClose={onClose}>
      <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1 mb-4">
        {(['daily', 'weekly', 'achievement'] as ChallengeCategory[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setTab(c)}
            className={`flex-1 rounded-lg py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
              tab === c ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {c === 'daily'
              ? lang === 'bn'
                ? 'দৈনিক'
                : 'Daily'
              : c === 'weekly'
              ? lang === 'bn'
                ? 'সাপ্তাহিক'
                : 'Weekly'
              : lang === 'bn'
              ? 'অর্জন'
              : 'Achievements'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((ch) => {
          const cur = Math.min(ch.target, progress.challengeProgress[ch.id] || 0);
          const done = cur >= ch.target;
          const claimed = progress.claimedChallenges.includes(ch.id);
          const pct = Math.round((cur / ch.target) * 100);

          return (
            <div key={ch.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900">
                    {lang === 'bn' ? ch.titleBn : ch.titleEn}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {lang === 'bn' ? ch.descBn : ch.descEn}
                  </p>
                  <div className="mt-2 text-xs font-bold text-emerald-700 tabular-nums">
                    {lang === 'bn' ? 'পুরস্কার:' : 'Reward:'} 🎋 +{ch.rewardBamboo} · ⚡ +{ch.rewardBoosterScore}
                  </div>
                </div>

                {claimed ? (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 shrink-0">
                    <Check className="w-4 h-4" />
                    {lang === 'bn' ? 'সংগৃহীত' : 'Claimed'}
                  </span>
                ) : done ? (
                  <button
                    type="button"
                    onClick={() => onClaim(ch.id)}
                    className="rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-300 active:scale-95 cursor-pointer shrink-0"
                  >
                    {lang === 'bn' ? 'পুরস্কার নাও' : 'Claim'}
                  </button>
                ) : (
                  <span className="text-xs font-bold text-slate-600 tabular-nums shrink-0">
                    {cur} / {ch.target}
                  </span>
                )}
              </div>

              <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ModalWrapper>
  );
};

export const UpgradesModal: React.FC<{
  progress: PlayerProgress;
  onUpgrade: (id: BoosterId) => void;
  onClose: () => void;
}> = ({ progress, onUpgrade, onClose }) => {
  const lang = progress.settings.language;

  return (
    <ModalWrapper
      title={lang === 'bn' ? 'বুস্টার ও আপগ্রেড' : 'Boosters & Upgrades'}
      onClose={onClose}
      headerRight={
        <div className="rounded-xl bg-orange-100 px-3 py-1 text-xs font-bold text-orange-900 tabular-nums">
          ⚡ {progress.spendableBoosterScore}
        </div>
      }
    >
      <p className="text-xs text-slate-600 mb-3">
        {lang === 'bn'
          ? 'বুস্টার আপগ্রেড করলে সময়কাল বাড়ে। মনে রাখবেন: কোনো বুস্টারই বাঁধায় ধাক্কা লাগা থেকে রক্ষা করে না!'
          : 'Upgrade boosters to extend duration. Remember: NO booster protects against obstacle collisions!'}
      </p>

      <div className="space-y-3">
        {BOOSTERS.map((b) => {
          const level = progress.boosterLevels[b.id] || 1;
          const dur = getBoosterDuration(progress, b.id);
          const cost = getBoosterUpgradeCost(level);
          const isMax = level >= 5;
          const canAfford = progress.spendableBoosterScore >= cost;

          return (
            <div
              key={b.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold border"
                  style={{ backgroundColor: b.bgColor, borderColor: b.color, color: b.color }}
                >
                  {b.iconLabel}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900">
                      {lang === 'bn' ? b.nameBn : b.nameEn}
                    </h4>
                    <span className="text-xs font-bold text-emerald-700 tabular-nums">
                      Lv.{level}/5 · {dur.toFixed(1)}s
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {lang === 'bn' ? b.descBn : b.descEn}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isMax || !canAfford}
                onClick={() => onUpgrade(b.id)}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold shrink-0 tabular-nums transition ${
                  isMax
                    ? 'bg-emerald-100 text-emerald-800 cursor-default'
                    : canAfford
                    ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95 cursor-pointer'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isMax
                  ? lang === 'bn'
                    ? 'সর্বোচ্চ লেভেল'
                    : 'MAX'
                  : `${lang === 'bn' ? 'আপগ্রেড' : 'Upgrade'} ⚡ ${cost}`}
              </button>
            </div>
          );
        })}
      </div>
    </ModalWrapper>
  );
};

export const SkinsModal: React.FC<{
  progress: PlayerProgress;
  onSelectSkin: (id: SkinId) => void;
  onSelectTrail: (id: TrailId) => void;
  onClose: () => void;
}> = ({ progress, onSelectSkin, onSelectTrail, onClose }) => {
  const lang = progress.settings.language;

  return (
    <ModalWrapper
      title={lang === 'bn' ? 'পান্ডা স্কিন ও ট্রেইল' : 'Panda Skins & Trails'}
      onClose={onClose}
      headerRight={
        <div className="flex items-center gap-2 text-xs font-bold tabular-nums">
          <span className="rounded-lg bg-green-100 px-2.5 py-1 text-green-900">
            🎋 {progress.spendableBamboo}
          </span>
          <span className="rounded-lg bg-orange-100 px-2.5 py-1 text-orange-900">
            ⚡ {progress.spendableBoosterScore}
          </span>
        </div>
      }
    >
      <h3 className="font-bold text-sm text-slate-800 mb-2">
        {lang === 'bn' ? 'স্কার্ফ স্টাইল (মূল পান্ডা অক্ষত রেখে)' : 'Scarf Editions (Preserving Original Panda)'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {SKINS.map((sk) => {
          const unlocked = progress.unlockedSkins.includes(sk.id);
          const equipped = progress.equippedSkin === sk.id;
          const canBuy =
            progress.spendableBamboo >= sk.costBamboo &&
            progress.spendableBoosterScore >= sk.costBoosterScore;

          return (
            <div key={sk.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-11 w-11 rounded-xl border-2 border-slate-900 shrink-0 flex items-center justify-center text-lg"
                  style={{ backgroundColor: sk.scarfColor }}
                >
                  🐼
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    {lang === 'bn' ? sk.nameBn : sk.nameEn}
                  </h4>
                  <p className="text-xs text-slate-600">{lang === 'bn' ? sk.descBn : sk.descEn}</p>
                </div>
              </div>

              <button
                type="button"
                disabled={!unlocked && !canBuy}
                onClick={() => onSelectSkin(sk.id)}
                className={`w-full rounded-xl py-2 text-xs font-bold transition tabular-nums ${
                  equipped
                    ? 'bg-emerald-600 text-white'
                    : unlocked
                    ? 'bg-white border border-emerald-500 text-emerald-800 hover:bg-emerald-50 cursor-pointer'
                    : canBuy
                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 cursor-pointer'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                {equipped
                  ? lang === 'bn'
                    ? 'ব্যবহৃত হচ্ছে ✓'
                    : 'Equipped ✓'
                  : unlocked
                  ? lang === 'bn'
                    ? 'পছন্দ করো'
                    : 'Equip'
                  : `${lang === 'bn' ? 'আনলক' : 'Unlock'} · 🎋 ${sk.costBamboo} · ⚡ ${sk.costBoosterScore}`}
              </button>
            </div>
          );
        })}
      </div>

      <h3 className="font-bold text-sm text-slate-800 mb-2">
        {lang === 'bn' ? 'দৌড়ের ট্রেইল ইফেক্ট' : 'Running Trails & Effects'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TRAILS.map((tr) => {
          const unlocked = progress.unlockedTrails.includes(tr.id);
          const equipped = progress.equippedTrail === tr.id;
          const canBuy =
            progress.spendableBamboo >= tr.costBamboo &&
            progress.spendableBoosterScore >= tr.costBoosterScore;

          return (
            <div key={tr.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-full border-2 border-slate-800 shrink-0"
                  style={{ backgroundColor: tr.color }}
                />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    {lang === 'bn' ? tr.nameBn : tr.nameEn}
                  </h4>
                  <p className="text-xs text-slate-600">{lang === 'bn' ? tr.descBn : tr.descEn}</p>
                </div>
              </div>

              <button
                type="button"
                disabled={!unlocked && !canBuy}
                onClick={() => onSelectTrail(tr.id)}
                className={`w-full rounded-xl py-2 text-xs font-bold transition tabular-nums ${
                  equipped
                    ? 'bg-emerald-600 text-white'
                    : unlocked
                    ? 'bg-white border border-emerald-500 text-emerald-800 hover:bg-emerald-50 cursor-pointer'
                    : canBuy
                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 cursor-pointer'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                {equipped
                  ? lang === 'bn'
                    ? 'ব্যবহৃত হচ্ছে ✓'
                    : 'Equipped ✓'
                  : unlocked
                  ? lang === 'bn'
                    ? 'পছন্দ করো'
                    : 'Equip'
                  : `${lang === 'bn' ? 'আনলক' : 'Unlock'} · 🎋 ${tr.costBamboo} · ⚡ ${tr.costBoosterScore}`}
              </button>
            </div>
          );
        })}
      </div>
    </ModalWrapper>
  );
};

export const SettingsModal: React.FC<{
  settings: GameSettings;
  onUpdate: (next: GameSettings) => void;
  onReplayTutorial: () => void;
  onHowToPlay: () => void;
  onResetProgress: () => void;
  onClose: () => void;
}> = ({
  settings,
  onUpdate,
  onReplayTutorial,
  onHowToPlay,
  onResetProgress,
  onClose,
}) => {
  const lang = settings.language;
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <ModalWrapper title={lang === 'bn' ? 'সেটিংস (Settings)' : 'Settings'} onClose={onClose}>
      <div className="space-y-4">
        {/* Language */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <span className="font-bold text-sm">{lang === 'bn' ? 'ভাষা (Language)' : 'Language'}</span>
          <div className="flex gap-1.5 bg-slate-200 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => onUpdate({ ...settings, language: 'bn' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                lang === 'bn' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ ...settings, language: 'en' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                lang === 'en' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Audio Channels */}
        {[
          {
            key: 'music' as const,
            labelBn: 'ব্যাকগ্রাউন্ড মিউজিক',
            labelEn: 'Background Music',
            enabled: settings.musicEnabled,
            vol: settings.musicVolume,
            toggle: () => onUpdate({ ...settings, musicEnabled: !settings.musicEnabled }),
            setVol: (v: number) => onUpdate({ ...settings, musicVolume: v }),
          },
          {
            key: 'sfx' as const,
            labelBn: 'সাউন্ড ইফেক্ট (SFX)',
            labelEn: 'Sound Effects (SFX)',
            enabled: settings.sfxEnabled,
            vol: settings.sfxVolume,
            toggle: () => onUpdate({ ...settings, sfxEnabled: !settings.sfxEnabled }),
            setVol: (v: number) => onUpdate({ ...settings, sfxVolume: v }),
          },
          {
            key: 'voice' as const,
            labelBn: 'বাংলা কার্টুন ভয়েস',
            labelEn: 'Cartoon Voice Lines',
            enabled: settings.voiceEnabled,
            vol: settings.voiceVolume,
            toggle: () => onUpdate({ ...settings, voiceEnabled: !settings.voiceEnabled }),
            setVol: (v: number) => onUpdate({ ...settings, voiceVolume: v }),
          },
        ].map((ch) => (
          <div key={ch.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-700" />
                {lang === 'bn' ? ch.labelBn : ch.labelEn}
              </span>
              <button
                type="button"
                onClick={ch.toggle}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  ch.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {ch.enabled ? (lang === 'bn' ? 'চালু (ON)' : 'ON') : lang === 'bn' ? 'বন্ধ (OFF)' : 'OFF'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={ch.vol}
                onChange={(e) => ch.setVol(parseFloat(e.target.value))}
                className="flex-1 accent-emerald-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-600 w-10 text-right tabular-nums">
                {Math.round(ch.vol * 100)}%
              </span>
            </div>
            {ch.key === 'voice' && ch.enabled && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => audioManager.previewVoice('panda')}
                  className="flex-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 py-2 px-3 text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  🐼 {lang === 'bn' ? 'পান্ডার ভয়েস শুনুন' : 'Test Panda Voice'}
                </button>
                <button
                  type="button"
                  onClick={() => audioManager.previewVoice('monkey')}
                  className="flex-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 py-2 px-3 text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  🐒 {lang === 'bn' ? 'বানর মিয়ার ভয়েস শুনুন' : 'Test Monkey Voice'}
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onReplayTutorial}
            className="rounded-xl bg-emerald-600 py-3 px-4 text-sm font-bold text-white hover:bg-emerald-700 cursor-pointer"
          >
            🎓 {lang === 'bn' ? 'টিউটোরিয়াল আবার খেলো' : 'Replay Tutorial'}
          </button>
          <button
            type="button"
            onClick={onHowToPlay}
            className="rounded-xl bg-sky-600 py-3 px-4 text-sm font-bold text-white hover:bg-sky-700 cursor-pointer"
          >
            📖 {lang === 'bn' ? 'খেলার নিয়ম দেখুন' : 'How to Play'}
          </button>
        </div>

        {/* Reset Progress with confirmation */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-white border border-rose-300 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{lang === 'bn' ? 'সব অগ্রগতি রিসেট করুন' : 'Reset All Progress'}</span>
            </button>
          ) : (
            <div className="space-y-2.5 text-center">
              <p className="text-xs font-bold text-rose-900">
                {lang === 'bn'
                  ? 'আপনি কি নিশ্চিত? সব স্কোর, বাঁশ ও আনলক মুছে যাবে!'
                  : 'Are you sure? All scores, bamboo & unlocks will be erased!'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetProgress();
                    setConfirmReset(false);
                  }}
                  className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
                >
                  {lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Reset'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 rounded-xl bg-white border border-slate-300 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};

export const HowToPlayModal: React.FC<{
  lang: Language;
  onReplayTutorial: () => void;
  onClose: () => void;
}> = ({ lang, onReplayTutorial, onClose }) => (
  <ModalWrapper title={lang === 'bn' ? 'খেলার নিয়ম (How to Play)' : 'How to Play'} onClose={onClose}>
    <div className="space-y-4 text-sm text-slate-700">
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
        <h3 className="font-bold text-emerald-950 mb-2">
          📱 {lang === 'bn' ? 'মোবাইল সোয়াইপ কন্ট্রোল' : 'Mobile Swipe Controls'}
        </h3>
        <ul className="space-y-1.5 text-xs sm:text-sm">
          <li>• <strong>{lang === 'bn' ? 'বামে সোয়াইপ:' : 'Swipe Left:'}</strong> {lang === 'bn' ? 'বামের লেনে যান' : 'Move one lane left'}</li>
          <li>• <strong>{lang === 'bn' ? 'ডানে সোয়াইপ:' : 'Swipe Right:'}</strong> {lang === 'bn' ? 'ডানের লেনে যান' : 'Move one lane right'}</li>
          <li>• <strong>{lang === 'bn' ? 'উপরে সোয়াইপ:' : 'Swipe Up:'}</strong> {lang === 'bn' ? 'বাঁধার ওপর দিয়ে লাফ দিন বা লতা (SWING) ধরুন' : 'Jump over obstacles or grab a vine (SWING)'}</li>
          <li>• <strong>{lang === 'bn' ? 'নিচে সোয়াইপ:' : 'Swipe Down:'}</strong> {lang === 'bn' ? 'নিচু হয়ে স্লাইড করুন বা লতা (RELEASE) ছাড়ুন' : 'Slide under gates or release a vine (RELEASE)'}</li>
        </ul>
      </div>

      <div className="rounded-2xl bg-sky-50 border border-sky-200 p-4">
        <h3 className="font-bold text-sky-950 mb-2">
          ⌨️ {lang === 'bn' ? 'ডেস্কটপ কীবোর্ড কন্ট্রোল' : 'Desktop Keyboard Controls'}
        </h3>
        <ul className="space-y-1.5 text-xs sm:text-sm">
          <li>• <strong>← / A :</strong> {lang === 'bn' ? 'বামে যান' : 'Move Left'}</li>
          <li>• <strong>→ / D :</strong> {lang === 'bn' ? 'ডানে যান' : 'Move Right'}</li>
          <li>• <strong>↑ / W :</strong> {lang === 'bn' ? 'লাফ দিন / লতা ধরুন' : 'Jump / Grab Vine'}</li>
          <li>• <strong>↓ / S :</strong> {lang === 'bn' ? 'স্লাইড করুন / লতা ছাড়ুন' : 'Slide / Release Vine'}</li>
          <li>• <strong>Space :</strong> {lang === 'bn' ? 'খেলা বিরতি / চালু' : 'Pause / Resume'}</li>
        </ul>
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
        <h3 className="font-bold text-amber-950 mb-1.5">
          ⚠️ {lang === 'bn' ? 'গুরুত্বপূর্ণ নিয়ম ও বানর মিয়া' : 'Key Rules & Banor Mia'}
        </h3>
        <p className="text-xs sm:text-sm leading-relaxed">
          {lang === 'bn'
            ? 'যেকোনো বাঁধায় ধাক্কা লাগলে, গর্তে পড়লে বা বানর মিয়া ধরে ফেললে সাথে সাথে খেলা শেষ! কোনো বুস্টারই ধাক্কা থেকে রক্ষা করে না। ১০০ মিটারে বানর মিয়ার তাড়া শুরু হলে বাঁশ তুলে দ্রুত পালিয়ে যান।'
            : 'Any obstacle hit, gap fall, or getting caught by Banor Mia ends the run immediately—boosters never grant invincibility! At 100m, collect bamboo to outrun Banor Mia.'}
        </p>
      </div>

      <button
        type="button"
        onClick={onReplayTutorial}
        className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow hover:bg-emerald-700 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
      >
        <Zap className="w-4 h-4" />
        <span>{lang === 'bn' ? 'ইন্টারেক্টিভ টিউটোরিয়াল খেলুন' : 'Play Interactive Tutorial'}</span>
      </button>
    </div>
  </ModalWrapper>
);
