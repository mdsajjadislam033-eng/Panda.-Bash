import { useCallback, useEffect, useState } from 'react';
import { GameplayHUD } from './components/GameplayHUD';
import { HomeScreen } from './components/HomeScreen';
import {
  BoosterScoreModal,
  ChallengesModal,
  GameOverModal,
  HowToPlayModal,
  PandaBoardModal,
  PauseModal,
  SettingsModal,
  SkinsModal,
  UpgradesModal,
} from './components/ModalScreens';
import { OfflineIndicator } from './components/PWAComponents';
import { PandaBashCanvas } from './game/PandaBashCanvas';
import {
  BoosterId,
  GameSettings,
  HudSnapshot,
  Language,
  PlayerProgress,
  RunSummary,
  ScreenState,
  SkinId,
  TrailId,
} from './types/game';
import { audioManager } from './utils/audio';
import {
  applyRunToProgress,
  claimChallengeReward,
  loadProgress,
  resetAllProgress,
  saveProgress,
  unlockOrEquipSkin,
  unlockOrEquipTrail,
  upgradeBooster,
} from './utils/storage';

const INITIAL_HUD: HudSnapshot = {
  distance: 0,
  runScore: 0,
  bambooCount: 0,
  boosterScore: 0,
  combo: 0,
  biome: 'bamboo_forest',
  activeBoosters: [],
  monkeyActive: false,
  monkeyProximity: 0,
  monkeyWarning: null,
  vinePrompt: 'none',
  milestoneText: null,
  speechBubble: null,
  tutorialStepIndex: 0,
  tutorialHint: null,
  tutorialCompletedBanner: false,
};

export default function App() {
  const [progress, setProgress] = useState<PlayerProgress>(() => loadProgress());
  const [screen, setScreen] = useState<ScreenState>('HOME');
  const [runKey, setRunKey] = useState(1);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [lastSummary, setLastSummary] = useState<RunSummary | null>(null);
  const [boardFromGameOver, setBoardFromGameOver] = useState(false);

  useEffect(() => {
    audioManager.updateSettings(progress.settings);
  }, [progress.settings]);

  const updateSettings = useCallback((nextSettings: GameSettings) => {
    setProgress((prev) => {
      const next = { ...prev, settings: nextSettings };
      saveProgress(next);
      return next;
    });
  }, []);

  const handleToggleLanguage = useCallback(() => {
    setProgress((prev) => {
      const nextLang: Language = prev.settings.language === 'bn' ? 'en' : 'bn';
      const next: PlayerProgress = {
        ...prev,
        settings: { ...prev.settings, language: nextLang },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const startFreshRun = useCallback((tutorialMode: boolean) => {
    audioManager.unlock();
    audioManager.stopActiveVoice();
    audioManager.startMusic();
    void audioManager.prefetchVoices(progress.settings.language);
    setLastSummary(null);
    setHud(INITIAL_HUD);
    setRunKey((k) => k + 1);
    setScreen(tutorialMode ? 'TUTORIAL' : 'PLAYING');
  }, [progress.settings.language]);

  const handlePlayPress = useCallback(() => {
    if (!progress.tutorialCompleted) {
      startFreshRun(true);
    } else {
      startFreshRun(false);
    }
  }, [progress.tutorialCompleted, startFreshRun]);

  const handleTutorialComplete = useCallback(() => {
    setProgress((prev) => {
      const next = { ...prev, tutorialCompleted: true };
      saveProgress(next);
      return next;
    });
    // Transition seamlessly into the first real run at comfortable starting speed
    startFreshRun(false);
  }, [startFreshRun]);

  const handleTogglePause = useCallback(() => {
    setScreen((cur) => {
      if (cur === 'PLAYING') {
        audioManager.stopMusic();
        audioManager.stopActiveVoice();
        return 'PAUSED';
      }
      if (cur === 'PAUSED') {
        audioManager.startMusic();
        return 'PLAYING';
      }
      return cur;
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    setProgress((prev) => {
      const allMuted =
        !prev.settings.musicEnabled && !prev.settings.sfxEnabled && !prev.settings.voiceEnabled;
      const nextSettings: GameSettings = {
        ...prev.settings,
        musicEnabled: allMuted,
        sfxEnabled: allMuted,
        voiceEnabled: allMuted,
      };
      if (allMuted && screen === 'PLAYING') {
        audioManager.updateSettings(nextSettings);
        audioManager.startMusic();
      }
      const next = { ...prev, settings: nextSettings };
      saveProgress(next);
      return next;
    });
  }, [screen]);

  const handleGameOver = useCallback(
    (summary: RunSummary, extra: { boosterBamboo: number; milestonesReached: number }) => {
      setProgress((prev) => applyRunToProgress(prev, summary, extra));
      setLastSummary(summary);
      setScreen('GAME_OVER');
    },
    []
  );

  const handleGoHome = useCallback(() => {
    audioManager.stopMusic();
    audioManager.stopActiveVoice();
    setScreen('HOME');
  }, []);

  const handleUpgradeBooster = useCallback((id: BoosterId) => {
    setProgress((prev) => upgradeBooster(prev, id) || prev);
  }, []);

  const handleSelectSkin = useCallback((id: SkinId) => {
    setProgress((prev) => unlockOrEquipSkin(prev, id) || prev);
  }, []);

  const handleSelectTrail = useCallback((id: TrailId) => {
    setProgress((prev) => unlockOrEquipTrail(prev, id) || prev);
  }, []);

  const handleClaimChallenge = useCallback((id: string) => {
    setProgress((prev) => claimChallengeReward(prev, id) || prev);
    audioManager.playMilestone();
  }, []);

  const handleResetProgress = useCallback(() => {
    const fresh = resetAllProgress();
    setProgress(fresh);
  }, []);

  const lang = progress.settings.language;
  const isGameplayVisible =
    screen === 'PLAYING' ||
    screen === 'TUTORIAL' ||
    screen === 'PAUSED' ||
    screen === 'GAME_OVER';
  const isMuted =
    !progress.settings.musicEnabled &&
    !progress.settings.sfxEnabled &&
    !progress.settings.voiceEnabled;

  return (
    <main className="relative w-screen h-dvh overflow-hidden bg-emerald-950">
      {/* Gameplay Canvas Layer */}
      {isGameplayVisible && (
        <div className="relative w-full h-full">
          <PandaBashCanvas
            screen={screen}
            runKey={runKey}
            isTutorial={screen === 'TUTORIAL'}
            progress={progress}
            onHudUpdate={setHud}
            onTogglePause={handleTogglePause}
            onTutorialComplete={handleTutorialComplete}
            onGameOver={handleGameOver}
          />
          {(screen === 'PLAYING' || screen === 'TUTORIAL') && (
            <GameplayHUD
              hud={hud}
              lang={lang}
              isTutorial={screen === 'TUTORIAL'}
              isMuted={isMuted}
              onPause={handleTogglePause}
              onToggleMute={handleToggleMute}
              onSkipTutorial={handleTutorialComplete}
            />
          )}
        </div>
      )}

      {/* Home Screen */}
      {screen === 'HOME' && (
        <HomeScreen
          progress={progress}
          onPlay={handlePlayPress}
          onNavigate={(s) => {
            setBoardFromGameOver(false);
            setScreen(s);
          }}
          onToggleLanguage={handleToggleLanguage}
        />
      )}

      {/* Pause Overlay */}
      {screen === 'PAUSED' && (
        <PauseModal
          lang={lang}
          settings={progress.settings}
          onResume={handleTogglePause}
          onRestart={() => startFreshRun(false)}
          onHome={handleGoHome}
          onUpdateSettings={updateSettings}
        />
      )}

      {/* Game Over Overlay */}
      {screen === 'GAME_OVER' && lastSummary && (
        <GameOverModal
          lang={lang}
          summary={lastSummary}
          bestDistance={progress.bestDistance}
          onRestart={() => startFreshRun(false)}
          onHome={handleGoHome}
          onPandaBoard={() => {
            setBoardFromGameOver(true);
            setScreen('PANDA_BOARD');
          }}
        />
      )}

      {/* Menu Modals */}
      {screen === 'PANDA_BOARD' && (
        <PandaBoardModal
          progress={progress}
          onClose={() => setScreen(boardFromGameOver ? 'GAME_OVER' : 'HOME')}
        />
      )}

      {screen === 'BOOSTER_SCORE' && (
        <BoosterScoreModal
          progress={progress}
          onClose={() => setScreen('HOME')}
          onNavigate={setScreen}
        />
      )}

      {screen === 'CHALLENGES' && (
        <ChallengesModal
          progress={progress}
          onClaim={handleClaimChallenge}
          onClose={() => setScreen('HOME')}
        />
      )}

      {screen === 'UPGRADES' && (
        <UpgradesModal
          progress={progress}
          onUpgrade={handleUpgradeBooster}
          onClose={() => setScreen('HOME')}
        />
      )}

      {screen === 'SKINS' && (
        <SkinsModal
          progress={progress}
          onSelectSkin={handleSelectSkin}
          onSelectTrail={handleSelectTrail}
          onClose={() => setScreen('HOME')}
        />
      )}

      {screen === 'SETTINGS' && (
        <SettingsModal
          settings={progress.settings}
          onUpdate={updateSettings}
          onReplayTutorial={() => startFreshRun(true)}
          onHowToPlay={() => setScreen('HOW_TO_PLAY')}
          onResetProgress={handleResetProgress}
          onClose={() => setScreen('HOME')}
        />
      )}

      {screen === 'HOW_TO_PLAY' && (
        <HowToPlayModal
          lang={lang}
          onReplayTutorial={() => startFreshRun(true)}
          onClose={() => setScreen('HOME')}
        />
      )}

      <OfflineIndicator lang={lang} />
    </main>
  );
}
