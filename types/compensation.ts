export type ProposalDraft = {
  salaryCurrent: number;
  currentBonus?: number;
  currentCategoryId?: number;
  currentCategory?: string;
  proposedSalary: number;
  bonus: number;
  nextFiscalYearBonus?: number;
  category: string;
  includeBonus?: boolean;
  includeNextFiscalYearBonus?: boolean;
  increasePercentage?: number;
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

export type SalaryProposalBenchmarkRow = {
  society_id: number | null;
  society_name: string | null;
  department_id: number | null;
  department_name: string | null;
  office_id: number | null;
  office_name: string | null;
  category_id: number | null;
  category_name: string | null;
  salary_increase_avg: number | null;
  salary_increase_percentage_avg: number | null;
  bonus_avg: number | null;
};

export type SalaryProposalBenchmarkScopeKey =
  | "society"
  | "department"
  | "office"
  | "category";

export type SalaryProposalBenchmarkScope = Record<
  SalaryProposalBenchmarkScopeKey,
  boolean
>;

export type SalaryProposalBenchmarkFilterKey =
  | "society_id"
  | "department_id"
  | "office_id"
  | "category_id";

export type SalaryProposalBenchmarkFilters = Partial<
  Record<SalaryProposalBenchmarkFilterKey, string | number>
>;
