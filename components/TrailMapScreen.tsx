'use client';

import React from 'react';
import {
  Star,
  Lock,
  Play,
  Sparkles,
  CheckCircle2,
  Trophy,
  KeyRound,
  GraduationCap,
} from 'lucide-react';
import { LevelInfo, Phase, ChildProfile } from '@/lib/types';
import {
  AVATAR_OPTIONS,
  getEducacaoInfantilProgressStats,
  getPrimeiroAnoProgressStats,
  isPrimeiroAnoAccessible,
} from '@/lib/game-data';
import { playPopSound, playSuccessSound } from '@/lib/sound';

interface TrailMapScreenProps {
  levels: LevelInfo[];
  childProfile: ChildProfile;
  totalStars: number;
  justUnlockedPrimeiroAno?: boolean;
  onSelectPhase: (phase: Phase) => void;
  onNavigateProgress: () => void;
}

export const TrailMapScreen: React.FC<TrailMapScreenProps> = ({
  levels,
  childProfile,
  totalStars,
  justUnlockedPrimeiroAno = false,
  onSelectPhase,
  onNavigateProgress,
}) => {
  const avatarObj = AVATAR_OPTIONS.find((a) => a.id === childProfile.avatarId) || AVATAR_OPTIONS[0];
  const edInfantilStats = getEducacaoInfantilProgressStats(levels);
  const primeiroAnoStats = getPrimeiroAnoProgressStats(levels);
  const primeiroAnoUnlocked = isPrimeiroAnoAccessible(levels, childProfile);
  const startedDirectlyInPrimeiroAno =
    primeiroAnoUnlocked &&
    (childProfile.cycleOrigin === 'primeiro_ano' || !edInfantilStats.isCompleted);

  // Order levels so direct 1º Ano starters see Level 4 right at the top
  const orderedLevels = startedDirectlyInPrimeiroAno
    ? [
        ...levels.filter((l) => l.cycle === 'primeiro_ano' || l.id >= 4),
        ...levels.filter((l) => (l.cycle || 'educacao_infantil') === 'educacao_infantil' && l.id < 4),
      ]
    : levels;

  // Find the currently active phase across unlocked levels
  const currentPhase =
    orderedLevels.flatMap((l) => l.phases).find((p) => p.status === 'current') ||
    orderedLevels[0].phases[0];

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-6 sm:py-10">
      {/* Hero Welcome Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 sm:p-8 text-white shadow-xl">
        {/* Soft decorative cloud shapes */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-xl" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-amber-400/20 blur-xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-3xl bg-amber-400 text-3xl sm:text-4xl shadow-[0_4px_0_#b45309] ring-4 ring-white/30">
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
              <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-white">
                {primeiroAnoUnlocked ? (
                  <GraduationCap className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  {primeiroAnoUnlocked ? 'Estudante do 1º Ano' : 'Aventureiro Mirim'}
                </span>
                <span className="text-white/40">·</span>
                <span className="text-xs font-semibold text-blue-100">{childProfile.ageGroup}</span>
                {primeiroAnoUnlocked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-950 shadow-xs">
                    <KeyRound className="h-3 w-3" />
                    <span>
                      {startedDirectlyInPrimeiroAno ? 'Ciclo 1º Ano Ativo' : '1º Ano Desbloqueado'}
                    </span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
                Olá, {childProfile.name}! 👋
              </h1>
              <p className="mt-1 text-sm text-blue-100 max-w-md">
                {startedDirectlyInPrimeiroAno
                  ? 'Sua trilha do 1º Ano do Ensino Fundamental está pronta! Qual desafio vamos jogar hoje?'
                  : edInfantilStats.isCompleted
                  ? 'Parabéns por concluir a Educação Infantil! Sua nova trilha do 1º Ano já está liberada.'
                  : 'Sua trilha de desafios está esperando. Qual letrinha vamos descobrir hoje?'}
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur-sm border border-white/20">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-amber-950 shadow-inner">
                <Star className="h-5 w-5 fill-amber-950 text-amber-950" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-amber-200 uppercase leading-none">
                  Estrelas
                </span>
                <span className="text-xl font-extrabold text-white leading-none">
                  {totalStars} ⭐
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                playPopSound();
                onNavigateProgress();
              }}
              className="flex items-center gap-1.5 rounded-2xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-amber-950 shadow-[0_3px_0_#b45309] hover:bg-amber-300 active:translate-y-0.5 active:shadow-[0_1px_0_#b45309] transition-all whitespace-nowrap cursor-pointer"
            >
              <Trophy className="h-4 w-4" />
              <span>Ver Medalhas</span>
            </button>
          </div>
        </div>

        {/* Cycle Progress Strip */}
        <div className="relative mt-5 rounded-2xl bg-white/10 px-4 py-3 border border-white/20 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-blue-100 mb-2">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-amber-300" />
              <span>
                {startedDirectlyInPrimeiroAno
                  ? 'Progresso no Ciclo: 1º Ano do Ensino Fundamental'
                  : edInfantilStats.isCompleted
                  ? 'Educação Infantil 100% Concluída · 1º Ano Fundamental Liberado!'
                  : 'Progresso para desbloquear o 1º Ano Fundamental'}
              </span>
            </span>
            <span className="font-black text-amber-200">
              {startedDirectlyInPrimeiroAno
                ? `${primeiroAnoStats.completedCount} de ${primeiroAnoStats.totalCount} fases (${primeiroAnoStats.percent}%)`
                : `${edInfantilStats.completedCount} de ${edInfantilStats.totalCount} fases (${edInfantilStats.percent}%)`}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-blue-950/40">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                edInfantilStats.isCompleted
                  ? 'bg-gradient-to-r from-amber-300 via-emerald-300 to-amber-300'
                  : 'bg-gradient-to-r from-amber-400 to-emerald-400'
              }`}
              style={{
                width: `${Math.max(
                  6,
                  startedDirectlyInPrimeiroAno
                    ? primeiroAnoStats.percent
                    : edInfantilStats.percent
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Current Mission Highlight Callout */}
        {currentPhase && (
          <div className="relative mt-4 rounded-2xl bg-white/10 p-4 border border-white/20 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm text-blue-900 font-extrabold font-display">
                {currentPhase.letter}
              </div>
              <div>
                <span className="inline-block rounded-md bg-amber-400/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-950 mb-1">
                  Missão Recomendada Agora
                </span>
                <h3 className="text-base font-extrabold text-white">
                  Fase {currentPhase.number}: {currentPhase.title} ({currentPhase.description})
                </h3>
              </div>
            </div>

            <button
              onClick={() => {
                playSuccessSound();
                onSelectPhase(currentPhase);
              }}
              className="group flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-extrabold text-white shadow-[0_4px_0_#047857] hover:bg-emerald-400 active:translate-y-1 active:shadow-[0_1px_0_#047857] transition-all whitespace-nowrap cursor-pointer"
            >
              <Play className="h-5 w-5 fill-white transition-transform group-hover:scale-110" />
              <span>JOGAR AGORA!</span>
            </button>
          </div>
        )}
      </div>

      {/* Levels Map Trail */}
      <div className="space-y-10">
        {orderedLevels.map((level) => {
          const isPrimeiroAnoLevel = level.cycle === 'primeiro_ano' || level.id >= 4;
          const levelUnlocked = !isPrimeiroAnoLevel || primeiroAnoUnlocked;

          return (
            <div
              key={level.id}
              className={`rounded-3xl border-3 p-5 sm:p-7 shadow-lg relative overflow-hidden ${
                isPrimeiroAnoLevel && levelUnlocked
                  ? 'border-amber-300 bg-gradient-to-b from-amber-50/40 via-white to-white ring-2 ring-amber-200/70'
                  : 'border-slate-200/80 bg-white'
              }`}
            >
              {/* Level Banner Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${level.accentColor} text-white font-extrabold text-xl shadow-md font-display`}
                  >
                    {isPrimeiroAnoLevel ? (
                      levelUnlocked ? (
                        <KeyRound className="h-6 w-6" />
                      ) : (
                        <Lock className="h-5 w-5" />
                      )
                    ) : (
                      level.id
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-black uppercase tracking-wider ${
                          isPrimeiroAnoLevel && levelUnlocked ? 'text-amber-700' : 'text-blue-600'
                        }`}
                      >
                        {level.badge}
                      </span>

                      {isPrimeiroAnoLevel && levelUnlocked && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-xs">
                          <Star className="h-3 w-3 fill-white" />
                          <span>
                            {justUnlockedPrimeiroAno
                              ? 'Nova Trilha Desbloqueada!'
                              : startedDirectlyInPrimeiroAno
                              ? 'Ciclo Inicial Ativo'
                              : 'Ciclo Desbloqueado'}
                          </span>
                        </span>
                      )}

                      {!isPrimeiroAnoLevel && startedDirectlyInPrimeiroAno && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-600">
                          <span>Ciclo Anterior · Sem Histórico Concluído</span>
                        </span>
                      )}

                      {isPrimeiroAnoLevel && !levelUnlocked && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-600">
                          <Lock className="h-3 w-3" />
                          <span>Conclua 100% da Educação Infantil</span>
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
                      {level.name}
                    </h2>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-medium sm:text-right max-w-xs">
                  {level.subtitle}
                </span>
              </div>

              {/* Trail Stepping Stones Grid */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {level.phases.map((phase) => {
                  const isCompleted = phase.status === 'completed';
                  const isCurrent = phase.status === 'current';
                  const isLocked = phase.status === 'locked';

                  return (
                    <div
                      key={phase.id}
                      className={`relative rounded-3xl p-5 border-3 transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'border-amber-400 bg-gradient-to-b from-amber-50/60 to-white shadow-xl ring-4 ring-amber-300/40 scale-[1.02]'
                          : isCompleted
                          ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400 shadow-md'
                          : 'border-slate-200 bg-slate-50/70 opacity-80'
                      }`}
                    >
                      {/* Top Row: Phase number badge & Stars */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-extrabold ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isCurrent
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                            {isLocked && <Lock className="h-3.5 w-3.5 text-slate-500" />}
                            <span>Fase {phase.number}</span>
                          </span>

                          {isPrimeiroAnoLevel && isCurrent && (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-amber-400 px-2 py-1 text-[10px] font-black text-amber-950">
                              <KeyRound className="h-3 w-3" />
                              <span>1º Ano</span>
                            </span>
                          )}
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((starNum) => (
                            <Star
                              key={starNum}
                              className={`h-5 w-5 ${
                                isCompleted && starNum <= phase.starsEarned
                                  ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_1px_2px_rgba(251,191,36,0.5)]'
                                  : 'text-slate-300 fill-slate-100'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Middle: Big Letter and Visual Icon */}
                      <div className="flex items-center gap-4 my-2">
                        <div
                          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl sm:text-3xl font-black font-display shadow-inner ${
                            isCurrent
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_4px_0_#c2410c]'
                              : isCompleted
                              ? 'bg-emerald-500 text-white shadow-[0_3px_0_#059669]'
                              : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {phase.letter}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 text-xl">
                            <span>{phase.icon}</span>
                            <h4 className="text-lg font-bold text-slate-800 font-display">
                              {phase.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{phase.description}</p>
                          <span className="mt-1 inline-block text-[10px] font-bold text-slate-400">
                            BNCC: {phase.bnccTag}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Action: Play / Replay or Locked */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        {isLocked ? (
                          <div className="flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-slate-500 text-center">
                            <Lock className="h-4 w-4 shrink-0" />
                            <span>
                              {isPrimeiroAnoLevel && !levelUnlocked
                                ? 'Conclua 100% da Educação Infantil para liberar'
                                : !isPrimeiroAnoLevel && startedDirectlyInPrimeiroAno
                                ? 'Ciclo anterior (início direto no 1º Ano)'
                                : 'Bloqueado (Conclua a fase anterior)'}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              playPopSound();
                              onSelectPhase(phase);
                            }}
                            className={`w-full py-2.5 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-amber-500 text-white shadow-[0_4px_0_#c2410c] hover:bg-amber-400 active:translate-y-0.5 active:shadow-[0_1px_0_#c2410c]'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            }`}
                          >
                            {isCurrent ? (
                              <>
                                <Play className="h-4 w-4 fill-white" />
                                <span>Jogar Desafio!</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 text-blue-500" />
                                <span>Jogar Novamente</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


