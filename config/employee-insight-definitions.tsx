import type {
  EmployeeInsightDefinition,
  KnownEmployeeInsightCode,
} from "@/types/employee-insights";

export const EMPLOYEE_INSIGHT_DEFINITIONS: Record<
  KnownEmployeeInsightCode,
  EmployeeInsightDefinition
> = {
  high_talent: {
    code: "high_talent",
    shortCode: "T01",
    family: "talent",
    tone: "success",
    chipLabel: "Alto Talento",
    title: "Alto Talento",
    description:
      "El empleado combina señales sólidas de valor, rendimiento y posicionamiento organizativo.",
    chipClassName:
      "border-emerald-500/40 bg-emerald-500/20 text-emerald-900 hover:bg-emerald-500/25 dark:border-emerald-400/40 dark:bg-emerald-400/20 dark:text-emerald-100 dark:hover:bg-emerald-400/25",
    chipDotClassName: "bg-emerald-400 dark:bg-emerald-300",
    cardClassName:
      "border-emerald-500/30 bg-white/88 text-slate-900 backdrop-blur-md dark:border-emerald-400/35 dark:bg-emerald-950/75 dark:text-slate-50",
    badgeClassName:
      "border-emerald-500/40 bg-emerald-500/20 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-400/20 dark:text-emerald-100",
    visibleEvidenceKeys: ["current_score_normalized", "ona_percentile_3"],
    sortOrder: 10,
  },

  high_potential: {
    code: "high_potential",
    shortCode: "T02",
    family: "talent",
    tone: "accent",
    chipLabel: "Alto Potencial",
    title: "Alto Potencial",
    description:
      "El empleado presenta señales de proyección futura y capacidad de crecimiento.",
    chipClassName:
      "border-violet-500/40 bg-violet-500/20 text-violet-900 hover:bg-violet-500/25 dark:border-violet-400/40 dark:bg-violet-400/20 dark:text-violet-100 dark:hover:bg-violet-400/25",
    chipDotClassName: "bg-violet-400 dark:bg-violet-300",
    cardClassName:
      "border-violet-500/30 bg-white/88 text-slate-900 backdrop-blur-md dark:border-violet-400/35 dark:bg-violet-950/75 dark:text-slate-50",
    badgeClassName:
      "border-violet-500/40 bg-violet-500/20 text-violet-900 dark:border-violet-400/40 dark:bg-violet-400/20 dark:text-violet-100",
    visibleEvidenceKeys: ["performance_delta_normalized"],
    sortOrder: 20,
  },

  high_performance: {
    code: "high_performance",
    shortCode: "E00",
    family: "performance",
    tone: "success",
    chipLabel: "Alto Rendimiento",
    title: "Alto Rendimiento",
    description:
      "La evaluación más reciente refleja un nivel alto de desempeño.",
    chipClassName:
      "border-emerald-500/40 bg-emerald-500/20 text-emerald-900 hover:bg-emerald-500/25 dark:border-emerald-400/40 dark:bg-emerald-400/20 dark:text-emerald-100 dark:hover:bg-emerald-400/25",
    chipDotClassName: "bg-emerald-400 dark:bg-emerald-300",
    cardClassName:
      "border-emerald-500/30 bg-white/88 text-slate-900 backdrop-blur-md dark:border-emerald-400/35 dark:bg-emerald-950/75 dark:text-slate-50",
    badgeClassName:
      "border-emerald-500/40 bg-emerald-500/20 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-400/20 dark:text-emerald-100",
    visibleEvidenceKeys: ["current_score_normalized", "threshold"],
    sortOrder: 30,
  },

  sustained_high_performance: {
    code: "sustained_high_performance",
    shortCode: "E01",
    family: "performance",
    tone: "success",
    chipLabel: "Desempeño Sostenido",
    title: "Alto Desempeño Sostenido",
    description:
      "El empleado mantiene un desempeño alto de manera consistente en las últimas evaluaciones disponibles.",
    chipClassName:
      "border-green-500/40 bg-green-500/20 text-green-900 hover:bg-green-500/25 dark:border-green-400/40 dark:bg-green-400/20 dark:text-green-100 dark:hover:bg-green-400/25",
    chipDotClassName: "bg-green-400 dark:bg-green-300",
    cardClassName:
      "border-green-500/30 bg-white/88 text-slate-900 backdrop-blur-md dark:border-green-400/35 dark:bg-green-950/75 dark:text-slate-50",
    badgeClassName:
      "border-green-500/40 bg-green-500/20 text-green-900 dark:border-green-400/40 dark:bg-green-400/20 dark:text-green-100",
    visibleEvidenceKeys: [
      "current_score_normalized",
      "previous_score_normalized",
      "threshold",
    ],
    sortOrder: 40,
  },

  performance_growth: {
    code: "performance_growth",
    shortCode: "E02",
    family: "performance",
    tone: "info",
    chipLabel: "Desempeño en Crecimiento",
    title: "Desempeño en Crecimiento",
    description:
      "La evolución reciente muestra una mejora relevante frente a la evaluación anterior.",
    chipClassName:
      "border-sky-500/40 bg-sky-500/20 text-sky-900 hover:bg-sky-500/25 dark:border-sky-400/40 dark:bg-sky-400/20 dark:text-sky-100 dark:hover:bg-sky-400/25",
    chipDotClassName: "bg-sky-400 dark:bg-sky-300",
    cardClassName:
      "border-sky-500/30 bg-white/88 text-slate-900 backdrop-blur-md dark:border-sky-400/35 dark:bg-sky-950/75 dark:text-slate-50",
    badgeClassName:
      "border-sky-500/40 bg-sky-500/20 text-sky-900 dark:border-sky-400/40 dark:bg-sky-400/20 dark:text-sky-100",
    visibleEvidenceKeys: ["delta", "threshold"],
    sortOrder: 50,
  },

  performance_decline: {
    code: "performance_decline",
    shortCode: "E03",
    family: "performance",
    tone: "warning",
    chipLabel: "Desempeño en Descenso",
    title: "Desempeño en Descenso",
    description:
      "La evaluación más reciente cae de forma relevante frente a la anterior.",
    chipClassName:
      "border-amber-500/40 bg-amber-500/20 text-amber-900 hover:bg-amber-500/25 dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-amber-100 dark:hover:bg-amber-400/25",
    chipDotClassName: "bg-amber-400 dark:bg-amber-300",
    cardClassName:
      "border-amber-500/30 bg-white/88 text-slate-900 backdrop-blur-md dark:border-amber-400/35 dark:bg-amber-950/75 dark:text-slate-50",
    badgeClassName:
      "border-amber-500/40 bg-amber-500/20 text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-amber-100",
    visibleEvidenceKeys: ["delta", "threshold"],
    sortOrder: 60,
  },

  performance_stable: {
    code: "performance_stable",
    shortCode: "E04",
    family: "performance",
    tone: "neutral",
    chipLabel: "Desempeño Estable",
    title: "Desempeño Estable",
    description:
      "El desempeño se mantiene en una banda similar respecto al periodo anterior.",
    chipClassName:
      "border-slate-500/40 bg-slate-500/20 text-slate-800 hover:bg-slate-500/25 dark:border-slate-400/40 dark:bg-slate-400/20 dark:text-slate-100 dark:hover:bg-slate-400/25",
    chipDotClassName: "bg-slate-400 dark:bg-slate-300",
    cardClassName:
      "border-slate-500/25 bg-white/88 text-slate-900 backdrop-blur-md dark:border-slate-400/30 dark:bg-slate-950/75 dark:text-slate-50",
    badgeClassName:
      "border-slate-500/40 bg-slate-500/20 text-slate-800 dark:border-slate-400/40 dark:bg-slate-400/20 dark:text-slate-100",
    visibleEvidenceKeys: ["delta", "stability_band_abs"],
    sortOrder: 70,
  },

  team_connector: {
    code: "team_connector",
    shortCode: "O02",
    family: "ona",
    tone: "info",
    chipLabel: "Conector de Equipo",
    title: "Conector de Equipo",
    description:
      "El empleado actúa como nodo de cohesión dentro de la red, facilitando conexiones entre personas.",
    chipClassName:
      "border-blue-500/40 bg-blue-500/20 text-blue-900 hover:bg-blue-500/25 dark:border-blue-400/40 dark:bg-blue-400/20 dark:text-blue-100 dark:hover:bg-blue-400/25",
    chipDotClassName: "bg-blue-400 dark:bg-blue-300",
    cardClassName:
      "border-blue-500/30 bg-white/88 text-slate-900 backdrop-blur-md dark:border-blue-400/35 dark:bg-blue-950/75 dark:text-slate-50",
    badgeClassName:
      "border-blue-500/40 bg-blue-500/20 text-blue-900 dark:border-blue-400/40 dark:bg-blue-400/20 dark:text-blue-100",
    visibleEvidenceKeys: ["ona_percentile_1", "unique_relations"],
    sortOrder: 80,
  },

  organizational_connector: {
    code: "organizational_connector",
    shortCode: "O03",
    family: "ona",
    tone: "accent",
    chipLabel: "Conector Organizativo",
    title: "Conector Organizativo",
    description:
      "El empleado muestra una posición de puente entre nodos o grupos de la organización.",
    chipClassName:
      "border-indigo-500/40 bg-indigo-500/20 text-indigo-900 hover:bg-indigo-500/25 dark:border-indigo-400/40 dark:bg-indigo-400/20 dark:text-indigo-100 dark:hover:bg-indigo-400/25",
    chipDotClassName: "bg-indigo-400 dark:bg-indigo-300",
    cardClassName:
      "border-indigo-500/30 bg-white/88 text-slate-900 backdrop-blur-md dark:border-indigo-400/35 dark:bg-indigo-950/75 dark:text-slate-50",
    badgeClassName:
      "border-indigo-500/40 bg-indigo-500/20 text-indigo-900 dark:border-indigo-400/40 dark:bg-indigo-400/20 dark:text-indigo-100",
    visibleEvidenceKeys: ["ona_percentile_2", "betweenness_centrality"],
    sortOrder: 90,
  },

  influential_profile: {
    code: "influential_profile",
    shortCode: "O01",
    family: "ona",
    tone: "accent",
    chipLabel: "Influencia Alta",
    title: "Perfil Influyente",
    description:
      "El empleado presenta señales altas de influencia dentro de la red organizativa.",
    chipClassName:
      "border-fuchsia-500/40 bg-fuchsia-500/20 text-fuchsia-900 hover:bg-fuchsia-500/25 dark:border-fuchsia-400/40 dark:bg-fuchsia-400/20 dark:text-fuchsia-100 dark:hover:bg-fuchsia-400/25",
    chipDotClassName: "bg-fuchsia-400 dark:bg-fuchsia-300",
    cardClassName:
      "border-fuchsia-500/30 bg-white/88 text-slate-900 backdrop-blur-md dark:border-fuchsia-400/35 dark:bg-fuchsia-950/75 dark:text-slate-50",
    badgeClassName:
      "border-fuchsia-500/40 bg-fuchsia-500/20 text-fuchsia-900 dark:border-fuchsia-400/40 dark:bg-fuchsia-400/20 dark:text-fuchsia-100",
    visibleEvidenceKeys: ["ona_percentile_3", "eigenvector_centrality"],
    sortOrder: 100,
  },

  well_connected_profile: {
    code: "well_connected_profile",
    shortCode: "O04",
    family: "ona",
    tone: "info",
    chipLabel: "Perfil Muy Conectado",
    title: "Perfil Muy Conectado",
    description:
      "El empleado ocupa una posición bien conectada dentro de la red y alcanza con facilidad a otros nodos.",
    chipClassName:
      "border-orange-500/40 bg-orange-500/20 text-orange-900 hover:bg-orange-500/25 dark:border-orange-400/40 dark:bg-orange-400/20 dark:text-orange-100 dark:hover:bg-orange-400/25",
    chipDotClassName: "bg-orange-400 dark:bg-orange-300",
    cardClassName:
      "border-orange-500/30 bg-white/88 text-slate-900 backdrop-blur-md dark:border-orange-400/35 dark:bg-orange-950/75 dark:text-slate-50",
    badgeClassName:
      "border-orange-500/40 bg-orange-500/20 text-orange-900 dark:border-orange-400/40 dark:bg-orange-400/20 dark:text-orange-100",
    visibleEvidenceKeys: ["ona_percentile_4", "closeness_centrality"],
    sortOrder: 110,
  },

  cross_functional_leader: {
    code: "cross_functional_leader",
    shortCode: "O05",
    family: "ona",
    tone: "accent",
    chipLabel: "Liderazgo Transversal",
    title: "Liderazgo Transversal",
    description:
      "Este perfil ejerce una influencia estratégica más allá de su equipo formal y conecta diferentes ámbitos de la organización.",
    chipClassName:
      "border-violet-500/40 bg-violet-500/20 text-violet-900 hover:bg-violet-500/25 dark:border-violet-400/40 dark:bg-violet-400/20 dark:text-violet-100 dark:hover:bg-violet-400/25",
    chipDotClassName: "bg-violet-400 dark:bg-violet-300",
    cardClassName:
      "border-violet-500/30 bg-white/88 text-slate-900 backdrop-blur-md dark:border-violet-400/35 dark:bg-violet-950/75 dark:text-slate-50",
    badgeClassName:
      "border-violet-500/40 bg-violet-500/20 text-violet-900 dark:border-violet-400/40 dark:bg-violet-400/20 dark:text-violet-100",
    visibleEvidenceKeys: ["ona_percentile_2", "ona_percentile_3"],
    sortOrder: 120,
  },

  peer_reference: {
    code: "peer_reference",
    shortCode: "O06",
    family: "ona",
    tone: "info",
    chipLabel: "Referente en su Nivel",
    title: "Referente en su Nivel",
    description:
      "El empleado destaca por su reconocimiento e influencia entre personas de un nivel equivalente.",
    chipClassName:
      "border-cyan-500/40 bg-cyan-500/20 text-cyan-900 hover:bg-cyan-500/25 dark:border-cyan-400/40 dark:bg-cyan-400/20 dark:text-cyan-100 dark:hover:bg-cyan-400/25",
    chipDotClassName: "bg-cyan-400 dark:bg-cyan-300",
    cardClassName:
      "border-cyan-500/30 bg-white/88 text-slate-900 backdrop-blur-md dark:border-cyan-400/35 dark:bg-cyan-950/75 dark:text-slate-50",
    badgeClassName:
      "border-cyan-500/40 bg-cyan-500/20 text-cyan-900 dark:border-cyan-400/40 dark:bg-cyan-400/20 dark:text-cyan-100",
    visibleEvidenceKeys: ["ona_percentile_3"],
    sortOrder: 130,
  },

  upward_visibility: {
    code: "upward_visibility",
    shortCode: "O07",
    family: "ona",
    tone: "accent",
    chipLabel: "Visibilidad Ascendente",
    title: "Impacto en Nuevos Superiores",
    description:
      "El empleado genera visibilidad y reconocimiento hacia niveles superiores.",
    chipClassName:
      "border-purple-500/40 bg-purple-500/20 text-purple-900 hover:bg-purple-500/25 dark:border-purple-400/40 dark:bg-purple-400/20 dark:text-purple-100 dark:hover:bg-purple-400/25",
    chipDotClassName: "bg-purple-400 dark:bg-purple-300",
    cardClassName:
      "border-purple-500/30 bg-white/88 text-slate-900 backdrop-blur-md dark:border-purple-400/35 dark:bg-purple-950/75 dark:text-slate-50",
    badgeClassName:
      "border-purple-500/40 bg-purple-500/20 text-purple-900 dark:border-purple-400/40 dark:bg-purple-400/20 dark:text-purple-100",
    visibleEvidenceKeys: ["ona_percentile_4"],
    sortOrder: 140,
  },
};
