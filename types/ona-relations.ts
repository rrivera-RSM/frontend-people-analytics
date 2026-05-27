export type OnaRelationEdgeApi = Record<string, unknown>;

export type OnaRelationsApiResponse =
  | OnaRelationEdgeApi[]
  | {
      relations?: OnaRelationEdgeApi[];
      edges?: OnaRelationEdgeApi[];
      links?: OnaRelationEdgeApi[];
      data?: OnaRelationEdgeApi[] | Record<string, unknown>;
      nodes?: Record<string, unknown>[];
    };

