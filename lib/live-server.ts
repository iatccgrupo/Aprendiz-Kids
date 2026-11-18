import { GoogleGenAI, Modality } from '@google/genai';
import type { LiveServerMessage, Session } from '@google/genai';

export const GEMINI_LIVE_MODEL = 'gemini-3.8-live';

export const LIVE_FEMALE_VOICES = ['Kore', 'Aoede'] as const;
export type LiveFemaleVoice = (typeof LIVE_FEMALE_VOICES)[number];

export function resolveLiveFemaleVoice(requested?: unknown): LiveFemaleVoice {
  if (
    typeof requested === 'string' &&
    (LIVE_FEMALE_VOICES as readonly string[]).includes(requested)
  ) {
    return requested as LiveFemaleVoice;
  }
  return 'Kore';
}

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return key;
}

export function createGeminiServerClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface TeacherInstructionOptions {
  mode: 'read_aloud' | 'conversation';
  childName?: string;
  screenContext?: string;
  slowRate?: boolean;
}

export function buildTeacherSystemInstruction({
  mode,
  childName,
  screenContext,
  slowRate = false,
}: TeacherInstructionOptions): string {
  const cleanChildName = childName?.trim();
  const cleanContext = screenContext?.trim();

  if (mode === 'read_aloud') {
    const pacingHint = slowRate
      ? 'Fale um pouco mais devagar, articulando cada sílaba e fonema com doçura, entusiasmo e muita clareza.'
      : 'Fale em ritmo alegre, vibrante, natural e empolgado.';

    return [
      'Você é a Professora Bia, uma professora de educação infantil brasileira muito animada, carinhosa, acolhedora e cheia de alegria.',
      'Fale sempre em português do Brasil (pt-BR) com entonação feminina expressiva, sorridente e calorosa para crianças de 4 a 7 anos.',
      pacingHint,
      'REGRA OBRIGATÓRIA DE LEITURA: Leia em voz alta EXATAMENTE e APENAS o texto solicitado pela criança/sistema, sem adicionar saudações, comentários extras ou repetir instruções.',
    ].join(' ');
  }

  return [
    'Você é a Professora Bia, uma professora de educação infantil brasileira super animada, carinhosa, paciente e acolhedora do aplicativo educativo "Aprendiz Kids".',
    'Converse sempre em português do Brasil (pt-BR) com uma voz feminina doce, alegre e cheia de entusiasmo para crianças de 4 a 7 anos.',
    cleanChildName
      ? `O nome da criança com quem você está conversando agora é ${cleanChildName}. Use o nome dela com carinho!`
      : 'Trate a criança com muito carinho e incentivo.',
    cleanContext
      ? `Contexto atual da atividade no aplicativo: ${cleanContext}.`
      : 'Ajude a criança com letras, vogais, consoantes, sílabas, fonemas e historinhas.',
    'Mantenha suas respostas curtas, lúdicas, fáceis de entender e estimulantes (1 a 3 frases alegres por turno), sempre celebrando o esforço da criança e convidando-a a participar ou pronunciar os sons das letras.',
  ].join(' ');
}

export function buildWavBufferFromPcm(
  pcmData: Buffer,
  sampleRate: number = 24000,
  numChannels: number = 1,
  bitsPerSample: number = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

function parseSampleRate(mimeType: string): number {
  const match = mimeType.match(/rate=(\d+)/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 24000;
}

export interface LiveSpeechResult {
  audioBase64: string;
  mimeType: string;
  engine: string;
  voiceName: LiveFemaleVoice;
}

const SERVER_LIVE_CACHE_LIMIT = 120;
const serverLiveCache = new Map<string, LiveSpeechResult>();
const serverLiveInFlight = new Map<string, Promise<LiveSpeechResult | null>>();

function setServerLiveCacheEntry(key: string, value: LiveSpeechResult): void {
  if (serverLiveCache.size >= SERVER_LIVE_CACHE_LIMIT) {
    const oldestKey = serverLiveCache.keys().next().value;
    if (oldestKey) {
      serverLiveCache.delete(oldestKey);
    }
  }
  serverLiveCache.set(key, value);
}

async function runSingleLiveSpeechSession(
  ai: GoogleGenAI,
  text: string,
  slowRate: boolean,
  voiceName: LiveFemaleVoice
): Promise<LiveSpeechResult | null> {
  return new Promise<LiveSpeechResult | null>((resolve, reject) => {
    const pcmChunks: Buffer[] = [];
    let detectedMimeType = 'audio/pcm;rate=24000';
    let sessionRef: Session | null = null;
    let settled = false;

    const cleanupAndFinish = (err?: Error | null, result?: LiveSpeechResult | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);

      try {
        sessionRef?.close();
      } catch {
        // Ignore close errors
      }
      sessionRef = null;

      if (err) {
        reject(err);
      } else {
        resolve(result ?? null);
      }
    };

    const timeoutId = setTimeout(() => {
      if (pcmChunks.length > 0) {
        const combinedPcm = Buffer.concat(pcmChunks);
        const wavBuffer = buildWavBufferFromPcm(
          combinedPcm,
          parseSampleRate(detectedMimeType),
          1,
          16
        );
        cleanupAndFinish(null, {
          audioBase64: wavBuffer.toString('base64'),
          mimeType: 'audio/wav',
          engine: GEMINI_LIVE_MODEL,
          voiceName,
        });
      } else {
        cleanupAndFinish(new Error('Tempo limite excedido ao aguardar áudio da Gemini Live API.'));
      }
    }, 14000);

    const systemInstruction = buildTeacherSystemInstruction({
      mode: 'read_aloud',
      slowRate,
    });

    ai.live
      .connect({
        model: GEMINI_LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
          systemInstruction,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const serverContent = message.serverContent;
            const parts = serverContent?.modelTurn?.parts ?? [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                if (part.inlineData.mimeType) {
                  detectedMimeType = part.inlineData.mimeType;
                }
                pcmChunks.push(Buffer.from(part.inlineData.data, 'base64'));
              }
            }

            if (serverContent?.generationComplete || serverContent?.turnComplete) {
              if (pcmChunks.length > 0) {
                const combinedPcm = Buffer.concat(pcmChunks);
                const wavBuffer = buildWavBufferFromPcm(
                  combinedPcm,
                  parseSampleRate(detectedMimeType),
                  1,
                  16
                );
                cleanupAndFinish(null, {
                  audioBase64: wavBuffer.toString('base64'),
                  mimeType: 'audio/wav',
                  engine: GEMINI_LIVE_MODEL,
                  voiceName,
                });
              } else if (serverContent?.turnComplete) {
                cleanupAndFinish(null, null);
              }
            }
          },
          onerror: (event: ErrorEvent) => {
            const msg = event?.message || 'Erro de conexão na Gemini Live API.';
            cleanupAndFinish(new Error(msg));
          },
          onclose: (event: CloseEvent) => {
            if (!settled) {
              if (pcmChunks.length > 0) {
                const combinedPcm = Buffer.concat(pcmChunks);
                const wavBuffer = buildWavBufferFromPcm(
                  combinedPcm,
                  parseSampleRate(detectedMimeType),
                  1,
                  16
                );
                cleanupAndFinish(null, {
                  audioBase64: wavBuffer.toString('base64'),
                  mimeType: 'audio/wav',
                  engine: GEMINI_LIVE_MODEL,
                  voiceName,
                });
              } else {
                const reason = event?.reason ? `: ${event.reason}` : '';
                cleanupAndFinish(
                  new Error(`Sessão Gemini Live encerrada sem áudio${reason}`)
                );
              }
            }
          },
        },
      })
      .then((session) => {
        if (settled) {
          try {
            session.close();
          } catch {}
          return;
        }
        sessionRef = session;
        session.sendClientContent({
          turns: [
            {
              role: 'user',
              parts: [
                {
                  text: `Leia em voz alta exatamente o texto a seguir com entusiasmo e carinho de professora infantil em português do Brasil:\n\n"${text}"`,
                },
              ],
            },
          ],
          turnComplete: true,
        });
      })
      .catch((err: unknown) => {
        const errorObj =
          err instanceof Error
            ? err
            : new Error('Falha ao conectar à Gemini Live API.');
        cleanupAndFinish(errorObj);
      });
  });
}

export async function synthesizeWithGeminiLive(params: {
  apiKey: string;
  text: string;
  slowRate?: boolean;
  voiceName?: LiveFemaleVoice;
}): Promise<LiveSpeechResult | null> {
  const cleanText = params.text.trim();
  const slowRate = Boolean(params.slowRate);
  const preferredVoice = resolveLiveFemaleVoice(params.voiceName);

  if (!cleanText) return null;

  const cacheKey = `${GEMINI_LIVE_MODEL}:${preferredVoice}:${slowRate ? 'slow' : 'normal'}:${cleanText}`;
  const cached = serverLiveCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const existingInFlight = serverLiveInFlight.get(cacheKey);
  if (existingInFlight) {
    return existingInFlight;
  }

  const ai = createGeminiServerClient(params.apiKey);

  const pendingPromise = (async (): Promise<LiveSpeechResult | null> => {
    // Tenta primeiro a voz feminina principal ('Kore') e faz fallback automático para 'Aoede'
    const voiceCandidates: LiveFemaleVoice[] =
      preferredVoice === 'Kore' ? ['Kore', 'Aoede'] : ['Aoede', 'Kore'];

    let lastError: unknown = null;
    for (const candidateVoice of voiceCandidates) {
      try {
        const result = await runSingleLiveSpeechSession(
          ai,
          cleanText,
          slowRate,
          candidateVoice
        );
        if (result) {
          setServerLiveCacheEntry(cacheKey, result);
          return result;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }
    return null;
  })().finally(() => {
    serverLiveInFlight.delete(cacheKey);
  });

  serverLiveInFlight.set(cacheKey, pendingPromise);
  return pendingPromise;
}

export interface LiveBridgeCallbacks {
  onAudioChunk: (base64Pcm: string, mimeType: string) => void;
  onInputTranscript: (text: string) => void;
  onOutputTranscript: (text: string) => void;
  onInterrupted: () => void;
  onTurnComplete: () => void;
  onReady: (voiceName: LiveFemaleVoice) => void;
  onError: (message: string) => void;
  onClose: (reason?: string) => void;
}

export async function connectInteractiveLiveSession(params: {
  apiKey: string;
  childName?: string;
  screenContext?: string;
  voiceName?: LiveFemaleVoice;
  callbacks: LiveBridgeCallbacks;
}): Promise<{ session: Session; voiceName: LiveFemaleVoice }> {
  const ai = createGeminiServerClient(params.apiKey);
  const preferredVoice = resolveLiveFemaleVoice(params.voiceName);
  const voiceCandidates: LiveFemaleVoice[] =
    preferredVoice === 'Kore' ? ['Kore', 'Aoede'] : ['Aoede', 'Kore'];

  const systemInstruction = buildTeacherSystemInstruction({
    mode: 'conversation',
    childName: params.childName,
    screenContext: params.screenContext,
  });

  let lastErr: unknown = null;

  for (const candidateVoice of voiceCandidates) {
    try {
      const session = await new Promise<Session>((resolve, reject) => {
        let opened = false;

        ai.live
          .connect({
            model: GEMINI_LIVE_MODEL,
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: candidateVoice,
                  },
                },
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              systemInstruction,
            },
            callbacks: {
              onopen: () => {
                opened = true;
              },
              onmessage: (message: LiveServerMessage) => {
                const content = message.serverContent;
                if (!content) return;

                if (content.interrupted) {
                  params.callbacks.onInterrupted();
                }

                if (content.inputTranscription?.text) {
                  params.callbacks.onInputTranscript(content.inputTranscription.text);
                }

                if (content.outputTranscription?.text) {
                  params.callbacks.onOutputTranscript(content.outputTranscription.text);
                }

                for (const part of content.modelTurn?.parts ?? []) {
                  if (part.inlineData?.data) {
                    params.callbacks.onAudioChunk(
                      part.inlineData.data,
                      part.inlineData.mimeType || 'audio/pcm;rate=24000'
                    );
                  }
                }

                if (content.turnComplete || content.generationComplete) {
                  params.callbacks.onTurnComplete();
                }
              },
              onerror: (event: ErrorEvent) => {
                const msg = event?.message || 'Erro na sessão de voz em tempo real.';
                if (!opened) {
                  reject(new Error(msg));
                } else {
                  params.callbacks.onError(msg);
                }
              },
              onclose: (event: CloseEvent) => {
                if (!opened) {
                  reject(
                    new Error(
                      event?.reason ||
                        `Não foi possível iniciar a voz ${candidateVoice} na Gemini Live API.`
                    )
                  );
                } else {
                  params.callbacks.onClose(event?.reason);
                }
              },
            },
          })
          .then((sess) => {
            opened = true;
            resolve(sess);
          })
          .catch((err) => reject(err));
      });

      params.callbacks.onReady(candidateVoice);
      return { session, voiceName: candidateVoice };
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error('Não foi possível conectar à Gemini Live API.');
}

export interface LiveTurnHistoryItem {
  role: 'child' | 'teacher';
  text: string;
}

export interface LiveTurnResult {
  audioBase64: string;
  mimeType: string;
  inputTranscript: string;
  outputTranscript: string;
  voiceName: LiveFemaleVoice;
}

async function runSingleLiveConversationTurn(params: {
  apiKey: string;
  action: 'greet' | 'text' | 'audio';
  text?: string;
  audioBase64Pcm16k?: string;
  history?: LiveTurnHistoryItem[];
  childName?: string;
  screenContext?: string;
  voiceName: LiveFemaleVoice;
}): Promise<LiveTurnResult> {
  const ai = createGeminiServerClient(params.apiKey);
  const voiceName = params.voiceName;
  const systemInstruction = buildTeacherSystemInstruction({
    mode: 'conversation',
    childName: params.childName,
    screenContext: params.screenContext,
  });

  return new Promise<LiveTurnResult>((resolve, reject) => {
    const pcmChunks: Buffer[] = [];
    let detectedMimeType = 'audio/pcm;rate=24000';
    let inputTranscript = '';
    let outputTranscript = '';
    let sessionRef: Session | null = null;
    let settled = false;

    const finish = (err?: Error | null, result?: LiveTurnResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      try {
        sessionRef?.close();
      } catch {}
      sessionRef = null;
      if (err) {
        reject(err);
      } else if (result) {
        resolve(result);
      }
    };

    const timeoutId = setTimeout(() => {
      if (pcmChunks.length > 0) {
        const wav = buildWavBufferFromPcm(
          Buffer.concat(pcmChunks),
          parseSampleRate(detectedMimeType),
          1,
          16
        );
        finish(null, {
          audioBase64: wav.toString('base64'),
          mimeType: 'audio/wav',
          inputTranscript: inputTranscript.trim(),
          outputTranscript: outputTranscript.trim(),
          voiceName,
        });
      } else {
        finish(new Error('Tempo limite excedido na resposta da Professora Bia.'));
      }
    }, 15000);

    ai.live
      .connect({
        model: GEMINI_LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const content = message.serverContent;
            if (!content) return;

            if (content.inputTranscription?.text) {
              inputTranscript += `${inputTranscript ? ' ' : ''}${content.inputTranscription.text.trim()}`;
            }

            if (content.outputTranscription?.text) {
              outputTranscript += `${outputTranscript ? ' ' : ''}${content.outputTranscription.text.trim()}`;
            }

            for (const part of content.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                if (part.inlineData.mimeType) {
                  detectedMimeType = part.inlineData.mimeType;
                }
                pcmChunks.push(Buffer.from(part.inlineData.data, 'base64'));
              }
            }

            if (content.generationComplete || content.turnComplete) {
              if (pcmChunks.length > 0) {
                const wav = buildWavBufferFromPcm(
                  Buffer.concat(pcmChunks),
                  parseSampleRate(detectedMimeType),
                  1,
                  16
                );
                finish(null, {
                  audioBase64: wav.toString('base64'),
                  mimeType: 'audio/wav',
                  inputTranscript: inputTranscript.trim(),
                  outputTranscript: outputTranscript.trim(),
                  voiceName,
                });
              } else if (content.turnComplete) {
                finish(new Error('A Professora Bia não retornou áudio neste turno.'));
              }
            }
          },
          onerror: (event: ErrorEvent) => {
            finish(new Error(event?.message || 'Erro de conexão com a Gemini Live API.'));
          },
          onclose: (event: CloseEvent) => {
            if (!settled) {
              if (pcmChunks.length > 0) {
                const wav = buildWavBufferFromPcm(
                  Buffer.concat(pcmChunks),
                  parseSampleRate(detectedMimeType),
                  1,
                  16
                );
                finish(null, {
                  audioBase64: wav.toString('base64'),
                  mimeType: 'audio/wav',
                  inputTranscript: inputTranscript.trim(),
                  outputTranscript: outputTranscript.trim(),
                  voiceName,
                });
              } else {
                finish(
                  new Error(event?.reason || 'Sessão encerrada antes da resposta da Professora.')
                );
              }
            }
          },
        },
      })
      .then((session) => {
        if (settled) {
          try {
            session.close();
          } catch {}
          return;
        }
        sessionRef = session;

        // Reenvia histórico recente para manter continuidade da conversa
        const historyTurns = (params.history || [])
          .slice(-6)
          .filter((item) => item.text.trim().length > 0)
          .map((item) => ({
            role: item.role === 'child' ? ('user' as const) : ('model' as const),
            parts: [{ text: item.text.trim() }],
          }));

        if (params.action === 'audio' && params.audioBase64Pcm16k) {
          if (historyTurns.length > 0) {
            session.sendClientContent({
              turns: historyTurns,
              turnComplete: false,
            });
          }

          const pcmBytes = Buffer.from(params.audioBase64Pcm16k, 'base64');
          const chunkSize = 8192;
          for (let offset = 0; offset < pcmBytes.length; offset += chunkSize) {
            const slice = pcmBytes.subarray(offset, offset + chunkSize);
            session.sendRealtimeInput({
              audio: {
                data: slice.toString('base64'),
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          }
          session.sendRealtimeInput({ audioStreamEnd: true });
          return;
        }

        const userPrompt =
          params.action === 'greet'
            ? params.childName
              ? `Cumprimente ${params.childName} com muita alegria e entusiasmo em português do Brasil e pergunte no que vocês vão brincar e aprender agora!`
              : 'Cumprimente a criança com muita alegria e entusiasmo em português do Brasil e convide-a para aprender brincando com você!'
            : params.text?.trim() || 'Olá, Professora!';

        session.sendClientContent({
          turns: [
            ...historyTurns,
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          turnComplete: true,
        });
      })
      .catch((err: unknown) => {
        finish(
          err instanceof Error
            ? err
            : new Error('Falha ao conectar à Gemini Live API.')
        );
      });
  });
}

export async function runLiveConversationTurn(params: {
  apiKey: string;
  action: 'greet' | 'text' | 'audio';
  text?: string;
  audioBase64Pcm16k?: string;
  history?: LiveTurnHistoryItem[];
  childName?: string;
  screenContext?: string;
  voiceName?: LiveFemaleVoice;
}): Promise<LiveTurnResult> {
  const preferredVoice = resolveLiveFemaleVoice(params.voiceName);
  const attempts: LiveFemaleVoice[] =
    preferredVoice === 'Kore'
      ? ['Kore', 'Kore', 'Aoede']
      : ['Aoede', 'Aoede', 'Kore'];

  let lastError: unknown = null;
  for (let i = 0; i < attempts.length; i++) {
    try {
      return await runSingleLiveConversationTurn({
        ...params,
        voiceName: attempts[i],
      });
    } catch (err) {
      lastError = err;
      if (i < attempts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (i + 1)));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Não foi possível conversar com a Professora Bia agora.');
}
