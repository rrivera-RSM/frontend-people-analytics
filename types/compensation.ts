export type ProposalDraft = {
  salaryCurrent: number;
  proposedSalary: number;
  bonus: number;
  category: string;
};

export type SimulationResult = {
  attritionProbability: number; // 0..1
  simulatedSalary: number;
  simulatedBonus: number;
  simulatedAt: string;
};