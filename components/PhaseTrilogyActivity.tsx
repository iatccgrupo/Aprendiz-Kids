'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Volume2,
  Sparkles,
  Pencil,
  RotateCcw,
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import {
  ActivityQuestion,
  ActivityOption,
  Phase,
  ChildProfile,
} from '@/lib/types';
import {
  AVATAR_OPTIONS,
  getPhaseTrilogyConfig,
  PhaseThemeColor,
  TrilogyWordHuntItem,
  TracePoint,
  TraceStrokeSpec,
  validatePhaseQuestionSync,
} from '@/lib/game-data';
import {
  DEFAULT_GEMINI_TTS_VOICE,
  buildCorrectFeedbackSpeech,
  buildRetryFeedbackSpeech,
  prefetchSpeechInPortuguese,
  speakInPortuguese,
  stopSpeaking,
  playPopSound,
  playSuccessSound,
  playStarSound,
  playTryAgainSound,
} from '@/lib/sound';
import { isPhonemeAnswerCorrect, normalizePhonemeString } from '@/lib/utils';

type TrilogyStation = 'explore' | 'trace' | 'word_hunt' | 'challenge';

interface PhaseTrilogyActivityProps {
  question: ActivityQuestion;
  currentPhase: Phase;
  childProfile: ChildProfile;
  soundEnabled: boolean;
  onAnswerSelected: (option: ActivityOption) => void;
  onBackToMap: () => void;
}

interface ThemePalette {
  badgeBg: string;
  badgeText: string;
  tabBorder: string;
  activeTab: string;
  doneTab: string;
  cardBorder: string;
  mascotBoxBg: string;
  mascotCircle: string;
  mascotShadow: string;
  canvasBg: string;
  canvasRule: string;
  guideStroke: string;
  drawStroke: string;
  markerBg: string;
  progressBar: string;
  accentText: string;
}

const THEME_PALETTES: Record<PhaseThemeColor, ThemePalette> = {
  emerald: {
    badgeBg: 'bg-emerald-100 border-emerald-300',
    badgeText: 'text-emerald-900',
    tabBorder: 'border-emerald-200',
    activeTab: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_3px_0_#047857]',
    doneTab: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
    cardBorder: 'border-emerald-200',
    mascotBoxBg: 'from-emerald-50 to-teal-50 border-emerald-200',
    mascotCircle: 'from-emerald-400 to-teal-500 ring-emerald-200',
    mascotShadow: 'shadow-[0_8px_0_#047857]',
    canvasBg: '#f0fdf4',
    canvasRule: '#bbf7d0',
    guideStroke: '#86efac',
    drawStroke: '#059669',
    markerBg: '#059669',
    progressBar: 'from-emerald-400 to-teal-500',
    accentText: 'text-emerald-600',
  },
  amber: {
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-900',
    tabBorder: 'border-amber-200',
    activeTab: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_3px_0_#b45309]',
    doneTab: 'bg-amber-50 text-amber-900 hover:bg-amber-100',
    cardBorder: 'border-amber-200',
    mascotBoxBg: 'from-amber-50 to-yellow-50 border-amber-200',
    mascotCircle: 'from-amber-400 to-orange-500 ring-amber-200',
    mascotShadow: 'shadow-[0_8px_0_#b45309]',
    canvasBg: '#fffbeb',
    canvasRule: '#fde68a',
    guideStroke: '#fcd34d',
    drawStroke: '#d97706',
    markerBg: '#d97706',
    progressBar: 'from-amber-400 to-orange-500',
    accentText: 'text-amber-600',
  },
  blue: {
    badgeBg: 'bg-blue-100 border-blue-300',
    badgeText: 'text-blue-900',
    tabBorder: 'border-blue-200',
    activeTab: 'bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-[0_3px_0_#1d4ed8]',
    doneTab: 'bg-blue-50 text-blue-900 hover:bg-blue-100',
    cardBorder: 'border-blue-200',
    mascotBoxBg: 'from-sky-50 to-blue-50 border-blue-200',
    mascotCircle: 'from-blue-400 to-sky-500 ring-blue-200',
    mascotShadow: 'shadow-[0_8px_0_#1d4ed8]',
    canvasBg: '#eff6ff',
    canvasRule: '#bfdbfe',
    guideStroke: '#93c5fd',
    drawStroke: '#2563eb',
    markerBg: '#2563eb',
    progressBar: 'from-blue-400 to-sky-500',
    accentText: 'text-blue-600',
  },
  purple: {
    badgeBg: 'bg-purple-100 border-purple-300',
    badgeText: 'text-purple-900',
    tabBorder: 'border-purple-200',
    activeTab: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-[0_3px_0_#6d28d9]',
    doneTab: 'bg-purple-50 text-purple-900 hover:bg-purple-100',
    cardBorder: 'border-purple-200',
    mascotBoxBg: 'from-purple-50 to-indigo-50 border-purple-200',
    mascotCircle: 'from-purple-400 to-indigo-500 ring-purple-200',
    mascotShadow: 'shadow-[0_8px_0_#6d28d9]',
    canvasBg: '#faf5ff',
    canvasRule: '#e9d5ff',
    guideStroke: '#d8b4fe',
    drawStroke: '#7c3aed',
    markerBg: '#7c3aed',
    progressBar: 'from-purple-400 to-indigo-500',
    accentText: 'text-purple-600',
  },
  orange: {
    badgeBg: 'bg-orange-100 border-orange-300',
    badgeText: 'text-orange-900',
    tabBorder: 'border-orange-200',
    activeTab: 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-[0_3px_0_#c2410c]',
    doneTab: 'bg-orange-50 text-orange-900 hover:bg-orange-100',
    cardBorder: 'border-orange-200',
    mascotBoxBg: 'from-orange-50 to-amber-50 border-orange-200',
    mascotCircle: 'from-orange-400 to-rose-500 ring-orange-200',
    mascotShadow: 'shadow-[0_8px_0_#c2410c]',
    canvasBg: '#fff7ed',
    canvasRule: '#fed7aa',
    guideStroke: '#fdba74',
    drawStroke: '#ea580c',
    markerBg: '#ea580c',
    progressBar: 'from-orange-400 to-rose-500',
    accentText: 'text-orange-600',
  },
};

function sampleCheckpointsFromStrokes(strokes: TraceStrokeSpec[]): TracePoint[] {
  const checkpoints: TracePoint[] = [];
  for (const stroke of strokes) {
    const pts = stroke.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const segLen = Math.hypot(b.x - a.x, b.y - a.y);
      const subSteps = Math.max(1, Math.round(segLen / 34));
      for (let s = 0; s <= subSteps; s++) {
        const t = s / subSteps;
        const px = Math.round(a.x + (b.x - a.x) * t);
        const py = Math.round(a.y + (b.y - a.y) * t);
        const tooClose = checkpoints.some(
          (existing) => Math.hypot(existing.x - px, existing.y - py) < 22
        );
        if (!tooClose) {
          checkpoints.push({ x: px, y: py });
        }
      }
    }
  }
  return checkpoints;
}

function renderHighlightedWord(word: string, highlightSegment?: string) {
  if (!highlightSegment) return <span>{word}</span>;
  const lowerWord = word.toLowerCase();
  const lowerSeg = highlightSegment.toLowerCase();
  const idx = lowerWord.indexOf(lowerSeg);
  if (idx === -1) return <span>{word}</span>;

  const before = word.slice(0, idx);
  const match = word.slice(idx, idx + highlightSegment.length);
  const after = word.slice(idx + highlightSegment.length);

  return (
    <span>
      {before}
      <span className="text-emerald-700 underline decoration-2 underline-offset-2">
        {match}
      </span>
      {after}
    </span>
  );
}

export const PhaseTrilogyActivity: React.FC<PhaseTrilogyActivityProps> = ({
  question,
  currentPhase,
  childProfile,
  soundEnabled,
  onAnswerSelected,
  onBackToMap,
}) => {
  const config = getPhaseTrilogyConfig(currentPhase.id);
  const palette = THEME_PALETTES[config.themeColor];
  const totalTargetMatches = useMemo(
    () => config.wordHuntItems.filter((w) => w.isMatch).length,
    [config.wordHuntItems]
  );

  const [station, setStation] = useState<TrilogyStation>('explore');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Estação 1: Mascote interativo + som fonético
  const [mascotJumpCount, setMascotJumpCount] = useState(0);
  const [hasTappedMascot, setHasTappedMascot] = useState(false);
  const [heardPhoneme, setHeardPhoneme] = useState(false);

  // Estação 2: Traçado guiado no Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const visitedCheckpointsRef = useRef<Set<number>>(new Set());
  const [traceProgress, setTraceProgress] = useState(0);
  const [traceCompleted, setTraceCompleted] = useState(false);

  const traceCheckpoints = useMemo(
    () => sampleCheckpointsFromStrokes(config.traceStrokes),
    [config.traceStrokes]
  );

  // Estação 3: Minijogo Caça-Palavras / Rimas
  const [foundWordIds, setFoundWordIds] = useState<string[]>([]);
  const [wordHuntFeedback, setWordHuntFeedback] = useState<string>(config.wordHuntPrompt);

  // Estação 4: Desafio Final sincronizado com Supabase
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const avatarObj =
    AVATAR_OPTIONS.find((a) => a.id === childProfile.avatarId) || AVATAR_OPTIONS[0];

  // Validação de integridade entre fase, questão e opções
  useEffect(() => {
    validatePhaseQuestionSync(currentPhase, question);
  }, [currentPhase, question]);

  const speakSafely = useCallback(
    async (text: string, slow: boolean = false) => {
      if (!soundEnabled) return;
      setIsPlayingAudio(true);
      await speakInPortuguese(text, slow, DEFAULT_GEMINI_TTS_VOICE);
      setIsPlayingAudio(false);
    },
    [soundEnabled]
  );

  // Pré-carregar áudios principais e de parabéns ao abrir a fase para eliminar lentidão
  useEffect(() => {
    if (!soundEnabled) return;

    prefetchSpeechInPortuguese(
      buildCorrectFeedbackSpeech(childProfile.name, question.targetLetter),
      false,
      DEFAULT_GEMINI_TTS_VOICE
    );
    prefetchSpeechInPortuguese(
      buildRetryFeedbackSpeech(childProfile.name),
      false,
      DEFAULT_GEMINI_TTS_VOICE
    );
    prefetchSpeechInPortuguese(
      question.spokenPrompt,
      false,
      DEFAULT_GEMINI_TTS_VOICE
    );
    prefetchSpeechInPortuguese(
      config.traceSuccessSpeech,
      false,
      DEFAULT_GEMINI_TTS_VOICE
    );
  }, [
    soundEnabled,
    childProfile.name,
    question.targetLetter,
    question.spokenPrompt,
    config.traceSuccessSpeech,
  ]);

  // Fala boas-vindas da fase ao carregar
  useEffect(() => {
    if (!soundEnabled) return;
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        void speakSafely(config.welcomeSpeech, false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [soundEnabled, config.welcomeSpeech, speakSafely]);

  const handleTapMascot = async () => {
    playPopSound();
    setMascotJumpCount((prev) => prev + 1);
    setHasTappedMascot(true);
    setHeardPhoneme(true);
    await speakSafely(config.tappedSpeech, false);
  };

  const handlePlayPhonemeOnly = async () => {
    playPopSound();
    setHeardPhoneme(true);
    await speakSafely(config.phonemeSpeech, true);
  };

  // =========================================================================
  // Lógica de Traçado Guiado no Canvas para qualquer letra / sílaba
  // =========================================================================
  const drawTracingGuide = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);

      // Fundo estilo caderno infantil
      ctx.fillStyle = palette.canvasBg;
      ctx.fillRect(0, 0, width, height);

      // Linha pautada central
      ctx.save();
      ctx.strokeStyle = palette.canvasRule;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(24, height * 0.5);
      ctx.lineTo(width - 24, height * 0.5);
      ctx.stroke();
      ctx.restore();

      // Guias tracejados dos traços da letra/sílaba
      ctx.save();
      ctx.strokeStyle = palette.guideStroke;
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([10, 12]);

      for (const stroke of config.traceStrokes) {
        if (stroke.points.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Marcadores numéricos de direção (1, 2, 3...)
      for (const stroke of config.traceStrokes) {
        ctx.save();
        ctx.fillStyle = palette.markerBg;
        ctx.beginPath();
        ctx.arc(stroke.markerPos.x, stroke.markerPos.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stroke.marker, stroke.markerPos.x, stroke.markerPos.y);
        ctx.restore();
      }
    },
    [config.traceStrokes, palette.canvasBg, palette.canvasRule, palette.guideStroke, palette.markerBg]
  );

  useEffect(() => {
    if (station !== 'trace') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawTracingGuide(ctx, canvas.width, canvas.height);
  }, [station, drawTracingGuide]);

  const resetTracingCanvas = () => {
    playPopSound();
    visitedCheckpointsRef.current.clear();
    setTraceProgress(0);
    setTraceCompleted(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      drawTracingGuide(ctx, canvas.width, canvas.height);
    }
  };

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const registerTraceCheckpoint = (x: number, y: number) => {
    if (traceCheckpoints.length === 0) return;

    traceCheckpoints.forEach((cp, idx) => {
      if (Math.hypot(x - cp.x, y - cp.y) <= 28) {
        visitedCheckpointsRef.current.add(idx);
      }
    });

    const requiredCount = Math.max(1, Math.ceil(traceCheckpoints.length * 0.72));
    const progress = Math.min(
      100,
      Math.round((visitedCheckpointsRef.current.size / requiredCount) * 100)
    );
    setTraceProgress(progress);

    if (!traceCompleted && visitedCheckpointsRef.current.size >= requiredCount) {
      setTraceCompleted(true);
      playSuccessSound();
      void speakSafely(config.traceSuccessSpeech, false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const { x, y } = getCanvasPoint(e);

    ctx.strokeStyle = palette.drawStroke;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    registerTraceCheckpoint(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCanvasPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    registerTraceCheckpoint(x, y);
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  // =========================================================================
  // Estação 3: Minijogo Caça-Palavras / Rimas
  // =========================================================================
  const handleSelectWordHuntItem = (item: TrilogyWordHuntItem) => {
    if (foundWordIds.includes(item.id)) return;

    if (item.isMatch) {
      const updated = [...foundWordIds, item.id];
      setFoundWordIds(updated);
      playStarSound(updated.length - 1);

      if (updated.length >= totalTargetMatches) {
        setWordHuntFeedback(
          `Incrível! Você encontrou todas as ${totalTargetMatches} palavras que ${config.wordHuntRuleLabel}!`
        );
        playSuccessSound();
        void speakSafely(
          `Isso mesmo! ${item.word}! Você encontrou todas as palavras certas!`,
          false
        );
      } else {
        setWordHuntFeedback(
          `Muito bem! "${item.word}" está certinha! Continue procurando!`
        );
        void speakSafely(`Muito bem! ${item.word}!`, false);
      }
    } else {
      playTryAgainSound();
      setWordHuntFeedback(
        `Quase! "${item.word}" começa com a letra ${item.initialLetter}. Procure as que ${config.wordHuntRuleLabel}!`
      );
      void speakSafely(
        `Quase! ${item.word} começa com ${item.initialLetter}. Tente outra figura!`,
        false
      );
    }
  };

  // =========================================================================
  // Estação 4: Desafio Final (registra atividade e salva estrelas no Supabase)
  // =========================================================================
  const handleSelectFinalOption = useCallback(
    (option: ActivityOption) => {
      if (selectedOptionId) return;
      playPopSound();
      setSelectedOptionId(option.id);

      const validatedIsCorrect =
        isPhonemeAnswerCorrect(option.letter, question.targetLetter) || option.isCorrect;

      setTimeout(() => {
        onAnswerSelected({
          ...option,
          isCorrect: validatedIsCorrect,
        });
      }, 240);
    },
    [selectedOptionId, question.targetLetter, onAnswerSelected]
  );

  // Atalho de teclado na Estação 4
  useEffect(() => {
    if (station !== 'challenge') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedOptionId || event.metaKey || event.ctrlKey || event.altKey) return;
      const normalizedKey = normalizePhonemeString(event.key);
      if (!normalizedKey || normalizedKey.length !== 1) return;

      const matchedOption = question.options.find(
        (opt) => normalizePhonemeString(opt.letter) === normalizedKey
      );
      if (matchedOption) {
        handleSelectFinalOption({
          ...matchedOption,
          isCorrect:
            isPhonemeAnswerCorrect(event.key, question.targetLetter) ||
            isPhonemeAnswerCorrect(matchedOption.letter, question.targetLetter) ||
            matchedOption.isCorrect,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [station, question.options, question.targetLetter, selectedOptionId, handleSelectFinalOption]);

  const stations: Array<{ id: TrilogyStation; label: string; done: boolean }> = [
    { id: 'explore', label: `1. ${config.mascotName.split(' ')[0]} & Som`, done: heardPhoneme },
    { id: 'trace', label: `2. Traçar ${config.traceDisplayChar}`, done: traceCompleted },
    {
      id: 'word_hunt',
      label: config.wordHuntTabLabel,
      done: foundWordIds.length >= totalTargetMatches,
    },
    { id: 'challenge', label: '4. Desafio Final', done: false },
  ];

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-6 sm:py-8">
      {/* Top Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            stopSpeaking();
            playPopSound();
            onBackToMap();
          }}
          className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs sm:text-sm font-extrabold text-slate-700 shadow-[0_3px_0_#cbd5e1] hover:bg-slate-50 active:translate-y-0.5 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Mapa</span>
        </button>

        <div className={`flex items-center gap-2 rounded-2xl px-4 py-2 border ${palette.badgeBg}`}>
          <span className={`text-xs font-black uppercase ${palette.badgeText}`}>
            Fase {currentPhase.number}
          </span>
          <span className="opacity-40">·</span>
          <span className={`text-xs font-extrabold ${palette.badgeText}`}>
            {config.titleBadge}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            playPopSound();
            setShowHint(!showHint);
          }}
          className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
            showHint
              ? 'bg-amber-400 text-amber-950 shadow-sm'
              : 'bg-white text-slate-600 shadow-[0_2px_0_#cbd5e1] hover:bg-amber-50'
          }`}
        >
          <HelpCircle className="h-4 w-4 text-amber-600" />
          <span>Dica</span>
        </button>
      </div>

      {/* Station Switcher Tabs */}
      <div className={`mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2 rounded-3xl border-2 shadow-sm ${palette.tabBorder}`}>
        {stations.map((item) => {
          const isActive = station === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                playPopSound();
                setStation(item.id);
                if (item.id === 'challenge') {
                  void speakSafely(question.spokenPrompt, false);
                }
              }}
              className={`flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-black transition-all cursor-pointer ${
                isActive
                  ? palette.activeTab
                  : item.done
                  ? palette.doneTab
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.done && !isActive && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              )}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dica do Mascote */}
      {showHint && (
        <div className="mb-5 rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 text-center flex items-center justify-center gap-3 shadow-sm">
          <span className="text-3xl">{avatarObj.emoji}</span>
          <p className="text-xs sm:text-sm font-bold text-amber-950">{question.hintText}</p>
        </div>
      )}

      {/* Main Card Container */}
      <div className={`rounded-3xl border-3 bg-white p-5 sm:p-8 shadow-xl relative overflow-hidden ${palette.cardBorder}`}>
        {/* ESTAÇÃO 1: ANIMAÇÃO DO MASCOTE + SOM FONÉTICO */}
        {station === 'explore' && (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                {config.exploreHeading}
              </h2>
              <p className="mt-1 text-sm text-slate-600 font-medium">
                {config.exploreSubtitle}
              </p>
            </div>

            <div className={`mx-auto max-w-lg rounded-3xl bg-gradient-to-b border-2 p-6 flex flex-col items-center gap-4 ${palette.mascotBoxBg}`}>
              <motion.button
                type="button"
                onClick={handleTapMascot}
                animate={
                  mascotJumpCount > 0
                    ? {
                        y: [0, -24, 0, -12, 0],
                        rotate: [0, -8, 8, -4, 0],
                        scale: [1, 1.12, 1.04, 1.08, 1],
                      }
                    : { y: [0, -6, 0] }
                }
                transition={
                  mascotJumpCount > 0
                    ? { duration: 0.7, ease: 'easeOut' }
                    : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
                }
                key={mascotJumpCount}
                className={`relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br ring-6 cursor-pointer hover:brightness-105 active:translate-y-1 ${palette.mascotCircle} ${palette.mascotShadow}`}
                title={`Toque em ${config.mascotName}!`}
              >
                <span className="text-7xl select-none" role="img" aria-label={config.mascotName}>
                  {config.mascotEmoji}
                </span>
                <span className="absolute -bottom-2 -right-2 flex h-12 min-w-12 px-2 items-center justify-center rounded-2xl bg-amber-400 text-xl sm:text-2xl font-black text-amber-950 shadow-[0_3px_0_#b45309] font-display">
                  {question.targetLetter}
                </span>
              </motion.button>

              <div className="rounded-2xl bg-white px-4 py-3 border border-slate-200 text-sm font-bold text-slate-900 shadow-xs max-w-md">
                {hasTappedMascot ? config.tappedGreeting : config.initialGreeting}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handlePlayPhonemeOnly}
                  className="flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-black text-amber-950 shadow-[0_4px_0_#b45309] hover:bg-amber-300 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <Volume2 className={`h-5 w-5 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                  <span>{config.phonemeButtonLabel}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setStation('trace');
                  }}
                  className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-[0_4px_0_#1d4ed8] hover:bg-blue-500 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Ir para o Traçado</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ESTAÇÃO 2: TRAÇADO GUIADO NO CANVAS */}
        {station === 'trace' && (
          <div className="text-center space-y-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                Traçado Guiado:{' '}
                <span className={palette.accentText}>{config.traceDisplayChar}</span>
              </h2>
              <p className="mt-1 text-sm text-slate-600 font-medium">
                {config.traceInstruction}
              </p>
            </div>

            <div className="mx-auto max-w-md flex flex-col items-center gap-4">
              <div className="w-full flex items-center justify-between text-xs font-extrabold text-slate-700 px-1">
                <span>Progresso do traçado:</span>
                <span className={`tabular-nums ${palette.accentText}`}>{traceProgress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <div
                  className={`h-full bg-gradient-to-r transition-all duration-200 ${palette.progressBar}`}
                  style={{ width: `${traceProgress}%` }}
                />
              </div>

              <div className={`relative rounded-3xl border-4 overflow-hidden shadow-inner ${palette.tabBorder}`}>
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={280}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="touch-none cursor-crosshair block w-full max-w-[320px] h-auto"
                />
              </div>

              {traceCompleted && (
                <div className="rounded-2xl bg-emerald-100 border-2 border-emerald-300 px-4 py-2.5 text-sm font-black text-emerald-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <span>Traçado perfeito de {config.traceDisplayChar}!</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={resetTracingCanvas}
                  className="flex items-center gap-2 rounded-full bg-slate-100 px-5 py-3 text-xs font-extrabold text-slate-700 shadow-[0_3px_0_#cbd5e1] hover:bg-slate-200 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Limpar Traçado</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setStation('word_hunt');
                  }}
                  className="flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-black text-white shadow-[0_4px_0_#047857] hover:bg-emerald-400 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                  <span>Jogar Caça-Palavras</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ESTAÇÃO 3: MINIJOGO DE CAÇA ÀS PALAVRAS / RIMAS */}
        {station === 'word_hunt' && (
          <div className="text-center space-y-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                {config.wordHuntTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-600 font-medium">
                Encontradas:{' '}
                <strong className="text-emerald-700 tabular-nums">
                  {foundWordIds.length} de {totalTargetMatches}
                </strong>{' '}
                palavras mágicas
              </p>
            </div>

            <div className="mx-auto max-w-xl rounded-2xl bg-blue-50 border-2 border-blue-200 px-4 py-3 text-xs sm:text-sm font-bold text-blue-900">
              {wordHuntFeedback}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
              {config.wordHuntItems.map((item) => {
                const isFound = foundWordIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectWordHuntItem(item)}
                    className={`relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl border-3 transition-all cursor-pointer ${
                      isFound
                        ? 'border-emerald-500 bg-emerald-100 text-emerald-950 shadow-[0_3px_0_#059669] scale-[0.98]'
                        : 'border-amber-200 bg-amber-50/50 text-slate-800 shadow-[0_5px_0_#cbd5e1] hover:bg-amber-50 active:translate-y-1'
                    }`}
                  >
                    {isFound && (
                      <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    )}
                    <span className="text-4xl sm:text-5xl mb-2">{item.icon}</span>
                    <span className="text-base sm:text-lg font-black font-display">
                      {isFound
                        ? renderHighlightedWord(item.word, item.highlightSegment)
                        : item.word}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setStation('challenge');
                  void speakSafely(question.spokenPrompt, false);
                }}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3.5 text-sm sm:text-base font-black text-white shadow-[0_5px_0_#c2410c] hover:brightness-105 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <Sparkles className="h-5 w-5" />
                <span>Ir para o Desafio Final da Fase {currentPhase.number}!</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* ESTAÇÃO 4: DESAFIO FINAL (SINCRONIZADO COM SUPABASE E FEEDBACK) */}
        {station === 'challenge' && (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                {question.spokenPrompt}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Toque no botão de som e escolha o card correto de{' '}
                <strong className={palette.accentText}>
                  {question.targetLetter} ({question.targetWord})
                </strong>{' '}
                para conquistar suas estrelas!
              </p>
            </div>

            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative">
                {isPlayingAudio && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
                    <div className="absolute -inset-4 rounded-full bg-amber-300/20 animate-pulse" />
                  </>
                )}

                <button
                  type="button"
                  onClick={() => void speakSafely(question.spokenPrompt, false)}
                  className="group relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-[0_6px_0_#c2410c] hover:brightness-105 active:translate-y-1 transition-all cursor-pointer"
                  title="Ouvir instrução da fase"
                >
                  <Volume2
                    className={`h-12 w-12 text-white ${
                      isPlayingAudio ? 'scale-110 animate-bounce' : ''
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={() => void speakSafely(question.spokenPrompt, false)}
                className="mt-3 text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Ouvir novamente</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
              {question.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectFinalOption(option)}
                    className={`group relative flex flex-col items-center justify-between p-4 sm:p-6 rounded-3xl border-3 transition-all cursor-pointer ${
                      option.colorClass
                    } ${
                      isSelected
                        ? 'scale-95 shadow-[0_2px_0_#94a3b8] translate-y-1'
                        : 'shadow-[0_6px_0_#94a3b8] hover:brightness-105 active:translate-y-1'
                    }`}
                  >
                    <span className="text-5xl sm:text-6xl font-black font-display tracking-tight transition-transform group-hover:scale-105">
                      {option.letter}
                    </span>
                    <div className="mt-3 flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 shadow-xs">
                      <span className="text-lg">{option.icon}</span>
                      <span className="text-xs font-extrabold">{option.word}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
