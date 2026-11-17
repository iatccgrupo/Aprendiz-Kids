import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_LEVELS,
  ACTIVITY_QUESTIONS,
  PHASE_3_IGUANA_WORDS,
  getQuestionByPhaseId,
  validateActivityQuestion,
  validatePhaseQuestionSync,
  validateAllActivityQuestions,
  reconcileLevelsWithCanonical,
  PHASE_TRILOGY_CONFIGS,
  getPhaseTrilogyConfig,
} from '../lib/game-data';
import { isPhonemeAnswerCorrect, normalizePhonemeString } from '../lib/utils';

test('Estrutura Geral das Fases 1 a 5 (A, E, I, O, U)', () => {
  const level1Phases = INITIAL_LEVELS[0].phases;
  assert.equal(level1Phases.length, 5);

  const expected = [
    { id: 'fase-1', number: 1, letter: 'A', word: 'Abelha' },
    { id: 'fase-2', number: 2, letter: 'E', word: 'Elefante' },
    { id: 'fase-3', number: 3, letter: 'I', word: 'Iguana' },
    { id: 'fase-4', number: 4, letter: 'O', word: 'Ovelha' },
    { id: 'fase-5', number: 5, letter: 'U', word: 'Uva' },
  ];

  expected.forEach((exp, index) => {
    const phase = level1Phases[index];
    assert.equal(phase.id, exp.id);
    assert.equal(phase.number, exp.number);
    assert.equal(phase.letter, exp.letter);
    assert.match(phase.description, new RegExp(exp.word, 'i'));
  });
});

test('Fase 3 é dedicada exclusivamente à Vogal I (I de Iguana) e possui palavras do caça-palavras com I', () => {
  const phase3 = INITIAL_LEVELS[0].phases[2];
  assert.equal(phase3.id, 'fase-3');
  assert.equal(phase3.number, 3);
  assert.equal(phase3.letter, 'I');
  assert.equal(phase3.title, 'Vogal I');

  const q3 = getQuestionByPhaseId('fase-3');
  assert.equal(q3.targetLetter, 'I');
  assert.equal(q3.targetWord, 'Iguana');

  const wordsWithI = PHASE_3_IGUANA_WORDS.filter((item) => item.startsWithI);
  assert.ok(wordsWithI.length >= 3);
  wordsWithI.forEach((item) => {
    assert.equal(normalizePhonemeString(item.word.charAt(0)), 'i');
  });
});

test('Todas as fases e níveis possuem Trilogia Interativa completa (Som Fonético, Traçado Guiado e Caça-Palavras)', () => {
  const allPhases = INITIAL_LEVELS.flatMap((lvl) => lvl.phases);
  assert.equal(Object.keys(PHASE_TRILOGY_CONFIGS).length, allPhases.length);

  for (const phase of allPhases) {
    const config = getPhaseTrilogyConfig(phase.id);
    assert.equal(config.phaseId, phase.id);
    assert.ok(config.traceStrokes.length >= 1, `Fase ${phase.id} precisa de traços guiados`);
    config.traceStrokes.forEach((stroke) => {
      assert.ok(stroke.points.length >= 2, `Traço ${stroke.marker} da fase ${phase.id} deve ter pontos`);
    });
    const matches = config.wordHuntItems.filter((item) => item.isMatch);
    assert.ok(matches.length >= 3, `Fase ${phase.id} precisa de pelo menos 3 itens corretos no caça-palavras`);
  }
});

test('Nível 2 (Floresta dos Fonemas) e todas as fases possuem exatamente 1 opção correta sincronizada com a letra-alvo', () => {
  validateAllActivityQuestions(INITIAL_LEVELS, ACTIVITY_QUESTIONS);

  const allPhases = INITIAL_LEVELS.flatMap((lvl) => lvl.phases);
  for (const phase of allPhases) {
    const question = getQuestionByPhaseId(phase.id);
    validatePhaseQuestionSync(phase, question);

    const matchingOptions = question.options.filter((opt) =>
      isPhonemeAnswerCorrect(opt.letter, question.targetLetter)
    );
    assert.equal(
      matchingOptions.length,
      1,
      `Fase ${phase.id} (${phase.letter}) deve ter exatamente 1 opção correta`
    );
    assert.equal(question.options.length, 4);
    assert.ok(
      normalizePhonemeString(question.spokenPrompt).includes(
        normalizePhonemeString(question.targetLetter)
      ),
      `Prompt da fase ${phase.id} deve conter a letra-alvo ${question.targetLetter}`
    );
  }
});

test('validateActivityQuestion rejeita questões sem a letra-alvo nas opções', () => {
  const brokenQuestion = {
    ...ACTIVITY_QUESTIONS[5], // Fase 6 (Letra B)
    options: ACTIVITY_QUESTIONS[5].options.map((opt) => ({
      ...opt,
      letter: opt.letter === 'B' ? 'Z' : opt.letter,
      isCorrect: false,
    })),
  };

  assert.throws(() => validateActivityQuestion(brokenQuestion));
});

test('Normalização aceita acentos e maiúsculas/minúsculas', () => {
  assert.equal(isPhonemeAnswerCorrect('a', 'A'), true);
  assert.equal(isPhonemeAnswerCorrect('á', 'A'), true);
  assert.equal(isPhonemeAnswerCorrect('Á', 'a'), true);
  assert.equal(isPhonemeAnswerCorrect('pao', 'PÃO'), true);
});

test('reconcileLevelsWithCanonical restaura ordem canônica preservando progresso salvo', () => {
  const stale = [
    {
      ...INITIAL_LEVELS[0],
      phases: [
        { ...INITIAL_LEVELS[0].phases[0], status: 'completed' as const, starsEarned: 3 },
        { ...INITIAL_LEVELS[0].phases[3], id: 'fase-3', letter: 'O', status: 'completed' as const, starsEarned: 2 },
      ],
    },
  ];

  const reconciled = reconcileLevelsWithCanonical(stale);
  assert.equal(reconciled[0].phases[2].id, 'fase-3');
  assert.equal(reconciled[0].phases[2].letter, 'I');
  assert.equal(reconciled[0].phases[2].starsEarned, 2);
});
