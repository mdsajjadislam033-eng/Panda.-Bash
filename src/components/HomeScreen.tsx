import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Flame,
  Palette,
  Play,
  Settings,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { CHALLENGES } from '../data/gameData';
import { Language, PlayerProgress, ScreenState } from '../types/game';
import { PWAInstallButton } from './PWAComponents';

interface HomeScreenProps {
  progress: PlayerProgress;
  onPlay: () => void;
  onNavigate: (screen: ScreenState) => void;
  onToggleLanguage: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  progress,
  onPlay,
  onNavigate,
  onToggleLanguage,
}) => {
  const lang: Language = progress.settings.language;
  const [imgError, setImgError] = useState(false);

  const claimableCount = CHALLENGES.filter(
    (ch) =>
      !progress.claimedChallenges.includes(ch.id) &&
      (progress.challengeProgress[ch.id] || 0) >= ch.target
  ).length;

  const menuItems: {
    id: ScreenState;
    labelBn: string;
    labelEn: string;
    icon: React.ReactNode;
    accent: string;
  }[] = [
    {
      id: 'PANDA_BOARD',
      labelBn: 'পান্ডা বোর্ড',
      labelEn: 'Panda Board',
      icon: <Trophy className="w-5 h-5" />,
      accent: 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100',
    },
    {
      id: 'BOOSTER_SCORE',
      labelBn: 'বুস্টার স্কোর',
      labelEn: 'Booster Score',
      icon: <Zap className="w-5 h-5" />,
      accent: 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100',
    },
    {
      id: 'CHALLENGES',
      labelBn: claimableCount > 0 ? `চ্যালেঞ্জ (${claimableCount})` : 'চ্যালেঞ্জ',
      labelEn: claimableCount > 0 ? `Challenges (${claimableCount})` : 'Challenges',
      icon: <Award className="w-5 h-5" />,
      accent: 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100',
    },
    {
      id: 'UPGRADES',
      labelBn: 'বুস্টার ও আপগ্রেড',
      labelEn: 'Boosters & Upgrades',
      icon: <Flame className="w-5 h-5" />,
      accent: 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100',
    },
    {
      id: 'SKINS',
      labelBn: 'পান্ডা স্কিন',
      labelEn: 'Panda Skins',
      icon: <Palette className="w-5 h-5" />,
      accent: 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100',
    },
    {
      id: 'HOW_TO_PLAY',
      labelBn: 'খেলার নিয়ম',
      labelEn: 'How to Play',
      icon: <BookOpen className="w-5 h-5" />,
      accent: 'bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100',
    },
    {
      id: 'SETTINGS',
      labelBn: 'সেটিংস',
      labelEn: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      accent: 'bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200',
    },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-y-auto custom-scroll bg-gradient-to-b from-sky-400 via-emerald-200 to-emerald-800">
      {/* Decorative Bamboo Forest Backdrop Framing */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-25">
        <div className="absolute left-3 top-0 bottom-0 w-5 rounded-full bg-emerald-700" />
        <div className="absolute left-11 top-0 bottom-0 w-3 rounded-full bg-emerald-600" />
        <div className="absolute right-3 top-0 bottom-0 w-5 rounded-full bg-emerald-700" />
        <div className="absolute right-11 top-0 bottom-0 w-3 rounded-full bg-emerald-600" />
      </div>

      {/* Top Utility Row */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-1 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-emerald-950 bg-white/85 px-3 py-1.5 rounded-xl shadow-sm tabular-nums">
          <span>🎋 {progress.spendableBamboo}</span>
          <span aria-hidden="true" className="text-emerald-400">·</span>
          <span>⚡ {progress.spendableBoosterScore}</span>
          <span aria-hidden="true" className="text-emerald-400">·</span>
          <span>🏆 {progress.bestDistance}m</span>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton lang={lang} />
          <button
            type="button"
            onClick={onToggleLanguage}
            className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-bold text-emerald-950 shadow-sm hover:bg-white active:scale-95 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            {lang === 'bn' ? 'English' : 'বাংলা'}
          </button>
        </div>
      </div>

      {/* Main Hero Centerpiece */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2 max-w-3xl mx-auto w-full">
        {/* Title Lockup */}
        <div className="text-center mb-3">
          <h1
            className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-[0_4px_0_rgba(20,83,45,0.95)]"
            style={{ WebkitTextStroke: '2px #14532d' }}
          >
            PANDA BASH
          </h1>
          <p className="mt-1 text-sm sm:text-base font-bold text-emerald-950 bg-amber-300/95 inline-block px-3.5 py-0.5 rounded-lg shadow-sm border border-amber-500/40">
            Created by Md Sazzad Hossain
          </p>
        </div>

        {/* Exact Supplied Panda Character Showcase */}
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-emerald-100 animate-float-slow mb-4">
          {!imgError ? (
            <img
              src={`${import.meta.env.BASE_URL}assets/aistudio/20261124_024222_85e4caba.jpg`}
              alt="Panda Bash Hero Panda with Green Scarf"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-400 to-green-700 text-white p-4 text-center">
              <Sparkles className="w-10 h-10 mb-2" />
              <span className="font-display text-xl font-bold">PANDA BASH</span>
            </div>
          )}
        </div>

        {/* Primary Play CTA */}
        <button
          type="button"
          onClick={onPlay}
          className="w-full max-w-xs sm:max-w-sm flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-b from-green-500 to-emerald-700 border-b-4 border-emerald-900 px-8 py-4 text-xl sm:text-2xl font-display font-bold text-white shadow-xl hover:brightness-105 active:translate-y-0.5 active:border-b-2 transition cursor-pointer mb-4"
        >
          <Play className="w-7 h-7 fill-current" />
          <span>{lang === 'bn' ? 'খেলুন (Play)' : 'Play Now'}</span>
        </button>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-2xl">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex items-center justify-center sm:justify-start gap-2 rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition cursor-pointer min-h-[44px] ${item.accent}`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{lang === 'bn' ? item.labelBn : item.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clean Quiet Footer Line */}
      <div className="relative z-10 text-center py-2 px-4 text-xs font-medium text-emerald-50/90">
        {lang === 'bn'
          ? 'সোয়াইপ বা কীবোর্ড দিয়ে খেলো · বানর মিয়া থেকে পালাও!'
          : 'Swipe or use Arrow/WASD keys · Escape Banor Mia!'}
      </div>
    </div>
  );
};
