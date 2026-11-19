'use client';

import React from 'react';
import Image from 'next/image';
import {
  Compass,
  Sparkles,
  User,
  Award,
  ShieldCheck,
  Volume2,
  VolumeX,
  BookOpen,
  Mic,
  KeyRound,
  Star,
  LogOut,
} from 'lucide-react';
import { ChildProfile, ScreenState } from '@/lib/types';
import { AVATAR_OPTIONS } from '@/lib/game-data';

interface NavbarProps {
  currentScreen: ScreenState;
  onNavigate: (screen: ScreenState) => void;
  childProfile: ChildProfile | null;
  totalStars: number;
  primeiroAnoUnlocked?: boolean;
  highlightPrimeiroAno?: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenParentGate: () => void;
  onOpenLiveVoice?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  childProfile,
  totalStars,
  primeiroAnoUnlocked = false,
  highlightPrimeiroAno = false,
  soundEnabled,
  onToggleSound,
  onOpenParentGate,
  onOpenLiveVoice,
  onLogout,
}) => {
  const avatarObj = AVATAR_OPTIONS.find((a) => a.id === childProfile?.avatarId) || AVATAR_OPTIONS[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:px-4">
        {/* Zone 1: Compact Brand element */}
        <button
          onClick={() => onNavigate(childProfile ? 'map' : 'auth')}
          className="group flex items-center gap-2 text-left transition-transform active:scale-95 cursor-pointer shrink-0"
        >
          <span className="relative block h-8 w-9 sm:h-9 sm:w-11 shrink-0 overflow-hidden rounded-lg bg-amber-50 p-0.5 border border-amber-200 shadow-xs">
            <Image
              src="/assets/aistudio/logo_aprendiz_kids_088c8185.jpg"
              alt="Aprendiz Kids Logo"
              fill
              className="object-contain"
              referrerPolicy="no-referrer"
              priority
            />
          </span>
          <span className="block leading-none">
            <span className="block text-sm sm:text-base xl:text-lg font-black tracking-tight text-blue-900 font-display whitespace-nowrap">
              Aprendiz <span className="text-amber-500">Kids</span>
            </span>
          </span>
        </button>

        {/* Zone 2: Compact Single-Line Navigation Links */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 min-w-0">
          <button
            onClick={() => onNavigate(childProfile ? 'map' : 'auth')}
            className={`flex items-center gap-1 xl:gap-1.5 px-1.5 xl:px-2.5 py-1.5 rounded-lg text-[11px] xl:text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              currentScreen === 'map'
                ? 'bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-200'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            <Compass className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="whitespace-nowrap">Trilha de Fases</span>
            {childProfile && primeiroAnoUnlocked && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-black whitespace-nowrap shrink-0 ${
                  highlightPrimeiroAno
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-xs'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
                title="1º Ano do Ensino Fundamental Desbloqueado!"
              >
                {highlightPrimeiroAno ? (
                  <Star className="h-2.5 w-2.5 fill-white" />
                ) : (
                  <KeyRound className="h-2.5 w-2.5 text-amber-700" />
                )}
                <span>1º Ano</span>
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('library')}
            className={`flex items-center gap-1 xl:gap-1.5 px-1.5 xl:px-2.5 py-1.5 rounded-lg text-[11px] xl:text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              currentScreen === 'library'
                ? 'bg-sky-50 text-sky-800 shadow-xs ring-1 ring-sky-200'
                : 'text-slate-600 hover:text-sky-700 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-sky-500 shrink-0" />
            <span className="whitespace-nowrap">Livros</span>
          </button>

          <button
            onClick={() => onNavigate('activity')}
            className={`flex items-center gap-1 xl:gap-1.5 px-1.5 xl:px-2.5 py-1.5 rounded-lg text-[11px] xl:text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              currentScreen === 'activity' || currentScreen === 'feedback'
                ? 'bg-amber-50 text-amber-800 shadow-xs ring-1 ring-amber-200'
                : 'text-slate-600 hover:text-amber-600 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="whitespace-nowrap">Atividade Sonora</span>
          </button>

          <button
            onClick={() => onNavigate('progress')}
            className={`flex items-center gap-1 xl:gap-1.5 px-1.5 xl:px-2.5 py-1.5 rounded-lg text-[11px] xl:text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              currentScreen === 'progress'
                ? 'bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-200'
                : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
            }`}
          >
            <Award className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="whitespace-nowrap">Meu Progresso</span>
          </button>

          <button
            onClick={onOpenParentGate}
            className={`flex items-center gap-1 xl:gap-1.5 px-1.5 xl:px-2.5 py-1.5 rounded-lg text-[11px] xl:text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              currentScreen === 'dashboard'
                ? 'bg-purple-50 text-purple-800 shadow-xs ring-1 ring-purple-200'
                : 'text-slate-600 hover:text-purple-600 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span className="whitespace-nowrap">Área dos Pais</span>
          </button>
        </nav>

        {/* Zone 3: Compact Audio Control, Live Voice & Child Profile / Auth Action */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenLiveVoice && (
            <button
              type="button"
              onClick={onOpenLiveVoice}
              aria-label="Conversar por voz em tempo real com a Professora Bia"
              className="flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-2 py-1.5 text-[11px] font-black text-rose-700 hover:bg-rose-100 transition-colors shadow-xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              title="Conversar por voz ao vivo com a Professora Bia"
            >
              <Mic className="h-3.5 w-3.5 text-rose-600 shrink-0" />
              <span className="hidden xl:inline">Voz ao Vivo</span>
              <span className="hidden sm:inline xl:hidden">Voz</span>
            </button>
          )}

          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Silenciar áudio' : 'Ativar áudio'}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors shadow-xs active:scale-95 shrink-0 cursor-pointer"
            title={soundEnabled ? 'Sons ativados' : 'Sons silenciados'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-blue-600" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
          </button>

          {childProfile ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onNavigate('progress')}
                className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-xs hover:border-amber-400 transition-all active:scale-95 cursor-pointer shrink-0"
                title="Ver perfil da criança"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-sm shadow-inner shrink-0">
                  {childProfile.avatarCustomUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={childProfile.avatarCustomUrl}
                      alt={childProfile.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{avatarObj.emoji}</span>
                  )}
                </span>
                <span className="block text-left leading-none">
                  <span className="block text-[11px] font-bold text-slate-800 leading-tight truncate max-w-[56px] sm:max-w-[76px] xl:max-w-[100px]">
                    {childProfile.name}
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-700 flex items-center gap-0.5 tabular-nums">
                    ★ {totalStars}
                  </span>
                </span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title="Sair / Trocar de Conta"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-[0_2px_0_#1d4ed8] hover:bg-blue-700 active:translate-y-0.5 active:shadow-[0_1px_0_#1d4ed8] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <User className="h-3.5 w-3.5 shrink-0" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile & Tablet Sub-Navigation Bar */}
      <div className="flex lg:hidden items-center justify-around border-t border-slate-100 bg-white/90 px-1 py-1.5">
        <button
          onClick={() => onNavigate(childProfile ? 'map' : 'auth')}
          className={`relative flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentScreen === 'map' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <span className="relative inline-flex items-center">
            <Compass className="h-3.5 w-3.5" />
            {childProfile && primeiroAnoUnlocked && (
              <Star className="h-2.5 w-2.5 -ml-1 -mt-2 fill-amber-400 text-amber-500" />
            )}
          </span>
          <span>Trilha</span>
        </button>
        <button
          onClick={() => onNavigate('library')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentScreen === 'library' ? 'text-sky-600' : 'text-slate-500'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Livros</span>
        </button>
        <button
          onClick={() => onNavigate('activity')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentScreen === 'activity' || currentScreen === 'feedback' ? 'text-amber-600' : 'text-slate-500'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Atividade</span>
        </button>
        <button
          onClick={() => onNavigate('progress')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentScreen === 'progress' ? 'text-emerald-600' : 'text-slate-500'
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          <span>Progresso</span>
        </button>
        <button
          onClick={onOpenParentGate}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentScreen === 'dashboard' ? 'text-purple-600' : 'text-slate-500'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Pais</span>
        </button>
      </div>
    </header>
  );
};
