export type EvaluationScatterPoint = {
  employee_id: number;
  society_id: number | null;
  department_id: number | null;
  category_id: number | null;

  evaluation_id: number;
  evaluation_at: string;
  evaluation_year: number;

  final_score: number;
  overall_percentile: number | null;
};

export type EvaluationScatterLatestCycleResponse = {
  cycle_year: number;
  cycle_label: string;
  total_points: number;
  points: EvaluationScatterPoint[];
};
``