import { NextRequest, NextResponse } from 'next/server';
import {
  getGeminiApiKey,
  LiveTurnHistoryItem,
  resolveLiveFemaleVoice,
  runLiveConversationTurn,
} from '@/lib/live-server';

export async function POST(req: NextRequest) {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'GEMINI_API_KEY não configurada no servidor. Configure sua chave no painel Settings > Secrets.',
        },
        { status: 503 }
      );
    }

    const body = (await req.json()) as {
      action?: 'greet' | 'text' | 'audio';
      text?: string;
      audioBase64Pcm16k?: string;
      history?: LiveTurnHistoryItem[];
      childName?: string;
      screenContext?: string;
      voiceName?: string;
    };

    const action =
      body?.action === 'audio' || body?.action === 'greet' ? body.action : 'text';

    if (action === 'text' && (!body?.text || !body.text.trim())) {
      return NextResponse.json(
        { error: 'Mensagem vazia para a Professora Bia.' },
        { status: 400 }
      );
    }

    if (action === 'audio' && !body?.audioBase64Pcm16k) {
      return NextResponse.json(
        { error: 'Nenhum áudio capturado para enviar à Professora Bia.' },
        { status: 400 }
      );
    }

    const result = await runLiveConversationTurn({
      apiKey,
      action,
      text: body?.text,
      audioBase64Pcm16k: body?.audioBase64Pcm16k,
      history: Array.isArray(body?.history) ? body.history : [],
      childName: body?.childName,
      screenContext: body?.screenContext,
      voiceName: resolveLiveFemaleVoice(body?.voiceName),
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Não foi possível conversar com a Professora Bia agora.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
