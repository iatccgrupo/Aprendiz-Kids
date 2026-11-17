'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { Navbar } from '@/components/Navbar';
import { AuthScreen } from '@/components/AuthScreen';
import { TrailMapScreen } from '@/components/TrailMapScreen';
import { ActivityScreen } from '@/components/ActivityScreen';
import { FeedbackScreen } from '@/components/FeedbackScreen';
import { ProgressScreen } from '@/components/ProgressScreen';
import { ParentDashboard, ParentalGateModal } from '@/components/ParentDashboard';
import { StorybookScreen } from '@/components/StorybookScreen';
import { LiveVoiceAssistant } from '@/components/LiveVoiceAssistant';
import {
  ScreenState,
  ChildProfile,
  LevelInfo,
  Phase,
  ActivityOption,
  Medal,
  Storybook,
} from '@/lib/types';
import {
  INITIAL_LEVELS,
  INITIAL_MEDALS,
  getQuestionByPhaseId,
  reconcileLevelsWithCanonical,
} from '@/lib/game-data';
import { playPopSound, playSuccessSound } from '@/lib/sound';
import {
  savePhaseProgressToSupabase,
  saveMedalToSupabase,
  logActivityToSupabase,
  signOutWithSupabase,
  saveInitialProgressForChildToSupabase,
  saveLocalAccountWorkspace,
  isUuid,
  RestoredWorkspace,
} from '@/lib/supabase/service';
import { isPhonemeAnswerCorrect } from '@/lib/utils';

const emptySubscribe = () => () => {};

function useHasMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function HomePage() {
  const hasMounted = useHasMounted();
  // Child Profile State with lazy initialization
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('aventura_child_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Navigation Screen State: The first screen is ALWAYS the Cadastro de Login e Senha ('auth')
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('auth');
  const [authInitialStep, setAuthInitialStep] = useState<'auth' | 'child_profile'>('auth');

  const [isParentGateOpen, setIsParentGateOpen] = useState(false);

  // Game Levels & Phases (always reconciled with canonical Fase 1-5 & Nível 2-3 order)
  const [levels, setLevels] = useState<LevelInfo[]>(() => {
    if (typeof window === 'undefined') return INITIAL_LEVELS;
    try {
      const saved = localStorage.getItem('aventura_levels');
      return saved ? reconcileLevelsWithCanonical(JSON.parse(saved) as LevelInfo[]) : INITIAL_LEVELS;
    } catch {
      return INITIAL_LEVELS;
    }
  });

  const [currentPhase, setCurrentPhase] = useState<Phase>(INITIAL_LEVELS[0].phases[2]); // Fase 3 (Vogal I - Iguana)

  // Activity & Feedback State (question sempre derivada de currentPhase.id)
  const [lastSelectedOption, setLastSelectedOption] = useState<ActivityOption | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);

  // Medals & Gamification (merge any newly added medals with saved local state)
  const [medals, setMedals] = useState<Medal[]>(() => {
    if (typeof window === 'undefined') return INITIAL_MEDALS;
    try {
      const saved = localStorage.getItem('aventura_medals');
      if (!saved) return INITIAL_MEDALS;
      const parsed = JSON.parse(saved) as Medal[];
      const savedMap = new Map(parsed.map((m) => [m.id, m]));
      return INITIAL_MEDALS.map((base) => savedMap.get(base.id) || base);
    } catch {
      return INITIAL_MEDALS;
    }
  });

  // Storybook Library state (hydration-safe via hasMounted)
  const [completedBookIds, setCompletedBookIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('aventura_completed_books');
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [customBooks, setCustomBooks] = useState<Storybook[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('aventura_custom_books');
      return saved ? (JSON.parse(saved) as Storybook[]) : [];
    } catch {
      return [];
    }
  });

  // Sound Control & Live Voice Conversation Modal
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);

  const activeChildProfile = hasMounted ? childProfile : null;
  const activeLevels = hasMounted ? levels : INITIAL_LEVELS;
  const activeMedals = hasMounted ? medals : INITIAL_MEDALS;
  const activeCompletedBookIds = hasMounted ? completedBookIds : [];
  const activeCustomBooks = hasMounted ? customBooks : [];

  // Calculate total stars (trail phases + completed storybooks)
  const phaseStars = activeLevels.reduce((acc, lvl) => {
    return acc + lvl.phases.reduce((pAcc, p) => pAcc + p.starsEarned, 0);
  }, 0);
  const totalStars = phaseStars + activeCompletedBookIds.length * 3;

  // Calculate completed phases
  const completedPhasesCount = activeLevels.reduce((acc, lvl) => {
    return acc + lvl.phases.filter((p) => p.status === 'completed').length;
  }, 0);

  const totalPhasesCount = activeLevels.reduce((acc, lvl) => acc + lvl.phases.length, 0);

  // Helper to mirror active child + completed stages into per-email local backup
  const persistAccountBackup = (
    profile: ChildProfile | null,
    nextLevels: LevelInfo[],
    nextMedals: Medal[],
    nextCompletedBooks: string[]
  ) => {
    if (!profile) return;
    try {
      const rawAcc = localStorage.getItem('aventura_parent_account');
      if (!rawAcc) return;
      const acc = JSON.parse(rawAcc) as {
        email?: string;
        name?: string;
        userId?: string;
      };
      if (!acc.email) return;
      saveLocalAccountWorkspace(acc.email, {
        parentName: acc.name,
        parentId: acc.userId,
        child: profile,
        levels: nextLevels,
        medals: nextMedals,
        completedBookIds: nextCompletedBooks,
      });
    } catch {}
  };

  // Complete child profile from AuthScreen (restoring saved stages/medals/books if returned)
  const handleCompleteProfile = (
    profile: ChildProfile,
    restoredWorkspace?: Partial<RestoredWorkspace>
  ) => {
    setChildProfile(profile);
    try {
      localStorage.setItem('aventura_child_profile', JSON.stringify(profile));
    } catch {}

    let nextLevels = levels;
    if (restoredWorkspace?.levels) {
      nextLevels = reconcileLevelsWithCanonical(restoredWorkspace.levels);
      setLevels(nextLevels);
      try {
        localStorage.setItem('aventura_levels', JSON.stringify(nextLevels));
      } catch {}
    }

    let nextMedals = medals;
    if (restoredWorkspace?.medals) {
      const savedMap = new Map(restoredWorkspace.medals.map((m) => [m.id, m]));
      nextMedals = INITIAL_MEDALS.map((base) => savedMap.get(base.id) || base);
      setMedals(nextMedals);
      try {
        localStorage.setItem('aventura_medals', JSON.stringify(nextMedals));
      } catch {}
    }

    let nextBooks = completedBookIds;
    if (restoredWorkspace?.completedBookIds) {
      nextBooks = restoredWorkspace.completedBookIds;
      setCompletedBookIds(nextBooks);
      try {
        localStorage.setItem(
          'aventura_completed_books',
          JSON.stringify(nextBooks)
        );
      } catch {}
    }

    persistAccountBackup(profile, nextLevels, nextMedals, nextBooks);

    if (isUuid(profile.id)) {
      void saveInitialProgressForChildToSupabase(
        profile.id,
        nextLevels,
        nextMedals,
        nextBooks
      );
    }

    setAuthInitialStep('auth');
    setCurrentScreen('map');
  };

  // Start a specific phase (question derivada diretamente de phase.id)
  const handleSelectPhase = (phase: Phase) => {
    setCurrentPhase(phase);
    setCurrentScreen('activity');
  };

  // Handle Answer Selection in Activity Screen
  const handleAnswerSelected = (option: ActivityOption) => {
    const isCorrect =
      isPhonemeAnswerCorrect(option.letter, currentQuestion.targetLetter) || option.isCorrect;

    setLastSelectedOption({ ...option, isCorrect });
    setIsAnswerCorrect(isCorrect);

    // Sincronizar log de atividade com Supabase
    if (childProfile) {
      logActivityToSupabase({
        childId: childProfile.id,
        phaseId: currentPhase.id,
        questionId: currentQuestion.id,
        targetLetter: currentQuestion.targetLetter,
        targetWord: currentQuestion.targetWord,
        chosenOptionLetter: option.letter,
        isCorrect,
      });
    }

    if (isCorrect) {
      // Sincronizar fase concluída no Supabase
      if (childProfile) {
        savePhaseProgressToSupabase(
          childProfile.id,
          currentPhase.id,
          currentPhase.levelId,
          3,
          'completed'
        );
      }

      // Mark current phase as completed with 3 stars!
      const updatedLevels = levels.map((lvl) => ({
        ...lvl,
        phases: lvl.phases.map((p) => {
          if (p.id === currentPhase.id) {
            return { ...p, status: 'completed' as const, starsEarned: 3 };
          }
          return p;
        }),
      }));

      // Unlock next phase if available
      const allPhases = updatedLevels.flatMap((lvl) => lvl.phases);
      const currentIndex = allPhases.findIndex((p) => p.id === currentPhase.id);

      if (currentIndex >= 0 && currentIndex + 1 < allPhases.length) {
        const nextPhaseId = allPhases[currentIndex + 1].id;
        updatedLevels.forEach((lvl) => {
          lvl.phases.forEach((p) => {
            if (p.id === nextPhaseId && p.status === 'locked') {
              p.status = 'current';
            }
          });
        });
      }

      const level1Completed = updatedLevels[0].phases.every((p) => p.status === 'completed');
      const level3Completed = updatedLevels[2]?.phases.every((p) => p.status === 'completed');

      setLevels(updatedLevels);
      try {
        localStorage.setItem('aventura_levels', JSON.stringify(updatedLevels));
      } catch {}

      // Sincronizar medalhas desbloqueadas com Supabase
      if (childProfile) {
        saveMedalToSupabase(childProfile.id, 'm4');
        if (level1Completed) {
          saveMedalToSupabase(childProfile.id, 'm5');
        }
        if (level3Completed) {
          saveMedalToSupabase(childProfile.id, 'm8');
        }
        if (totalStars + 3 >= 15) {
          saveMedalToSupabase(childProfile.id, 'm6');
        }
      }

      // Unlock medals if criteria met
      setMedals((prevMedals) => {
        const updatedMedals = prevMedals.map((m) => {
          if (m.id === 'm4' && !m.unlocked) {
            return { ...m, unlocked: true, unlockedDate: 'Hoje' };
          }
          if (m.id === 'm5' && level1Completed && !m.unlocked) {
            return { ...m, unlocked: true, unlockedDate: 'Hoje' };
          }
          if (m.id === 'm8' && level3Completed && !m.unlocked) {
            return { ...m, unlocked: true, unlockedDate: 'Hoje' };
          }
          if (m.id === 'm6' && totalStars + 3 >= 15 && !m.unlocked) {
            return { ...m, unlocked: true, unlockedDate: 'Hoje' };
          }
          return m;
        });
        try {
          localStorage.setItem('aventura_medals', JSON.stringify(updatedMedals));
        } catch {}
        persistAccountBackup(
          childProfile,
          updatedLevels,
          updatedMedals,
          completedBookIds
        );
        return updatedMedals;
      });
    }

    setCurrentScreen('feedback');
  };

  // Progress to next phase in canonical order
  const handleNextQuestion = () => {
    const allPhases = activeLevels.flatMap((lvl) => lvl.phases);
    const currentIdx = allPhases.findIndex((p) => p.id === currentPhase.id);
    const nextPhase =
      currentIdx >= 0 ? allPhases[(currentIdx + 1) % allPhases.length] : allPhases[0];

    if (nextPhase) {
      setCurrentPhase(nextPhase);
    }

    setCurrentScreen('activity');
  };

  // Retry the same question
  const handleRetryQuestion = () => {
    setCurrentScreen('activity');
  };

  // Add AI-generated storybook
  const handleAddCustomBook = (book: Storybook) => {
    setCustomBooks((prev) => {
      const updated = [book, ...prev];
      try {
        localStorage.setItem('aventura_custom_books', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Complete reading a storybook: reward stars, unlock reading medals, and sync with Supabase
  const handleCompleteBook = (book: Storybook) => {
    const isNewCompletion = !completedBookIds.includes(book.id);
    const updatedCompletedBooks = isNewCompletion
      ? [...completedBookIds, book.id]
      : completedBookIds;

    if (isNewCompletion) {
      setCompletedBookIds(updatedCompletedBooks);
      try {
        localStorage.setItem(
          'aventura_completed_books',
          JSON.stringify(updatedCompletedBooks)
        );
      } catch {}
    }

    const projectedTotalStars =
      levels.reduce(
        (acc, lvl) => acc + lvl.phases.reduce((pAcc, p) => pAcc + p.starsEarned, 0),
        0
      ) +
      updatedCompletedBooks.length * 3;

    const shouldUnlockLiteraryExplorer =
      updatedCompletedBooks.length >= 3 || Boolean(book.isGenerated);

    if (activeChildProfile) {
      void savePhaseProgressToSupabase(
        activeChildProfile.id,
        `book-${book.id}`,
        4,
        3,
        'completed'
      );
      void saveMedalToSupabase(activeChildProfile.id, 'm9');
      if (shouldUnlockLiteraryExplorer) {
        void saveMedalToSupabase(activeChildProfile.id, 'm10');
      }
      if (projectedTotalStars >= 15) {
        void saveMedalToSupabase(activeChildProfile.id, 'm6');
      }
    }

    setMedals((prevMedals) => {
      const updated = prevMedals.map((m) => {
        if (m.id === 'm9' && !m.unlocked) {
          return { ...m, unlocked: true, unlockedDate: 'Hoje' };
        }
        if (m.id === 'm10' && shouldUnlockLiteraryExplorer && !m.unlocked) {
          return { ...m, unlocked: true, unlockedDate: 'Hoje' };
        }
        if (m.id === 'm6' && projectedTotalStars >= 15 && !m.unlocked) {
          return { ...m, unlocked: true, unlockedDate: 'Hoje' };
        }
        return m;
      });

      try {
        localStorage.setItem('aventura_medals', JSON.stringify(updated));
      } catch {}

      persistAccountBackup(
        activeChildProfile,
        levels,
        updated,
        updatedCompletedBooks
      );

      return updated;
    });
  };

  // Reset entire game progress
  const handleResetProgress = () => {
    setLevels(INITIAL_LEVELS);
    setMedals(INITIAL_MEDALS);
    setCompletedBookIds([]);
    try {
      localStorage.removeItem('aventura_levels');
      localStorage.removeItem('aventura_medals');
      localStorage.removeItem('aventura_completed_books');
    } catch {}
    persistAccountBackup(activeChildProfile, INITIAL_LEVELS, INITIAL_MEDALS, []);
    playSuccessSound();
  };

  // Logout / Switch account handler (preserva backup por e-mail e encerra sessão no Supabase)
  const handleLogout = () => {
    persistAccountBackup(
      activeChildProfile,
      activeLevels,
      activeMedals,
      activeCompletedBookIds
    );
    void signOutWithSupabase();
    setChildProfile(null);
    setLevels(INITIAL_LEVELS);
    setMedals(INITIAL_MEDALS);
    setCompletedBookIds([]);
    setAuthInitialStep('auth');
    try {
      localStorage.removeItem('aventura_child_profile');
      localStorage.removeItem('aventura_parent_account');
      localStorage.removeItem('aventura_levels');
      localStorage.removeItem('aventura_medals');
      localStorage.removeItem('aventura_completed_books');
    } catch {}
    setCurrentScreen('auth');
    playPopSound();
  };

  // Sempre garante sincronia estrita entre a fase ativa e sua questão/opções
  const currentQuestion = getQuestionByPhaseId(currentPhase.id);

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9ff]">
      {/* Top Navigation Bar */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          playPopSound();
          if (
            !activeChildProfile &&
            (screen === 'map' || screen === 'activity' || screen === 'progress')
          ) {
            setCurrentScreen('auth');
            return;
          }
          if (screen === 'activity') {
            const activeOrFirst =
              activeLevels.flatMap((l) => l.phases).find((p) => p.status === 'current') ||
              activeLevels[0].phases[0];
            setCurrentPhase(activeOrFirst);
          }
          setCurrentScreen(screen);
        }}
        childProfile={activeChildProfile}
        totalStars={totalStars}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          playPopSound();
          setSoundEnabled(!soundEnabled);
        }}
        onOpenLiveVoice={() => {
          playPopSound();
          setIsLiveVoiceOpen(true);
        }}
        onOpenParentGate={() => setIsParentGateOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Screen Renderer */}
      <main className="flex-1">
        {currentScreen === 'auth' && (
          <AuthScreen
            key={`${authInitialStep}-${activeChildProfile?.id || 'anon'}`}
            existingProfile={activeChildProfile}
            initialStep={authInitialStep}
            currentLevels={activeLevels}
            currentMedals={activeMedals}
            currentCompletedBookIds={activeCompletedBookIds}
            onCompleteProfile={handleCompleteProfile}
            onSkipToPlay={() => {
              if (!activeChildProfile) {
                const defaultProfile: ChildProfile = {
                  id: 'child-default',
                  name: 'Sofia',
                  avatarId: 'fox',
                  ageGroup: '1º Ano (6 anos)',
                  createdAt: new Date().toLocaleDateString('pt-BR'),
                };
                setChildProfile(defaultProfile);
              }
              setCurrentScreen('map');
            }}
          />
        )}

        {currentScreen === 'map' && activeChildProfile && (
          <TrailMapScreen
            levels={activeLevels}
            childProfile={activeChildProfile}
            totalStars={totalStars}
            onSelectPhase={handleSelectPhase}
            onNavigateProgress={() => setCurrentScreen('progress')}
          />
        )}

        {currentScreen === 'library' && (
          <StorybookScreen
            childProfile={activeChildProfile}
            soundEnabled={soundEnabled}
            completedBookIds={activeCompletedBookIds}
            customBooks={activeCustomBooks}
            onAddCustomBook={handleAddCustomBook}
            onCompleteBook={handleCompleteBook}
            onNavigateProgress={() =>
              setCurrentScreen(activeChildProfile ? 'progress' : 'auth')
            }
            onNavigateMap={() =>
              setCurrentScreen(activeChildProfile ? 'map' : 'auth')
            }
          />
        )}

        {currentScreen === 'activity' && activeChildProfile && (
          <ActivityScreen
            key={currentQuestion.id}
            question={currentQuestion}
            currentPhase={currentPhase}
            childProfile={activeChildProfile}
            soundEnabled={soundEnabled}
            onAnswerSelected={handleAnswerSelected}
            onBackToMap={() => setCurrentScreen('map')}
          />
        )}

        {currentScreen === 'feedback' && activeChildProfile && lastSelectedOption && (
          <FeedbackScreen
            isCorrect={isAnswerCorrect}
            selectedOption={lastSelectedOption}
            question={currentQuestion}
            childProfile={activeChildProfile}
            soundEnabled={soundEnabled}
            onNextQuestion={handleNextQuestion}
            onRetryQuestion={handleRetryQuestion}
            onBackToMap={() => setCurrentScreen('map')}
          />
        )}

        {currentScreen === 'progress' && activeChildProfile && (
          <ProgressScreen
            childProfile={activeChildProfile}
            totalStars={totalStars}
            medals={activeMedals}
            completedPhasesCount={completedPhasesCount}
            totalPhasesCount={totalPhasesCount}
            onNavigateMap={() => setCurrentScreen('map')}
          />
        )}

        {currentScreen === 'dashboard' && activeChildProfile && (
          <ParentDashboard
            childProfile={activeChildProfile}
            totalStars={totalStars}
            completedPhasesCount={completedPhasesCount}
            totalPhasesCount={totalPhasesCount}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            onResetProgress={handleResetProgress}
            onEditProfile={() => {
              setAuthInitialStep('child_profile');
              setCurrentScreen('auth');
            }}
            onBackToApp={() => setCurrentScreen('map')}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Parental Gate Modal for secure area protection */}
      <ParentalGateModal
        isOpen={isParentGateOpen}
        onClose={() => setIsParentGateOpen(false)}
        onSuccess={() => {
          if (!childProfile) {
            const defaultProfile: ChildProfile = {
              id: 'child-default',
              name: 'Sofia',
              avatarId: 'fox',
              ageGroup: '1º Ano Fundamental',
              createdAt: new Date().toLocaleDateString('pt-BR'),
            };
            setChildProfile(defaultProfile);
          }
          setCurrentScreen('dashboard');
        }}
      />

      {/* Conversação por Voz em Tempo Real com a Professora Bia (Gemini Live API) */}
      <LiveVoiceAssistant
        isOpen={isLiveVoiceOpen}
        onOpen={() => setIsLiveVoiceOpen(true)}
        onClose={() => setIsLiveVoiceOpen(false)}
        childProfile={activeChildProfile}
        currentScreen={currentScreen}
        currentPhase={currentPhase}
        soundEnabled={soundEnabled}
      />

      {/* Playful Child-Safe Footer */}
      <footer className="mt-auto border-t border-blue-100 bg-white/80 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-bold text-slate-600">
            Aventura do Saber · Educação Infantil e Alfabetização Lúdica
          </p>
          <div className="flex items-center gap-4 text-slate-400 font-semibold">
            <span>Alinhado às diretrizes da BNCC</span>
            <span>·</span>
            <span>Ambiente 100% Livre de Anúncios</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
