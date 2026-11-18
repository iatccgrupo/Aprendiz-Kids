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
  Square,
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
type TransportMode = 'ws' | 'http';

interface LiveTurnApiResponse {
  audioBase64: string;
  mimeType: string;
  inputTranscript?: string;
  outputTranscript?: string;
  voiceName?: GeminiFemaleVoice;
  error?: string;
}

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  );
}

function createSafeAudioContext(preferredSampleRate: number): AudioContext {
  const AudioCtx = getAudioContextConstructor();
  if (!AudioCtx) {
    throw new Error('Navegador sem suporte a áudio Web.');
  }
  try {
    return new AudioCtx({ sampleRate: preferredSampleRate });
  } catch {
    return new AudioCtx();
  }
}

function downsampleFloat32(
  input: Float32Array,
  sourceRate: number,
  targetRate: number = 16000
): Float32Array {
  if (!sourceRate || sourceRate <= 0 || sourceRate === targetRate) {
    return input;
  }
  const ratio = sourceRate / targetRate;
  const newLength = Math.max(1, Math.round(input.length / ratio));
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const low = Math.floor(srcIndex);
    const high = Math.min(input.length - 1, low + 1);
    const frac = srcIndex - low;
    result[i] = input[low] * (1 - frac) + input[high] * frac;
  }

  return result;
}

function concatFloat32Chunks(chunks: Float32Array[]): Float32Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

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

function base64ToUint8Array(base64Data: string): Uint8Array {
  const binaryString = window.atob(base64Data);
  const byteLength = binaryString.length;
  const bytes = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function base64PcmToAudioBuffer(
  ctx: AudioContext,
  base64Data: string,
  sampleRate: number = 24000
): AudioBuffer {
  const bytes = base64ToUint8Array(base64Data);
  const sampleCount = Math.floor(bytes.byteLength / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const float32 = new Float32Array(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    const sample = view.getInt16(i * 2, true);
    float32[i] = sample / 32768;
  }

  try {
    const audioBuffer = ctx.createBuffer(1, sampleCount, sampleRate);
    audioBuffer.getChannelData(0).set(float32);
    return audioBuffer;
  } catch {
    // Fallback caso o dispositivo mobile exija o sampleRate nativo do AudioContext
    const targetRate = ctx.sampleRate || 44100;
    const resampled = downsampleFloat32(float32, sampleRate, targetRate);
    const audioBuffer = ctx.createBuffer(1, resampled.length, targetRate);
    audioBuffer.getChannelData(0).set(resampled);
    return audioBuffer;
  }
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
  const connectionStateRef = useRef<ConnectionState>('idle');
  const updateConnectionState = useCallback((next: ConnectionState) => {
    connectionStateRef.current = next;
    setConnectionState(next);
  }, []);
  const [transportMode, setTransportMode] = useState<TransportMode>('ws');
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isTeacherSpeaking, setIsTeacherSpeaking] = useState<boolean>(false);
  const [isHttpRecording, setIsHttpRecording] = useState<boolean>(false);
  const [isHttpSending, setIsHttpSending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const wsReadyRef = useRef<boolean>(false);
  const wsWatchdogRef = useRef<number | null>(null);
  const transportModeRef = useRef<TransportMode>('ws');

  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const zeroGainRef = useRef<GainNode | null>(null);

  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const httpAudioElRef = useRef<HTMLAudioElement | null>(null);
  const httpAudioUrlRef = useRef<string | null>(null);

  const isMicMutedRef = useRef<boolean>(false);
  const isHttpRecordingRef = useRef<boolean>(false);
  const httpRecordedChunksRef = useRef<Float32Array[]>([]);
  const transcriptsRef = useRef<TranscriptMessage[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const sessionSeqRef = useRef<number>(0);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    transcriptsRef.current = transcripts;
  }, [transcripts]);

  const clearWsWatchdog = useCallback(() => {
    if (wsWatchdogRef.current !== null) {
      window.clearTimeout(wsWatchdogRef.current);
      wsWatchdogRef.current = null;
    }
  }, []);

  const stopQueuedPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    if (httpAudioElRef.current) {
      try {
        httpAudioElRef.current.pause();
        httpAudioElRef.current.src = '';
      } catch {}
      httpAudioElRef.current = null;
    }

    if (httpAudioUrlRef.current) {
      try {
        URL.revokeObjectURL(httpAudioUrlRef.current);
      } catch {}
      httpAudioUrlRef.current = null;
    }

    setIsTeacherSpeaking(false);
  }, []);

  const cleanupMicResources = useCallback(() => {
    isHttpRecordingRef.current = false;
    httpRecordedChunksRef.current = [];
    setIsHttpRecording(false);

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
  }, []);

  const disconnectLiveSession = useCallback(() => {
    sessionSeqRef.current += 1;
    clearWsWatchdog();
    wsReadyRef.current = false;
    stopQueuedPlayback();
    cleanupMicResources();

    if (outputAudioCtxRef.current) {
      try {
        void outputAudioCtxRef.current.close();
      } catch {}
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      const socket = wsRef.current;
      wsRef.current = null;
      try {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
      } catch {}
    }

    updateConnectionState('idle');
    setIsTeacherSpeaking(false);
    setIsHttpSending(false);
  }, [cleanupMicResources, clearWsWatchdog, stopQueuedPlayback, updateConnectionState]);

  const appendTranscript = useCallback(
    (role: 'child' | 'teacher', delta: string, replaceLastChunked: boolean = true) => {
      const clean = delta.trim();
      if (!clean) return;

      setTranscripts((prev) => {
        const last = prev[prev.length - 1];
        if (replaceLastChunked && last && last.role === role) {
          const separator =
            last.text.endsWith(' ') || clean.startsWith(' ') || /^[.,!?]/.test(clean)
              ? ''
              : ' ';
          const updated = {
            ...last,
            text: `${last.text}${separator}${clean}`.trim(),
          };
          const next = [...prev.slice(0, -1), updated];
          transcriptsRef.current = next;
          return next;
        }

        const next = [
          ...prev.slice(-11),
          {
            id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            role,
            text: clean,
          },
        ];
        transcriptsRef.current = next;
        return next;
      });
    },
    []
  );

  const scheduleOutputAudioChunk = useCallback(
    (base64Pcm: string, mimeType?: string) => {
      if (!soundEnabled) return;

      let outputCtx = outputAudioCtxRef.current;
      if (!outputCtx) {
        try {
          outputCtx = createSafeAudioContext(24000);
          outputAudioCtxRef.current = outputCtx;
        } catch {
          return;
        }
      }

      if (outputCtx.state === 'suspended') {
        void outputCtx.resume();
      }

      const sampleRate = parseSampleRateFromMime(mimeType);
      const buffer = base64PcmToAudioBuffer(outputCtx, base64Pcm, sampleRate);
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

  const playWavBase64 = useCallback(
    async (base64Wav: string, mimeType: string = 'audio/wav') => {
      if (!soundEnabled || !base64Wav) return;
      stopQueuedPlayback();

      const bytes = base64ToUint8Array(base64Wav);
      const blobBytes = new Uint8Array(bytes.byteLength);
      blobBytes.set(bytes);
      const blob = new Blob([blobBytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      httpAudioUrlRef.current = url;

      const audioEl = new Audio(url);
      httpAudioElRef.current = audioEl;
      setIsTeacherSpeaking(true);

      audioEl.onended = () => {
        if (httpAudioUrlRef.current === url) {
          URL.revokeObjectURL(url);
          httpAudioUrlRef.current = null;
        }
        if (httpAudioElRef.current === audioEl) {
          httpAudioElRef.current = null;
        }
        setIsTeacherSpeaking(false);
      };

      audioEl.onerror = () => {
        if (httpAudioUrlRef.current === url) {
          URL.revokeObjectURL(url);
          httpAudioUrlRef.current = null;
        }
        if (httpAudioElRef.current === audioEl) {
          httpAudioElRef.current = null;
        }
        setIsTeacherSpeaking(false);
      };

      try {
        await audioEl.play();
      } catch {
        // Fallback para Web Audio API caso o elemento Audio seja bloqueado no iOS Safari
        try {
          let outputCtx = outputAudioCtxRef.current;
          if (!outputCtx) {
            outputCtx = createSafeAudioContext(24000);
            outputAudioCtxRef.current = outputCtx;
          }
          if (outputCtx.state === 'suspended') {
            await outputCtx.resume();
          }
          const arrayBuffer = await blob.arrayBuffer();
          const decoded = await outputCtx.decodeAudioData(arrayBuffer.slice(0));
          const source = outputCtx.createBufferSource();
          source.buffer = decoded;
          source.connect(outputCtx.destination);
          activeSourcesRef.current.add(source);
          source.onended = () => {
            activeSourcesRef.current.delete(source);
            if (activeSourcesRef.current.size === 0) {
              setIsTeacherSpeaking(false);
            }
          };
          source.start(0);
        } catch {
          setIsTeacherSpeaking(false);
        }
      }
    },
    [soundEnabled, stopQueuedPlayback]
  );

  const setupMicrophonePipeline = useCallback(
    async (mode: TransportMode): Promise<boolean> => {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        return false;
      }

      if (mediaStreamRef.current && processorRef.current && inputAudioCtxRef.current) {
        if (inputAudioCtxRef.current.state === 'suspended') {
          try {
            await inputAudioCtxRef.current.resume();
          } catch {}
        }
        return true;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;

        const inputCtx = createSafeAudioContext(16000);
        inputAudioCtxRef.current = inputCtx;
        if (inputCtx.state === 'suspended') {
          await inputCtx.resume().catch(() => {});
        }

        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        const zeroGain = inputCtx.createGain();
        zeroGain.gain.value = 0;

        sourceNodeRef.current = source;
        processorRef.current = processor;
        zeroGainRef.current = zeroGain;

        processor.onaudioprocess = (event) => {
          const channelData = event.inputBuffer.getChannelData(0);
          const downsampled = downsampleFloat32(channelData, inputCtx.sampleRate, 16000);

          if (transportModeRef.current === 'ws') {
            if (isMicMutedRef.current) return;
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
            const base64Pcm = pcmFloat32ToBase64(downsampled);
            wsRef.current.send(
              JSON.stringify({
                type: 'audio',
                data: base64Pcm,
              })
            );
            return;
          }

          // Em modo HTTP compatível com mobile, acumula chunks durante gravação ativa
          if (mode === 'http' || transportModeRef.current === 'http') {
            if (!isHttpRecordingRef.current) return;
            // Limite de segurança (~12 segundos em 16kHz)
            const totalSamples = httpRecordedChunksRef.current.reduce(
              (sum, arr) => sum + arr.length,
              0
            );
            if (totalSamples < 16000 * 12) {
              httpRecordedChunksRef.current.push(new Float32Array(downsampled));
            }
          }
        };

        source.connect(processor);
        processor.connect(zeroGain);
        zeroGain.connect(inputCtx.destination);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const childName = childProfile?.name;

  const callHttpLiveTurn = useCallback(
    async (
      payload: {
        action: 'greet' | 'text' | 'audio';
        text?: string;
        audioBase64Pcm16k?: string;
      },
      seq: number
    ) => {
      setIsHttpSending(true);
      try {
        const response = await fetch('/api/live-turn', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...payload,
            history: transcriptsRef.current.slice(-6).map((item) => ({
              role: item.role,
              text: item.text,
            })),
            childName,
            screenContext: buildScreenContextDescription(currentScreen, currentPhase),
            voiceName: 'Kore',
          }),
        });

        const data = (await response.json()) as LiveTurnApiResponse;
        if (sessionSeqRef.current !== seq) return;

        if (!response.ok || data.error) {
          throw new Error(
            data.error || 'A Professora Bia não pôde responder agora. Tente novamente.'
          );
        }

        updateConnectionState('connected');
        setErrorMessage('');

        if (payload.action === 'audio' && data.inputTranscript) {
          appendTranscript('child', data.inputTranscript, false);
        }
        if (data.outputTranscript) {
          appendTranscript('teacher', data.outputTranscript, false);
        }
        if (data.audioBase64) {
          await playWavBase64(data.audioBase64, data.mimeType || 'audio/wav');
        }
      } catch (err: unknown) {
        if (sessionSeqRef.current !== seq) return;
        const message =
          err instanceof Error
            ? err.message
            : 'Não foi possível conversar com a Professora Bia agora.';
        setErrorMessage(message);
        if (connectionStateRef.current !== 'connected') {
          updateConnectionState('error');
        }
      } finally {
        if (sessionSeqRef.current === seq) {
          setIsHttpSending(false);
        }
      }
    },
    [
      appendTranscript,
      childName,
      currentPhase,
      currentScreen,
      playWavBase64,
      updateConnectionState,
    ]
  );

  const switchToHttpLiveMode = useCallback(
    async (seq: number, sendInitialGreet: boolean = true) => {
      if (sessionSeqRef.current !== seq) return;
      clearWsWatchdog();
      wsReadyRef.current = false;

      if (wsRef.current) {
        const socket = wsRef.current;
        wsRef.current = null;
        try {
          socket.onopen = null;
          socket.onmessage = null;
          socket.onerror = null;
          socket.onclose = null;
          socket.close();
        } catch {}
      }

      transportModeRef.current = 'http';
      setTransportMode('http');
      setErrorMessage('');
      updateConnectionState('connected');

      if (sendInitialGreet) {
        await callHttpLiveTurn({ action: 'greet' }, seq);
      }
    },
    [callHttpLiveTurn, clearWsWatchdog, updateConnectionState]
  );

  const startLiveSession = useCallback(
    async (preferredVoice: GeminiFemaleVoice = 'Kore') => {
      stopSpeaking();
      disconnectLiveSession();

      const seq = sessionSeqRef.current;
      transportModeRef.current = 'ws';
      wsReadyRef.current = false;

      setTransportMode('ws');
      setErrorMessage('');
      setTranscripts([]);
      transcriptsRef.current = [];
      updateConnectionState('connecting');
      setIsMicMuted(false);
      isMicMutedRef.current = false;

      try {
        // Desbloqueia saída de áudio dentro do gesto de toque (crítico no iOS/Android)
        try {
          const outputCtx = createSafeAudioContext(24000);
          outputAudioCtxRef.current = outputCtx;
          if (outputCtx.state === 'suspended') {
            void outputCtx.resume();
          }
        } catch {
          // Segue mesmo se AudioContext falhar, pois o fallback WAV usa <audio>
        }

        // Solicita microfone sem travar a conversa caso seja negado ou bloqueado no dispositivo
        const micOk = await setupMicrophonePipeline('ws');
        if (sessionSeqRef.current !== seq) return;

        if (!micOk) {
          setIsMicMuted(true);
          isMicMutedRef.current = true;
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

        let ws: WebSocket;
        try {
          ws = new WebSocket(`${protocol}//${window.location.host}/ws/live?${query.toString()}`);
        } catch {
          await switchToHttpLiveMode(seq, true);
          return;
        }

        wsRef.current = ws;

        // Watchdog de 3.8s: se proxy/mobile bloquear WebSocket, muda automaticamente para HTTP Live sem erro!
        wsWatchdogRef.current = window.setTimeout(() => {
          if (sessionSeqRef.current !== seq) return;
          if (!wsReadyRef.current) {
            void switchToHttpLiveMode(seq, true);
          }
        }, 3800);

        ws.onopen = () => {
          if (wsRef.current !== ws || sessionSeqRef.current !== seq) return;
          // Aguarda evento 'ready' do servidor antes de desarmar watchdog
        };

        ws.onmessage = (event) => {
          if (wsRef.current !== ws || sessionSeqRef.current !== seq) return;
          try {
            const payload = JSON.parse(event.data as string) as {
              type?: string;
              data?: string;
              mimeType?: string;
              text?: string;
              voiceName?: GeminiFemaleVoice;
              message?: string;
            };

            if (payload.type === 'ready') {
              wsReadyRef.current = true;
              clearWsWatchdog();
              transportModeRef.current = 'ws';
              setTransportMode('ws');
              updateConnectionState('connected');
              setErrorMessage('');
              return;
            }

            if (payload.type === 'audio' && payload.data) {
              wsReadyRef.current = true;
              clearWsWatchdog();
              updateConnectionState('connected');
              scheduleOutputAudioChunk(payload.data, payload.mimeType);
              return;
            }

            if (payload.type === 'inputTranscript' && payload.text) {
              appendTranscript('child', payload.text, true);
              return;
            }

            if (payload.type === 'outputTranscript' && payload.text) {
              appendTranscript('teacher', payload.text, true);
              return;
            }

            if (payload.type === 'interrupted') {
              stopQueuedPlayback();
              return;
            }

            if (payload.type === 'error') {
              if (!wsReadyRef.current) {
                void switchToHttpLiveMode(seq, true);
              } else {
                setErrorMessage(
                  payload.message || 'Erro na conexão de voz com a Professora Bia.'
                );
              }
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
          if (wsRef.current !== ws || sessionSeqRef.current !== seq) return;
          if (!wsReadyRef.current) {
            // Em mobile/proxies onde WSS falha, alterna silenciosamente para HTTP Live (Kore)
            void switchToHttpLiveMode(seq, true);
          } else {
            void switchToHttpLiveMode(seq, false);
          }
        };

        ws.onclose = () => {
          if (wsRef.current !== ws || sessionSeqRef.current !== seq) return;
          if (!wsReadyRef.current) {
            void switchToHttpLiveMode(seq, true);
          } else {
            setIsTeacherSpeaking(false);
          }
        };
      } catch {
        await switchToHttpLiveMode(seq, true);
      }
    },
    [
      appendTranscript,
      childName,
      clearWsWatchdog,
      currentPhase,
      currentScreen,
      disconnectLiveSession,
      scheduleOutputAudioChunk,
      setupMicrophonePipeline,
      stopQueuedPlayback,
      switchToHttpLiveMode,
      updateConnectionState,
    ]
  );

  // Atualiza contexto da tela silenciosamente se sessão WS já estiver conectada
  useEffect(() => {
    if (connectionState !== 'connected' || transportMode !== 'ws') return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'context',
        screenContext: buildScreenContextDescription(currentScreen, currentPhase),
      })
    );
  }, [connectionState, transportMode, currentScreen, currentPhase]);

  // Rola transcrições para o final automaticamente
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Limpa sessão ao desmontar componente
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
    setTextInput('');

    if (
      transportModeRef.current === 'ws' &&
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN
    ) {
      appendTranscript('child', clean, false);
      wsRef.current.send(JSON.stringify({ type: 'text', text: clean }));
      return;
    }

    if (transportModeRef.current === 'http' && connectionState === 'connected') {
      appendTranscript('child', clean, false);
      void callHttpLiveTurn({ action: 'text', text: clean }, sessionSeqRef.current);
      return;
    }

    // Caso a sessão ainda esteja fechada/ociosa, inicia em modo HTTP Live e envia a pergunta
    stopSpeaking();
    disconnectLiveSession();
    const seq = sessionSeqRef.current;
    transportModeRef.current = 'http';
    setTransportMode('http');
    updateConnectionState('connected');
    appendTranscript('child', clean, false);
    void callHttpLiveTurn({ action: 'text', text: clean }, seq);
  };

  const handleToggleHttpRecording = async () => {
    playPopSound();

    if (isHttpRecordingRef.current) {
      isHttpRecordingRef.current = false;
      setIsHttpRecording(false);

      const chunks = httpRecordedChunksRef.current;
      httpRecordedChunksRef.current = [];
      const merged = concatFloat32Chunks(chunks);

      // Mínimo ~0.25s de áudio a 16kHz para evitar envios vazios
      if (merged.length < 4000) {
        setErrorMessage('Toque e segure sua fala por pelo menos 1 segundo para eu ouvir você!');
        return;
      }

      setErrorMessage('');
      const base64Pcm = pcmFloat32ToBase64(merged);
      await callHttpLiveTurn(
        { action: 'audio', audioBase64Pcm16k: base64Pcm },
        sessionSeqRef.current
      );
      return;
    }

    // Inicia gravação no modo mobile HTTP
    stopQueuedPlayback();
    setErrorMessage('');

    const micReady = await setupMicrophonePipeline('http');
    if (!micReady) {
      setErrorMessage(
        'Não foi possível abrir o microfone neste aparelho. Você pode digitar ou tocar nas sugestões abaixo!'
      );
      return;
    }

    httpRecordedChunksRef.current = [];
    isHttpRecordingRef.current = true;
    setIsHttpRecording(true);
  };

  const quickPrompts = [
    `Como é o som da letra ${currentPhase.letter}?`,
    'Me dê uma dica divertida!',
    'Vamos treinar uma palavra juntos?',
  ];

  return (
    <>
      {/* Botão flutuante de acesso rápido à Conversa em Tempo Real (somente após login) */}
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

      {/* Painel de Conversação por Voz em Tempo Real (Gemini Live API · Kore) */}
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
                      (isHttpSending
                        ? 'Professora Bia está pensando...'
                        : isTeacherSpeaking
                        ? 'Falando com carinho...'
                        : transportMode === 'http'
                        ? isHttpRecording
                          ? 'Ouvindo você! Toque em Enviar Fala'
                          : 'Pronta! Toque no botão verde para falar'
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
                <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Área de transcrições em tempo real */}
              <div className="h-44 overflow-y-auto rounded-2xl border-2 border-amber-100 bg-white p-3 space-y-2.5 shadow-inner">
                {transcripts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-3 text-slate-500">
                    {connectionState === 'connecting' || isHttpSending ? (
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
                    disabled={isHttpSending}
                    onClick={() => handleSendTextToLive(prompt)}
                    className="rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1 text-[11px] font-extrabold text-amber-950 disabled:opacity-50 transition-colors cursor-pointer"
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
                  disabled={!textInput.trim() || isHttpSending}
                  className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-xs hover:bg-rose-600 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Enviar pergunta"
                >
                  {isHttpSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>

              {/* Controles principais de Microfone & Encerrar */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {connectionState === 'connected' || connectionState === 'connecting' ? (
                  <>
                    {transportMode === 'ws' ? (
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
                    ) : (
                      <button
                        type="button"
                        disabled={isHttpSending}
                        onClick={() => void handleToggleHttpRecording()}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black transition-all cursor-pointer disabled:opacity-60 ${
                          isHttpRecording
                            ? 'bg-rose-500 text-white shadow-[0_4px_0_#be123c] animate-pulse'
                            : 'bg-emerald-500 text-white shadow-[0_4px_0_#047857] hover:brightness-105 active:translate-y-0.5'
                        }`}
                      >
                        {isHttpSending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Enviando fala...</span>
                          </>
                        ) : isHttpRecording ? (
                          <>
                            <Square className="h-4 w-4 fill-white" />
                            <span>Enviar Minha Fala</span>
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4" />
                            <span>Tocar para Falar</span>
                          </>
                        )}
                      </button>
                    )}

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
