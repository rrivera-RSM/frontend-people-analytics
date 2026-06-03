export type TimelineEventType = "org_change" | "salary_change" | "evaluation" | string;

export type OrgChangePayload = {
  start_at: string | null;
  end_at: string | null;
  society_id: number | null;
  society_name: string | null;
  department_id: number | null;
  department_name: string | null;
  office_id: number | null;
  office_name: string | null;
  category_id: number | null;
  category_name: string | null;
};

export type SalaryChangePayload = {
  start_at: string | null;
  end_at: string | null;
  salary: number;
  bonus: number | null;
};

export type EvaluationPayload = {
  evaluation_at: string | null;
  final_score: number;
  bol_positive_impact: number | null;
};

export type EmployeeTimelineEvent = {
  event_type: TimelineEventType;
  event_at: string;
  title: string;
  payload: Record<string, unknown>;
};

export type EmployeeTimelineEvolutionResponse = {
  employee_id: number;
  employee_name: string;
  joined_at: string | null;
  left_at: string | null;
  total_events: number;
  events: EmployeeTimelineEvent[];
};
