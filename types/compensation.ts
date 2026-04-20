export type ProposalDraft = {
  salaryCurrent: number;
  proposedSalary: number;
  bonus: number;
  category: string;
  comments?: string;
};

export type SimulationResult = {
  attritionProbability: number; // 0..1
  simulatedSalary: number;
  simulatedBonus: number;
  simulatedAt: string;
};