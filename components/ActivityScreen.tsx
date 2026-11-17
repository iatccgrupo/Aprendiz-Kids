'use client';

import React from 'react';
import { ActivityQuestion, ActivityOption, Phase, ChildProfile } from '@/lib/types';
import { PhaseTrilogyActivity } from '@/components/PhaseTrilogyActivity';

interface ActivityScreenProps {
  question: ActivityQuestion;
  currentPhase: Phase;
  childProfile: ChildProfile;
  soundEnabled: boolean;
  onAnswerSelected: (option: ActivityOption) => void;
  onBackToMap: () => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  question,
  currentPhase,
  childProfile,
  soundEnabled,
  onAnswerSelected,
  onBackToMap,
}) => {
  // Todas as fases dos Níveis 1, 2 e 3 seguem a Trilogia Interativa Completa:
  // 1) Mascote & Som Fonético -> 2) Traçado Guiado no Canvas -> 3) Caça-Palavras/Rimas -> 4) Desafio Final
  return (
    <PhaseTrilogyActivity
      question={question}
      currentPhase={currentPhase}
      childProfile={childProfile}
      soundEnabled={soundEnabled}
      onAnswerSelected={onAnswerSelected}
      onBackToMap={onBackToMap}
    />
  );
};
