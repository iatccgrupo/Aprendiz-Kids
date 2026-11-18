import {
  LevelInfo,
  Phase,
  ChildProfile,
  ActivityQuestion,
  ActivityOption,
  Medal,
  BnccSkill,
  ParentTip,
} from './types';
import { isPhonemeAnswerCorrect, normalizePhonemeString } from './utils';

export const PRIMEIRO_ANO_UNLOCK_MARKER_PHASE_ID = 'cycle-1ano-unlocked';

export const AVATAR_OPTIONS = [
  { id: 'fox', name: 'Pipoca', desc: 'A Raposinha Curiosa', emoji: '🦊', color: 'bg-orange-100 border-orange-400' },
  { id: 'bear', name: 'Teddy', desc: 'O Ursinho Amigo', emoji: '🐻', color: 'bg-amber-100 border-amber-400' },
  { id: 'owl', name: 'Sabichona', desc: 'A Corujinha Sábia', emoji: '🦉', color: 'bg-blue-100 border-blue-400' },
  { id: 'lion', name: 'Juba', desc: 'O Leãozinho Valente', emoji: '🦁', color: 'bg-yellow-100 border-yellow-400' },
  { id: 'astronaut', name: 'Astro', desc: 'O Explorador Espacial', emoji: '🚀', color: 'bg-indigo-100 border-indigo-400' },
  { id: 'dino', name: 'Dino', desc: 'O Dinossauro Brincalhão', emoji: '🦕', color: 'bg-emerald-100 border-emerald-400' },
  { id: 'cat', name: 'Mia', desc: 'A Gatinha Esperta', emoji: '🐱', color: 'bg-pink-100 border-pink-400' },
  { id: 'dolphin', name: 'Fred', desc: 'O Golfinho Saltador', emoji: '🐬', color: 'bg-cyan-100 border-cyan-400' },
];

/**
 * Estrutura oficial e ordenada das fases (BNCC - Alfabetização Lúdica):
 * Ciclo 1 - Educação Infantil (Níveis 1, 2 e 3):
 * - Nível 1 (Vogais): Fase 1 (A), Fase 2 (E), Fase 3 (I - Iguana), Fase 4 (O), Fase 5 (U)
 * - Nível 2 (Floresta dos Fonemas - Consoantes Amigas): B, C, M, P
 * - Nível 3 (Reino das Palavras Mágicas): Sílabas, Rimas e Desafio Final
 * Ciclo 2 - 1º Ano do Ensino Fundamental (Nível 4):
 * - Desbloqueado automaticamente ao concluir 100% da Educação Infantil (Fases 1 a 12)
 */
export const INITIAL_LEVELS: LevelInfo[] = [
  {
    id: 1,
    name: 'Nível 1: Ilha das Vogais',
    subtitle: 'Descobrindo os primeiros sons mágicos do alfabeto',
    badge: 'Vogais A-E-I-O-U',
    accentColor: 'from-blue-500 to-cyan-500',
    cycle: 'educacao_infantil',
    phases: [
      {
        id: 'fase-1',
        number: 1,
        levelId: 1,
        title: 'Vogal A',
        letter: 'A',
        icon: '🐝',
        starsEarned: 3,
        status: 'completed',
        description: 'A de Abelha e Avião',
        bnccTag: 'EF01LP02',
      },
      {
        id: 'fase-2',
        number: 2,
        levelId: 1,
        title: 'Vogal E',
        letter: 'E',
        icon: '🐘',
        starsEarned: 3,
        status: 'completed',
        description: 'E de Elefante e Estrela',
        bnccTag: 'EF01LP02',
      },
      {
        id: 'fase-3',
        number: 3,
        levelId: 1,
        title: 'Vogal I',
        letter: 'I',
        icon: '🦎',
        starsEarned: 0,
        status: 'current',
        description: 'I de Iguana e Ilha',
        bnccTag: 'EF01LP05',
      },
      {
        id: 'fase-4',
        number: 4,
        levelId: 1,
        title: 'Vogal O',
        letter: 'O',
        icon: '🐑',
        starsEarned: 0,
        status: 'locked',
        description: 'O de Ovelha e Óculos',
        bnccTag: 'EF01LP05',
      },
      {
        id: 'fase-5',
        number: 5,
        levelId: 1,
        title: 'Vogal U',
        letter: 'U',
        icon: '🍇',
        starsEarned: 0,
        status: 'locked',
        description: 'U de Uva e Urso',
        bnccTag: 'EF01LP07',
      },
    ],
  },
  {
    id: 2,
    name: 'Nível 2: Floresta dos Fonemas',
    subtitle: 'Conexão entre letras sonoras e animais da floresta',
    badge: 'Consoantes Amigas',
    accentColor: 'from-emerald-500 to-teal-500',
    cycle: 'educacao_infantil',
    phases: [
      {
        id: 'fase-6',
        number: 6,
        levelId: 2,
        title: 'Letra B',
        letter: 'B',
        icon: '⚽',
        starsEarned: 0,
        status: 'locked',
        description: 'B de Bola e Borboleta',
        bnccTag: 'EF01LP07',
      },
      {
        id: 'fase-7',
        number: 7,
        levelId: 2,
        title: 'Letra C',
        letter: 'C',
        icon: '🏠',
        starsEarned: 0,
        status: 'locked',
        description: 'C de Casa e Coelho',
        bnccTag: 'EF01LP07',
      },
      {
        id: 'fase-8',
        number: 8,
        levelId: 2,
        title: 'Letra M',
        letter: 'M',
        icon: '🐒',
        starsEarned: 0,
        status: 'locked',
        description: 'M de Macaco e Melancia',
        bnccTag: 'EF01LP08',
      },
      {
        id: 'fase-9',
        number: 9,
        levelId: 2,
        title: 'Letra P',
        letter: 'P',
        icon: '🦆',
        starsEarned: 0,
        status: 'locked',
        description: 'P de Pato e Pipa',
        bnccTag: 'EF01LP08',
      },
    ],
  },
  {
    id: 3,
    name: 'Nível 3: Reino das Palavras Mágicas',
    subtitle: 'Unindo sílabas e montando as primeiras palavras completas',
    badge: 'Mestres da Leitura',
    accentColor: 'from-purple-500 to-indigo-500',
    cycle: 'educacao_infantil',
    phases: [
      {
        id: 'fase-10',
        number: 10,
        levelId: 3,
        title: 'Sílabas BA-BE-BI',
        letter: 'BA',
        icon: '🍌',
        starsEarned: 0,
        status: 'locked',
        description: 'Banana, Baleia e Batata',
        bnccTag: 'EF01LP10',
      },
      {
        id: 'fase-11',
        number: 11,
        levelId: 3,
        title: 'Rimas Encantadas',
        letter: 'PÃO',
        icon: '🍞',
        starsEarned: 0,
        status: 'locked',
        description: 'Mão rima com Pão!',
        bnccTag: 'EF01LP12',
      },
      {
        id: 'fase-12',
        number: 12,
        levelId: 3,
        title: 'Grande Desafio do Saber',
        letter: 'S',
        icon: '☀️',
        starsEarned: 0,
        status: 'locked',
        description: 'S de Saber e Sol Dourado',
        bnccTag: 'EF01LP14',
      },
    ],
  },
  {
    id: 4,
    name: 'Nível 4: Trilha do 1º Ano Fundamental',
    subtitle: 'Encontros consonantais, dígrafos mágicos e leitura fluente',
    badge: '1º Ano Fundamental',
    accentColor: 'from-amber-500 to-rose-500',
    cycle: 'primeiro_ano',
    phases: [
      {
        id: 'fase-13',
        number: 13,
        levelId: 4,
        title: 'Encontro BR',
        letter: 'BR',
        icon: '🇧🇷',
        starsEarned: 0,
        status: 'locked',
        description: 'Brasil, Brinquedo e Abraço',
        bnccTag: 'EF01LP09',
      },
      {
        id: 'fase-14',
        number: 14,
        levelId: 4,
        title: 'Dígrafo CH',
        letter: 'CH',
        icon: '🔑',
        starsEarned: 0,
        status: 'locked',
        description: 'Chave, Chuva e Chapéu',
        bnccTag: 'EF01LP11',
      },
      {
        id: 'fase-15',
        number: 15,
        levelId: 4,
        title: 'Leitura Brilhante',
        letter: 'LUZ',
        icon: '🌟',
        starsEarned: 0,
        status: 'locked',
        description: 'Palavras e Frases do 1º Ano',
        bnccTag: 'EF01LP16',
      },
    ],
  },
];

/**
 * Palavras do minijogo "Caça às Palavras que começam com I" na Fase 3 (I de Iguana)
 */
export interface WordHuntItem {
  id: string;
  word: string;
  icon: string;
  startsWithI: boolean;
  initialLetter: string;
}

export const PHASE_3_IGUANA_WORDS: WordHuntItem[] = [
  { id: 'wh-iguana', word: 'Iguana', icon: '🦎', startsWithI: true, initialLetter: 'I' },
  { id: 'wh-abelha', word: 'Abelha', icon: '🐝', startsWithI: false, initialLetter: 'A' },
  { id: 'wh-ilha', word: 'Ilha', icon: '🏝️', startsWithI: true, initialLetter: 'I' },
  { id: 'wh-bola', word: 'Bola', icon: '⚽', startsWithI: false, initialLetter: 'B' },
  { id: 'wh-iglu', word: 'Iglu', icon: '🧊', startsWithI: true, initialLetter: 'I' },
  { id: 'wh-igreja', word: 'Igreja', icon: '⛪', startsWithI: true, initialLetter: 'I' },
];

export interface TracePoint {
  x: number;
  y: number;
}

export interface TraceStrokeSpec {
  marker: string;
  markerPos: TracePoint;
  points: TracePoint[];
}

export interface TrilogyWordHuntItem {
  id: string;
  word: string;
  icon: string;
  isMatch: boolean;
  initialLetter: string;
  highlightSegment?: string;
}

export type PhaseThemeColor = 'amber' | 'blue' | 'emerald' | 'purple' | 'orange';

export interface PhaseTrilogyConfig {
  phaseId: string;
  themeColor: PhaseThemeColor;
  mascotName: string;
  mascotEmoji: string;
  titleBadge: string;
  exploreHeading: string;
  exploreSubtitle: string;
  welcomeSpeech: string;
  initialGreeting: string;
  tappedGreeting: string;
  tappedSpeech: string;
  phonemeButtonLabel: string;
  phonemeSpeech: string;
  traceDisplayChar: string;
  traceInstruction: string;
  traceSuccessSpeech: string;
  traceStrokes: TraceStrokeSpec[];
  wordHuntTabLabel: string;
  wordHuntTitle: string;
  wordHuntPrompt: string;
  wordHuntRuleLabel: string;
  wordHuntItems: TrilogyWordHuntItem[];
}

function buildEllipseStroke(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startDeg: number,
  endDeg: number,
  steps: number = 18
): TracePoint[] {
  const pts: TracePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const rad = ((startDeg + (endDeg - startDeg) * t) * Math.PI) / 180;
    pts.push({
      x: Math.round(cx + rx * Math.cos(rad)),
      y: Math.round(cy + ry * Math.sin(rad)),
    });
  }
  return pts;
}

export const PHASE_TRILOGY_CONFIGS: Record<string, PhaseTrilogyConfig> = {
  'fase-1': {
    phaseId: 'fase-1',
    themeColor: 'amber',
    mascotName: 'Abelha Aninha',
    mascotEmoji: '🐝',
    titleBadge: 'Vogal A — A de Abelha 🐝',
    exploreHeading: 'Conheça a Abelha Aninha e a Letra A!',
    exploreSubtitle: 'Toque na abelhinha animada para ela voar e ensinar o som fonético /a/.',
    welcomeSpeech: 'Bem-vindo à Fase 1: Vogal A de Abelha! Toque na abelhinha para ouvir o som do A.',
    initialGreeting: 'Oi! Eu sou a Abelha Aninha! Toque em mim para ouvir o som da letra A!',
    tappedGreeting: 'Aaa-aaa-aaa! A de Abelha, Avião e Árvore!',
    tappedSpeech: 'Aaa! O som da letra A é aaaa, bem abertinho, como em Abelha e Avião!',
    phonemeButtonLabel: 'Ouvir Som Fonético /a/',
    phonemeSpeech: 'Letra A! Repita comigo: Aaaa de Abelha!',
    traceDisplayChar: 'A',
    traceInstruction: 'Siga os números 1, 2 e 3 com o dedo ou mouse para desenhar a letra A!',
    traceSuccessSpeech: 'Parabéns! Você desenhou a letra A perfeitamente!',
    traceStrokes: [
      {
        marker: '1',
        markerPos: { x: 146, y: 26 },
        points: [
          { x: 160, y: 46 },
          { x: 92, y: 234 },
        ],
      },
      {
        marker: '2',
        markerPos: { x: 178, y: 26 },
        points: [
          { x: 160, y: 46 },
          { x: 228, y: 234 },
        ],
      },
      {
        marker: '3',
        markerPos: { x: 94, y: 158 },
        points: [
          { x: 114, y: 158 },
          { x: 206, y: 158 },
        ],
      },
    ],
    wordHuntTabLabel: '3. Caça-Palavras A',
    wordHuntTitle: 'Caça às Palavras com a Letra A!',
    wordHuntPrompt: 'Toque em todas as figuras cujos nomes começam com a letra A!',
    wordHuntRuleLabel: 'começam com A',
    wordHuntItems: [
      { id: 'wh-a-abelha', word: 'Abelha', icon: '🐝', isMatch: true, initialLetter: 'A', highlightSegment: 'A' },
      { id: 'wh-a-bola', word: 'Bola', icon: '⚽', isMatch: false, initialLetter: 'B' },
      { id: 'wh-a-aviao', word: 'Avião', icon: '✈️', isMatch: true, initialLetter: 'A', highlightSegment: 'A' },
      { id: 'wh-a-uva', word: 'Uva', icon: '🍇', isMatch: false, initialLetter: 'U' },
      { id: 'wh-a-arvore', word: 'Árvore', icon: '🌳', isMatch: true, initialLetter: 'A', highlightSegment: 'Á' },
      { id: 'wh-a-anel', word: 'Anel', icon: '💍', isMatch: true, initialLetter: 'A', highlightSegment: 'A' },
    ],
  },
  'fase-2': {
    phaseId: 'fase-2',
    themeColor: 'blue',
    mascotName: 'Elefante Edu',
    mascotEmoji: '🐘',
    titleBadge: 'Vogal E — E de Elefante 🐘',
    exploreHeading: 'Conheça o Elefante Edu e a Letra E!',
    exploreSubtitle: 'Toque no elefante animado para ele balançar a tromba e ensinar o som /e/.',
    welcomeSpeech: 'Bem-vindo à Fase 2: Vogal E de Elefante! Toque no elefante para ouvir o som do E.',
    initialGreeting: 'Oi! Eu sou o Elefante Edu! Toque em mim para ouvir o som da letra E!',
    tappedGreeting: 'Eee-eee-eee! E de Elefante, Estrela e Escova!',
    tappedSpeech: 'Eee! O som da letra E é eeee, como em Elefante e Estrela!',
    phonemeButtonLabel: 'Ouvir Som Fonético /e/',
    phonemeSpeech: 'Letra E! Repita comigo: Eeee de Elefante!',
    traceDisplayChar: 'E',
    traceInstruction: 'Siga os números 1, 2, 3 e 4 para desenhar a letra E!',
    traceSuccessSpeech: 'Parabéns! Você desenhou a letra E perfeitamente!',
    traceStrokes: [
      {
        marker: '1',
        markerPos: { x: 86, y: 46 },
        points: [
          { x: 108, y: 46 },
          { x: 108, y: 234 },
        ],
      },
      {
        marker: '2',
        markerPos: { x: 108, y: 24 },
        points: [
          { x: 108, y: 46 },
          { x: 214, y: 46 },
        ],
      },
      {
        marker: '3',
        markerPos: { x: 108, y: 118 },
        points: [
          { x: 108, y: 140 },
          { x: 196, y: 140 },
        ],
      },
      {
        marker: '4',
        markerPos: { x: 108, y: 256 },
        points: [
          { x: 108, y: 234 },
          { x: 214, y: 234 },
        ],
      },
    ],
    wordHuntTabLabel: '3. Caça-Palavras E',
    wordHuntTitle: 'Caça às Palavras com a Letra E!',
    wordHuntPrompt: 'Toque em todas as figuras cujos nomes começam com a letra E!',
    wordHuntRuleLabel: 'começam com E',
    wordHuntItems: [
      { id: 'wh-e-elefante', word: 'Elefante', icon: '🐘', isMatch: true, initialLetter: 'E', highlightSegment: 'E' },
      { id: 'wh-e-casa', word: 'Casa', icon: '🏠', isMatch: false, initialLetter: 'C' },
      { id: 'wh-e-estrela', word: 'Estrela', icon: '⭐', isMatch: true, initialLetter: 'E', highlightSegment: 'E' },
      { id: 'wh-e-iguana', word: 'Iguana', icon: '🦎', isMatch: false, initialLetter: 'I' },
      { id: 'wh-e-escova', word: 'Escova', icon: '🪥', isMatch: true, initialLetter: 'E', highlightSegment: 'E' },
      { id: 'wh-e-espelho', word: 'Espelho', icon: '🪞', isMatch: true, initialLetter: 'E', highlightSegment: 'E' },
    ],
  },
  'fase-3': {
    phaseId: 'fase-3',
    themeColor: 'emerald',
    mascotName: 'Iguana Iara',
    mascotEmoji: '🦎',
    titleBadge: 'Vogal I — I de Iguana 🦎',
    exploreHeading: 'Conheça a Iguana Iara e a Letra I!',
    exploreSubtitle: 'Toque na iguana animada para ela pular e ensinar o som fonético /i/.',
    welcomeSpeech: 'Bem-vindo à Fase 3: Vogal I de Iguana! Toque na iguana para ouvir o som do I.',
    initialGreeting: 'Oi! Eu sou a Iguana Iara! Toque em mim para ouvir o som da letra I!',
    tappedGreeting: 'Iii-iii-iii! I de Iguana, Ilha e Iglu!',
    tappedSpeech: 'Iii! O som da letra I é iiii, como em Iguana e Ilha!',
    phonemeButtonLabel: 'Ouvir Som Fonético /i/',
    phonemeSpeech: 'Letra I! Repita comigo: Iiii de Iguana!',
    traceDisplayChar: 'I',
    traceInstruction: 'Siga os números 1, 2 e 3 com o dedo ou mouse para desenhar a letra I!',
    traceSuccessSpeech: 'Parabéns! Você desenhou a letra I perfeitamente!',
    traceStrokes: [
      {
        marker: '1',
        markerPos: { x: 160, y: 22 },
        points: [
          { x: 160, y: 42 },
          { x: 160, y: 238 },
        ],
      },
      {
        marker: '2',
        markerPos: { x: 88, y: 42 },
        points: [
          { x: 108, y: 42 },
          { x: 212, y: 42 },
        ],
      },
      {
        marker: '3',
        markerPos: { x: 88, y: 238 },
        points: [
          { x: 108, y: 238 },
          { x: 212, y: 238 },
        ],
      },
    ],
    wordHuntTabLabel: '3. Caça-Palavras I',
    wordHuntTitle: 'Caça às Palavras com a Letra I!',
    wordHuntPrompt: 'Toque em todas as figuras cujos nomes começam com a letra I!',
    wordHuntRuleLabel: 'começam com I',
    wordHuntItems: PHASE_3_IGUANA_WORDS.map((item) => ({
      id: item.id,
      word: item.word,
      icon: item.icon,
      isMatch: item.startsWithI,
      initialLetter: item.initialLetter,
      highlightSegment: item.startsWithI ? 'I' : undefined,
    })),
  },
  'fase-4': {
    phaseId: 'fase-4',
    themeColor: 'orange',
    mascotName: 'Ovelha Olívia',
    mascotEmoji: '🐑',
    titleBadge: 'Vogal O — O de Ovelha 🐑',
    exploreHeading: 'Conheça a Ovelha Olívia e a Letra O!',
    exploreSubtitle: 'Toque na ovelhinha fofa para ela pular e ensinar o som fonético /o/.',
    welcomeSpeech: 'Bem-vindo à Fase 4: Vogal O de Ovelha! Toque na ovelhinha para ouvir o som do O.',
    initialGreeting: 'Oi! Eu sou a Ovelha Olívia! Toque em mim para ouvir o som da letra O!',
    tappedGreeting: 'Ooo-ooo-ooo! O de Ovelha, Óculos e Ônibus!',
    tappedSpeech: 'Ooo! O som da letra O faz a boquinha redondinha: oooo de Ovelha!',
    phonemeButtonLabel: 'Ouvir Som Fonético /o/',
    phonemeSpeech: 'Letra O! Repita comigo: Oooo de Ovelha!',
    traceDisplayChar: 'O',
    traceInstruction: 'Comece no número 1 lá no alto e dê a volta redondinha para desenhar a letra O!',
    traceSuccessSpeech: 'Parabéns! Você desenhou a letra O perfeitamente!',
    traceStrokes: [
      {
        marker: '1',
        markerPos: { x: 160, y: 22 },
        points: buildEllipseStroke(160, 140, 68, 92, -90, 270, 20),
      },
    ],
    wordHuntTabLabel: '3. Caça-Palavras O',
    wordHuntTitle: 'Caça às Palavras com a Letra O!',
    wordHuntPrompt: 'Toque em todas as figuras cujos nomes começam com a letra O!',
    wordHuntRuleLabel: 'começam com O',
    wordHuntItems: [
      { id: 'wh-o-ovelha', word: 'Ovelha', icon: '🐑', isMatch: true, initialLetter: 'O', highlightSegment: 'O' },
      { id: 'wh-o-uva', word: 'Uva', icon: '🍇', isMatch: false, initialLetter: 'U' },
      { id: 'wh-o-oculos', word: 'Óculos', icon: '👓', isMatch: true, initialLetter: 'O', highlightSegment: 'Ó' },
      { id: 'wh-o-pato', word: 'Pato', icon: '🦆', isMatch: false, initialLetter: 'P' },
      { id: 'wh-o-olho', word: 'Olho', icon: '👀', isMatch: true, initialLetter: 'O', highlightSegment: 'O' },
      { id: 'wh-o-onibus', word: 'Ônibus', icon: '🚌', isMatch: true, initialLetter: 'O', highlightSegment: 'Ô' },
    ],
  },
  'fase-5': {
    phaseId: 'fase-5',
    themeColor: 'purple',
    mascotName: 'Urso Ulisses',
    mascotEmoji: '🐻',
    titleBadge: 'Vogal U — U de Uva 🍇',
    exploreHeading: 'Conheça o Urso Ulisses e a Letra U!',
    exploreSubtitle: 'Toque no ursinho amigo para ouvir o som fonético /u/ de Uva e Urso.',
    welcomeSpeech: 'Bem-vindo à Fase 5: Vogal U de Uva! Toque no ursinho para ouvir o som do U.',
    initialGreeting: 'Oi! Eu sou o Urso Ulisses e adoro Uva! Toque em mim para ouvir o som do U!',
    tappedGreeting: 'Uuu-uuu-uuu! U de Uva, Urso e Unicórnio!',
    tappedSpeech: 'Uuu! O som da letra U faz biquinho: uuuu de Uva e Urso!',
    phonemeButtonLabel: 'Ouvir Som Fonético /u/',
    phonemeSpeech: 'Letra U! Repita comigo: Uuuu de Uva!',
    traceDisplayChar: 'U',
    traceInstruction: 'Comece no número 1, desça pela curva e suba até o outro lado para formar o U!',
    traceSuccessSpeech: 'Parabéns! Você desenhou a letra U perfeitamente!',
    traceStrokes: [
      {
        marker: '1',
        markerPos: { x: 82, y: 46 },
        points: [
          { x: 102, y: 46 },
          { x: 102, y: 162 },
          { x: 112, y: 204 },
          { x: 136, y: 228 },
          { x: 160, y: 234 },
          { x: 184, y: 228 },
          { x: 208, y: 204 },
          { x: 218, y: 162 },
          { x: 218, y: 46 },
        ],
      },
    ],
    wordHuntTabLabel: '3. Caça-Palavras U',
    wordHuntTitle: 'Caça às Palavras com a Letra U!',
    wordHuntPrompt: 'Toque em todas as figuras cujos nomes começam com a letra U!',
    wordHuntRuleLabel: 'começam com U',
    wordHuntItems: [
      { id: 'wh-u-uva', word: 'Uva', icon: '🍇', isMatch: true, initialLetter: 'U', highlightSegment: 'U' },
      { id: 'wh-u-estrela', word: 'Estrela', icon: '⭐', isMatch: false, initialLetter: 'E' },
      { id: 'wh-u-urso', word: 'Urso', icon: '🐻', isMatch: true, initialLetter: 'U', highlightSegment: 'U' },
      { id: 'wh-u-macaco', word: 'Macaco', icon: '🐒', isMatch: false, initialLetter: 'M' },
      { id: 'wh-u-unicornio', word: 'Unicórnio', icon: '🦄', isMatch: true, initialLetter: 'U', highlightSegment: 'U' },
      { id: 'wh-u-unha', word: 'Unha', icon: '💅', isMatch: true, initialLetter: 'U', highlightSegment: 'U' },
    ],
  },
  'fase-6': {
    phaseId: 'fase-6',
    themeColor: 'blue',
    mascotName: 'Borboleta Bela',
    mascotEmoji: '🦋',
    titleBadge: 'Letra B — B de Bola ⚽',
    exploreHeading: 'Conheça a Borboleta Bela e a Letra B!',
    exploreSubtitle: 'Toque na borboleta da floresta para ouvir o som da consoante B (/b/).',
    welcomeSpeech: 'Bem-vindo à Floresta dos Fonemas! Vamos descobrir a letra B de Bola e Borboleta!',
    initialGreeting: 'Oi! Eu sou a Borboleta Bela! Toque em mim para ouvir o som da letra B!',
    tappedGreeting: 'B-b-b! B de Bola, Borboleta e Banana!',
    tappedSpeech: 'Bê! O som do B junta os lábios e solta o ar: b-b-b de Bola e Borboleta!',
    phonemeButtonLabel: 'Ouvir Som Fonético /b/',
    phonemeSpeech: 'Letra B! Repita comigo: Bê de Bola!',
    traceDisplayChar: 'B',
    traceInstruction: 'Siga os números 1, 2 e 3: faça o traço reto e depois as duas barriguinhas do B!',
    traceSuccessSpeech: 'Parabéns! Você desenhou a letra B perfeitamente!',
    traceStrokes: [
      {
        marker: '1',
        markerPos: { x: 86, y: 46 },
        points: [
          { x: 106, y: 46 },
          { x: 106, y: 234 },
        ],
      },
      {
        marker: '2',
        markerPos: { x: 108, y: 24 },
        points: [
          { x: 106, y: 46 },
          { x: 176, y: 46 },
          { x: 208, y: 66 },
          { x: 208, y: 116 },
          { x: 176, y: 138 },
          { x: 106, y: 138 },
        ],
      },
      {
        marker: '3',
        markerPos: { x: 204, y: 138 },
        points: [
          { x: 106, y: 138 },
          { x: 184, y: 138 },
          { x: 218, y: 162 },
          { x: 218, y: 212 },
          { x: 184, y: 234 },
          { x: 106, y: 234 },
        ],
      },
    ],
    wordHuntTabLabel: '3. Caça-Palavras B',
    wordHuntTitle: 'Caça às Palavras com a Letra B!',
    wordHuntPrompt: 'Toque em todas as figuras cujos nomes começam com a letra B!',
    wordHuntRuleLabel: 'começam com B',
    wordHuntItems: [
      { id: 'wh-b-bola', word: 'Bola', icon: '⚽', isMatch: true, initialLetter: 'B', highlightSegment: 'B' },
      { id: 'wh-b-casa', word: 'Casa', icon: '🏠', isMatch: false, initialLetter: 'C' },
      { id: 'wh-b-borboleta', word: 'Borboleta', icon: '🦋', isMatch: true, initialLetter: 'B', highlightSegment: 'B' },
      { id: 'wh-b-dado', word: 'Dado', icon: '🎲', isMatch: false, initialLetter: 'D' },
      { id: 'wh-b-banana', word: 'Banana', icon: '🍌', isMatch: true, initialLetter: 'B', highlightSegment: 'B' },
      { id: 'wh-b-baleia', word: 'Baleia', icon: '🐋', isMatch: true, initialLetter: 'B', highlightSegment: 'B' },
    ],
  },
  'fase-7': {
    phaseId: 'fase-7',
    themeColor: 'emerald',
    mascotName: 'Coelho Cacá',
    mascotEmoji: '🐰',
    titleBadge: 'Letra C — C de Casa 🏠',
    exploreHeading: 'Conheça o Coelho Cacá e a Letra C!',
    exploreSubtitle: 'Toque no coelhinho saltador para ouvir o som da consoante C (/k/).',
    welcomeSpeech: 'Que legal! Chegamos na Fase 7: Letra C de Casa e Coelho!',
    initialGreeting: 'Oi! Eu sou o Coelho Cacá! Toque em mim para ouvir o som da letra C!',
    tappedGreeting: 'C-c-c! C de Casa, Coelho e Carro!',
    tappedSpeech: 'Cê! O som do C em Casa e Coelho faz c-c-c bem forte na gargantinha!',
    phonemeButtonLabel: 'Ouvir Som Fonético /c/',
    phonemeSpeech: 'Letra C! Repita comigo: Cê de Casa e Coelho!',
    traceDisplayChar: 'C',
    traceInstruction: 'Comece no número 1 em cima e faça a curva aberta da letra C!',
    traceSuccessSpeech: 'Parabéns! Você desenhou a letra C perfeitamente!',
    traceStrokes: [
      {
        marker: '1',
        markerPos: { x: 214, y: 52 },
        points: buildEllipseStroke(164, 140, 70, 92, -45, -315, 18),
      },
    ],
    wordHuntTabLabel: '3. Caça-Palavras C',
    wordHuntTitle: 'Caça às Palavras com a Letra C!',
    wordHuntPrompt: 'Toque em todas as figuras cujos nomes começam com a letra C!',
    wordHuntRuleLabel: 'começam com C',
    wordHuntItems: [
      { id: 'wh-c-casa', word: 'Casa', icon: '🏠', isMatch: true, initialLetter: 'C', highlightSegment: 'C' },
      { id: 'wh-c-bola', word: 'Bola', icon: '⚽', isMatch: false, initialLetter: 'B' },
      { id: 'wh-c-coelho', word: 'Coelho', icon: '🐰', isMatch: true, initialLetter: 'C', highlightSegment: 'C' },
      { id: 'wh-c-gato', word: 'Gato', icon: '🐱', isMatch: false, initialLetter: 'G' },
      { id: 'wh-c-carro', word: 'Carro', icon: '🚗', isMatch: true, initialLetter: 'C', highlightSegment: 'C' },
      { id: 'wh-c-coruja', word: 'Coruja', icon: '🦉', isMatch: true, initialLetter: 'C', highlightSegment: 'C' },
    ],
  },
  'fase-8': {
    phaseId: 'fase-8',
    themeColor: 'amber',
    mascotName: 'Macaco Miko',
    mascotEmoji: '🐒',
    titleBadge: 'Letra M — M de Macaco 🐒',
    exploreHeading: 'Conheça o Macaco Miko e a Letra M!',
    exploreSubtitle: 'Toque no macaquinho alegre para ouvir o som da consoante M (/m/).',
    welcomeSpeech: 'Chegamos na Fase 8: Letra M de Macaco e Melancia! Toque no macaquinho!',
    initialGreeting: 'Oi! Eu sou o Macaco Miko! Toque em mim para ouvir o som da letra M!',
    tappedGreeting: 'M-m-m! M de Macaco, Melancia e Maçã!',
    tappedSpeech: 'Ême! O som do M fecha os lábios e faz hummm: m-m-m de Macaco e Melancia!',
    phonemeButtonLabel: 'Ouvir Som Fonético /m/',
    phonemeSpeech: 'Letra M! Repita comigo: Hummm de Macaco!',
    traceDisplayChar: 'M',
    traceInstruction: 'Siga os números 1, 2, 3 e 4 para subir e descer as montanhas da letra M!',
    traceSuccessSpeech: 'Parabéns! Você desenhou a letra M perfeitamente!',
    traceStrokes: [
      {
        marker: '1',
        markerPos: { x: 72, y: 224 },
        points: [
          { x: 90, y: 234 },
          { x: 90, y: 46 },
        ],
      },
      {
        marker: '2',
        markerPos: { x: 92, y: 24 },
        points: [
          { x: 90, y: 46 },
          { x: 160, y: 158 },
        ],
      },
      {
        marker: '3',
        markerPos: { x: 228, y: 24 },
        points: [
          { x: 230, y: 46 },
          { x: 160, y: 158 },
        ],
      },
      {
        marker: '4',
        markerPos: { x: 248, y: 46 },
        points: [
          { x: 230, y: 46 },
          { x: 230, y: 234 },
        ],
      },
    ],
    wordHuntTabLabel: '3. Caça-Palavras M',
    wordHuntTitle: 'Caça às Palavras com a Letra M!',
    wordHuntPrompt: 'Toque em todas as figuras cujos nomes começam com a letra M!',
    wordHuntRuleLabel: 'começam com M',
    wordHuntItems: [
      { id: 'wh-m-macaco', word: 'Macaco', icon: '🐒', isMatch: true, initialLetter: 'M', highlightSegment: 'M' },
      { id: 'wh-m-navio', word: 'Navio', icon: '🚢', isMatch: false, initialLetter: 'N' },
      { id: 'wh-m-melancia', word: 'Melancia', icon: '🍉', isMatch: true, initialLetter: 'M', highlightSegment: 'M' },
      { id: 'wh-m-pipa', word: 'Pipa', icon: '🪁', isMatch: false, initialLetter: 'P' },
      { id: 'wh-m-maca', word: 'Maçã', icon: '🍎', isMatch: true, initialLetter: 'M', highlightSegment: 'M' },
      { id: 'wh-m-mala', word: 'Mala', icon: '🧳', isMatch: true, initialLetter: 'M', highlightSegment: 'M' },
    ],
  },
  'fase-9': {
    phaseId: 'fase-9',
    themeColor: 'orange',
    mascotName: 'Pato Pepe',
    mascotEmoji: '🦆',
    titleBadge: 'Letra P — P de Pato 🦆',
    exploreHeading: 'Conheça o Pato Pepe e a Letra P!',
    exploreSubtitle: 'Toque no patinho divertido para ouvir o som explosivo do P (/p/).',
    welcomeSpeech: 'Que máximo! Fase 9: Letra P de Pato e Pipa! Toque no patinho!',
    initialGreeting: 'Oi! Eu sou o Pato Pepe! Toque em mim para ouvir o som da letra P!',
    tappedGreeting: 'P-p-p! P de Pato, Pipa e Pipoca!',
    tappedSpeech: 'Pê! O som da letra P estoura levinho nos lábios como pipoca: p-p-p de Pato!',
    phonemeButtonLabel: 'Ouvir Som Fonético /p/',
    phonemeSpeech: 'Letra P! Repita comigo: Pê de Pato e Pipa!',
    traceDisplayChar: 'P',
    traceInstruction: 'Siga os números 1 e 2 para traçar o pauzinho e a cabecinha da letra P!',
    traceSuccessSpeech: 'Parabéns! Você desenhou a letra P perfeitamente!',
    traceStrokes: [
      {
        marker: '1',
        markerPos: { x: 88, y: 46 },
        points: [
          { x: 108, y: 46 },
          { x: 108, y: 234 },
        ],
      },
      {
        marker: '2',
        markerPos: { x: 112, y: 24 },
        points: [
          { x: 108, y: 46 },
          { x: 184, y: 46 },
          { x: 218, y: 70 },
          { x: 218, y: 122 },
          { x: 184, y: 146 },
          { x: 108, y: 146 },
        ],
      },
    ],
    wordHuntTabLabel: '3. Caça-Palavras P',
    wordHuntTitle: 'Caça às Palavras com a Letra P!',
    wordHuntPrompt: 'Toque em todas as figuras cujos nomes começam com a letra P!',
    wordHuntRuleLabel: 'começam com P',
    wordHuntItems: [
      { id: 'wh-p-pato', word: 'Pato', icon: '🦆', isMatch: true, initialLetter: 'P', highlightSegment: 'P' },
      { id: 'wh-p-bola', word: 'Bola', icon: '⚽', isMatch: false, initialLetter: 'B' },
      { id: 'wh-p-pipa', word: 'Pipa', icon: '🪁', isMatch: true, initialLetter: 'P', highlightSegment: 'P' },
      { id: 'wh-p-coelho', word: 'Coelho', icon: '🐰', isMatch: false, initialLetter: 'C' },
      { id: 'wh-p-peixe', word: 'Peixe', icon: '🐟', isMatch: true, initialLetter: 'P', highlightSegment: 'P' },
      { id: 'wh-p-pipoca', word: 'Pipoca', icon: '🍿', isMatch: true, initialLetter: 'P', highlightSegment: 'P' },
    ],
  },
  'fase-10': {
    phaseId: 'fase-10',
    themeColor: 'purple',
    mascotName: 'Baleia Bia',
    mascotEmoji: '🐋',
    titleBadge: 'Sílabas BA-BE-BI — Banana 🍌',
    exploreHeading: 'Conheça a Baleia Bia e a Sílaba BA!',
    exploreSubtitle: 'Toque na baleia amiga para juntar os sons B + A e formar BA!',
    welcomeSpeech: 'Entramos no Reino das Palavras Mágicas! Toque na baleia para ouvir a sílaba BA!',
    initialGreeting: 'Oi! Eu sou a Baleia Bia! Vamos juntar B + A para formar BA?',
    tappedGreeting: 'B + A = BA! BA de Banana, Baleia e Balão!',
    tappedSpeech: 'BA! Quando a letra B dá a mão para a vogal A, nasce o som BA de Banana e Baleia!',
    phonemeButtonLabel: 'Ouvir Sílaba /ba/',
    phonemeSpeech: 'B com A faz BA! Repita comigo: BA de Banana!',
    traceDisplayChar: 'BA',
    traceInstruction: 'Siga os números 1, 2, 3 e 4 para traçar juntinhas as letras B e A!',
    traceSuccessSpeech: 'Parabéns! Você desenhou a sílaba BA perfeitamente!',
    traceStrokes: [
      {
        marker: '1',
        markerPos: { x: 36, y: 54 },
        points: [
          { x: 54, y: 54 },
          { x: 54, y: 224 },
        ],
      },
      {
        marker: '2',
        markerPos: { x: 58, y: 34 },
        points: [
          { x: 54, y: 54 },
          { x: 112, y: 54 },
          { x: 134, y: 74 },
          { x: 134, y: 114 },
          { x: 112, y: 136 },
          { x: 54, y: 136 },
          { x: 116, y: 136 },
          { x: 140, y: 160 },
          { x: 140, y: 204 },
          { x: 116, y: 224 },
          { x: 54, y: 224 },
        ],
      },
      {
        marker: '3',
        markerPos: { x: 218, y: 34 },
        points: [
          { x: 218, y: 54 },
          { x: 170, y: 224 },
        ],
      },
      {
        marker: '4',
        markerPos: { x: 238, y: 34 },
        points: [
          { x: 218, y: 54 },
          { x: 266, y: 224 },
        ],
      },
      {
        marker: '5',
        markerPos: { x: 176, y: 158 },
        points: [
          { x: 190, y: 158 },
          { x: 248, y: 158 },
        ],
      },
    ],
    wordHuntTabLabel: '3. Caça-Sílabas BA',
    wordHuntTitle: 'Caça às Palavras com a Sílaba BA!',
    wordHuntPrompt: 'Toque em todas as figuras cujos nomes começam com BA!',
    wordHuntRuleLabel: 'começam com BA',
    wordHuntItems: [
      { id: 'wh-ba-banana', word: 'Banana', icon: '🍌', isMatch: true, initialLetter: 'B', highlightSegment: 'Ba' },
      { id: 'wh-ba-maca', word: 'Maçã', icon: '🍎', isMatch: false, initialLetter: 'M' },
      { id: 'wh-ba-baleia', word: 'Baleia', icon: '🐋', isMatch: true, initialLetter: 'B', highlightSegment: 'Ba' },
      { id: 'wh-ba-caju', word: 'Caju', icon: '🥜', isMatch: false, initialLetter: 'C' },
      { id: 'wh-ba-batata', word: 'Batata', icon: '🥔', isMatch: true, initialLetter: 'B', highlightSegment: 'Ba' },
      { id: 'wh-ba-balao', word: 'Balão', icon: '🎈', isMatch: true, initialLetter: 'B', highlightSegment: 'Ba' },
    ],
  },
  'fase-11': {
    phaseId: 'fase-11',
    themeColor: 'amber',
    mascotName: 'Padeiro Pipo',
    mascotEmoji: '🍞',
    titleBadge: 'Rimas Encantadas — Pão & Mão 🍞',
    exploreHeading: 'Descubra as Rimas com Pão e Mão!',
    exploreSubtitle: 'Toque no pãozinho quentinho para ouvir o som mágico da rima -ÃO!',
    welcomeSpeech: 'Hora das Rimas Encantadas! Toque no pãozinho para ouvir a rima em ão!',
    initialGreeting: 'Oi! Vamos brincar de rimar? Toque em mim para ouvir o som de Pão!',
    tappedGreeting: 'Mão rima com Pão, Leão e Balão! Tudo termina com -ÃO!',
    tappedSpeech: 'ÃO! Mão e Pão terminam igualzinho com o som ão! Que rima divertida!',
    phonemeButtonLabel: 'Ouvir Rima /ão/',
    phonemeSpeech: 'Rima com ão! Mão, Pão, Leão e Balão!',
    traceDisplayChar: 'ÃO',
    traceInstruction: 'Siga os números 1, 2, 3, 4 e 5 para traçar o som mágico ÃO!',
    traceSuccessSpeech: 'Parabéns! Você desenhou o som mágico ÃO perfeitamente!',
    traceStrokes: [
      {
        marker: '1',
        markerPos: { x: 96, y: 54 },
        points: [
          { x: 96, y: 74 },
          { x: 52, y: 224 },
        ],
      },
      {
        marker: '2',
        markerPos: { x: 114, y: 54 },
        points: [
          { x: 96, y: 74 },
          { x: 140, y: 224 },
        ],
      },
      {
        marker: '3',
        markerPos: { x: 56, y: 162 },
        points: [
          { x: 70, y: 162 },
          { x: 122, y: 162 },
        ],
      },
      {
        marker: '4',
        markerPos: { x: 64, y: 34 },
        points: [
          { x: 68, y: 44 },
          { x: 86, y: 34 },
          { x: 106, y: 46 },
          { x: 124, y: 36 },
        ],
      },
      {
        marker: '5',
        markerPos: { x: 224, y: 52 },
        points: buildEllipseStroke(224, 150, 48, 74, -90, 270, 18),
      },
    ],
    wordHuntTabLabel: '3. Caça-Rimas -ÃO',
    wordHuntTitle: 'Caça às Palavras que Rimam com PÃO!',
    wordHuntPrompt: 'Toque em todas as palavras que terminam com o som -ÃO!',
    wordHuntRuleLabel: 'rimam com -ÃO',
    wordHuntItems: [
      { id: 'wh-r-pao', word: 'Pão', icon: '🍞', isMatch: true, initialLetter: 'P', highlightSegment: 'ão' },
      { id: 'wh-r-sol', word: 'Sol', icon: '☀️', isMatch: false, initialLetter: 'S' },
      { id: 'wh-r-mao', word: 'Mão', icon: '✋', isMatch: true, initialLetter: 'M', highlightSegment: 'ão' },
      { id: 'wh-r-uva', word: 'Uva', icon: '🍇', isMatch: false, initialLetter: 'U' },
      { id: 'wh-r-leao', word: 'Leão', icon: '🦁', isMatch: true, initialLetter: 'L', highlightSegment: 'ão' },
      { id: 'wh-r-balao', word: 'Balão', icon: '🎈', isMatch: true, initialLetter: 'B', highlightSegment: 'ão' },
    ],
  },
  'fase-12': {
    phaseId: 'fase-12',
    themeColor: 'orange',
    mascotName: 'Sol Sabichão',
    mascotEmoji: '☀️',
    titleBadge: 'Grande Desafio — S de Sol ☀️',
    exploreHeading: 'Conheça o Sol Sabichão e a Letra S!',
    exploreSubtitle: 'Toque no Sol dourado para ouvir o som da letra S (/s/) e concluir a jornada!',
    welcomeSpeech: 'Grande Desafio do Saber! Toque no Sol dourado para ouvir o som da letra S!',
    initialGreeting: 'Oi! Eu sou o Sol Sabichão! Toque em mim para ouvir o som da letra S!',
    tappedGreeting: 'Sss-sss-sss! S de Sol, Saber e Sapo!',
    tappedSpeech: 'Ésse! A letra S faz o som da cobrinha ssss, como em Sol e Saber!',
    phonemeButtonLabel: 'Ouvir Som Fonético /s/',
    phonemeSpeech: 'Letra S! Repita comigo: Ssss de Sol e Saber!',
    traceDisplayChar: 'S',
    traceInstruction: 'Comece no número 1 lá em cima e faça a curva da cobrinha para desenhar o S!',
    traceSuccessSpeech: 'Parabéns! Você desenhou a letra S perfeitamente!',
    traceStrokes: [
      {
        marker: '1',
        markerPos: { x: 214, y: 46 },
        points: [
          { x: 210, y: 66 },
          { x: 164, y: 44 },
          { x: 114, y: 64 },
          { x: 114, y: 108 },
          { x: 160, y: 140 },
          { x: 210, y: 172 },
          { x: 210, y: 214 },
          { x: 160, y: 236 },
          { x: 108, y: 214 },
        ],
      },
    ],
    wordHuntTabLabel: '3. Caça-Palavras S',
    wordHuntTitle: 'Caça às Palavras com a Letra S!',
    wordHuntPrompt: 'Toque em todas as figuras cujos nomes começam com a letra S!',
    wordHuntRuleLabel: 'começam com S',
    wordHuntItems: [
      { id: 'wh-s-sol', word: 'Sol', icon: '☀️', isMatch: true, initialLetter: 'S', highlightSegment: 'S' },
      { id: 'wh-s-lua', word: 'Lua', icon: '🌙', isMatch: false, initialLetter: 'L' },
      { id: 'wh-s-sapo', word: 'Sapo', icon: '🐸', isMatch: true, initialLetter: 'S', highlightSegment: 'S' },
      { id: 'wh-s-rei', word: 'Rei', icon: '👑', isMatch: false, initialLetter: 'R' },
      { id: 'wh-s-sorvete', word: 'Sorvete', icon: '🍦', isMatch: true, initialLetter: 'S', highlightSegment: 'S' },
      { id: 'wh-s-sino', word: 'Sino', icon: '🔔', isMatch: true, initialLetter: 'S', highlightSegment: 'S' },
    ],
  },
  'fase-13': {
    phaseId: 'fase-13',
    themeColor: 'emerald',
    mascotName: 'Tucano Tico',
    mascotEmoji: '🦜',
    titleBadge: '1º Ano: Encontro BR — Brasil 🇧🇷',
    exploreHeading: 'Bem-vindo ao 1º Ano! Conheça o som BR!',
    exploreSubtitle: 'Toque no Tucano Tico para juntar B + R e ouvir o som vibrante BR!',
    welcomeSpeech: 'Bem-vindo ao 1º Ano do Ensino Fundamental! Toque no tucano para ouvir o encontro B R de Brasil e Brinquedo!',
    initialGreeting: 'Oi! Eu sou o Tucano Tico! Vamos descobrir o som B + R juntos?',
    tappedGreeting: 'B + R = BR! BR de Brasil, Brinquedo e Braço!',
    tappedSpeech: 'Brrr! Quando o B se junta com o R, nasce o som vibrante BR de Brasil e Brinquedo!',
    phonemeButtonLabel: 'Ouvir Encontro /br/',
    phonemeSpeech: 'Encontro B R! Repita comigo: BR de Brasil e Brinquedo!',
    traceDisplayChar: 'BR',
    traceInstruction: 'Siga os números para traçar as letras B e R juntinhas!',
    traceSuccessSpeech: 'Excelente! Você escreveu o encontro B R com capricho!',
    traceStrokes: [
      {
        marker: '1',
        markerPos: { x: 40, y: 54 },
        points: [
          { x: 58, y: 54 },
          { x: 58, y: 224 },
        ],
      },
      {
        marker: '2',
        markerPos: { x: 64, y: 34 },
        points: [
          { x: 58, y: 54 },
          { x: 118, y: 54 },
          { x: 140, y: 74 },
          { x: 140, y: 116 },
          { x: 118, y: 136 },
          { x: 58, y: 136 },
          { x: 124, y: 136 },
          { x: 144, y: 160 },
          { x: 144, y: 204 },
          { x: 120, y: 224 },
          { x: 58, y: 224 },
        ],
      },
      {
        marker: '3',
        markerPos: { x: 168, y: 54 },
        points: [
          { x: 186, y: 54 },
          { x: 186, y: 224 },
        ],
      },
      {
        marker: '4',
        markerPos: { x: 192, y: 34 },
        points: [
          { x: 186, y: 54 },
          { x: 244, y: 54 },
          { x: 266, y: 76 },
          { x: 266, y: 118 },
          { x: 244, y: 140 },
          { x: 186, y: 140 },
          { x: 264, y: 224 },
        ],
      },
    ],
    wordHuntTabLabel: '3. Caça-Palavras BR',
    wordHuntTitle: 'Caça às Palavras com o Encontro BR!',
    wordHuntPrompt: 'Toque em todas as figuras que têm o encontro BR!',
    wordHuntRuleLabel: 'têm BR',
    wordHuntItems: [
      { id: 'wh-br-brasil', word: 'Brasil', icon: '🇧🇷', isMatch: true, initialLetter: 'B', highlightSegment: 'Br' },
      { id: 'wh-br-casa', word: 'Casa', icon: '🏠', isMatch: false, initialLetter: 'C' },
      { id: 'wh-br-brinquedo', word: 'Brinquedo', icon: '🧸', isMatch: true, initialLetter: 'B', highlightSegment: 'Br' },
      { id: 'wh-br-gato', word: 'Gato', icon: '🐱', isMatch: false, initialLetter: 'G' },
      { id: 'wh-br-braco', word: 'Braço', icon: '💪', isMatch: true, initialLetter: 'B', highlightSegment: 'Br' },
      { id: 'wh-br-bruxa', word: 'Bruxa', icon: '🧙‍♀️', isMatch: true, initialLetter: 'B', highlightSegment: 'Br' },
    ],
  },
  'fase-14': {
    phaseId: 'fase-14',
    themeColor: 'blue',
    mascotName: 'Chaveirinho Chico',
    mascotEmoji: '🔑',
    titleBadge: '1º Ano: Dígrafo CH — Chave 🔑',
    exploreHeading: 'Descubra o Dígrafo CH com a Chave Mágica!',
    exploreSubtitle: 'Toque na chavinha do 1º Ano para ouvir C + H fazendo o som /x/!',
    welcomeSpeech: 'Fase 14 do 1º Ano! Vamos aprender o dígrafo C H de Chave, Chuva e Chapéu!',
    initialGreeting: 'Oi! Quando C e H se abraçam, fazemos shhh! Toque em mim!',
    tappedGreeting: 'C + H = CH! CH de Chave, Chuva e Chapéu!',
    tappedSpeech: 'Chê! As duas letrinhas C e H juntas fazem um único som: shhh de Chave e Chuva!',
    phonemeButtonLabel: 'Ouvir Dígrafo /ch/',
    phonemeSpeech: 'Dígrafo C H! Repita comigo: Shhh de Chave e Chapéu!',
    traceDisplayChar: 'CH',
    traceInstruction: 'Siga os números para traçar juntinhas as letras C e H!',
    traceSuccessSpeech: 'Incrível! Você desenhou o dígrafo C H direitinho!',
    traceStrokes: [
      {
        marker: '1',
        markerPos: { x: 132, y: 66 },
        points: buildEllipseStroke(102, 140, 48, 74, -45, -315, 16),
      },
      {
        marker: '2',
        markerPos: { x: 162, y: 54 },
        points: [
          { x: 180, y: 54 },
          { x: 180, y: 224 },
        ],
      },
      {
        marker: '3',
        markerPos: { x: 244, y: 54 },
        points: [
          { x: 262, y: 54 },
          { x: 262, y: 224 },
        ],
      },
      {
        marker: '4',
        markerPos: { x: 182, y: 140 },
        points: [
          { x: 180, y: 140 },
          { x: 262, y: 140 },
        ],
      },
    ],
    wordHuntTabLabel: '3. Caça-Palavras CH',
    wordHuntTitle: 'Caça às Palavras com o Dígrafo CH!',
    wordHuntPrompt: 'Toque em todas as figuras cujos nomes começam com CH!',
    wordHuntRuleLabel: 'começam com CH',
    wordHuntItems: [
      { id: 'wh-ch-chave', word: 'Chave', icon: '🔑', isMatch: true, initialLetter: 'C', highlightSegment: 'Ch' },
      { id: 'wh-ch-bola', word: 'Bola', icon: '⚽', isMatch: false, initialLetter: 'B' },
      { id: 'wh-ch-chuva', word: 'Chuva', icon: '🌧️', isMatch: true, initialLetter: 'C', highlightSegment: 'Ch' },
      { id: 'wh-ch-pato', word: 'Pato', icon: '🦆', isMatch: false, initialLetter: 'P' },
      { id: 'wh-ch-chapeu', word: 'Chapéu', icon: '👒', isMatch: true, initialLetter: 'C', highlightSegment: 'Ch' },
      { id: 'wh-ch-chocolate', word: 'Chocolate', icon: '🍫', isMatch: true, initialLetter: 'C', highlightSegment: 'Ch' },
    ],
  },
  'fase-15': {
    phaseId: 'fase-15',
    themeColor: 'amber',
    mascotName: 'Estrela Luz',
    mascotEmoji: '🌟',
    titleBadge: '1º Ano: Leitura Brilhante — LUZ 🌟',
    exploreHeading: 'Leitura Brilhante do 1º Ano Fundamental!',
    exploreSubtitle: 'Toque na Estrela Luz para ler a palavra LUZ e praticar leitura rápida!',
    welcomeSpeech: 'Que orgulho! Chegamos à Leitura Brilhante do 1º Ano! Toque na estrela para ouvir a palavra LUZ!',
    initialGreeting: 'Oi! Vamos ler palavras completas do 1º Ano juntos?',
    tappedGreeting: 'L + U + Z = LUZ! A luz do saber brilha em você!',
    tappedSpeech: 'Luz! Juntando L, U e Z lemos LUZ! Agora você já lê palavrinhas inteiras com brilho!',
    phonemeButtonLabel: 'Ouvir Palavra LUZ',
    phonemeSpeech: 'Lê comigo: L U Z forma a palavra Luz!',
    traceDisplayChar: 'LUZ',
    traceInstruction: 'Siga os números para escrever a palavra mágica LUZ!',
    traceSuccessSpeech: 'Maravilha! Você escreveu a palavra LUZ inteirinha!',
    traceStrokes: [
      {
        marker: '1',
        markerPos: { x: 34, y: 58 },
        points: [
          { x: 48, y: 66 },
          { x: 48, y: 214 },
          { x: 102, y: 214 },
        ],
      },
      {
        marker: '2',
        markerPos: { x: 118, y: 58 },
        points: [
          { x: 128, y: 66 },
          { x: 128, y: 174 },
          { x: 140, y: 206 },
          { x: 160, y: 216 },
          { x: 180, y: 206 },
          { x: 192, y: 174 },
          { x: 192, y: 66 },
        ],
      },
      {
        marker: '3',
        markerPos: { x: 214, y: 46 },
        points: [
          { x: 214, y: 66 },
          { x: 282, y: 66 },
          { x: 214, y: 214 },
          { x: 284, y: 214 },
        ],
      },
    ],
    wordHuntTabLabel: '3. Caça-Palavras LUZ',
    wordHuntTitle: 'Caça às Palavras que Terminam com Z ou Brilham!',
    wordHuntPrompt: 'Toque nas palavras que rimam com LUZ ou terminam com Z!',
    wordHuntRuleLabel: 'terminam com Z',
    wordHuntItems: [
      { id: 'wh-luz-luz', word: 'Luz', icon: '🌟', isMatch: true, initialLetter: 'L', highlightSegment: 'uz' },
      { id: 'wh-luz-mesa', word: 'Mesa', icon: '🪑', isMatch: false, initialLetter: 'M' },
      { id: 'wh-luz-paz', word: 'Paz', icon: '🕊️', isMatch: true, initialLetter: 'P', highlightSegment: 'az' },
      { id: 'wh-luz-livro', word: 'Livro', icon: '📖', isMatch: false, initialLetter: 'L' },
      { id: 'wh-luz-feliz', word: 'Feliz', icon: '😄', isMatch: true, initialLetter: 'F', highlightSegment: 'iz' },
      { id: 'wh-luz-voz', word: 'Voz', icon: '🎤', isMatch: true, initialLetter: 'V', highlightSegment: 'oz' },
    ],
  },
};

export function getPhaseTrilogyConfig(phaseId: string): PhaseTrilogyConfig {
  return PHASE_TRILOGY_CONFIGS[phaseId] || PHASE_TRILOGY_CONFIGS['fase-1'];
}

/**
 * Fonte única de verdade para geração de perguntas e alternativas.
 * Garante que a letra-alvo da rodada e do áudio seja idêntica à opção correta gerada.
 */
interface OptionSeed {
  letter: string;
  word: string;
  icon: string;
  colorClass: string;
}

interface PhaseChallengeBlueprint {
  id: string;
  phaseId: string;
  target: OptionSeed;
  phonemeSound: string;
  spokenPrompt: string;
  hintText: string;
  correctSlotIndex: 0 | 1 | 2 | 3;
  distractors: [OptionSeed, OptionSeed, OptionSeed];
}

function buildActivityQuestionFromBlueprint(
  blueprint: PhaseChallengeBlueprint
): ActivityQuestion {
  const { id, phaseId, target, phonemeSound, spokenPrompt, hintText, correctSlotIndex, distractors } =
    blueprint;

  const targetNorm = normalizePhonemeString(target.letter);

  // Garante que nenhum distrator tenha a mesma letra da resposta correta
  const sanitizedDistractors = distractors.filter(
    (d) => normalizePhonemeString(d.letter) !== targetNorm
  );
  if (sanitizedDistractors.length !== 3) {
    throw new Error(
      `Blueprint inválido na fase "${phaseId}": distratores devem ser 3 letras distintas da letra-alvo "${target.letter}".`
    );
  }

  const orderedSeeds: OptionSeed[] = [];
  let distractorIdx = 0;
  for (let slot = 0; slot < 4; slot++) {
    if (slot === correctSlotIndex) {
      orderedSeeds.push(target);
    } else {
      orderedSeeds.push(sanitizedDistractors[distractorIdx]);
      distractorIdx++;
    }
  }

  const options: ActivityOption[] = orderedSeeds.map((seed, idx) => ({
    id: `opt-${phaseId}-${idx}-${normalizePhonemeString(seed.letter)}`,
    letter: seed.letter,
    word: seed.word,
    icon: seed.icon,
    colorClass: seed.colorClass,
    isCorrect: isPhonemeAnswerCorrect(seed.letter, target.letter),
  }));

  return {
    id,
    phaseId,
    targetLetter: target.letter,
    targetWord: target.word,
    phonemeSound,
    spokenPrompt,
    hintText,
    options,
  };
}

const PHASE_CHALLENGE_BLUEPRINTS: PhaseChallengeBlueprint[] = [
  // NÍVEL 1: ILHA DAS VOGAIS (Fases 1 a 5 em ordem exata)
  {
    id: 'q-vogal-a',
    phaseId: 'fase-1',
    target: { letter: 'A', word: 'Abelha', icon: '🐝', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
    phonemeSound: '/a/',
    spokenPrompt: 'Atenção, aventureiro! Onde está a letra A de Abelha?',
    hintText: 'A de Amor, Abelha e Amizade!',
    correctSlotIndex: 2,
    distractors: [
      { letter: 'U', word: 'Uva', icon: '🍇', colorClass: 'bg-purple-100 border-purple-300 text-purple-900' },
      { letter: 'O', word: 'Óculos', icon: '👓', colorClass: 'bg-sky-100 border-sky-300 text-sky-900' },
      { letter: 'E', word: 'Estrela', icon: '⭐', colorClass: 'bg-rose-100 border-rose-300 text-rose-900' },
    ],
  },
  {
    id: 'q-vogal-e',
    phaseId: 'fase-2',
    target: { letter: 'E', word: 'Elefante', icon: '🐘', colorClass: 'bg-blue-100 border-blue-300 text-blue-900' },
    phonemeSound: '/e/',
    spokenPrompt: 'Ouça o som: E! Qual card tem a letra E de Elefante?',
    hintText: 'A letrinha E parece uma escadinha com três degraus!',
    correctSlotIndex: 0,
    distractors: [
      { letter: 'I', word: 'Ilha', icon: '🏝️', colorClass: 'bg-teal-100 border-teal-300 text-teal-900' },
      { letter: 'U', word: 'Urso', icon: '🐻', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
      { letter: 'A', word: 'Avião', icon: '✈️', colorClass: 'bg-orange-100 border-orange-300 text-orange-900' },
    ],
  },
  {
    id: 'q-vogal-i',
    phaseId: 'fase-3',
    target: { letter: 'I', word: 'Iguana', icon: '🦎', colorClass: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
    phonemeSound: '/i/',
    spokenPrompt: 'Ouça com atenção: toque na letra I de Iguana!',
    hintText: 'A letra I é compridinha e tem o som inicial de Iguana e Ilha!',
    correctSlotIndex: 1,
    distractors: [
      { letter: 'A', word: 'Abelha', icon: '🐝', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
      { letter: 'E', word: 'Elefante', icon: '🐘', colorClass: 'bg-blue-100 border-blue-300 text-blue-900' },
      { letter: 'O', word: 'Ovelha', icon: '🐑', colorClass: 'bg-orange-100 border-orange-300 text-orange-900' },
    ],
  },
  {
    id: 'q-vogal-o',
    phaseId: 'fase-4',
    target: { letter: 'O', word: 'Ovelha', icon: '🐑', colorClass: 'bg-orange-100 border-orange-300 text-orange-900' },
    phonemeSound: '/o/',
    spokenPrompt: 'Vamos encontrar a letra O de Ovelha e Ônibus!',
    hintText: 'A letrinha O é bem redondinha como uma bolha!',
    correctSlotIndex: 1,
    distractors: [
      { letter: 'A', word: 'Árvore', icon: '🌳', colorClass: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
      { letter: 'E', word: 'Espelho', icon: '🪞', colorClass: 'bg-indigo-100 border-indigo-300 text-indigo-900' },
      { letter: 'U', word: 'Unicórnio', icon: '🦄', colorClass: 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-900' },
    ],
  },
  {
    id: 'q-vogal-u',
    phaseId: 'fase-5',
    target: { letter: 'U', word: 'Uva', icon: '🍇', colorClass: 'bg-purple-100 border-purple-300 text-purple-900' },
    phonemeSound: '/u/',
    spokenPrompt: 'Ouça o som: U! Onde está a letra U de Uva?',
    hintText: 'A letra U desce por uma curva e sobe de novo como um escorregador!',
    correctSlotIndex: 3,
    distractors: [
      { letter: 'I', word: 'Iglu', icon: '🧊', colorClass: 'bg-cyan-100 border-cyan-300 text-cyan-900' },
      { letter: 'E', word: 'Escova', icon: '🪥', colorClass: 'bg-lime-100 border-lime-300 text-lime-900' },
      { letter: 'O', word: 'Olho', icon: '👀', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
    ],
  },

  // NÍVEL 2: FLORESTA DOS FONEMAS (Consoantes Amigas — B, C, M, P)
  {
    id: 'q-consoante-b',
    phaseId: 'fase-6',
    target: { letter: 'B', word: 'Bola', icon: '⚽', colorClass: 'bg-blue-100 border-blue-300 text-blue-900' },
    phonemeSound: '/b/',
    spokenPrompt: 'Ouça o som da floresta: toque na letra B de Bola!',
    hintText: 'O som /b/ junta os dois lábios: B de Bola e Borboleta!',
    correctSlotIndex: 0,
    distractors: [
      { letter: 'D', word: 'Dado', icon: '🎲', colorClass: 'bg-red-100 border-red-300 text-red-900' },
      { letter: 'P', word: 'Pato', icon: '🦆', colorClass: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
      { letter: 'M', word: 'Maçã', icon: '🍎', colorClass: 'bg-rose-100 border-rose-300 text-rose-900' },
    ],
  },
  {
    id: 'q-consoante-c',
    phaseId: 'fase-7',
    target: { letter: 'C', word: 'Casa', icon: '🏠', colorClass: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
    phonemeSound: '/k/',
    spokenPrompt: 'Ouça com atenção: toque na letra C de Casa e Coelho!',
    hintText: 'A letra C tem o som /k/ como em Casa e Coelho!',
    correctSlotIndex: 2,
    distractors: [
      { letter: 'B', word: 'Bola', icon: '⚽', colorClass: 'bg-blue-100 border-blue-300 text-blue-900' },
      { letter: 'G', word: 'Gato', icon: '🐱', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
      { letter: 'T', word: 'Tatu', icon: '🐾', colorClass: 'bg-orange-100 border-orange-300 text-orange-900' },
    ],
  },
  {
    id: 'q-consoante-m',
    phaseId: 'fase-8',
    target: { letter: 'M', word: 'Macaco', icon: '🐒', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
    phonemeSound: '/m/',
    spokenPrompt: 'Ouça o som amigo: toque na letra M de Macaco!',
    hintText: 'O som /m/ faz hummm com os lábios fechados: M de Macaco!',
    correctSlotIndex: 1,
    distractors: [
      { letter: 'N', word: 'Navio', icon: '🚢', colorClass: 'bg-sky-100 border-sky-300 text-sky-900' },
      { letter: 'P', word: 'Pipa', icon: '🪁', colorClass: 'bg-purple-100 border-purple-300 text-purple-900' },
      { letter: 'B', word: 'Borboleta', icon: '🦋', colorClass: 'bg-pink-100 border-pink-300 text-pink-900' },
    ],
  },
  {
    id: 'q-consoante-p',
    phaseId: 'fase-9',
    target: { letter: 'P', word: 'Pato', icon: '🦆', colorClass: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
    phonemeSound: '/p/',
    spokenPrompt: 'Atenção na floresta: toque na letra P de Pato e Pipa!',
    hintText: 'O som /p/ estoura bem levinho nos lábios: P de Pato!',
    correctSlotIndex: 3,
    distractors: [
      { letter: 'B', word: 'Baleia', icon: '🐋', colorClass: 'bg-cyan-100 border-cyan-300 text-cyan-900' },
      { letter: 'C', word: 'Coelho', icon: '🐰', colorClass: 'bg-rose-100 border-rose-300 text-rose-900' },
      { letter: 'F', word: 'Foca', icon: '🦭', colorClass: 'bg-indigo-100 border-indigo-300 text-indigo-900' },
    ],
  },

  // NÍVEL 3: REINO DAS PALAVRAS MÁGICAS
  {
    id: 'q-silaba-ba',
    phaseId: 'fase-10',
    target: { letter: 'BA', word: 'Banana', icon: '🍌', colorClass: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
    phonemeSound: '/ba/',
    spokenPrompt: 'Junte os sons B + A! Toque na sílaba BA de Banana!',
    hintText: 'Quando o B dá a mão para o A, nasce a sílaba BA de Banana!',
    correctSlotIndex: 1,
    distractors: [
      { letter: 'CA', word: 'Caju', icon: '🥜', colorClass: 'bg-orange-100 border-orange-300 text-orange-900' },
      { letter: 'MA', word: 'Maçã', icon: '🍎', colorClass: 'bg-rose-100 border-rose-300 text-rose-900' },
      { letter: 'PA', word: 'Pato', icon: '🦆', colorClass: 'bg-sky-100 border-sky-300 text-sky-900' },
    ],
  },
  {
    id: 'q-rima-pao',
    phaseId: 'fase-11',
    target: { letter: 'PÃO', word: 'Pão', icon: '🍞', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
    phonemeSound: '/ão/',
    spokenPrompt: 'Rimas encantadas! Qual palavra rima com MÃO? Toque em PÃO!',
    hintText: 'Mão e Pão terminam com o mesmo som mágico: -ÃO!',
    correctSlotIndex: 0,
    distractors: [
      { letter: 'SOL', word: 'Sol', icon: '☀️', colorClass: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
      { letter: 'BOLA', word: 'Bola', icon: '⚽', colorClass: 'bg-blue-100 border-blue-300 text-blue-900' },
      { letter: 'UVA', word: 'Uva', icon: '🍇', colorClass: 'bg-purple-100 border-purple-300 text-purple-900' },
    ],
  },
  {
    id: 'q-desafio-s',
    phaseId: 'fase-12',
    target: { letter: 'S', word: 'Sol', icon: '☀️', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
    phonemeSound: '/s/',
    spokenPrompt: 'Grande Desafio do Saber! Toque na letra S de Sol e Saber!',
    hintText: 'A letra S tem o som da cobrinha sss... S de Sol e Saber!',
    correctSlotIndex: 2,
    distractors: [
      { letter: 'L', word: 'Lua', icon: '🌙', colorClass: 'bg-indigo-100 border-indigo-300 text-indigo-900' },
      { letter: 'R', word: 'Rei', icon: '👑', colorClass: 'bg-purple-100 border-purple-300 text-purple-900' },
      { letter: 'V', word: 'Vento', icon: '💨', colorClass: 'bg-teal-100 border-teal-300 text-teal-900' },
    ],
  },

  // NÍVEL 4: TRILHA DO 1º ANO FUNDAMENTAL
  {
    id: 'q-1ano-br',
    phaseId: 'fase-13',
    target: { letter: 'BR', word: 'Brasil', icon: '🇧🇷', colorClass: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
    phonemeSound: '/br/',
    spokenPrompt: 'Desafio do 1º Ano! Toque no encontro BR de Brasil e Brinquedo!',
    hintText: 'Quando B e R se juntam, formam o som BR de Brasil!',
    correctSlotIndex: 1,
    distractors: [
      { letter: 'CH', word: 'Chave', icon: '🔑', colorClass: 'bg-blue-100 border-blue-300 text-blue-900' },
      { letter: 'PA', word: 'Pato', icon: '🦆', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
      { letter: 'SO', word: 'Sol', icon: '☀️', colorClass: 'bg-orange-100 border-orange-300 text-orange-900' },
    ],
  },
  {
    id: 'q-1ano-ch',
    phaseId: 'fase-14',
    target: { letter: 'CH', word: 'Chave', icon: '🔑', colorClass: 'bg-blue-100 border-blue-300 text-blue-900' },
    phonemeSound: '/ch/',
    spokenPrompt: 'Dígrafo do 1º Ano! Toque em CH de Chave e Chapéu!',
    hintText: 'O C com H faz o som shhh de Chave e Chuva!',
    correctSlotIndex: 2,
    distractors: [
      { letter: 'BR', word: 'Brasil', icon: '🇧🇷', colorClass: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
      { letter: 'MA', word: 'Maçã', icon: '🍎', colorClass: 'bg-rose-100 border-rose-300 text-rose-900' },
      { letter: 'CA', word: 'Casa', icon: '🏠', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
    ],
  },
  {
    id: 'q-1ano-luz',
    phaseId: 'fase-15',
    target: { letter: 'LUZ', word: 'Luz', icon: '🌟', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
    phonemeSound: '/luz/',
    spokenPrompt: 'Leitura Brilhante do 1º Ano! Toque na palavra LUZ!',
    hintText: 'Junte as letras L + U + Z para ler a palavra LUZ!',
    correctSlotIndex: 0,
    distractors: [
      { letter: 'SOL', word: 'Sol', icon: '☀️', colorClass: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
      { letter: 'MAR', word: 'Mar', icon: '🌊', colorClass: 'bg-cyan-100 border-cyan-300 text-cyan-900' },
      { letter: 'PÃO', word: 'Pão', icon: '🍞', colorClass: 'bg-orange-100 border-orange-300 text-orange-900' },
    ],
  },
];

export const ACTIVITY_QUESTIONS: ActivityQuestion[] = PHASE_CHALLENGE_BLUEPRINTS.map(
  buildActivityQuestionFromBlueprint
);

/**
 * Busca a pergunta correspondente a uma fase específica usando phaseId como fonte única.
 */
export function getQuestionByPhaseId(phaseId: string): ActivityQuestion {
  return (
    ACTIVITY_QUESTIONS.find((q) => q.phaseId === phaseId) || ACTIVITY_QUESTIONS[0]
  );
}

/**
 * Validação rigorosa de integridade pedagógica e de lógica de jogo:
 * - Garante que a letra-alvo esteja presente em EXATAMENTE UMA opção jogável;
 * - Garante que não haja opções duplicadas;
 * - Garante coerência entre a letra-alvo, o prompt falado e a opção correta.
 */
export function validateActivityQuestion(question: ActivityQuestion): void {
  const normalizedTarget = normalizePhonemeString(question.targetLetter);
  if (!normalizedTarget) {
    throw new Error(`Questão "${question.id}" sem targetLetter válido.`);
  }

  if (question.options.length !== 4) {
    throw new Error(
      `Questão "${question.id}" (${question.phaseId}) deve ter exatamente 4 opções, mas possui ${question.options.length}.`
    );
  }

  const normalizedLetters = question.options.map((opt) =>
    normalizePhonemeString(opt.letter)
  );
  const uniqueLetters = new Set(normalizedLetters);
  if (uniqueLetters.size !== question.options.length) {
    throw new Error(
      `Questão "${question.id}" (${question.phaseId}) possui opções duplicadas.`
    );
  }

  const matchingTargetOptions = question.options.filter((opt) =>
    isPhonemeAnswerCorrect(opt.letter, question.targetLetter)
  );
  if (matchingTargetOptions.length !== 1) {
    throw new Error(
      `Questão "${question.id}" (${question.phaseId}) deve conter a letra-alvo "${question.targetLetter}" em exatamente 1 opção, mas encontrou ${matchingTargetOptions.length}.`
    );
  }

  const flaggedCorrectOptions = question.options.filter((opt) => opt.isCorrect);
  if (
    flaggedCorrectOptions.length !== 1 ||
    flaggedCorrectOptions[0].id !== matchingTargetOptions[0].id
  ) {
    throw new Error(
      `Questão "${question.id}" (${question.phaseId}) possui divergência entre isCorrect e targetLetter "${question.targetLetter}".`
    );
  }

  const normalizedPrompt = normalizePhonemeString(question.spokenPrompt);
  if (!normalizedPrompt.includes(normalizedTarget)) {
    throw new Error(
      `Prompt da questão "${question.id}" (${question.phaseId}) não menciona a letra-alvo "${question.targetLetter}".`
    );
  }
}

/**
 * Valida que uma fase e sua questão correspondente estão 100% sincronizadas:
 * - Mesmo phaseId;
 * - Mesma letra-alvo normalizada entre Fase, Pergunta, Prompt e exatamente 1 Opção jogável.
 */
export function validatePhaseQuestionSync(
  phase: LevelInfo['phases'][number],
  question: ActivityQuestion
): void {
  if (phase.id !== question.phaseId) {
    throw new Error(
      `Descompasso de fase: Fase "${phase.id}" recebeu questão da fase "${question.phaseId}".`
    );
  }

  if (normalizePhonemeString(phase.letter) !== normalizePhonemeString(question.targetLetter)) {
    throw new Error(
      `Descompasso na Fase "${phase.id}": a letra da fase ("${phase.letter}") difere da letra-alvo da questão ("${question.targetLetter}").`
    );
  }

  validateActivityQuestion(question);
}

/**
 * Retorna todas as fases pertencentes ao ciclo da Educação Infantil (Níveis 1, 2 e 3).
 */
export function getEducacaoInfantilPhases(levels: LevelInfo[]): Phase[] {
  return levels
    .filter((lvl) => (lvl.cycle || (lvl.id <= 3 ? 'educacao_infantil' : 'primeiro_ano')) === 'educacao_infantil')
    .flatMap((lvl) => lvl.phases);
}

/**
 * Calcula estatísticas exatas de conclusão do ciclo de Educação Infantil.
 */
export function getEducacaoInfantilProgressStats(levels: LevelInfo[]): {
  completedCount: number;
  totalCount: number;
  percent: number;
  isCompleted: boolean;
} {
  const edInfantilPhases = getEducacaoInfantilPhases(levels);
  const totalCount = edInfantilPhases.length;
  const completedCount = edInfantilPhases.filter((p) => p.status === 'completed').length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  return {
    completedCount,
    totalCount,
    percent,
    isCompleted: totalCount > 0 && completedCount === totalCount,
  };
}

/**
 * Verifica se a criança concluiu 100% das fases e níveis da Educação Infantil.
 */
export function isEducacaoInfantilCompleted(levels: LevelInfo[]): boolean {
  return getEducacaoInfantilProgressStats(levels).isCompleted;
}

/**
 * Verifica se o acesso ao 1º Ano do Ensino Fundamental está liberado.
 */
export function isPrimeiroAnoAccessible(
  levels: LevelInfo[],
  childProfile?: Pick<ChildProfile, 'primeiroAnoUnlocked'> | null
): boolean {
  if (childProfile?.primeiroAnoUnlocked) return true;
  if (isEducacaoInfantilCompleted(levels)) return true;
  return levels
    .filter((lvl) => lvl.cycle === 'primeiro_ano' || lvl.id >= 4)
    .some((lvl) => lvl.phases.some((p) => p.status === 'current' || p.status === 'completed'));
}

/**
 * Aplica a regra de bloqueio/desbloqueio do 1º Ano sobre os níveis da trilha.
 */
export function applyCycleUnlockToLevels(
  levels: LevelInfo[],
  explicitlyUnlocked: boolean = false
): LevelInfo[] {
  const edInfantilDone = isEducacaoInfantilCompleted(levels);
  const allowPrimeiroAno = explicitlyUnlocked || edInfantilDone;

  const updated = levels.map((lvl) => {
    const isPrimeiroAnoLevel = lvl.cycle === 'primeiro_ano' || lvl.id >= 4;
    if (!isPrimeiroAnoLevel) {
      return {
        ...lvl,
        phases: lvl.phases.map((p) => ({ ...p })),
      };
    }

    if (!allowPrimeiroAno) {
      return {
        ...lvl,
        phases: lvl.phases.map((p) => ({
          ...p,
          status: 'locked' as const,
          starsEarned: 0,
        })),
      };
    }

    const clonedPhases = lvl.phases.map((p) => ({ ...p }));
    const hasActiveOrDone = clonedPhases.some(
      (p) => p.status === 'current' || p.status === 'completed'
    );
    if (!hasActiveOrDone && clonedPhases.length > 0) {
      clonedPhases[0].status = 'current';
    }
    return {
      ...lvl,
      phases: clonedPhases,
    };
  });

  // Garante que haja pelo menos uma fase 'current' disponível na jornada
  const allPhases = updated.flatMap((lvl) => lvl.phases);
  const hasCurrent = allPhases.some((p) => p.status === 'current');
  if (!hasCurrent) {
    const firstEligible = updated
      .filter((lvl) => allowPrimeiroAno || (lvl.cycle || 'educacao_infantil') === 'educacao_infantil')
      .flatMap((lvl) => lvl.phases)
      .find((p) => p.status !== 'completed');
    if (firstEligible) {
      firstEligible.status = 'current';
    }
  }

  return updated;
}

/**
 * Reconcilia níveis salvos no localStorage com a estrutura canônica de INITIAL_LEVELS,
 * preservando progresso (status e estrelas) sem permitir ordem ou letras desatualizadas.
 */
export function reconcileLevelsWithCanonical(
  savedLevels: LevelInfo[],
  explicitlyUnlockedPrimeiroAno: boolean = false
): LevelInfo[] {
  const savedPhaseMap = new Map<string, LevelInfo['phases'][number]>();
  for (const lvl of savedLevels) {
    for (const p of lvl.phases || []) {
      savedPhaseMap.set(p.id, p);
    }
  }

  const reconciled = INITIAL_LEVELS.map((canonicalLevel) => ({
    ...canonicalLevel,
    phases: canonicalLevel.phases.map((canonicalPhase) => {
      const saved = savedPhaseMap.get(canonicalPhase.id);
      if (!saved) return { ...canonicalPhase };
      return {
        ...canonicalPhase,
        starsEarned:
          typeof saved.starsEarned === 'number'
            ? Math.max(0, Math.min(3, saved.starsEarned))
            : canonicalPhase.starsEarned,
        status:
          saved.status === 'completed' ||
          saved.status === 'current' ||
          saved.status === 'locked'
            ? saved.status
            : canonicalPhase.status,
      };
    }),
  }));

  return applyCycleUnlockToLevels(reconciled, explicitlyUnlockedPrimeiroAno);
}

export function validateAllActivityQuestions(
  levels: LevelInfo[] = INITIAL_LEVELS,
  questions: ActivityQuestion[] = ACTIVITY_QUESTIONS
): void {
  const expectedVowels = [
    { phaseId: 'fase-1', number: 1, letter: 'A', word: 'Abelha' },
    { phaseId: 'fase-2', number: 2, letter: 'E', word: 'Elefante' },
    { phaseId: 'fase-3', number: 3, letter: 'I', word: 'Iguana' },
    { phaseId: 'fase-4', number: 4, letter: 'O', word: 'Ovelha' },
    { phaseId: 'fase-5', number: 5, letter: 'U', word: 'Uva' },
  ];

  const flatPhases = levels.flatMap((lvl) => lvl.phases);

  expectedVowels.forEach((expected, index) => {
    const phase = flatPhases[index];
    if (
      !phase ||
      phase.id !== expected.phaseId ||
      phase.number !== expected.number ||
      normalizePhonemeString(phase.letter) !== normalizePhonemeString(expected.letter)
    ) {
      throw new Error(
        `Ordem inválida na Fase ${expected.number}: esperado ${expected.phaseId} (${expected.letter} de ${expected.word}).`
      );
    }
  });

  for (const phase of flatPhases) {
    const q = questions.find((item) => item.phaseId === phase.id);
    if (!q) {
      throw new Error(
        `Fase "${phase.id}" (${phase.title}) não possui questão configurada em ACTIVITY_QUESTIONS.`
      );
    }
    validatePhaseQuestionSync(phase, q);

    const trilogy = PHASE_TRILOGY_CONFIGS[phase.id];
    if (!trilogy || trilogy.traceStrokes.length === 0 || trilogy.wordHuntItems.filter((w) => w.isMatch).length < 3) {
      throw new Error(
        `Fase "${phase.id}" (${phase.title}) não possui Trilogia de Atividades completa (traçado + caça-palavras).`
      );
    }
  }
}

// Executa a validação estrutural automaticamente ao carregar o módulo
validateAllActivityQuestions(INITIAL_LEVELS, ACTIVITY_QUESTIONS);

export const INITIAL_MEDALS: Medal[] = [
  {
    id: 'm1',
    title: 'Primeiro Passo',
    description: 'Completou com sucesso a primeira atividade da trilha.',
    icon: '🚀',
    category: 'aventura',
    unlocked: true,
    unlockedDate: 'Hoje',
    color: 'from-amber-400 to-yellow-500',
  },
  {
    id: 'm2',
    title: 'Mestre das Vogais',
    description: 'Identificou os sons das vogais A e E sem pestanejar.',
    icon: '🅰️',
    category: 'alfabeto',
    unlocked: true,
    unlockedDate: 'Hoje',
    color: 'from-blue-400 to-indigo-500',
  },
  {
    id: 'm3',
    title: 'Ouvidos de Ouro',
    description: 'Ouviu atentamente o som da atividade antes de responder.',
    icon: '🎧',
    category: 'dedicacao',
    unlocked: true,
    unlockedDate: 'Hoje',
    color: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'm4',
    title: 'Mira Certeira',
    description: 'Acertou de primeira sem hesitar em 3 desafios consecutivos.',
    icon: '🎯',
    category: 'conquista',
    unlocked: false,
    color: 'from-rose-400 to-pink-500',
  },
  {
    id: 'm5',
    title: 'Explorador da Floresta',
    description: 'Desbloqueie o Nível 2 completando a Ilha das Vogais.',
    icon: '🌳',
    category: 'aventura',
    unlocked: false,
    color: 'from-green-400 to-emerald-600',
  },
  {
    id: 'm6',
    title: 'Colecionador de Estrelas',
    description: 'Acumule 15 ou mais estrelas douradas na sua jornada.',
    icon: '⭐',
    category: 'conquista',
    unlocked: false,
    color: 'from-yellow-300 to-amber-500',
  },
  {
    id: 'm7',
    title: 'Super Focado',
    description: 'Brinque por 15 minutos em atividades de consciência fonológica.',
    icon: '🧘',
    category: 'dedicacao',
    unlocked: false,
    color: 'from-purple-400 to-violet-500',
  },
  {
    id: 'm8',
    title: 'Rei das Palavras Mágicas',
    description: 'Conquiste todos os desafios do Nível 3.',
    icon: '👑',
    category: 'aventura',
    unlocked: false,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'm9',
    title: 'Pequeno Leitor',
    description: 'Leu seu primeiro livrinho completo na Biblioteca de Histórias.',
    icon: '📖',
    category: 'leitura',
    unlocked: false,
    color: 'from-sky-400 to-blue-500',
  },
  {
    id: 'm10',
    title: 'Explorador Literário',
    description: 'Concluiu 3 histórias completas ou criou uma aventura mágica com IA.',
    icon: '📚',
    category: 'leitura',
    unlocked: false,
    color: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'm11',
    title: 'Formando da Educação Infantil',
    description: 'Completou 100% da Educação Infantil e desbloqueou o 1º Ano Fundamental!',
    icon: '🎓',
    category: 'conquista',
    unlocked: false,
    color: 'from-amber-400 to-rose-500',
  },
];

export const BNCC_SKILLS: BnccSkill[] = [
  {
    code: 'EF01LP02',
    title: 'Segmentação da fala e consciência fonológica',
    description: 'Escrever, espontaneamente ou por ditado, palavras e frases de forma alfabética.',
    progress: 88,
  },
  {
    code: 'EF01LP05',
    title: 'Reconhecimento de grafemas e sons das letras',
    description: 'Reconhecer o sistema de escrita alfabética como representação dos sons da fala.',
    progress: 92,
  },
  {
    code: 'EF01LP07',
    title: 'Associação de fonemas às suas letras',
    description: 'Identificar fonemas e sua representação por grafemas correspondentes.',
    progress: 75,
  },
  {
    code: 'EF01LP10',
    title: 'Construção do repertório silábico',
    description: 'Nomear as letras do alfabeto e recitá-lo na ordem das letras.',
    progress: 60,
  },
];

export const PARENT_TIPS: ParentTip[] = [
  {
    title: 'Brincadeira da Caça aos Sons na Cozinha',
    activity: 'Peça para a criança apontar três objetos que começam com o som /A/ (Abacaxi, Açúcar, Avental). Essa atividade fixa a consciência fonológica fora das telas!',
    targetSkill: 'Consciência Fonológica Inicial',
  },
  {
    title: 'Desenho com o Dedo na Areia ou Farinha',
    activity: 'Coloque um pouco de farinha ou fubá em um prato raso e convide a criança a desenhar a letrinha com o dedo enquanto faz o som sonoro.',
    targetSkill: 'Coordenação Fina e Memória Tátil',
  },
  {
    title: 'Jogo do Eco Encantado',
    activity: 'Diga uma palavra devagarinho ("E-le-fan-te") e peça para a criança repetir somente o primeiro som bem alto. Isso exercita o foco auditivo.',
    targetSkill: 'Discriminação Auditiva',
  },
];
