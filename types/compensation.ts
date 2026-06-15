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

export type SalaryOfferPayload = {
  employee_id: number;
  new_salary: number;
  new_bonus?: number;
  month_payment_bonus?: string;
  bonus_next_fy?: number;
  new_category?: string;
  observations?: string;
};

export type SalaryOffer = {
  id: number;
  employee_id: number;
  new_salary: number;
  new_bonus: number | null;
  month_payment_bonus: string | null;
  bonus_next_fy: number | null;
  new_category: string | null;
  observations: string | null;
  aud_user_creation: string;
  aud_creation_at: string;
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
