export type OnaCategory =
  | "central"
  | "hipo"
  | "intermediary"
  | "peripheral";

export type OnaRelationEdgeApi = Record<string, unknown> & {
  from_employee_id?: number | string;
  to_employee_id?: number | string;
  from_id?: number | string;
  to_id?: number | string;
  ona_question_id?: number | string;
  from_ona_category?: string | null;
  to_ona_category?: string | null;
};

export type OnaRelationNodeApi = Record<string, unknown> & {
  id?: number | string;
  employee_id?: number | string;
  ona_category?: string | null;
  graph_x_coordinate?: number | string | null;
  graph_y_coordinate?: number | string | null;
};

export type OnaRelationsApiResponse =
  | OnaRelationEdgeApi[]
  | {
      relations?: OnaRelationEdgeApi[];
      edges?: OnaRelationEdgeApi[];
      links?: OnaRelationEdgeApi[];
      data?: OnaRelationEdgeApi[] | Record<string, unknown>;
      nodes?: OnaRelationNodeApi[];
    };
