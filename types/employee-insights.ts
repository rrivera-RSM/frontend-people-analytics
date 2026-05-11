export type InsightFamily = "talent" | "performance" | "ona";

export type InsightTone =
  | "success"
  | "info"
  | "warning"
  | "accent"
  | "neutral";

export type KnownEmployeeInsightCode =
  | "high_talent"
  | "high_potential"
  | "high_underrecognized"
  | "high_performer"
  | "sustained_high_performance"
  | "performance_growth"
  | "performance_decline"
  | "performance_stable"
  | "team_connector"
  | "organizational_connector"
  | "influential_profile"
  | "well_connected_profile"
  | "cross_functional_leader"
  | "peer_reference"
  | "upward_visibility";

export type EmployeeInsightCode = KnownEmployeeInsightCode | (string & {});

export type EmployeeInsightItemApi = {
  code: EmployeeInsightCode;
  family: InsightFamily;
  title?: string;
  description?: string;
  priority: number;
  evidence: Record<string, unknown>;
};

export type EmployeeInsightFeaturesApi = {
  employee_active: boolean;

  current_evaluation_at?: string | null;
  previous_evaluation_at?: string | null;

  current_evaluation_score_raw?: number | null;
  previous_evaluation_score_raw?: number | null;
  current_evaluation_score_normalized?: number | null;
  previous_evaluation_score_normalized?: number | null;
  performance_delta_normalized?: number | null;

  ona_record_count: number;
  ona_category_ids: number[];
  ona_influence_ids: number[];

  ona_percentile_1?: number | null;
  ona_percentile_2?: number | null;
  ona_percentile_3?: number | null;
  ona_percentile_4?: number | null;

  degree_centrality?: number | null;
  closeness_centrality?: number | null;
  betweenness_centrality?: number | null;
  eigenvector_centrality?: number | null;

  incoming_unique_relations: number;
  outgoing_unique_relations: number;
  unique_relations: number;
};

export type EmployeeInsightsResponseApi = {
  generated_at: string;
  as_of: string;
  employee_id: number;
  employee_full_name: string;
  features: EmployeeInsightFeaturesApi;
  insights: EmployeeInsightItemApi[];
  warnings: string[];
};

export type EmployeeInsightDefinition = {
  code: KnownEmployeeInsightCode;
  shortCode: string;
  family: InsightFamily;
  tone: InsightTone;

  chipLabel: string;
  title: string;
  description: string;
  formulaDescription?: string;

  chipClassName: string;
  chipDotClassName?: string;
  cardClassName: string;
  badgeClassName: string;

  visibleEvidenceKeys?: string[];
  sortOrder?: number;
};

export type EmployeeInsightViewModel = {
  code: EmployeeInsightCode;
  family: InsightFamily;
  tone: InsightTone;

  shortCode: string;
  chipLabel: string;
  title: string;
  description: string;

  priority: number;
  evidence: Record<string, unknown>;

  chipClassName: string;
  chipDotClassName?: string;
  cardClassName: string;
  badgeClassName: string;

  visibleEvidenceKeys: string[];
};
``