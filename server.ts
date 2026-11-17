import { createServer } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import { WebSocket, WebSocketServer } from 'ws';
import type { Session } from '@google/genai';
import {
  connectInteractiveLiveSession,
  getGeminiApiKey,
  resolveLiveFemaleVoice,
} from './lib/live-server.ts';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface ClientLiveMessage {
  type: 'start' | 'audio' | 'text' | 'context';
  data?: string;
  text?: string;
  childName?: string;
  screenContext?: string;
  voiceName?: string;
}

function sendJsonSafe(ws: WebSocket, payload: Record<string, unknown>): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || '/', true);
    void handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });
  const nextUpgradeHandler = app.getUpgradeHandler();

  server.on('upgrade', (req, socket, head) => {
    const parsedUrl = parse(req.url || '/', true);
    if (parsedUrl.pathname === '/ws/live') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
      return;
    }

    // Repassa upgrades internos do Next.js se existirem
    void nextUpgradeHandler(req, socket, head);
  });

  wss.on('connection', (clientWs, req) => {
    const parsedUrl = parse(req.url || '/', true);
    const initialChildName =
      typeof parsedUrl.query.childName === 'string'
        ? parsedUrl.query.childName
        : undefined;
    const initialContext =
      typeof parsedUrl.query.context === 'string'
        ? parsedUrl.query.context
        : undefined;
    const initialVoice = resolveLiveFemaleVoice(parsedUrl.query.voiceName);

    let liveSession: Session | null = null;
    let isConnecting = false;
    let isClosed = false;

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      sendJsonSafe(clientWs, {
        type: 'error',
        message:
          'GEMINI_API_KEY não configurada no servidor. Configure sua chave no painel Settings > Secrets para ativar a conversa por voz.',
      });
      clientWs.close(1008, 'Missing GEMINI_API_KEY');
      return;
    }

    const startSession = async (opts: {
      childName?: string;
      screenContext?: string;
      voiceName?: string;
    }) => {
      if (isConnecting || isClosed) return;
      isConnecting = true;

      if (liveSession) {
        try {
          liveSession.close();
        } catch {}
        liveSession = null;
      }

      try {
        const { session } = await connectInteractiveLiveSession({
          apiKey,
          childName: opts.childName,
          screenContext: opts.screenContext,
          voiceName: resolveLiveFemaleVoice(opts.voiceName),
          callbacks: {
            onReady: (voiceName) => {
              sendJsonSafe(clientWs, {
                type: 'ready',
                voiceName,
              });
            },
            onAudioChunk: (data, mimeType) => {
              sendJsonSafe(clientWs, {
                type: 'audio',
                data,
                mimeType,
              });
            },
            onInputTranscript: (text) => {
              sendJsonSafe(clientWs, {
                type: 'inputTranscript',
                text,
              });
            },
            onOutputTranscript: (text) => {
              sendJsonSafe(clientWs, {
                type: 'outputTranscript',
                text,
              });
            },
            onInterrupted: () => {
              sendJsonSafe(clientWs, {
                type: 'interrupted',
              });
            },
            onTurnComplete: () => {
              sendJsonSafe(clientWs, {
                type: 'turnComplete',
              });
            },
            onError: (message) => {
              sendJsonSafe(clientWs, {
                type: 'error',
                message,
              });
            },
            onClose: (reason) => {
              sendJsonSafe(clientWs, {
                type: 'closed',
                reason,
              });
            },
          },
        });

        if (isClosed) {
          try {
            session.close();
          } catch {}
          return;
        }

        liveSession = session;

        // Saudação calorosa inicial da Professora Bia ao conectar
        session.sendClientContent({
          turns: [
            {
              role: 'user',
              parts: [
                {
                  text: opts.childName
                    ? `Cumprimente ${opts.childName} com muita alegria e entusiasmo em português do Brasil e pergunte no que vocês vão brincar e aprender agora!`
                    : 'Cumprimente a criança com muita alegria e entusiasmo em português do Brasil e convide-a para aprender brincando com você!',
                },
              ],
            },
          ],
          turnComplete: true,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erro ao iniciar conversa em tempo real com a Gemini Live API.';
        sendJsonSafe(clientWs, { type: 'error', message });
      } finally {
        isConnecting = false;
      }
    };

    void startSession({
      childName: initialChildName,
      screenContext: initialContext,
      voiceName: initialVoice,
    });

    clientWs.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as ClientLiveMessage;

        if (msg.type === 'start') {
          void startSession({
            childName: msg.childName || initialChildName,
            screenContext: msg.screenContext || initialContext,
            voiceName: msg.voiceName || initialVoice,
          });
          return;
        }

        if (!liveSession) return;

        if (msg.type === 'audio' && typeof msg.data === 'string' && msg.data.length > 0) {
          liveSession.sendRealtimeInput({
            audio: {
              data: msg.data,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
          return;
        }

        if (msg.type === 'text' && typeof msg.text === 'string' && msg.text.trim()) {
          liveSession.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [{ text: msg.text.trim() }],
              },
            ],
            turnComplete: true,
          });
          return;
        }

        if (msg.type === 'context' && typeof msg.screenContext === 'string') {
          liveSession.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [
                  {
                    text: `[Atualização silenciosa de contexto da tela: ${msg.screenContext}. Não precisa responder agora se a criança ainda estiver explorando, apenas use esse contexto quando ela falar com você.]`,
                  },
                ],
              },
            ],
            turnComplete: false,
          });
        }
      } catch {
        // Ignora mensagens JSON inválidas
      }
    });

    clientWs.on('close', () => {
      isClosed = true;
      if (liveSession) {
        try {
          liveSession.close();
        } catch {}
        liveSession = null;
      }
    });

    clientWs.on('error', () => {
      isClosed = true;
      if (liveSession) {
        try {
          liveSession.close();
        } catch {}
        liveSession = null;
      }
    });
  });

  server.listen(port, hostname, () => {
    console.log(`> Aprendiz Kids Live Server ready on http://${hostname}:${port}`);
  });
});
