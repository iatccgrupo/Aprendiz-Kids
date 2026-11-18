// Web Audio API Synthesizer & Speech Synthesis for playful, zero-dependency audio

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playPopSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // Ignore audio context errors if muted/unsupported
  }
};

export const playSuccessSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Arpeggio C5 -> E5 -> G5 -> C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + i * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });
  } catch {
    // Ignore
  }
};

export const playTryAgainSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Soft warm gentle two-tone (E4 -> C4)
    const notes = [329.63, 261.63];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + i * 0.14;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  } catch {
    // Ignore
  }
};

export const playStarSound = (starIndex: number = 0) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseFrequencies = [587.33, 739.99, 880.0]; // D5, F#5, A5
    const freq = baseFrequencies[starIndex % baseFrequencies.length] || 880;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.22);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  } catch {
    // Ignore
  }
};

const FEMALE_PT_VOICE_KEYWORDS = [
  'francisca',
  'thalita',
  'maria',
  'luciana',
  'joana',
  'brenda',
  'elza',
  'giovanna',
  'leila',
  'leticia',
  'letícia',
  'manuela',
  'yara',
  'camila',
  'vitoria',
  'vitória',
  'raquel',
  'catarina',
  'ines',
  'inês',
  'fernanda',
  'helena',
  'alice',
  'sofia',
  'lara',
  'beatriz',
  'clara',
  'mariana',
  'julia',
  'júlia',
  'ana',
  'paula',
  'carolina',
  'aoede',
  'kore',
  'leda',
  'google português do brasil',
  'google portugues do brasil',
  'female',
  'feminina',
  'mulher',
  'woman',
  'girl',
];

const MALE_PT_VOICE_KEYWORDS = [
  'daniel',
  'antonio',
  'antônio',
  'fabio',
  'fábio',
  'humberto',
  'julio',
  'júlio',
  'nicolau',
  'valerio',
  'valério',
  'duarte',
  'felipe',
  'rafael',
  'lucas',
  'ricardo',
  'donato',
  'tiago',
  'gabriel',
  'pedro',
  'mateus',
  'bruno',
  'marcos',
  'paulo',
  'miguel',
  'male',
  'masculino',
  'masculina',
  'homem',
  'man',
];

function scorePortugueseFemaleVoice(voice: SpeechSynthesisVoice): number {
  const lang = (voice.lang || '').toLowerCase();
  const name = (voice.name || '').toLowerCase();

  let score = 0;

  if (lang === 'pt-br' || lang === 'pt_br') {
    score += 220;
  } else if (lang.startsWith('pt')) {
    score += 90;
  } else {
    return -1000;
  }

  if (FEMALE_PT_VOICE_KEYWORDS.some((kw) => name.includes(kw))) {
    score += 140;
  }

  if (MALE_PT_VOICE_KEYWORDS.some((kw) => name.includes(kw))) {
    score -= 180;
  }

  if (name.includes('natural') || name.includes('neural') || name.includes('online')) {
    score += 30;
  }

  if (voice.localService) {
    score += 5;
  }

  return score;
}

function getAvailableVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const initialVoices = window.speechSynthesis.getVoices();
    if (initialVoices.length > 0) {
      resolve(initialVoices);
      return;
    }

    let settled = false;
    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      clearTimeout(timer);
      resolve(voices);
    };

    const onVoicesChanged = () => {
      finish(window.speechSynthesis.getVoices());
    };

    const timer = setTimeout(() => {
      finish(window.speechSynthesis.getVoices());
    }, 250);

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
  });
}

function selectPreferredPtBrFemaleVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = -999;

  for (const voice of voices) {
    const score = scorePortugueseFemaleVoice(voice);
    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  return bestScore > 0 ? bestVoice : null;
}

const TTS_MEMORY_CACHE_LIMIT = 60;
const TTS_LOCAL_STORAGE_KEY = 'aventura_live_kore_cache_v2';
const TTS_LOCAL_MAX_ENTRIES = 18;
const TTS_LOCAL_MAX_ITEM_CHARS = 450000;

interface PersistedTtsEntry {
  k: string;
  v: string;
  t: number;
}

const ttsAudioCache = new Map<string, string>();
const ttsInFlightRequests = new Map<string, Promise<string | null>>();
let activeTtsAudio: HTMLAudioElement | null = null;
let activeTtsObjectUrl: string | null = null;
let activeTtsRequestId = 0;

function readFromLocalTtsCache(cacheKey: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TTS_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const entries = JSON.parse(raw) as PersistedTtsEntry[];
    if (!Array.isArray(entries)) return null;
    const match = entries.find((entry) => entry.k === cacheKey);
    return match?.v || null;
  } catch {
    return null;
  }
}

function writeToMemoryTtsCache(cacheKey: string, audioBase64: string): void {
  if (ttsAudioCache.size >= TTS_MEMORY_CACHE_LIMIT) {
    const oldestKey = ttsAudioCache.keys().next().value;
    if (oldestKey) {
      ttsAudioCache.delete(oldestKey);
    }
  }
  ttsAudioCache.set(cacheKey, audioBase64);
}

function writeToLocalTtsCache(cacheKey: string, audioBase64: string): void {
  if (typeof window === 'undefined') return;
  if (audioBase64.length > TTS_LOCAL_MAX_ITEM_CHARS) return;

  try {
    const raw = localStorage.getItem(TTS_LOCAL_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as PersistedTtsEntry[]) : [];
    const entries = Array.isArray(parsed)
      ? parsed.filter((entry) => entry.k !== cacheKey)
      : [];

    entries.push({ k: cacheKey, v: audioBase64, t: Date.now() });

    while (entries.length > TTS_LOCAL_MAX_ENTRIES) {
      entries.shift();
    }

    try {
      localStorage.setItem(TTS_LOCAL_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      const trimmed = entries.slice(-6);
      try {
        localStorage.setItem(TTS_LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
      } catch {
        // Ignora se localStorage estiver indisponível
      }
    }
  } catch {
    // Ignore storage read/write errors
  }
}

function stopActiveTtsAudio(): void {
  if (activeTtsAudio) {
    try {
      activeTtsAudio.pause();
      activeTtsAudio.currentTime = 0;
    } catch {}
    activeTtsAudio = null;
  }

  if (activeTtsObjectUrl) {
    try {
      URL.revokeObjectURL(activeTtsObjectUrl);
    } catch {}
    activeTtsObjectUrl = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export const stopSpeaking = (): void => {
  activeTtsRequestId += 1;
  stopActiveTtsAudio();
};

function base64ToWavBlob(base64Data: string, mimeType: string = 'audio/wav'): Blob {
  const binaryString = window.atob(base64Data);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

function playBase64Audio(
  base64Data: string,
  mimeType: string = 'audio/wav',
  requestId?: number
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (requestId !== undefined && requestId !== activeTtsRequestId) {
        resolve(true);
        return;
      }

      stopActiveTtsAudio();

      const blob = base64ToWavBlob(base64Data, mimeType);
      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);

      activeTtsAudio = audio;
      activeTtsObjectUrl = objectUrl;

      let settled = false;
      const finish = (playedOk: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(safetyTimer);
        if (activeTtsAudio === audio) {
          activeTtsAudio = null;
        }
        if (activeTtsObjectUrl === objectUrl) {
          activeTtsObjectUrl = null;
        }
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
        if (requestId !== undefined && requestId !== activeTtsRequestId) {
          resolve(true);
          return;
        }
        resolve(playedOk);
      };

      const safetyTimer = setTimeout(() => finish(true), 25000);

      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (requestId !== undefined && requestId !== activeTtsRequestId) {
            finish(true);
          } else {
            finish(false);
          }
        });
      }
    } catch {
      resolve(false);
    }
  });
}

async function speakWithWebSpeechFallback(
  text: string,
  slowRate: boolean = false,
  requestId?: number
): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  if (requestId !== undefined && requestId !== activeTtsRequestId) {
    return;
  }

  try {
    const voices = await getAvailableVoicesAsync();
    if (requestId !== undefined && requestId !== activeTtsRequestId) {
      return;
    }

    const preferredVoice = selectPreferredPtBrFemaleVoice(voices);

    await new Promise<void>((resolve) => {
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        clearTimeout(safetyTimer);
        resolve();
      };

      const safetyTimer = setTimeout(done, 20000);

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = preferredVoice?.lang || 'pt-BR';
      utterance.pitch = 1.24;
      utterance.rate = slowRate ? 0.92 : 1.05;
      utterance.volume = 1.0;

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = done;
      utterance.onerror = done;

      window.speechSynthesis.speak(utterance);
    });
  } catch {
    // Ignore speech synthesis errors
  }
}

export type GeminiFemaleVoice = 'Kore' | 'Aoede';
export const DEFAULT_GEMINI_TTS_VOICE: GeminiFemaleVoice = 'Kore';

function buildUnifiedLiveCacheKey(
  text: string,
  slowRate: boolean,
  voiceName: GeminiFemaleVoice
): string {
  return `live:${voiceName}:${slowRate ? 'slow' : 'normal'}:${text.trim()}`;
}

async function fetchAndCacheGeminiLiveSpeech(
  text: string,
  slowRate: boolean,
  voiceName: GeminiFemaleVoice
): Promise<string | null> {
  const cleanText = text.trim();
  if (!cleanText || typeof window === 'undefined') return null;

  const cacheKey = buildUnifiedLiveCacheKey(cleanText, slowRate, voiceName);

  // 1. Cache instantâneo em RAM
  const fromMemory = ttsAudioCache.get(cacheKey);
  if (fromMemory) {
    return fromMemory;
  }

  // 2. Cache persistente em localStorage
  const fromLocal = readFromLocalTtsCache(cacheKey);
  if (fromLocal) {
    writeToMemoryTtsCache(cacheKey, fromLocal);
    return fromLocal;
  }

  // 3. Deduplicação de requisição já em andamento
  const existingInFlight = ttsInFlightRequests.get(cacheKey);
  if (existingInFlight) {
    return existingInFlight;
  }

  const requestPromise = (async (): Promise<string | null> => {
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch('/api/live-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: cleanText,
            slowRate,
            voiceName,
          }),
        });

        if (response.status === 503) {
          // GEMINI_API_KEY ausente -> acionar fallback apenas se necessário
          return null;
        }

        if (response.ok) {
          const data = (await response.json()) as {
            audioBase64?: string;
            mimeType?: string;
          };

          if (data.audioBase64) {
            writeToMemoryTtsCache(cacheKey, data.audioBase64);
            writeToLocalTtsCache(cacheKey, data.audioBase64);
            return data.audioBase64;
          }
        }
      } catch {
        // Tenta novamente em erro transitório
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
    return null;
  })().finally(() => {
    ttsInFlightRequests.delete(cacheKey);
  });

  ttsInFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Pré-carrega em segundo plano áudio gerado pela Gemini Live API (gemini-3.8-live)
 * com a voz feminina entusiasmada 'Kore'.
 */
export const prefetchSpeechInPortuguese = (
  text: string,
  slowRate: boolean = false,
  voiceName: GeminiFemaleVoice = DEFAULT_GEMINI_TTS_VOICE
): void => {
  if (typeof window === 'undefined' || !text.trim()) return;
  void fetchAndCacheGeminiLiveSpeech(text, slowRate, voiceName);
};

export const speakInPortuguese = async (
  text: string,
  slowRate: boolean = false,
  voiceName: GeminiFemaleVoice = DEFAULT_GEMINI_TTS_VOICE,
  _context?: 'activity' | 'storybook'
): Promise<void> => {
  void _context;
  if (typeof window === 'undefined' || !text.trim()) {
    return;
  }

  activeTtsRequestId += 1;
  const currentRequestId = activeTtsRequestId;
  stopActiveTtsAudio();

  const audioBase64 = await fetchAndCacheGeminiLiveSpeech(
    text,
    slowRate,
    voiceName
  );

  if (currentRequestId !== activeTtsRequestId) {
    return;
  }

  if (audioBase64) {
    const played = await playBase64Audio(
      audioBase64,
      'audio/wav',
      currentRequestId
    );
    if (played || currentRequestId !== activeTtsRequestId) {
      return;
    }
  }

  await speakWithWebSpeechFallback(text, slowRate, currentRequestId);
};

export function buildCorrectFeedbackSpeech(
  childName: string,
  targetLetter: string
): string {
  return `Sensacional, ${childName}! Você acertou a letrinha ${targetLetter}!`;
}

export function buildRetryFeedbackSpeech(childName: string): string {
  return `Quase lá, ${childName}! Que tal tentar de novo?`;
}

export function buildPrimeiroAnoUnlockSpeech(childName?: string): string {
  const cleanName = childName?.trim();
  const greeting = cleanName ? `Parabéns, ${cleanName}!` : 'Parabéns!';
  return `${greeting} Você completou a Educação Infantil e agora o 1º Ano do Ensino Fundamental foi desbloqueado! Vamos continuar a aventura?`;
}

