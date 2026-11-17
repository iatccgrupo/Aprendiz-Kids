import { NextRequest, NextResponse } from 'next/server';
import {
  getGeminiApiKey,
  resolveLiveFemaleVoice,
  synthesizeWithGeminiLive,
} from '@/lib/live-server';

// Rota unificada: delega integralmente para a Gemini Live API (gemini-3.8-live)
export async function POST(req: NextRequest) {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY não configurada no servidor.',
          fallback: true,
        },
        { status: 503 }
      );
    }

    const body = (await req.json()) as {
      text?: string;
      slowRate?: boolean;
      voiceName?: string;
    };

    const cleanText = typeof body?.text === 'string' ? body.text.trim() : '';
    const slowRate = Boolean(body?.slowRate);
    const voiceName = resolveLiveFemaleVoice(body?.voiceName);

    if (!cleanText) {
      return NextResponse.json(
        { error: 'Texto vazio para síntese de voz.' },
        { status: 400 }
      );
    }

    const result = await synthesizeWithGeminiLive({
      apiKey,
      text: cleanText,
      slowRate,
      voiceName,
    });

    if (!result) {
      return NextResponse.json(
        {
          error: 'A Gemini Live API não retornou dados de áudio.',
          fallback: true,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Erro ao gerar áudio via Gemini Live API.';
    return NextResponse.json(
      {
        error: message,
        fallback: true,
      },
      { status: 500 }
    );
  }
}
