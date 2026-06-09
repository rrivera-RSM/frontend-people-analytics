export type ProposalInputs = {
  salaryCurrent: number;
  proposedSalary: number;
  proposedPercentageIncrease?: number;
  bonus: number;
};

export type ProposalAverages = {
  avgSalaryIncrease?: number | null;
  avgSalaryIncreasePercentage?: number | null;
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
  const salaryIncreasePct =
    typeof inputs.proposedPercentageIncrease === "number"
      ? inputs.proposedPercentageIncrease
      : salaryCurrent > 0
        ? (raiseAmount / salaryCurrent) * 100
        : null;

  const salaryIncreaseVsAvgPct =
    typeof salaryIncreasePct === "number" &&
    typeof avgs.avgSalaryIncreasePercentage === "number" &&
    avgs.avgSalaryIncreasePercentage > 0
      ? salaryIncreasePct - avgs.avgSalaryIncreasePercentage
      : null;

  const bonusVsAvgPct =
    typeof avgs.avgBonus === "number" && avgs.avgBonus > 0
      ? ((bonus - avgs.avgBonus) / avgs.avgBonus) * 100
      : null;

  return { raiseAmount, salaryIncreaseVsAvgPct, bonusVsAvgPct };
}
