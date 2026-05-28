"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  OnaCategory,
  OnaRelationNodeApi,
  OnaRelationsApiResponse,
} from "@/types/ona-relations";

type Props = {
  employeeId: number | null | undefined;
  societyId: number | null | undefined;
  title?: string;
};

type GraphNode = {
  id: string;
  degree: number;
  isSelected: boolean;
  isNeighbor: boolean;
  onaCategory: OnaCategory | null;
  color: string;
  radius: number;
  x: number;
  y: number;
};

type GraphEdge = {
  source: string;
  target: string;
  weight: number;
};

type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 540;

const CATEGORY_PRIORITY: Record<OnaCategory, number> = {
  central: 1,
  hipo: 2,
  intermediary: 3,
  peripheral: 4,
};

const CATEGORY_COLORS: Record<OnaCategory, string> = {
  central: "#22c55e",
  hipo: "#a3e635",
  intermediary: "#f59e0b",
  peripheral: "#ef4444",
};

const CATEGORY_LABELS: Record<OnaCategory, string> = {
  central: "Central",
  hipo: "Hipo",
  intermediary: "Intermediary",
  peripheral: "Peripheral",
};

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const next = Number(value);
    return Number.isFinite(next) ? next : null;
  }
  return null;
}

function readString(value: unknown): string | null {
  if (typeof value === "string" && value.trim() !== "") return value;
  const asNumber = readNumber(value);
  return asNumber != null ? String(asNumber) : null;
}

function getEdgeWeight(item: Record<string, unknown>) {
  return (
    readNumber(item.weight) ??
    readNumber(item.strength) ??
    readNumber(item.count) ??
    1
  );
}

function getRawRelationItems(payload: OnaRelationsApiResponse) {
  return Array.isArray(payload)
    ? payload
    : Array.isArray(payload.relations)
      ? payload.relations
      : Array.isArray(payload.edges)
        ? payload.edges
        : Array.isArray(payload.links)
          ? payload.links
          : payload.data && Array.isArray(payload.data)
            ? payload.data
            : [];
}

function normalizeOnaCategory(value: unknown): OnaCategory | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();

  if (normalized === "central") return "central";
  if (normalized === "hipo") return "hipo";
  if (normalized === "intermediary" || normalized === "intermediario") {
    return "intermediary";
  }
  if (normalized === "peripheral" || normalized === "periferico" || normalized === "periférico") {
    return "peripheral";
  }

  return null;
}

function resolveNodeColor(category: OnaCategory | null) {
  if (!category) return "#fbbf24";
  return CATEGORY_COLORS[category];
}

function resolveCategoryLabel(category: OnaCategory | null) {
  if (!category) return "Sin categorizar";
  return CATEGORY_LABELS[category];
}

function getEdgeEndpoints(item: Record<string, unknown>) {
  const source =
    readString(item.source) ??
    readString(item.source_id) ??
    readString(item.source_employee_id) ??
    readString(item.from) ??
    readString(item.from_id) ??
    readString(item.from_employee_id) ??
    readString(item.employee_id);

  const target =
    readString(item.target) ??
    readString(item.target_id) ??
    readString(item.target_employee_id) ??
    readString(item.to) ??
    readString(item.to_id) ??
    readString(item.to_employee_id) ??
    readString(item.related_employee_id) ??
    readString(item.connected_employee_id);

  if (!source || !target || source === target) return null;

  return {
    source,
    target,
    weight: getEdgeWeight(item),
  };
}

function extractEdges(payload: OnaRelationsApiResponse): GraphEdge[] {
  const rawList = getRawRelationItems(payload);

  const dedup = new Map<string, GraphEdge>();

  for (const item of rawList) {
    if (!item || typeof item !== "object") continue;
    const endpoints = getEdgeEndpoints(item);
    if (!endpoints) continue;
    const key =
      endpoints.source < endpoints.target
        ? `${endpoints.source}-${endpoints.target}`
        : `${endpoints.target}-${endpoints.source}`;

    const previous = dedup.get(key);
    dedup.set(key, {
      source: endpoints.source,
      target: endpoints.target,
      weight: (previous?.weight ?? 0) + endpoints.weight,
    });
  }

  return [...dedup.values()];
}

function extractNodeCategories(payload: OnaRelationsApiResponse) {
  const rawList = getRawRelationItems(payload);
  const categories = new Map<string, OnaCategory>();

  function assignCategory(id: string | null, category: OnaCategory | null) {
    if (!id || !category) return;

    const previous = categories.get(id);
    if (!previous || CATEGORY_PRIORITY[category] < CATEGORY_PRIORITY[previous]) {
      categories.set(id, category);
    }
  }

  for (const item of rawList) {
    if (!item || typeof item !== "object") continue;

    assignCategory(
      readString(item.from_employee_id) ?? readString(item.source) ?? readString(item.from),
      normalizeOnaCategory(item.from_ona_category),
    );
    assignCategory(
      readString(item.to_employee_id) ?? readString(item.target) ?? readString(item.to),
      normalizeOnaCategory(item.to_ona_category),
    );
  }

  return categories;
}

function getRawNodes(payload: OnaRelationsApiResponse): OnaRelationNodeApi[] {
  if (Array.isArray(payload)) return [];
  if (Array.isArray(payload.nodes)) return payload.nodes;

  if (
    payload.data &&
    !Array.isArray(payload.data) &&
    Array.isArray((payload.data as Record<string, unknown>).nodes)
  ) {
    return ((payload.data as Record<string, unknown>).nodes ?? []) as OnaRelationNodeApi[];
  }

  return [];
}

function buildGraph(raw: OnaRelationsApiResponse, employeeId: number): GraphData {
  const selectedId = String(employeeId);
  const edges = extractEdges(raw);
  const rawNodes = getRawNodes(raw);
  const nodeCategories = extractNodeCategories(raw);
  const degrees = new Map<string, number>();
  const neighbors = new Set<string>();
  const coordinates = new Map<string, { x: number; y: number }>();

  for (const edge of edges) {
    degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + edge.weight);
    degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + edge.weight);

    if (edge.source === selectedId) neighbors.add(edge.target);
    if (edge.target === selectedId) neighbors.add(edge.source);
  }

  if (!degrees.has(selectedId)) {
    degrees.set(selectedId, 0);
  }

  for (const node of rawNodes) {
    const nodeId =
      readString(node.id) ??
      readString(node.employee_id) ??
      readString(node.node_id) ??
      readString(node.person_id);
    if (!nodeId) continue;

    if (!degrees.has(nodeId)) degrees.set(nodeId, 0);

    const category = normalizeOnaCategory(node.ona_category);
    if (category) {
      const previous = nodeCategories.get(nodeId);
      if (!previous || CATEGORY_PRIORITY[category] < CATEGORY_PRIORITY[previous]) {
        nodeCategories.set(nodeId, category);
      }
    }

    const x = readNumber(node.graph_x_coordinate);
    const y = readNumber(node.graph_y_coordinate);
    if (x != null && y != null) {
      coordinates.set(nodeId, { x, y });
    }
  }

  const nodeIds = [...degrees.keys()];
  const maxDegree = Math.max(...degrees.values(), 1);
  const positioned = [...coordinates.values()];
  const minX = positioned.length ? Math.min(...positioned.map((p) => p.x)) : -1;
  const maxX = positioned.length ? Math.max(...positioned.map((p) => p.x)) : 1;
  const minY = positioned.length ? Math.min(...positioned.map((p) => p.y)) : -1;
  const maxY = positioned.length ? Math.max(...positioned.map((p) => p.y)) : 1;
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const margin = 52;
  const drawWidth = VIEWBOX_WIDTH - margin * 2;
  const drawHeight = VIEWBOX_HEIGHT - margin * 2;

  const nodes: GraphNode[] = [];
  nodeIds.forEach((id) => {
    const degree = degrees.get(id) ?? 0;
    const isSelected = id === selectedId;
    const isNeighbor = neighbors.has(id);
    const onaCategory = nodeCategories.get(id) ?? null;
    const color = resolveNodeColor(onaCategory);
    const position = coordinates.get(id);

    const x =
      position != null
        ? margin + ((position.x - minX) / spanX) * drawWidth
        : VIEWBOX_WIDTH / 2;
    const y =
      position != null
        ? margin + ((position.y - minY) / spanY) * drawHeight
        : VIEWBOX_HEIGHT / 2;

    nodes.push({
      id,
      degree,
      isSelected,
      isNeighbor,
      onaCategory,
      color,
      radius: isSelected
        ? 15
        : Math.max(6, Math.min(11, 6 + (degree / maxDegree) * 5)),
      x: Math.max(36, Math.min(VIEWBOX_WIDTH - 36, x)),
      y: Math.max(36, Math.min(VIEWBOX_HEIGHT - 36, y)),
    });
  });

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const simulationEdges = edges.filter(
    (edge) => nodeMap.has(edge.source) && nodeMap.has(edge.target),
  );

  return { nodes, edges: simulationEdges };
}

function PersonGlyph({
  x,
  y,
  radius,
  color,
  selected,
}: {
  x: number;
  y: number;
  radius: number;
  color: string;
  selected: boolean;
}) {
  const headRadius = radius * 0.48;
  const bodyWidth = radius * 1.7;
  const bodyHeight = radius * 1.05;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {selected && (
        <>
          <circle r={radius * 1.95} fill="rgba(34, 211, 238, 0.12)" />
          <circle r={radius * 1.55} fill="none" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="2" />
        </>
      )}
      <circle cy={-radius * 0.9} r={headRadius} fill={color} />
      <rect
        x={-bodyWidth / 2}
        y={-radius * 0.2}
        width={bodyWidth}
        height={bodyHeight}
        rx={radius * 0.45}
        fill={color}
      />
    </g>
  );
}

export function OnaOrganizationGraph({
  employeeId,
  societyId,
  title = "Red organizacional de la sociedad",
}: Props) {
  const [data, setData] = useState<OnaRelationsApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId || !societyId) {
      setData(null);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/ona/relations?society_id=${societyId}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`No se pudo cargar la red ONA (${response.status})`);
        }

        const payload = (await response.json()) as OnaRelationsApiResponse;
        setData(payload);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(
            err instanceof Error ? err.message : "No se pudo cargar la red ONA",
          );
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [employeeId, societyId]);

  const graph = useMemo(() => {
    if (!data || !employeeId) return null;
    return buildGraph(data, employeeId);
  }, [data, employeeId]);

  const selectedNode = useMemo(() => {
    return graph?.nodes.find((node) => node.isSelected) ?? null;
  }, [graph]);

  const hasGraph = Boolean(graph && graph.nodes.length > 0);

  return (
    <Card className="overflow-hidden border-slate-200 bg-[var(--exec-card)] py-2 dark:border-slate-700/90">
      <CardHeader className="space-y-3 px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base leading-tight text-slate-900 dark:text-slate-100">
            {title}
          </CardTitle>
          <div className="inline-flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              Empleado seleccionado (halo)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              Central
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-lime-400" />
              Hipo
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              Intermediary
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              Peripheral
            </span>
          </div>
        </div>
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          Vista agregada de relaciones dentro de la sociedad. La posicion de cada
          nodo se toma de `graph_x_coordinate` y `graph_y_coordinate`, mientras el
          color se basa en `ona_category`.
        </p>
      </CardHeader>

      <CardContent className="px-3 pb-3 pt-0">
        {!societyId ? (
          <div className="grid min-h-[260px] place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-400">
            Este empleado no tiene `society_id` disponible para construir la red.
          </div>
        ) : loading ? (
          <div className="grid min-h-[260px] place-items-center rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-400">
            Cargando red organizacional...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : !hasGraph ? (
          <div className="grid min-h-[260px] place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-400">
            No hay suficientes relaciones ONA para representar esta sociedad.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedNode && (
              <div
                className="flex items-center justify-between rounded-xl border px-4 py-3"
                style={{
                  borderColor: `${selectedNode.color}55`,
                  background: `linear-gradient(135deg, ${selectedNode.color}18, rgba(15,23,42,0.78))`,
                }}
              >
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
                    Posicion organizacional
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {resolveCategoryLabel(selectedNode.onaCategory)}
                  </div>
                </div>

                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-slate-800 dark:text-slate-50"
                  style={{
                    borderColor: `${selectedNode.color}66`,
                    backgroundColor: `${selectedNode.color}22`,
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  {resolveCategoryLabel(selectedNode.onaCategory)}
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-300 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(241,245,249,0.95))] dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.55),rgba(2,6,23,0.85))]">
              <svg
                viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                className="h-[420px] w-full"
                role="img"
                aria-label="Grafo organizacional anonimizado de la sociedad"
              >
                {graph.edges.map((edge, index) => {
                  const source = graph.nodes.find((node) => node.id === edge.source);
                  const target = graph.nodes.find((node) => node.id === edge.target);
                  if (!source || !target) return null;

                  const connectedToSelection = source.isSelected || target.isSelected;
                  const midX = (source.x + target.x) / 2;
                  const midY = (source.y + target.y) / 2;
                  const curveY = midY - 8;

                  return (
                    <path
                      key={`${edge.source}-${edge.target}-${index}`}
                      d={`M ${source.x} ${source.y} Q ${midX} ${curveY} ${target.x} ${target.y}`}
                      stroke={
                        connectedToSelection
                          ? "rgba(34, 211, 238, 0.42)"
                          : "rgba(148, 163, 184, 0.16)"
                      }
                      strokeWidth={
                        connectedToSelection ? 2.1 : Math.min(1.5, 0.7 + edge.weight * 0.16)
                      }
                      fill="none"
                    />
                  );
                })}

                {graph.nodes.map((node) => (
                  <PersonGlyph
                    key={node.id}
                    x={node.x}
                    y={node.y}
                    radius={node.radius}
                    color={node.color}
                    selected={node.isSelected}
                  />
                ))}
              </svg>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
