'use client';

import React from 'react';
import { ActivityQuestion, ActivityOption, Phase, ChildProfile } from '@/lib/types';
import { PhaseTrilogyActivity } from '@/components/PhaseTrilogyActivity';

interface Phase3IguanaActivityProps {
  question: ActivityQuestion;
  currentPhase: Phase;
  childProfile: ChildProfile;
  soundEnabled: boolean;
  onAnswerSelected: (option: ActivityOption) => void;
  onBackToMap: () => void;
}

export const Phase3IguanaActivity: React.FC<Phase3IguanaActivityProps> = (props) => {
  return <PhaseTrilogyActivity {...props} />;
};
