export type ProposalDraft = {
  salaryCurrent: number;
  currentBonus?: number;
  currentCategory?: string;
  proposedSalary: number;
  bonus: number;
  category: string;
  includeBonus?: boolean;
  includeCategory?: boolean;
  bonusPaymentMonth?: string;
  observations?: string;
};

export type SimulationResult = {
  attritionProbability: number; // 0..1
  simulatedSalary: number;
  simulatedBonus: number;
  simulatedAt: string;
};
