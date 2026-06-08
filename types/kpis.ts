export type ProposalInputs = {
  salaryCurrent: number;
  proposedSalary: number;
  bonus: number;
};

export type ProposalAverages = {
  avgSalaryIncrease?: number | null;
  avgBonus?: number | null;
};

export type ProposalKpis = {
  raiseAmount: number;
  salaryIncreaseVsAvgPct: number | null;
  bonusVsAvgPct: number | null;
};

export function computeProposalKpis(
  inputs: ProposalInputs,
  avgs: ProposalAverages
): ProposalKpis {
  const { salaryCurrent, proposedSalary, bonus } = inputs;

  const raiseAmount = proposedSalary - salaryCurrent;

  const salaryIncreaseVsAvgPct =
    typeof avgs.avgSalaryIncrease === "number" && avgs.avgSalaryIncrease > 0
      ? ((raiseAmount - avgs.avgSalaryIncrease) / avgs.avgSalaryIncrease) * 100
      : null;

  const bonusVsAvgPct =
    typeof avgs.avgBonus === "number" && avgs.avgBonus > 0
      ? ((bonus - avgs.avgBonus) / avgs.avgBonus) * 100
      : null;

  return { raiseAmount, salaryIncreaseVsAvgPct, bonusVsAvgPct };
}
