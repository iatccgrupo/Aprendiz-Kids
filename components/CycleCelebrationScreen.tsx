'use client';

import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  KeyRound,
  Star,
  Trophy,
  Volume2,
  ArrowRight,
  Compass,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { ChildProfile } from '@/lib/types';
import { AVATAR_OPTIONS } from '@/lib/game-data';
import {
  DEFAULT_GEMINI_TTS_VOICE,
  buildPrimeiroAnoUnlockSpeech,
  playPopSound,
  playStarSound,
  playSuccessSound,
  speakInPortuguese,
  stopSpeaking,
} from '@/lib/sound';

interface CycleCelebrationScreenProps {
  childProfile: ChildProfile;
  soundEnabled: boolean;
  totalStars: number;
  edInfantilTotalPhases: number;
  onGoToTrail: () => void;
  onStartPrimeiroAno: () => void;
}

export const CycleCelebrationScreen: React.FC<CycleCelebrationScreenProps> = ({
  childProfile,
  soundEnabled,
  totalStars,
  edInfantilTotalPhases,
  onGoToTrail,
  onStartPrimeiroAno,
}) => {
  const avatarObj =
    AVATAR_OPTIONS.find((a) => a.id === childProfile.avatarId) || AVATAR_OPTIONS[0];
  const celebratorySpeech = buildPrimeiroAnoUnlockSpeech(childProfile.name);

  useEffect(() => {
    if (soundEnabled) {
      playSuccessSound();
      setTimeout(() => playStarSound(0), 220);
      setTimeout(() => playStarSound(1), 420);
      setTimeout(() => playStarSound(2), 620);
      void speakInPortuguese(celebratorySpeech, false, DEFAULT_GEMINI_TTS_VOICE);
    }

    const fireBurst = (originX: number) => {
      confetti({
        particleCount: 70,
        spread: 75,
        origin: { x: originX, y: 0.62 },
        colors: ['#fbbf24', '#10b981', '#3b82f6', '#f43f5e', '#a855f7'],
      });
    };

    fireBurst(0.25);
    fireBurst(0.75);
    const secondWave = setTimeout(() => {
      fireBurst(0.5);
    }, 650);

    return () => {
      clearTimeout(secondWave);
      stopSpeaking();
    };
  }, [soundEnabled, celebratorySpeech]);

  const handleReplayAudio = () => {
    playPopSound();
    void speakInPortuguese(celebratorySpeech, false, DEFAULT_GEMINI_TTS_VOICE);
  };

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-[2rem] border-4 border-amber-300 bg-gradient-to-b from-amber-50 via-white to-emerald-50/70 p-6 sm:p-10 shadow-2xl text-center"
      >
        {/* Soft background glows */}
        <div className="pointer-events-none absolute -top-14 -right-14 h-52 w-52 rounded-full bg-amber-300/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-14 h-52 w-52 rounded-full bg-emerald-300/25 blur-2xl" />

        <div className="relative z-10">
          {/* Top Highlight Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-md">
            <GraduationCap className="h-4 w-4" />
            <span>Formatura da Educação Infantil</span>
            <Sparkles className="h-4 w-4" />
          </div>

          {/* Avatar + Graduation & Unlocked Key Medallion */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14 }}
              className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-amber-400 text-5xl shadow-[0_6px_0_#b45309] ring-4 ring-white"
            >
              {childProfile.avatarCustomUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={childProfile.avatarCustomUrl}
                  alt={childProfile.name}
                  className="h-full w-full rounded-3xl object-cover"
                />
              ) : (
                <span>{avatarObj.emoji}</span>
              )}
              <div className="absolute -top-3 -right-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md ring-2 ring-white">
                <KeyRound className="h-5 w-5" />
              </div>
            </motion.div>
          </div>

          {/* 3 Golden Stars */}
          <div className="mt-5 flex items-center justify-center gap-2">
            {[0, 1, 2].map((idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0, rotate: -25 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15 + idx * 0.12, type: 'spring', stiffness: 260 }}
              >
                <Star className="h-9 w-9 fill-amber-400 text-amber-500 drop-shadow-sm" />
              </motion.div>
            ))}
          </div>

          {/* Headline */}
          <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-display">
            Parabéns, {childProfile.name}! 🎉
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base sm:text-lg font-bold text-slate-700 leading-relaxed">
            Você completou <span className="text-emerald-700">100% da Educação Infantil</span> e
            acaba de desbloquear o <span className="text-amber-700">1º Ano do Ensino Fundamental</span>!
          </p>

          {/* Replay Voice Button (Kore) */}
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={handleReplayAudio}
              className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-blue-900 border-2 border-blue-300 hover:bg-blue-200 transition-colors cursor-pointer"
            >
              <Volume2 className="h-4 w-4 text-blue-700" />
              <span>Ouvir Parabéns da Professora Bia</span>
            </button>
          </div>

          {/* Unlocked Achievements Cards */}
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-xs uppercase tracking-wide">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Ciclo Concluído</span>
              </div>
              <p className="mt-1.5 text-lg font-black text-slate-900 font-display">
                {edInfantilTotalPhases} / {edInfantilTotalPhases} Fases
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-600">
                Vogais, Consoantes Amigas e Palavras Mágicas 100% completas!
              </p>
            </div>

            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-amber-800 font-black text-xs uppercase tracking-wide">
                <KeyRound className="h-4 w-4 shrink-0" />
                <span>Chave Liberada</span>
              </div>
              <p className="mt-1.5 text-lg font-black text-slate-900 font-display">
                1º Ano Fundamental
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-700">
                Novas aventuras com Encontro BR, Dígrafo CH e Leitura Brilhante!
              </p>
            </div>

            <div className="rounded-2xl border-2 border-rose-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-rose-700 font-black text-xs uppercase tracking-wide">
                <Trophy className="h-4 w-4 shrink-0" />
                <span>Medalha Especial</span>
              </div>
              <p className="mt-1.5 text-lg font-black text-slate-900 font-display">
                🎓 Formando!
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-600">
                Salva no seu perfil com {totalStars} estrelas brilhantes!
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                playSuccessSound();
                stopSpeaking();
                onStartPrimeiroAno();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-sm sm:text-base font-black text-white shadow-[0_5px_0_#047857] hover:bg-emerald-400 active:translate-y-1 active:shadow-[0_1px_0_#047857] transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="h-5 w-5" />
              <span>Começar 1º Ano Agora</span>
              <ArrowRight className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                playPopSound();
                stopSpeaking();
                onGoToTrail();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-amber-400 px-7 py-4 text-sm sm:text-base font-black text-amber-950 shadow-[0_5px_0_#b45309] hover:bg-amber-300 active:translate-y-1 active:shadow-[0_1px_0_#b45309] transition-all cursor-pointer whitespace-nowrap"
            >
              <Compass className="h-5 w-5" />
              <span>Ver Nova Trilha do 1º Ano</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
