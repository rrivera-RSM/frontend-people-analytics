import type {
  EmployeeInsightDefinition,
  KnownEmployeeInsightCode,
} from "@/types/employee-insights";

export const EMPLOYEE_INSIGHT_DEFINITIONS: Record<
  KnownEmployeeInsightCode,
  EmployeeInsightDefinition
> = {
  /* ------------------------------------------------------------------ */
  /* TALENT                                                             */
  /* ------------------------------------------------------------------ */

  high_talent: {
    code: "high_talent",
    shortCode: "T01",
    family: "talent",
    tone: "success",
    chipLabel: "Alto Talento",
    title: "Alto Talento",
    description:
      "Este empleado combina un rendimiento alto con una posición relevante dentro de la organización. Es un perfil que no solo obtiene buenos resultados, sino que además parece tener peso en la red interna.",
    formulaDescription:
      "Se identifica cuando el empleado tiene una evaluación actual alta y, además, destaca en métricas de ONA activo relacionadas con influencia o posicionamiento organizativo.",
    chipClassName:
      "border-emerald-500/40 bg-emerald-500/20 text-emerald-900 hover:bg-emerald-500/25 dark:border-emerald-400/40 dark:bg-emerald-400/20 dark:text-emerald-100 dark:hover:bg-emerald-400/25",
    chipDotClassName: "bg-emerald-400 dark:bg-emerald-300",
    cardClassName:
      "border-emerald-500/30 bg-emerald-50/90 text-slate-900 backdrop-blur-md dark:border-emerald-400/35 dark:bg-emerald-950/75 dark:text-slate-50",
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
      "Este empleado muestra señales claras de crecimiento. Su evolución apunta a una mejora relevante y puede convertirse en un perfil de mayor impacto si se acompaña adecuadamente.",
    formulaDescription:
      "Se calcula comparando la evaluación actual con la evaluación anterior. Si la mejora normalizada supera el umbral definido, se marca como perfil con alto potencial.",
    chipClassName:
      "border-violet-500/40 bg-violet-500/20 text-violet-900 hover:bg-violet-500/25 dark:border-violet-400/40 dark:bg-violet-400/20 dark:text-violet-100 dark:hover:bg-violet-400/25",
    chipDotClassName: "bg-violet-400 dark:bg-violet-300",
    cardClassName:
      "border-violet-500/30 bg-violet-50/90 text-slate-900 backdrop-blur-md dark:border-violet-400/35 dark:bg-violet-950/75 dark:text-slate-50",
    badgeClassName:
      "border-violet-500/40 bg-violet-500/20 text-violet-900 dark:border-violet-400/40 dark:bg-violet-400/20 dark:text-violet-100",
    visibleEvidenceKeys: ["performance_delta_normalized"],
    sortOrder: 20,
  },

  high_underrecognized: {
    code: "high_underrecognized",
    shortCode: "T03",
    family: "talent",
    tone: "warning",
    chipLabel: "Alto Infrareconocido",
    title: "Alto Infrareconocido",
    description:
      "Este empleado tiene una posición fuerte dentro de la red, pero su desempeño actual todavía no refleja ese nivel de influencia. Puede ser un perfil con valor interno que no está del todo capturado por los indicadores tradicionales.",
    formulaDescription:
      "Se activa cuando el empleado presenta una categoría ONA fuerte, pero su evaluación actual no alcanza el umbral definido como desempeño alto.",
    chipClassName:
      "border-amber-500/40 bg-amber-500/20 text-amber-900 hover:bg-amber-500/25 dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-amber-100 dark:hover:bg-amber-400/25",
    chipDotClassName: "bg-amber-400 dark:bg-amber-300",
    cardClassName:
      "border-amber-500/30 bg-amber-50/90 text-slate-900 backdrop-blur-md dark:border-amber-400/35 dark:bg-amber-950/75 dark:text-slate-50",
    badgeClassName:
      "border-amber-500/40 bg-amber-500/20 text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-amber-100",
    visibleEvidenceKeys: ["current_score_normalized", "ona_primary_category"],
    sortOrder: 25,
  },

  high_performer: {
    code: "high_performer",
    shortCode: "T04",
    family: "talent",
    tone: "success",
    chipLabel: "Alto Rendimiento",
    title: "Alto Rendimiento",
    description:
      "Este empleado destaca principalmente por sus resultados. Tiene un desempeño alto, aunque su posición en la red organizativa no sea necesariamente la más central.",
    formulaDescription:
      "Se identifica cuando la evaluación actual está en tramo alto y la clasificación ONA principal corresponde a perfiles intermedios o periféricos.",
    chipClassName:
      "border-blue-500/40 bg-blue-500/20 text-blue-900 hover:bg-blue-500/25 dark:border-blue-400/40 dark:bg-blue-400/20 dark:text-blue-100 dark:hover:bg-blue-400/25",
    chipDotClassName: "bg-blue-400 dark:bg-blue-300",
    cardClassName:
      "border-blue-500/30 bg-blue-50/90 text-slate-900 backdrop-blur-md dark:border-blue-400/35 dark:bg-blue-950/75 dark:text-slate-50",
    badgeClassName:
      "border-blue-500/40 bg-blue-500/20 text-blue-900 dark:border-blue-400/40 dark:bg-blue-400/20 dark:text-blue-100",
    visibleEvidenceKeys: ["current_score_normalized", "ona_primary_category"],
    sortOrder: 26,
  },

  /* ------------------------------------------------------------------ */
  /* PERFORMANCE - NUEVA MATRIZ                                         */
  /* ------------------------------------------------------------------ */

  high_solid_performance: {
    code: "high_solid_performance",
    shortCode: "E10",
    family: "performance",
    tone: "success",
    chipLabel: "Alto desempeño sólido",
    title: "Alto desempeño sólido",
    description:
      "Este empleado mantiene un rendimiento alto de forma consistente. No parece tratarse de un pico puntual, sino de una trayectoria estable o positiva.",
    formulaDescription:
      "Se calcula a partir de la evaluación actual, la banda de desempeño y la tendencia frente a la evaluación anterior. Se activa cuando el empleado está en nivel alto y no muestra una caída relevante.",
    chipClassName:
      "border-emerald-600/40 bg-emerald-600/20 text-emerald-950 hover:bg-emerald-600/25 dark:border-emerald-400/40 dark:bg-emerald-400/20 dark:text-emerald-100 dark:hover:bg-emerald-400/25",
    chipDotClassName: "bg-emerald-500 dark:bg-emerald-300",
    cardClassName:
      "border-emerald-600/30 bg-emerald-50/90 text-slate-900 backdrop-blur-md dark:border-emerald-400/35 dark:bg-emerald-950/75 dark:text-slate-50",
    badgeClassName:
      "border-emerald-600/40 bg-emerald-600/20 text-emerald-950 dark:border-emerald-400/40 dark:bg-emerald-400/20 dark:text-emerald-100",
    visibleEvidenceKeys: [
      "current_score_normalized",
      "performance_band",
      "performance_trend",
    ],
    sortOrder: 80,
  },

  hidden_risk: {
    code: "hidden_risk",
    shortCode: "E11",
    family: "performance",
    tone: "warning",
    chipLabel: "Riesgo oculto",
    title: "Riesgo oculto",
    description:
      "Este empleado sigue estando en un nivel alto, pero su evolución reciente muestra una pérdida de tracción. Conviene revisarlo antes de que la caída sea más evidente.",
    formulaDescription:
      "Se detecta cuando la evaluación actual sigue en tramo alto, pero el delta frente a la evaluación anterior es negativo y supera el umbral definido como caída relevante.",
    chipClassName:
      "border-rose-500/40 bg-rose-500/20 text-rose-950 hover:bg-rose-500/25 dark:border-rose-400/40 dark:bg-rose-400/20 dark:text-rose-100 dark:hover:bg-rose-400/25",
    chipDotClassName: "bg-rose-400 dark:bg-rose-300",
    cardClassName:
      "border-rose-500/30 bg-rose-50/90 text-slate-900 backdrop-blur-md dark:border-rose-400/35 dark:bg-rose-950/75 dark:text-slate-50",
    badgeClassName:
      "border-rose-500/40 bg-rose-500/20 text-rose-950 dark:border-rose-400/40 dark:bg-rose-400/20 dark:text-rose-100",
    visibleEvidenceKeys: [
      "current_score_normalized",
      "delta",
      "performance_trend",
    ],
    sortOrder: 90,
  },

  potential: {
    code: "potential",
    shortCode: "E12",
    family: "performance",
    tone: "info",
    chipLabel: "Potencial",
    title: "Potencial",
    description:
      "Este empleado se encuentra en una zona media de desempeño, pero está mejorando de forma clara. Puede ser un perfil interesante para acompañar y seguir de cerca.",
    formulaDescription:
      "Se calcula combinando la banda actual de desempeño con el delta respecto a la evaluación anterior. Se activa cuando el empleado está en nivel medio y muestra una mejora relevante.",
    chipClassName:
      "border-cyan-500/40 bg-cyan-500/20 text-cyan-950 hover:bg-cyan-500/25 dark:border-cyan-400/40 dark:bg-cyan-400/20 dark:text-cyan-100 dark:hover:bg-cyan-400/25",
    chipDotClassName: "bg-cyan-400 dark:bg-cyan-300",
    cardClassName:
      "border-cyan-500/30 bg-cyan-50/90 text-slate-900 backdrop-blur-md dark:border-cyan-400/35 dark:bg-cyan-950/75 dark:text-slate-50",
    badgeClassName:
      "border-cyan-500/40 bg-cyan-500/20 text-cyan-950 dark:border-cyan-400/40 dark:bg-cyan-400/20 dark:text-cyan-100",
    visibleEvidenceKeys: [
      "current_score_normalized",
      "delta",
      "performance_band",
    ],
    sortOrder: 100,
  },

  stagnant: {
    code: "stagnant",
    shortCode: "E13",
    family: "performance",
    tone: "neutral",
    chipLabel: "Estancado",
    title: "Estancado",
    description:
      "Este empleado se mantiene en una zona media sin señales claras de avance. No necesariamente es una situación crítica, pero sí puede requerir seguimiento si se esperaba una mayor evolución.",
    formulaDescription:
      "Se identifica cuando la evaluación actual está en nivel medio y la tendencia es estable, débil o ligeramente negativa respecto al periodo anterior.",
    chipClassName:
      "border-slate-500/40 bg-slate-500/20 text-slate-800 hover:bg-slate-500/25 dark:border-slate-400/40 dark:bg-slate-400/20 dark:text-slate-100 dark:hover:bg-slate-400/25",
    chipDotClassName: "bg-slate-400 dark:bg-slate-300",
    cardClassName:
      "border-slate-500/25 bg-slate-100/90 text-slate-900 backdrop-blur-md dark:border-slate-400/30 dark:bg-slate-950/75 dark:text-slate-50",
    badgeClassName:
      "border-slate-500/40 bg-slate-500/20 text-slate-800 dark:border-slate-400/40 dark:bg-slate-400/20 dark:text-slate-100",
    visibleEvidenceKeys: [
      "current_score_normalized",
      "performance_band",
      "performance_trend",
    ],
    sortOrder: 110,
  },

  recovery: {
    code: "recovery",
    shortCode: "E14",
    family: "performance",
    tone: "info",
    chipLabel: "Recuperación",
    title: "Recuperación",
    description:
      "Este empleado venía de una situación de bajo rendimiento, pero empieza a mostrar señales de mejora. Puede ser un buen momento para reforzar el acompañamiento.",
    formulaDescription:
      "Se calcula cuando la evaluación actual sigue en tramo bajo, pero el delta respecto a la evaluación anterior es positivo y supera el umbral mínimo de mejora.",
    chipClassName:
      "border-lime-500/40 bg-lime-500/20 text-lime-950 hover:bg-lime-500/25 dark:border-lime-400/40 dark:bg-lime-400/20 dark:text-lime-100 dark:hover:bg-lime-400/25",
    chipDotClassName: "bg-lime-400 dark:bg-lime-300",
    cardClassName:
      "border-lime-500/30 bg-lime-50/90 text-slate-900 backdrop-blur-md dark:border-lime-400/35 dark:bg-lime-950/75 dark:text-slate-50",
    badgeClassName:
      "border-lime-500/40 bg-lime-500/20 text-lime-950 dark:border-lime-400/40 dark:bg-lime-400/20 dark:text-lime-100",
    visibleEvidenceKeys: [
      "current_score_normalized",
      "delta",
      "performance_trend",
    ],
    sortOrder: 120,
  },

  critical: {
    code: "critical",
    shortCode: "E15",
    family: "performance",
    tone: "warning",
    chipLabel: "Crítico",
    title: "Crítico",
    description:
      "Este empleado se encuentra en una situación de bajo rendimiento y no muestra todavía señales suficientes de recuperación. Es un caso que conviene revisar con prioridad.",
    formulaDescription:
      "Se activa cuando la evaluación actual está en nivel bajo y la tendencia no muestra una mejora relevante respecto a la evaluación anterior.",
    chipClassName:
      "border-red-500/40 bg-red-500/20 text-red-950 hover:bg-red-500/25 dark:border-red-400/40 dark:bg-red-400/20 dark:text-red-100 dark:hover:bg-red-400/25",
    chipDotClassName: "bg-red-400 dark:bg-red-300",
    cardClassName:
      "border-red-500/30 bg-red-50/90 text-slate-900 backdrop-blur-md dark:border-red-400/35 dark:bg-red-950/75 dark:text-slate-50",
    badgeClassName:
      "border-red-500/40 bg-red-500/20 text-red-950 dark:border-red-400/40 dark:bg-red-400/20 dark:text-red-100",
    visibleEvidenceKeys: [
      "current_score_normalized",
      "performance_band",
      "performance_trend",
    ],
    sortOrder: 130,
  },

  /* ------------------------------------------------------------------ */
  /* ONA - LEGACY CONTEXT                                               */
  /* ------------------------------------------------------------------ */

  team_connector: {
    code: "team_connector",
    shortCode: "O02",
    family: "ona",
    tone: "info",
    chipLabel: "Conector de Equipo",
    title: "Conector de Equipo",
    description:
      "Este empleado ayuda a conectar personas dentro del equipo. Puede actuar como punto de apoyo informal para que la información y la colaboración fluyan mejor.",
    formulaDescription:
      "Se calcula a partir de las relaciones ONA del empleado, especialmente el número de relaciones únicas y su posición en métricas asociadas a conexión dentro del equipo.",
    chipClassName:
      "border-blue-500/40 bg-blue-500/20 text-blue-900 hover:bg-blue-500/25 dark:border-blue-400/40 dark:bg-blue-400/20 dark:text-blue-100 dark:hover:bg-blue-400/25",
    chipDotClassName: "bg-blue-400 dark:bg-blue-300",
    cardClassName:
      "border-blue-500/30 bg-blue-50/90 text-slate-900 backdrop-blur-md dark:border-blue-400/35 dark:bg-blue-950/75 dark:text-slate-50",
    badgeClassName:
      "border-blue-500/40 bg-blue-500/20 text-blue-900 dark:border-blue-400/40 dark:bg-blue-400/20 dark:text-blue-100",
    visibleEvidenceKeys: ["ona_percentile_1", "unique_relations"],
    sortOrder: 140,
  },

  organizational_connector: {
    code: "organizational_connector",
    shortCode: "O03",
    family: "ona",
    tone: "accent",
    chipLabel: "Conector Organizativo",
    title: "Conector Organizativo",
    description:
      "Este empleado parece conectar partes distintas de la organización. Su valor no está solo en a quién conoce, sino en cómo puede facilitar puentes entre grupos.",
    formulaDescription:
      "Se identifica mediante métricas ONA asociadas a intermediación o conexión entre grupos, como percentiles ONA y centralidad de intermediación.",
    chipClassName:
      "border-indigo-500/40 bg-indigo-500/20 text-indigo-900 hover:bg-indigo-500/25 dark:border-indigo-400/40 dark:bg-indigo-400/20 dark:text-indigo-100 dark:hover:bg-indigo-400/25",
    chipDotClassName: "bg-indigo-400 dark:bg-indigo-300",
    cardClassName:
      "border-indigo-500/30 bg-indigo-50/90 text-slate-900 backdrop-blur-md dark:border-indigo-400/35 dark:bg-indigo-950/75 dark:text-slate-50",
    badgeClassName:
      "border-indigo-500/40 bg-indigo-500/20 text-indigo-900 dark:border-indigo-400/40 dark:bg-indigo-400/20 dark:text-indigo-100",
    visibleEvidenceKeys: ["ona_percentile_2", "betweenness_centrality"],
    sortOrder: 150,
  },

  influential_profile: {
    code: "influential_profile",
    shortCode: "O01",
    family: "ona",
    tone: "accent",
    chipLabel: "Influencia Alta",
    title: "Perfil Influyente",
    description:
      "Este empleado tiene una influencia destacada dentro de la red. Es probable que sus opiniones, decisiones o comportamientos tengan impacto más allá de su entorno inmediato.",
    formulaDescription:
      "Se calcula con métricas de influencia ONA, especialmente percentiles altos y centralidad tipo eigenvector, que mide la conexión con otros nodos relevantes.",
    chipClassName:
      "border-fuchsia-500/40 bg-fuchsia-500/20 text-fuchsia-900 hover:bg-fuchsia-500/25 dark:border-fuchsia-400/40 dark:bg-fuchsia-400/20 dark:text-fuchsia-100 dark:hover:bg-fuchsia-400/25",
    chipDotClassName: "bg-fuchsia-400 dark:bg-fuchsia-300",
    cardClassName:
      "border-fuchsia-500/30 bg-fuchsia-50/90 text-slate-900 backdrop-blur-md dark:border-fuchsia-400/35 dark:bg-fuchsia-950/75 dark:text-slate-50",
    badgeClassName:
      "border-fuchsia-500/40 bg-fuchsia-500/20 text-fuchsia-900 dark:border-fuchsia-400/40 dark:bg-fuchsia-400/20 dark:text-fuchsia-100",
    visibleEvidenceKeys: ["ona_percentile_3", "eigenvector_centrality"],
    sortOrder: 160,
  },

  well_connected_profile: {
    code: "well_connected_profile",
    shortCode: "O04",
    family: "ona",
    tone: "info",
    chipLabel: "Perfil Muy Conectado",
    title: "Perfil Muy Conectado",
    description:
      "Este empleado está bien conectado dentro de la organización y puede acceder con facilidad a distintos puntos de la red.",
    formulaDescription:
      "Se identifica usando métricas ONA asociadas a cercanía o alcance, como percentiles de conexión y centralidad de cercanía.",
    chipClassName:
      "border-orange-500/40 bg-orange-500/20 text-orange-900 hover:bg-orange-500/25 dark:border-orange-400/40 dark:bg-orange-400/20 dark:text-orange-100 dark:hover:bg-orange-400/25",
    chipDotClassName: "bg-orange-400 dark:bg-orange-300",
    cardClassName:
      "border-orange-500/30 bg-orange-50/90 text-slate-900 backdrop-blur-md dark:border-orange-400/35 dark:bg-orange-950/75 dark:text-slate-50",
    badgeClassName:
      "border-orange-500/40 bg-orange-500/20 text-orange-900 dark:border-orange-400/40 dark:bg-orange-400/20 dark:text-orange-100",
    visibleEvidenceKeys: ["ona_percentile_4", "closeness_centrality"],
    sortOrder: 170,
  },

  cross_functional_leader: {
    code: "cross_functional_leader",
    shortCode: "O05",
    family: "ona",
    tone: "accent",
    chipLabel: "Liderazgo Transversal",
    title: "Liderazgo Transversal",
    description:
      "Este empleado muestra capacidad de influencia transversal. No se limita a su equipo formal, sino que parece tener reconocimiento en diferentes ámbitos de la organización.",
    formulaDescription:
      "Se calcula combinando métricas ONA de intermediación e influencia. Se activa cuando el empleado destaca en más de una dimensión relacional relevante.",
    chipClassName:
      "border-violet-500/40 bg-violet-500/20 text-violet-900 hover:bg-violet-500/25 dark:border-violet-400/40 dark:bg-violet-400/20 dark:text-violet-100 dark:hover:bg-violet-400/25",
    chipDotClassName: "bg-violet-400 dark:bg-violet-300",
    cardClassName:
      "border-violet-500/30 bg-violet-50/90 text-slate-900 backdrop-blur-md dark:border-violet-400/35 dark:bg-violet-950/75 dark:text-slate-50",
    badgeClassName:
      "border-violet-500/40 bg-violet-500/20 text-violet-900 dark:border-violet-400/40 dark:bg-violet-400/20 dark:text-violet-100",
    visibleEvidenceKeys: ["ona_percentile_2", "ona_percentile_3"],
    sortOrder: 180,
  },

  peer_reference: {
    code: "peer_reference",
    shortCode: "O06",
    family: "ona",
    tone: "info",
    chipLabel: "Referente en su Nivel",
    title: "Referente en su Nivel",
    description:
      "Este empleado destaca entre perfiles de nivel similar. Puede ser una referencia informal para sus pares o para personas con responsabilidades equivalentes.",
    formulaDescription:
      "Se identifica cuando el empleado alcanza percentiles altos de influencia o reconocimiento dentro de su grupo comparable.",
    chipClassName:
      "border-cyan-500/40 bg-cyan-500/20 text-cyan-900 hover:bg-cyan-500/25 dark:border-cyan-400/40 dark:bg-cyan-400/20 dark:text-cyan-100 dark:hover:bg-cyan-400/25",
    chipDotClassName: "bg-cyan-400 dark:bg-cyan-300",
    cardClassName:
      "border-cyan-500/30 bg-cyan-50/90 text-slate-900 backdrop-blur-md dark:border-cyan-400/35 dark:bg-cyan-950/75 dark:text-slate-50",
    badgeClassName:
      "border-cyan-500/40 bg-cyan-500/20 text-cyan-900 dark:border-cyan-400/40 dark:bg-cyan-400/20 dark:text-cyan-100",
    visibleEvidenceKeys: ["ona_percentile_3"],
    sortOrder: 190,
  },

  upward_visibility: {
    code: "upward_visibility",
    shortCode: "O07",
    family: "ona",
    tone: "accent",
    chipLabel: "Visibilidad Ascendente",
    title: "Impacto en Nuevos Superiores",
    description:
      "Este empleado genera visibilidad hacia niveles superiores. Puede estar consiguiendo reconocimiento más allá de su posición formal actual.",
    formulaDescription:
      "Se calcula a partir de señales ONA relacionadas con reconocimiento, alcance o conexiones ascendentes hacia categorías superiores.",
    chipClassName:
      "border-purple-500/40 bg-purple-500/20 text-purple-900 hover:bg-purple-500/25 dark:border-purple-400/40 dark:bg-purple-400/20 dark:text-purple-100 dark:hover:bg-purple-400/25",
    chipDotClassName: "bg-purple-400 dark:bg-purple-300",
    cardClassName:
      "border-purple-500/30 bg-purple-50/90 text-slate-900 backdrop-blur-md dark:border-purple-400/35 dark:bg-purple-950/75 dark:text-slate-50",
    badgeClassName:
      "border-purple-500/40 bg-purple-500/20 text-purple-900 dark:border-purple-400/40 dark:bg-purple-400/20 dark:text-purple-100",
    visibleEvidenceKeys: ["ona_percentile_4"],
    sortOrder: 200,
  },

  /* ------------------------------------------------------------------ */
  /* ONA RELACIONES - NUEVOS                                            */
  /* ------------------------------------------------------------------ */

  strong_transversal_leadership: {
    code: "strong_transversal_leadership",
    shortCode: "O10",
    family: "ona",
    tone: "accent",
    chipLabel: "Liderazgo Transversal Fuerte",
    title: "Liderazgo Transversal Fuerte",
    description:
      "Este empleado recibe reconocimiento desde varios niveles de la organización. Es una señal fuerte de liderazgo transversal y de impacto más allá de su entorno directo.",
    formulaDescription:
      "Se activa cuando el empleado recibe relaciones entrantes desde un número alto de categorías distintas, superando el umbral definido para liderazgo transversal fuerte.",
    chipClassName:
      "border-violet-600/40 bg-violet-600/20 text-violet-950 hover:bg-violet-600/25 dark:border-violet-400/40 dark:bg-violet-400/20 dark:text-violet-100 dark:hover:bg-violet-400/25",
    chipDotClassName: "bg-violet-500 dark:bg-violet-300",
    cardClassName:
      "border-violet-600/30 bg-violet-50/90 text-slate-900 backdrop-blur-md dark:border-violet-400/35 dark:bg-violet-950/75 dark:text-slate-50",
    badgeClassName:
      "border-violet-600/40 bg-violet-600/20 text-violet-950 dark:border-violet-400/40 dark:bg-violet-400/20 dark:text-violet-100",
    visibleEvidenceKeys: ["n_different_categories_in", "threshold"],
    sortOrder: 210,
  },

  transversal_influence: {
    code: "transversal_influence",
    shortCode: "O11",
    family: "ona",
    tone: "accent",
    chipLabel: "Influencia Transversal",
    title: "Influencia Transversal",
    description:
      "Este empleado tiene reconocimiento en diferentes categorías o niveles. Su influencia no parece estar concentrada en un único grupo.",
    formulaDescription:
      "Se calcula contando cuántas categorías distintas reconocen al empleado en la red ONA. Si el número supera el umbral definido, se marca como influencia transversal.",
    chipClassName:
      "border-indigo-500/40 bg-indigo-500/20 text-indigo-950 hover:bg-indigo-500/25 dark:border-indigo-400/40 dark:bg-indigo-400/20 dark:text-indigo-100 dark:hover:bg-indigo-400/25",
    chipDotClassName: "bg-indigo-400 dark:bg-indigo-300",
    cardClassName:
      "border-indigo-500/30 bg-indigo-50/90 text-slate-900 backdrop-blur-md dark:border-indigo-400/35 dark:bg-indigo-950/75 dark:text-slate-50",
    badgeClassName:
      "border-indigo-500/40 bg-indigo-500/20 text-indigo-950 dark:border-indigo-400/40 dark:bg-indigo-400/20 dark:text-indigo-100",
    visibleEvidenceKeys: ["n_different_categories_in", "threshold"],
    sortOrder: 220,
  },

  lateral_influence: {
    code: "lateral_influence",
    shortCode: "O12",
    family: "ona",
    tone: "info",
    chipLabel: "Influencia Lateral",
    title: "Influencia Lateral",
    description:
      "Este empleado tiene una influencia fuerte entre personas de su mismo nivel o niveles cercanos. Puede ser una referencia natural para sus pares.",
    formulaDescription:
      "Se identifica cuando el empleado recibe un volumen relevante de relaciones entrantes desde personas de la misma categoría o de categorías equivalentes.",
    chipClassName:
      "border-cyan-500/40 bg-cyan-500/20 text-cyan-950 hover:bg-cyan-500/25 dark:border-cyan-400/40 dark:bg-cyan-400/20 dark:text-cyan-100 dark:hover:bg-cyan-400/25",
    chipDotClassName: "bg-cyan-400 dark:bg-cyan-300",
    cardClassName:
      "border-cyan-500/30 bg-cyan-50/90 text-slate-900 backdrop-blur-md dark:border-cyan-400/35 dark:bg-cyan-950/75 dark:text-slate-50",
    badgeClassName:
      "border-cyan-500/40 bg-cyan-500/20 text-cyan-950 dark:border-cyan-400/40 dark:bg-cyan-400/20 dark:text-cyan-100",
    visibleEvidenceKeys: ["n_same_category_in", "threshold"],
    sortOrder: 230,
  },

  upward_influence: {
    code: "upward_influence",
    shortCode: "O13",
    family: "ona",
    tone: "accent",
    chipLabel: "Influencia Ascendente",
    title: "Influencia Ascendente",
    description:
      "Este empleado está siendo reconocido por perfiles de niveles superiores. Es una señal interesante de visibilidad, confianza e impacto por encima de su posición actual.",
    formulaDescription:
      "Se calcula contando relaciones entrantes desde categorías superiores a la del empleado. Si el número supera el umbral definido, se marca como influencia ascendente.",
    chipClassName:
      "border-purple-500/40 bg-purple-500/20 text-purple-950 hover:bg-purple-500/25 dark:border-purple-400/40 dark:bg-purple-400/20 dark:text-purple-100 dark:hover:bg-purple-400/25",
    chipDotClassName: "bg-purple-400 dark:bg-purple-300",
    cardClassName:
      "border-purple-500/30 bg-purple-50/90 text-slate-900 backdrop-blur-md dark:border-purple-400/35 dark:bg-purple-950/75 dark:text-slate-50",
    badgeClassName:
      "border-purple-500/40 bg-purple-500/20 text-purple-950 dark:border-purple-400/40 dark:bg-purple-400/20 dark:text-purple-100",
    visibleEvidenceKeys: ["n_upper_categories_in", "threshold"],
    sortOrder: 240,
  },

  bridge_person: {
    code: "bridge_person",
    shortCode: "O14",
    family: "ona",
    tone: "info",
    chipLabel: "Persona Puente",
    title: "Persona Puente",
    description:
      "Este empleado conecta diferentes áreas o departamentos. Puede ser clave para facilitar colaboración, circulación de información y coordinación transversal.",
    formulaDescription:
      "Se activa cuando el empleado recibe relaciones desde varios departamentos distintos, superando el umbral definido de diversidad departamental.",
    chipClassName:
      "border-blue-600/40 bg-blue-600/20 text-blue-950 hover:bg-blue-600/25 dark:border-blue-400/40 dark:bg-blue-400/20 dark:text-blue-100 dark:hover:bg-blue-400/25",
    chipDotClassName: "bg-blue-500 dark:bg-blue-300",
    cardClassName:
      "border-blue-600/30 bg-blue-50/90 text-slate-900 backdrop-blur-md dark:border-blue-400/35 dark:bg-blue-950/75 dark:text-slate-50",
    badgeClassName:
      "border-blue-600/40 bg-blue-600/20 text-blue-950 dark:border-blue-400/40 dark:bg-blue-400/20 dark:text-blue-100",
    visibleEvidenceKeys: ["n_different_departments_in", "threshold"],
    sortOrder: 250,
  },

  high_team_trust: {
    code: "high_team_trust",
    shortCode: "O15",
    family: "ona",
    tone: "success",
    chipLabel: "Alta Confianza del Equipo",
    title: "Alta Confianza del Equipo",
    description:
      "Este empleado concentra un nivel alto de reconocimiento dentro de su entorno. Es una señal de confianza, visibilidad y relevancia en el día a día del equipo.",
    formulaDescription:
      "Se calcula comparando el número total de votos o relaciones entrantes del empleado frente al percentil 80 de referencia de su departamento u oficina.",
    chipClassName:
      "border-teal-500/40 bg-teal-500/20 text-teal-950 hover:bg-teal-500/25 dark:border-teal-400/40 dark:bg-teal-400/20 dark:text-teal-100 dark:hover:bg-teal-400/25",
    chipDotClassName: "bg-teal-400 dark:bg-teal-300",
    cardClassName:
      "border-teal-500/30 bg-teal-50/90 text-slate-900 backdrop-blur-md dark:border-teal-400/35 dark:bg-teal-950/75 dark:text-slate-50",
    badgeClassName:
      "border-teal-500/40 bg-teal-500/20 text-teal-950 dark:border-teal-400/40 dark:bg-teal-400/20 dark:text-teal-100",
    visibleEvidenceKeys: ["n_total_votes_in", "percentile_80_votes_dpt_office"],
    sortOrder: 260,
  },

  /* ------------------------------------------------------------------ */
  /* ONA ACTIVO - NUEVOS (RADAR)                                        */
  /* ------------------------------------------------------------------ */

  active_influence_ci: {
    code: "active_influence_ci",
    shortCode: "OA1",
    family: "ona",
    tone: "info",
    chipLabel: "Influencia CI",
    title: "Influencia CI",
    description:
      "Este empleado destaca en la dimensión CI del ONA activo. Está por encima de la mayoría de la organización en esta métrica concreta.",
    formulaDescription:
      "Se activa cuando el percentil 1 de ONA activo del empleado se sitúa en el tramo alto, normalmente igual o superior al umbral definido para el top 20%.",
    chipClassName:
      "border-blue-500/40 bg-blue-500/20 text-blue-900 hover:bg-blue-500/25 dark:border-blue-400/40 dark:bg-blue-400/20 dark:text-blue-100 dark:hover:bg-blue-400/25",
    chipDotClassName: "bg-blue-400 dark:bg-blue-300",
    cardClassName:
      "border-blue-500/30 bg-blue-50/90 text-slate-900 backdrop-blur-md dark:border-blue-400/35 dark:bg-blue-950/75 dark:text-slate-50",
    badgeClassName:
      "border-blue-500/40 bg-blue-500/20 text-blue-900 dark:border-blue-400/40 dark:bg-blue-400/20 dark:text-blue-100",
    visibleEvidenceKeys: ["ona_percentile_1", "threshold"],
    sortOrder: 270,
  },

  active_influence_at: {
    code: "active_influence_at",
    shortCode: "OA2",
    family: "ona",
    tone: "accent",
    chipLabel: "Influencia AT",
    title: "Influencia AT",
    description:
      "Este empleado destaca en la dimensión AT del ONA activo. Muestra una señal relacional especialmente fuerte en esta variable.",
    formulaDescription:
      "Se activa cuando el percentil 2 de ONA activo del empleado se sitúa en el tramo alto, normalmente igual o superior al umbral definido para el top 20%.",
    chipClassName:
      "border-indigo-500/40 bg-indigo-500/20 text-indigo-900 hover:bg-indigo-500/25 dark:border-indigo-400/40 dark:bg-indigo-400/20 dark:text-indigo-100 dark:hover:bg-indigo-400/25",
    chipDotClassName: "bg-indigo-400 dark:bg-indigo-300",
    cardClassName:
      "border-indigo-500/30 bg-indigo-50/90 text-slate-900 backdrop-blur-md dark:border-indigo-400/35 dark:bg-indigo-950/75 dark:text-slate-50",
    badgeClassName:
      "border-indigo-500/40 bg-indigo-500/20 text-indigo-900 dark:border-indigo-400/40 dark:bg-indigo-400/20 dark:text-indigo-100",
    visibleEvidenceKeys: ["ona_percentile_2", "threshold"],
    sortOrder: 280,
  },

  active_influence_ap: {
    code: "active_influence_ap",
    shortCode: "OA3",
    family: "ona",
    tone: "accent",
    chipLabel: "Influencia AP",
    title: "Influencia AP",
    description:
      "Este empleado destaca en la dimensión AP del ONA activo. Es una señal de influencia o reconocimiento relevante dentro de esta dimensión.",
    formulaDescription:
      "Se activa cuando el percentil 3 de ONA activo del empleado se sitúa en el tramo alto, normalmente igual o superior al umbral definido para el top 20%.",
    chipClassName:
      "border-fuchsia-500/40 bg-fuchsia-500/20 text-fuchsia-900 hover:bg-fuchsia-500/25 dark:border-fuchsia-400/40 dark:bg-fuchsia-400/20 dark:text-fuchsia-100 dark:hover:bg-fuchsia-400/25",
    chipDotClassName: "bg-fuchsia-400 dark:bg-fuchsia-300",
    cardClassName:
      "border-fuchsia-500/30 bg-fuchsia-50/90 text-slate-900 backdrop-blur-md dark:border-fuchsia-400/35 dark:bg-fuchsia-950/75 dark:text-slate-50",
    badgeClassName:
      "border-fuchsia-500/40 bg-fuchsia-500/20 text-fuchsia-900 dark:border-fuchsia-400/40 dark:bg-fuchsia-400/20 dark:text-fuchsia-100",
    visibleEvidenceKeys: ["ona_percentile_3", "threshold"],
    sortOrder: 290,
  },

  active_influence_in: {
    code: "active_influence_in",
    shortCode: "OA4",
    family: "ona",
    tone: "info",
    chipLabel: "Influencia IN",
    title: "Influencia IN",
    description:
      "Este empleado destaca en la dimensión IN del ONA activo. Tiene una posición especialmente buena en esta métrica frente al resto de empleados.",
    formulaDescription:
      "Se activa cuando el percentil 4 de ONA activo del empleado se sitúa en el tramo alto, normalmente igual o superior al umbral definido para el top 20%.",
    chipClassName:
      "border-orange-500/40 bg-orange-500/20 text-orange-900 hover:bg-orange-500/25 dark:border-orange-400/40 dark:bg-orange-400/20 dark:text-orange-100 dark:hover:bg-orange-400/25",
    chipDotClassName: "bg-orange-400 dark:bg-orange-300",
    cardClassName:
      "border-orange-500/30 bg-orange-50/90 text-slate-900 backdrop-blur-md dark:border-orange-400/35 dark:bg-orange-950/75 dark:text-slate-50",
    badgeClassName:
      "border-orange-500/40 bg-orange-500/20 text-orange-900 dark:border-orange-400/40 dark:bg-orange-400/20 dark:text-orange-100",
    visibleEvidenceKeys: ["ona_percentile_4", "threshold"],
    sortOrder: 300,
  },
};
