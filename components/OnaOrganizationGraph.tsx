"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
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

type ForceNode = GraphNode & {
  fx: number;
  fy: number;
};

type ForceLink = GraphEdge & {
  source: string | ForceNode;
  target: string | ForceNode;
};

type ForceGraph2DProps = {
  ref?: React.RefObject<ForceGraphRef | null>;
  graphData: { nodes: ForceNode[]; links: ForceLink[] };
  width: number;
  height: number;
  backgroundColor?: string;
  nodeRelSize?: number;
  cooldownTicks?: number;
  enableNodeDrag?: boolean;
  enablePanInteraction?: boolean;
  enableZoomInteraction?: boolean;
  linkDirectionalParticles?: number;
  linkDirectionalParticleSpeed?: (link: ForceLink) => number;
  linkDirectionalParticleWidth?: (link: ForceLink) => number;
  linkDirectionalParticleColor?: (link: ForceLink) => string;
  linkColor?: (link: ForceLink) => string;
  linkWidth?: (link: ForceLink) => number;
  linkCurvature?: number;
  nodeCanvasObject?: (
    node: ForceNode,
    ctx: CanvasRenderingContext2D,
    globalScale: number,
  ) => void;
  nodeCanvasObjectMode?: (node: ForceNode) => "replace";
};

type ForceGraphRef = {
  centerAt: (x?: number, y?: number, ms?: number) => void;
  zoom: (k?: number, ms?: number) => void;
  zoomToFit: (ms?: number, padding?: number) => void;
};

const ForceGraph2D = dynamic<ForceGraph2DProps>(
  () => import("react-force-graph-2d"),
  { ssr: false },
);

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 540;

const CATEGORY_PRIORITY: Record<OnaCategory, number> = {
  central: 1,
  hipo: 2,
  intermediary: 3,
  peripheral: 4,
};

const CATEGORY_COLORS: Record<OnaCategory, string> = {
  central: "#3F9C35",
  hipo: "#34A798",
  intermediary: "#F1B434",
  peripheral: "#E40046",
};

const CATEGORY_LABELS: Record<OnaCategory, string> = {
  central: "Central",
  hipo: "Hipo",
  intermediary: "Intermediary",
  peripheral: "Peripheral",
};

type ViewMode = "employee" | "organization";

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
  if (!category) return "#888B8D";
  return CATEGORY_COLORS[category];
}

function resolveCategoryLabel(category: OnaCategory | null) {
  if (!category) return "Sin categorizar";
  return CATEGORY_LABELS[category];
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
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

function nudgeSelectedNode(nodes: GraphNode[], selectedId: string): GraphNode[] {
  const selected = nodes.find((node) => node.id === selectedId);
  if (!selected) return nodes;

  const minDistance = 26;
  const closeNodes = nodes.filter((node) => {
    if (node.id === selectedId) return false;
    const dx = selected.x - node.x;
    const dy = selected.y - node.y;
    return Math.hypot(dx, dy) < minDistance;
  });

  if (closeNodes.length === 0) return nodes;

  let pushX = 0;
  let pushY = 0;
  for (const node of closeNodes) {
    const dx = selected.x - node.x;
    const dy = selected.y - node.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const strength = (minDistance - distance) / minDistance;
    pushX += (dx / distance) * strength;
    pushY += (dy / distance) * strength;
  }

  const adjusted = {
    ...selected,
    x: Math.max(36, Math.min(VIEWBOX_WIDTH - 36, selected.x + pushX * 18)),
    y: Math.max(36, Math.min(VIEWBOX_HEIGHT - 36, selected.y + pushY * 18)),
  };

  return nodes.map((node) => (node.id === selectedId ? adjusted : node));
}

export function OnaOrganizationGraph({
  employeeId,
  societyId,
  title = "Red organizacional de la sociedad",
}: Props) {
  const [data, setData] = useState<OnaRelationsApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const forceGraphRef = useRef<ForceGraphRef | null>(null);
  const [graphSize, setGraphSize] = useState({ width: 960, height: 420 });
  const [viewMode, setViewMode] = useState<ViewMode>("employee");
  const [pulseTick, setPulseTick] = useState(0);

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPulseTick((value) => value + 1);
    }, 900);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resize = () => {
      const width = Math.max(320, Math.floor(element.clientWidth));
      const height = Math.max(300, Math.floor(element.clientHeight));
      setGraphSize({ width, height });
    };

    resize();
    const observer = new ResizeObserver(() => resize());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const graph = useMemo(() => {
    if (!data || !employeeId) return null;
    return buildGraph(data, employeeId);
  }, [data, employeeId]);

  const forceGraphData = useMemo(() => {
    if (!graph || !employeeId) return null;
    const selectedId = String(employeeId);
    const adjustedNodes = nudgeSelectedNode(graph.nodes, selectedId);
    return {
      nodes: adjustedNodes.map((node) => ({
        ...node,
        fx: node.x,
        fy: node.y,
      })),
      links: graph.edges,
    };
  }, [graph, employeeId]);

  const selectedNode = useMemo(() => {
    return forceGraphData?.nodes.find((node) => node.isSelected) ?? null;
  }, [forceGraphData]);

  const applyCameraMode = useMemo(
    () => (mode: ViewMode) => {
      if (!forceGraphData || !forceGraphRef.current) return;
      const selected = forceGraphData.nodes.find((node) => node.isSelected);
      const centerX = VIEWBOX_WIDTH / 2;
      const centerY = VIEWBOX_HEIGHT / 2;

      if (mode === "employee" && selected) {
        forceGraphRef.current.centerAt(selected.x, selected.y, 450);
        forceGraphRef.current.zoom(1.7, 450);
        return;
      }

      const orgX =
        forceGraphData.nodes.reduce((sum, node) => sum + node.x, 0) /
        Math.max(1, forceGraphData.nodes.length);
      const orgY =
        forceGraphData.nodes.reduce((sum, node) => sum + node.y, 0) /
        Math.max(1, forceGraphData.nodes.length);

      forceGraphRef.current.centerAt(
        Number.isFinite(orgX) ? orgX : centerX,
        Number.isFinite(orgY) ? orgY : centerY,
        250,
      );
      forceGraphRef.current.zoomToFit(450, 56);
    },
    [forceGraphData],
  );

  useEffect(() => {
    const rafId = requestAnimationFrame(() => applyCameraMode(viewMode));
    return () => cancelAnimationFrame(rafId);
  }, [applyCameraMode, viewMode, graphSize.width, graphSize.height]);

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
              <span className="h-2.5 w-2.5 rounded-full bg-[#009CDE]" />
              Empleado seleccionado (halo)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3F9C35]" />
              Central
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#34A798]" />
              Hipo
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F1B434]" />
              Intermediary
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E40046]" />
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
          <div className="rounded-xl border border-[color:rgb(var(--rsm-red-rgb)/0.3)] bg-[rgb(var(--rsm-red-rgb)/0.1)] p-4 text-sm text-[var(--rsm-red)] dark:text-[#ff9ab8]">
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
                  background: `linear-gradient(135deg, ${selectedNode.color}18, rgba(0,21,61,0.78))`,
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

            <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-[radial-gradient(circle_at_top,rgba(0,156,222,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,248,250,0.95))] dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top,rgba(0,156,222,0.11),transparent_30%),linear-gradient(180deg,rgba(0,21,61,0.64),rgba(6,17,38,0.9))]">
              <div className="absolute right-3 top-3 z-10 inline-flex items-center rounded-lg border border-slate-300/80 bg-white/90 p-1 text-[11px] shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
                <button
                  type="button"
                  onClick={() => setViewMode("employee")}
                  className={`rounded-md px-2.5 py-1 font-medium transition ${
                    viewMode === "employee"
                      ? "bg-[#009CDE] text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  Empleado centrado
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("organization")}
                  className={`rounded-md px-2.5 py-1 font-medium transition ${
                    viewMode === "organization"
                      ? "bg-[#009CDE] text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  Organización centrada
                </button>
              </div>
              <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-lg border border-slate-300/80 bg-white/90 p-1 text-[11px] shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
                <button
                  type="button"
                  onClick={() => applyCameraMode(viewMode)}
                  className="rounded-md px-2.5 py-1 font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Recentrar
                </button>
                <button
                  type="button"
                  onClick={() => forceGraphRef.current?.zoomToFit(450, 56)}
                  className="rounded-md px-2.5 py-1 font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Reset
                </button>
              </div>
              <div ref={containerRef} className="h-[420px] w-full" role="img" aria-label="Grafo organizacional anonimizado de la sociedad">
                {forceGraphData && (
                  <ForceGraph2D
                    ref={forceGraphRef}
                    graphData={forceGraphData}
                    width={graphSize.width}
                    height={graphSize.height}
                    backgroundColor="rgba(0,0,0,0)"
                    nodeRelSize={1}
                    cooldownTicks={0}
                    enableNodeDrag={false}
                    enablePanInteraction
                    enableZoomInteraction
                    linkCurvature={0.12}
                    linkColor={(link) => {
                      const source = link.source as ForceNode;
                      const target = link.target as ForceNode;
                      return source.isSelected || target.isSelected
                        ? "rgba(0, 156, 222, 0.42)"
                        : "rgba(136, 139, 141, 0.14)";
                    }}
                    linkWidth={(link) => {
                      const source = link.source as ForceNode;
                      const target = link.target as ForceNode;
                      return source.isSelected || target.isSelected
                        ? 2.1
                        : Math.min(1.5, 0.7 + link.weight * 0.16);
                    }}
                    linkDirectionalParticles={1}
                    linkDirectionalParticleSpeed={(link) =>
                      Math.min(0.012, 0.003 + link.weight * 0.0008)
                    }
                    linkDirectionalParticleWidth={(link) =>
                      Math.min(2.2, 1.1 + link.weight * 0.16)
                    }
                    linkDirectionalParticleColor={(link) => {
                      const source = link.source as ForceNode;
                      const target = link.target as ForceNode;
                      return source.isSelected || target.isSelected
                        ? "rgba(0, 156, 222, 0.84)"
                        : "rgba(136, 139, 141, 0.26)";
                    }}
                    nodeCanvasObjectMode={() => "replace"}
                    nodeCanvasObject={(node, ctx, globalScale) => {
                      const highlightScale = node.isSelected ? 1.18 : node.isNeighbor ? 1.08 : 1;
                      const radius = Math.max(
                        3.5,
                        (node.radius * highlightScale) / Math.max(0.8, globalScale * 0.9),
                      );
                      const headRadius = radius * 0.5;
                      const bodyWidth = radius * 1.7;
                      const bodyHeight = radius * 1.05;
                      const baseAlpha = node.isSelected ? 1 : node.isNeighbor ? 0.9 : 0.42;
                      const pulse = node.isSelected ? (pulseTick % 2 === 0 ? 1 : 0.78) : 0;

                      ctx.save();
                      ctx.translate(node.x, node.y);
                      ctx.globalAlpha = baseAlpha;

                      if (node.isSelected) {
                        ctx.beginPath();
                        ctx.arc(0, 0, radius * (2.2 + pulse * 0.22), 0, 2 * Math.PI);
                        ctx.fillStyle = "rgba(0, 156, 222, 0.14)";
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(0, 0, radius * 1.6, 0, 2 * Math.PI);
                        ctx.strokeStyle = "rgba(0, 156, 222, 0.56)";
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(0, 0, radius * 1.24, 0, 2 * Math.PI);
                        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
                        ctx.lineWidth = 1;
                        ctx.stroke();
                      }

                      ctx.beginPath();
                      ctx.arc(0, -radius * 0.9, headRadius, 0, 2 * Math.PI);
                      ctx.fillStyle = node.color;
                      ctx.fill();

                      drawRoundedRect(
                        ctx,
                        -bodyWidth / 2,
                        -radius * 0.2,
                        bodyWidth,
                        bodyHeight,
                        radius * 0.45,
                      );
                      ctx.fillStyle = node.color;
                      ctx.fill();
                      ctx.restore();
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
