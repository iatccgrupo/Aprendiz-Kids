import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { Storybook } from '@/lib/types';

const PAGE_ACCENTS = [
  'from-amber-50 to-orange-50',
  'from-sky-50 to-blue-50',
  'from-emerald-50 to-teal-50',
  'from-purple-50 to-pink-50',
  'from-yellow-50 to-amber-50',
];

const COVER_ACCENTS: Record<string, string> = {
  Animais: 'from-amber-400 to-orange-500',
  Espaço: 'from-blue-600 to-indigo-600',
  Natureza: 'from-emerald-500 to-teal-600',
  Alfabeto: 'from-rose-500 to-amber-500',
  Aventura: 'from-sky-500 to-blue-600',
};

const STORYBOOK_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
] as const;

const RETRY_DELAYS_MS = [1500, 3000] as const;

const FRIENDLY_BUSY_MESSAGE =
  'A mágica das histórias está um pouquinho ocupada agora. Tente novamente em alguns segundos!';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return '';
  }
}

function isModelNotFoundError(err: unknown): boolean {
  const msg = getErrorText(err).toLowerCase();
  return msg.includes('not_found') || msg.includes('404') || msg.includes('not found');
}

function isTransientUnavailableError(err: unknown): boolean {
  const msg = getErrorText(err).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('502') ||
    msg.includes('504') ||
    msg.includes('etimedout') ||
    msg.includes('econnreset') ||
    msg.includes('fetch failed') ||
    msg.includes('network') ||
    msg.includes('timeout')
  );
}

function isAuthOrKeyError(err: unknown): boolean {
  const msg = getErrorText(err).toLowerCase();
  return (
    msg.includes('api_key_invalid') ||
    msg.includes('permission_denied') ||
    msg.includes('403') ||
    msg.includes('invalid api key')
  );
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('503 timeout ao gerar história'));
    }, timeoutMs);

    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function generateStoryJsonWithFallback(
  ai: GoogleGenAI,
  prompt: string
): Promise<string> {
  let lastError: unknown = null;

  for (let modelIndex = 0; modelIndex < STORYBOOK_MODEL_CANDIDATES.length; modelIndex++) {
    const model = STORYBOOK_MODEL_CANDIDATES[modelIndex];
    // Modelo principal faz até 3 tentativas (backoff de 1,5s e 3s); fallbacks respondem imediatamente
    const maxAttempts = modelIndex === 0 ? 3 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'Título curto e encantador da história em português',
                  },
                  theme: {
                    type: Type.STRING,
                    description:
                      'Tema principal (Animais, Espaço, Natureza, Alfabeto ou Aventura)',
                  },
                  summary: {
                    type: Type.STRING,
                    description: 'Resumo de 1 frase para a capa do livrinho',
                  },
                  moral: {
                    type: Type.STRING,
                    description: 'Mensagem carinhosa e educativa final',
                  },
                  coverEmoji: {
                    type: Type.STRING,
                    description: 'Um único emoji representativo da capa',
                  },
                  pages: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        pageNumber: { type: Type.INTEGER },
                        text: {
                          type: Type.STRING,
                          description:
                            'Texto infantil da página em português do Brasil (2-3 frases)',
                        },
                        illustrationDescription: {
                          type: Type.STRING,
                          description: 'Descrição visual da cena ilustrada em português',
                        },
                        sceneEmoji: {
                          type: Type.STRING,
                          description: 'Um único emoji expressivo da cena',
                        },
                        highlightWord: {
                          type: Type.STRING,
                          description: 'Uma palavra-chave da página para alfabetização',
                        },
                        highlightLetter: {
                          type: Type.STRING,
                          description: 'Letra inicial em maiúscula da palavra-chave',
                        },
                      },
                      required: [
                        'pageNumber',
                        'text',
                        'illustrationDescription',
                        'sceneEmoji',
                        'highlightWord',
                        'highlightLetter',
                      ],
                    },
                  },
                },
                required: ['title', 'theme', 'summary', 'moral', 'coverEmoji', 'pages'],
              },
            },
          }),
          10000
        );

        const rawText = (response.text ?? '').trim();
        if (rawText) {
          return rawText;
        }
        lastError = new Error('Resposta vazia do modelo ao criar história.');
      } catch (err: unknown) {
        lastError = err;

        if (isAuthOrKeyError(err)) {
          throw err;
        }

        // Se o modelo não existe/não está habilitado, passa imediatamente ao fallback
        if (isModelNotFoundError(err)) {
          break;
        }

        const shouldRetry = isTransientUnavailableError(err) && attempt < maxAttempts;
        if (shouldRetry) {
          const delayMs =
            RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)];
          await sleep(delayMs);
          continue;
        }

        // Se falhou definitivamente neste modelo por 503/429/rede, tenta próximo modelo
        if (isTransientUnavailableError(err)) {
          break;
        }

        throw err;
      }
    }
  }

  throw lastError ?? new Error(FRIENDLY_BUSY_MESSAGE);
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return NextResponse.json(
        {
          error:
            'A chave da IA ainda não está configurada no servidor. Peça a um adulto para verificar o painel Settings > Secrets.',
        },
        { status: 503 }
      );
    }

    const body = (await req.json()) as {
      theme?: string;
      customIdea?: string;
      childName?: string;
    };

    const theme =
      typeof body?.theme === 'string' && body.theme.trim()
        ? body.theme.trim()
        : 'Aventura';
    const customIdea =
      typeof body?.customIdea === 'string' ? body.customIdea.trim() : '';
    const childName =
      typeof body?.childName === 'string' ? body.childName.trim() : '';

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = [
      'Você é uma autora carinhosa de livros infantis brasileiros e pedagoga da Educação Infantil (4 a 7 anos).',
      `Crie uma história infantil lúdica, alegre e educativa em português do Brasil sobre o tema "${theme}".`,
      customIdea ? `Ideia especial pedida pela criança: "${customIdea}".` : '',
      childName
        ? `Se fizer sentido na narrativa, inclua com carinho o nome "${childName}" como amigo(a) ou protagonista.`
        : '',
      'Divida a história em exatamente 5 páginas curtas (2 a 3 frases fáceis, ricas em imaginação e positivas por página).',
      'Para cada página, inclua uma descrição visual detalhada da ilustração infantil, 1 emoji de cena, e 1 palavra-chave da página com sua letra inicial para ajudar na alfabetização.',
    ]
      .filter(Boolean)
      .join('\n');

    const rawText = await generateStoryJsonWithFallback(ai, prompt);

    const parsed = JSON.parse(rawText) as Omit<
      Storybook,
      'id' | 'coverAccent' | 'isGenerated'
    >;

    if (!parsed.title || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
      return NextResponse.json(
        {
          error: FRIENDLY_BUSY_MESSAGE,
          retryable: true,
        },
        { status: 503 }
      );
    }

    const resolvedTheme = parsed.theme || theme;
    const book: Storybook = {
      id: `ai-book-${Date.now()}`,
      title: parsed.title,
      theme: resolvedTheme,
      summary:
        parsed.summary || 'Uma história mágica criada especialmente para você!',
      moral:
        parsed.moral || 'A imaginação nos leva para aventuras incríveis!',
      coverEmoji: parsed.coverEmoji || '📖',
      coverAccent: COVER_ACCENTS[resolvedTheme] || 'from-blue-500 to-indigo-600',
      isGenerated: true,
      pages: parsed.pages.map((p, idx) => ({
        pageNumber: p.pageNumber || idx + 1,
        text: p.text,
        illustrationDescription: p.illustrationDescription,
        sceneEmoji: p.sceneEmoji || '✨',
        highlightWord: p.highlightWord || 'História',
        highlightLetter: (
          p.highlightLetter ||
          p.highlightWord?.[0] ||
          'H'
        ).toUpperCase(),
        accentBg: PAGE_ACCENTS[idx % PAGE_ACCENTS.length],
      })),
    };

    return NextResponse.json({ book });
  } catch (err: unknown) {
    if (isAuthOrKeyError(err)) {
      return NextResponse.json(
        {
          error:
            'Não foi possível autenticar a criação de histórias no momento. Verifique a chave em Settings > Secrets.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: FRIENDLY_BUSY_MESSAGE,
        retryable: true,
      },
      { status: 503 }
    );
  }
}
