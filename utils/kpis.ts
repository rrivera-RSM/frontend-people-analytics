export type ProposalInputs = {
  salaryCurrent: number;
  proposedSalary: number;
  bonus: number;
};

export type ProposalAverages = {
  avgSalary: number; // 30000
  avgBonus: number;  // 2000
};

export type ProposalKpis = {
  raiseAmount: number;     // proposedSalary - salaryCurrent
  salaryVsAvgPct: number;  // (proposedSalary - avgSalary) / avgSalary * 100
  bonusVsAvgPct: number;   // (bonus - avgBonus) / avgBonus * 100
};

export function computeProposalKpis(
  inputs: ProposalInputs,
  avgs: ProposalAverages
): ProposalKpis {
  const { salaryCurrent, proposedSalary, bonus } = inputs;

  const raiseAmount = proposedSalary - salaryCurrent;

  const salaryVsAvgPct =
    avgs.avgSalary > 0
      ? ((proposedSalary - avgs.avgSalary) / avgs.avgSalary) * 100
      : 0;

  const bonusVsAvgPct =
    avgs.avgBonus > 0
      ? ((bonus - avgs.avgBonus) / avgs.avgBonus) * 100
      : 0;

  console.log("Computed KPIs:", { raiseAmount, salaryVsAvgPct, bonusVsAvgPct });

  return { raiseAmount, salaryVsAvgPct, bonusVsAvgPct };
}