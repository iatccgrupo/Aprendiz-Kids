import { NextRequest, NextResponse } from 'next/server';
import {
  getGeminiApiKey,
  resolveLiveFemaleVoice,
  synthesizeWithGeminiLive,
} from '@/lib/live-server';

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
        { error: 'Texto vazio para síntese de voz na Gemini Live API.' },
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
          error: 'A Gemini Live API não retornou áudio para este texto.',
          fallback: true,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Erro ao gerar áudio em tempo real via Gemini Live API.';
    return NextResponse.json(
      {
        error: message,
        fallback: true,
      },
      { status: 500 }
    );
  }
}
