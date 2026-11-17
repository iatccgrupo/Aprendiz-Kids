'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Volume2,
  X,
  AlertCircle,
  Loader2,
  Send,
  MessageCircleHeart,
} from 'lucide-react';
import { ChildProfile, Phase, ScreenState } from '@/lib/types';
import { stopSpeaking, playPopSound, GeminiFemaleVoice } from '@/lib/sound';

interface LiveVoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  childProfile: ChildProfile | null;
  currentScreen: ScreenState;
  currentPhase: Phase;
  soundEnabled: boolean;
}

interface TranscriptMessage {
  id: string;
  role: 'child' | 'teacher';
  text: string;
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

function pcmFloat32ToBase64(input: Float32Array): string {
  const int16 = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const clamped = Math.max(-1, Math.min(1, input[i]));
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return window.btoa(binary);
}

function base64Pcm24kToAudioBuffer(
  ctx: AudioContext,
  base64Data: string,
  sampleRate: number = 24000
): AudioBuffer {
  const binaryString = window.atob(base64Data);
  const byteLength = binaryString.length;
  const bytes = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const sampleCount = Math.floor(bytes.byteLength / 2);
  const view = new DataView(bytes.buffer);
  const float32 = new Float32Array(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    const sample = view.getInt16(i * 2, true);
    float32[i] = sample / 32768;
  }

  const audioBuffer = ctx.createBuffer(1, sampleCount, sampleRate);
  audioBuffer.getChannelData(0).set(float32);
  return audioBuffer;
}

function parseSampleRateFromMime(mimeType?: string): number {
  if (!mimeType) return 24000;
  const match = mimeType.match(/rate=(\d+)/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 24000;
}

function buildScreenContextDescription(
  currentScreen: ScreenState,
  currentPhase: Phase
): string {
  switch (currentScreen) {
    case 'activity':
      return `Na Atividade Sonora da Fase ${currentPhase.number}: ${currentPhase.title} (Letra ${currentPhase.letter}, ${currentPhase.description})`;
    case 'feedback':
      return `Na tela de feedback e comemoração após responder a Fase ${currentPhase.number} (${currentPhase.title})`;
    case 'library':
      return 'Na Biblioteca de Histórias lendo livrinhos infantis mágicos';
    case 'progress':
      return 'Na tela de Meu Progresso vendo estrelas e medalhas conquistadas';
    case 'map':
      return `Na Trilha de Fases (fase atual destacada: Fase ${currentPhase.number} - ${currentPhase.title})`;
    default:
      return 'Explorando o aplicativo educativo Aprendiz Kids';
  }
}

export const LiveVoiceAssistant: React.FC<LiveVoiceAssistantProps> = ({
  isOpen,
  onClose,
  onOpen,
  childProfile,
  currentScreen,
  currentPhase,
  soundEnabled,
}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isTeacherSpeaking, setIsTeacherSpeaking] = useState<boolean>(false);
  const [activeVoice, setActiveVoice] = useState<GeminiFemaleVoice>('Kore');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const zeroGainRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isMicMutedRef = useRef<boolean>(false);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  const stopQueuedPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsTeacherSpeaking(false);
  }, []);

  const disconnectLiveSession = useCallback(() => {
    stopQueuedPlayback();

    if (processorRef.current) {
      try {
        processorRef.current.onaudioprocess = null;
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }

    if (zeroGainRef.current) {
      try {
        zeroGainRef.current.disconnect();
      } catch {}
      zeroGainRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        void inputAudioCtxRef.current.close();
      } catch {}
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      try {
        void outputAudioCtxRef.current.close();
      } catch {}
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    setConnectionState('idle');
    setIsTeacherSpeaking(false);
  }, [stopQueuedPlayback]);

  const appendTranscript = useCallback((role: 'child' | 'teacher', delta: string) => {
    const clean = delta.trim();
    if (!clean) return;

    setTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role) {
        const separator =
          last.text.endsWith(' ') || clean.startsWith(' ') || /^[.,!?]/.test(clean)
            ? ''
            : ' ';
        const updated = {
          ...last,
          text: `${last.text}${separator}${clean}`.trim(),
        };
        return [...prev.slice(0, -1), updated];
      }

      return [
        ...prev.slice(-11),
        {
          id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role,
          text: clean,
        },
      ];
    });
  }, []);

  const scheduleOutputAudioChunk = useCallback(
    (base64Pcm: string, mimeType?: string) => {
      if (!soundEnabled) return;

      const outputCtx = outputAudioCtxRef.current;
      if (!outputCtx) return;

      if (outputCtx.state === 'suspended') {
        void outputCtx.resume();
      }

      const sampleRate = parseSampleRateFromMime(mimeType);
      const buffer = base64Pcm24kToAudioBuffer(outputCtx, base64Pcm, sampleRate);
      const source = outputCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(outputCtx.destination);

      const startAt = Math.max(outputCtx.currentTime, nextStartTimeRef.current);
      nextStartTimeRef.current = startAt + buffer.duration;

      activeSourcesRef.current.add(source);
      setIsTeacherSpeaking(true);

      source.onended = () => {
        activeSourcesRef.current.delete(source);
        if (activeSourcesRef.current.size === 0) {
          setIsTeacherSpeaking(false);
        }
      };

      source.start(startAt);
    },
    [soundEnabled]
  );

  const childName = childProfile?.name;

  const startLiveSession = useCallback(
    async (preferredVoice: GeminiFemaleVoice = activeVoice) => {
      stopSpeaking();
      disconnectLiveSession();

      setErrorMessage('');
      setTranscripts([]);
      setConnectionState('connecting');
      setIsMicMuted(false);
      isMicMutedRef.current = false;

      try {
        const OutputAudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const outputCtx = new OutputAudioCtx({ sampleRate: 24000 });
        outputAudioCtxRef.current = outputCtx;

        // Solicita microfone para conversação em tempo real (16kHz PCM)
        let micAvailable = true;
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          mediaStreamRef.current = stream;
        } catch {
          micAvailable = false;
          setIsMicMuted(true);
          isMicMutedRef.current = true;
          setErrorMessage(
            'Não foi possível acessar o microfone. Você ainda pode ouvir e conversar enviando mensagens abaixo!'
          );
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const screenContext = buildScreenContextDescription(currentScreen, currentPhase);
        const query = new URLSearchParams({
          voiceName: preferredVoice,
          context: screenContext,
        });
        if (childName) {
          query.set('childName', childName);
        }

        const ws = new WebSocket(`${protocol}//${window.location.host}/ws/live?${query.toString()}`);
        wsRef.current = ws;

        ws.onopen = () => {
          if (wsRef.current !== ws) return;

          if (micAvailable && stream) {
            const InputAudioCtx =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext;
            const inputCtx = new InputAudioCtx({ sampleRate: 16000 });
            inputAudioCtxRef.current = inputCtx;

            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            const zeroGain = inputCtx.createGain();
            zeroGain.gain.value = 0;

            sourceNodeRef.current = source;
            processorRef.current = processor;
            zeroGainRef.current = zeroGain;

            processor.onaudioprocess = (event) => {
              if (isMicMutedRef.current) return;
              if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

              const channelData = event.inputBuffer.getChannelData(0);
              const base64Pcm = pcmFloat32ToBase64(channelData);
              wsRef.current.send(
                JSON.stringify({
                  type: 'audio',
                  data: base64Pcm,
                })
              );
            };

            source.connect(processor);
            processor.connect(zeroGain);
            zeroGain.connect(inputCtx.destination);
          }
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data as string) as {
              type?: string;
              data?: string;
              mimeType?: string;
              text?: string;
              voiceName?: GeminiFemaleVoice;
              message?: string;
              reason?: string;
            };

            if (payload.type === 'ready') {
              setConnectionState('connected');
              if (payload.voiceName) {
                setActiveVoice(payload.voiceName);
              }
              return;
            }

            if (payload.type === 'audio' && payload.data) {
              setConnectionState('connected');
              scheduleOutputAudioChunk(payload.data, payload.mimeType);
              return;
            }

            if (payload.type === 'inputTranscript' && payload.text) {
              appendTranscript('child', payload.text);
              return;
            }

            if (payload.type === 'outputTranscript' && payload.text) {
              appendTranscript('teacher', payload.text);
              return;
            }

            if (payload.type === 'interrupted') {
              stopQueuedPlayback();
              return;
            }

            if (payload.type === 'error') {
              setErrorMessage(
                payload.message || 'Erro na conexão de voz em tempo real com a Professora Bia.'
              );
              setConnectionState('error');
              return;
            }

            if (payload.type === 'closed') {
              setIsTeacherSpeaking(false);
            }
          } catch {
            // Ignora payloads inválidos
          }
        };

        ws.onerror = () => {
          setErrorMessage(
            'Não foi possível conectar à conversa ao vivo. Verifique a conexão e tente novamente.'
          );
          setConnectionState('error');
        };

        ws.onclose = () => {
          if (wsRef.current === ws) {
            setIsTeacherSpeaking(false);
          }
        };
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Erro ao iniciar o microfone ou a conversa por voz.';
        setErrorMessage(msg);
        setConnectionState('error');
      }
    },
    [
      activeVoice,
      appendTranscript,
      childName,
      currentPhase,
      currentScreen,
      disconnectLiveSession,
      scheduleOutputAudioChunk,
      stopQueuedPlayback,
    ]
  );

  // Atualiza contexto da tela silenciosamente se sessão ao vivo já estiver conectada
  useEffect(() => {
    if (connectionState !== 'connected') return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'context',
        screenContext: buildScreenContextDescription(currentScreen, currentPhase),
      })
    );
  }, [connectionState, currentScreen, currentPhase]);

  // Rola transcrições para o final automaticamente
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Limpa sessão ao fechar modal ou desmontar componente
  useEffect(() => {
    return () => {
      disconnectLiveSession();
    };
  }, [disconnectLiveSession]);

  const handleClosePanel = () => {
    playPopSound();
    disconnectLiveSession();
    onClose();
  };

  const handleSendTextToLive = (promptText: string) => {
    const clean = promptText.trim();
    if (!clean) return;
    playPopSound();

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      void startLiveSession();
      return;
    }

    appendTranscript('child', clean);
    wsRef.current.send(JSON.stringify({ type: 'text', text: clean }));
    setTextInput('');
  };

  const quickPrompts = [
    `Como é o som da letra ${currentPhase.letter}?`,
    'Me dê uma dica divertida!',
    'Vamos treinar uma palavra juntos?',
  ];

  return (
    <>
      {/* Botão flutuante de acesso rápido à Conversa em Tempo Real */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            playPopSound();
            onOpen();
            void startLiveSession();
          }}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 px-5 py-3.5 text-sm font-black text-white shadow-[0_6px_0_#be123c,0_12px_24px_rgba(244,63,94,0.35)] hover:brightness-105 active:translate-y-1 transition-all cursor-pointer"
          title="Conversar por voz em tempo real com a Professora Bia"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/25">
            <Mic className="h-4 w-4 text-white" />
          </span>
          <span>Falar com a Professora</span>
          <Sparkles className="h-4 w-4 text-yellow-200 animate-pulse" />
        </button>
      )}

      {/* Painel de Conversação por Voz em Tempo Real (Gemini Live API) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[410px] z-50 rounded-3xl border-4 border-rose-300 bg-white shadow-2xl overflow-hidden"
          >
            {/* Header acolhedor */}
            <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 px-5 py-4 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/25 text-2xl shadow-inner ${
                    isTeacherSpeaking ? 'animate-bounce' : ''
                  }`}
                >
                  <span role="img" aria-label="Professora Bia">
                    👩‍🏫
                  </span>
                  {connectionState === 'connected' && (
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 border-2 border-white" />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-base sm:text-lg font-black leading-tight truncate">
                    Professora Bia · Voz ao Vivo
                  </h3>
                  <p className="text-xs font-bold text-rose-50 truncate">
                    {connectionState === 'connecting' && 'Conectando conversa mágica...'}
                    {connectionState === 'connected' &&
                      (isTeacherSpeaking
                        ? 'Falando com carinho...'
                        : isMicMuted
                        ? 'Microfone pausado (toque para falar)'
                        : 'Ouvindo você! Pode falar agora!')}
                    {connectionState === 'idle' && 'Pronta para conversar com você!'}
                    {connectionState === 'error' && 'Vamos tentar conectar novamente'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClosePanel}
                aria-label="Fechar conversa por voz"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Voz feminina padronizada em todo o aplicativo: Kore (pt-BR) */}
            <div className="bg-rose-50/80 border-b border-rose-100 px-4 py-2 flex items-center justify-between gap-2 text-xs">
              <span className="font-extrabold text-rose-900 flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-rose-600" />
                <span>Voz Feminina (pt-BR):</span>
              </span>
              <span className="rounded-full bg-rose-500 px-3 py-0.5 text-[11px] font-black text-white shadow-xs">
                Kore · Padrão
              </span>
            </div>

            {/* Corpo da Conversa */}
            <div className="p-4 space-y-3 bg-gradient-to-b from-white to-amber-50/40">
              {errorMessage && (
                <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Área de transcrições em tempo real */}
              <div className="h-44 overflow-y-auto rounded-2xl border-2 border-amber-100 bg-white p-3 space-y-2.5 shadow-inner">
                {transcripts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-3 text-slate-500">
                    {connectionState === 'connecting' ? (
                      <>
                        <Loader2 className="h-7 w-7 text-rose-500 animate-spin mb-2" />
                        <p className="text-xs font-bold">
                          Chamando a Professora Bia para conversar com você...
                        </p>
                      </>
                    ) : (
                      <>
                        <MessageCircleHeart className="h-8 w-8 text-rose-400 mb-2" />
                        <p className="text-xs font-bold text-slate-700">
                          Diga &ldquo;Oi, Professora!&rdquo; ou toque em uma sugestão abaixo!
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  transcripts.map((item) => (
                    <div
                      key={item.id}
                      className={`flex ${
                        item.role === 'child' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs font-bold leading-relaxed ${
                          item.role === 'child'
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-rose-50 border border-rose-200 text-rose-950 rounded-bl-sm'
                        }`}
                      >
                        {item.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>

              {/* Sugestões rápidas contextuais */}
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSendTextToLive(prompt)}
                    className="rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1 text-[11px] font-extrabold text-amber-950 transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Campo opcional de mensagem rápida */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendTextToLive(textInput);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Ou escreva aqui para a Professora..."
                  className="flex-1 rounded-2xl border-2 border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:border-rose-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-xs hover:bg-rose-600 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Enviar pergunta"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              {/* Controles principais de Microfone & Encerrar */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {connectionState === 'connected' || connectionState === 'connecting' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        playPopSound();
                        setIsMicMuted((prev) => !prev);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black transition-all cursor-pointer ${
                        isMicMuted
                          ? 'bg-amber-100 text-amber-900 border-2 border-amber-300'
                          : 'bg-emerald-500 text-white shadow-[0_4px_0_#047857] hover:brightness-105 active:translate-y-0.5'
                      }`}
                    >
                      {isMicMuted ? (
                        <>
                          <MicOff className="h-4 w-4" />
                          <span>Ativar Microfone</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 animate-pulse" />
                          <span>Microfone Aberto</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playPopSound();
                        disconnectLiveSession();
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-extrabold text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      <PhoneOff className="h-4 w-4" />
                      <span>Pausar</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      playPopSound();
                      void startLiveSession();
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 px-5 py-3 text-sm font-black text-white shadow-[0_4px_0_#be123c] hover:brightness-105 active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    <Mic className="h-4 w-4" />
                    <span>Iniciar Conversa em Tempo Real</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
