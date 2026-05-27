"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OnaRelationsApiResponse } from "@/types/ona-relations";

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
  clusterIndex: number;
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
  clusters: {
    id: string;
    x: number;
    y: number;
    radius: number;
    isSelectedCluster: boolean;
  }[];
};

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 540;

const NODE_COLORS = {
  selected: "#22d3ee",
  neighbor: "#22c55e",
  other: "#fbbf24",
  otherStrong: "#84cc16",
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
  const rawList = Array.isArray(payload)
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

function extractNodeIds(payload: OnaRelationsApiResponse): string[] {
  const rawNodes = !Array.isArray(payload) && Array.isArray(payload.nodes)
    ? payload.nodes
    : !Array.isArray(payload) &&
        payload.data &&
        !Array.isArray(payload.data) &&
        Array.isArray(payload.data.nodes)
      ? payload.data.nodes
      : [];

  return rawNodes
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      return (
        readString(item.id) ??
        readString(item.employee_id) ??
        readString(item.node_id) ??
        readString(item.person_id)
      );
    })
    .filter((value): value is string => Boolean(value));
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) + 1;
}

function buildConnectedComponents(nodeIds: string[], edges: GraphEdge[]) {
  const adjacency = new Map<string, Set<string>>();

  for (const id of nodeIds) {
    adjacency.set(id, new Set());
  }

  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  const visited = new Set<string>();
  const components: string[][] = [];

  for (const id of adjacency.keys()) {
    if (visited.has(id)) continue;

    const queue = [id];
    const component: string[] = [];
    visited.add(id);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      component.push(current);

      for (const neighbor of adjacency.get(current) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }

    components.push(component);
  }

  return { adjacency, components };
}

function getClusterCenters(clusterCount: number, selectedClusterIndex: number) {
  if (clusterCount <= 1) {
    return [{ x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT / 2 }];
  }

  const centers = [{ x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT / 2 }];
  const others = clusterCount - 1;
  const columns = Math.max(2, Math.ceil(Math.sqrt(others)));
  const rows = Math.max(1, Math.ceil(others / columns));
  const startX = 210;
  const endX = VIEWBOX_WIDTH - 210;
  const startY = 120;
  const endY = VIEWBOX_HEIGHT - 120;
  const stepX = columns === 1 ? 0 : (endX - startX) / Math.max(columns - 1, 1);
  const stepY = rows === 1 ? 0 : (endY - startY) / Math.max(rows - 1, 1);

  let itemIndex = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (itemIndex >= others) break;
      centers.push({
        x: startX + column * stepX,
        y: startY + row * stepY,
      });
      itemIndex += 1;
    }
  }

  if (selectedClusterIndex === 0) return centers;

  const selectedCenter = centers[0];
  centers[0] = centers[selectedClusterIndex];
  centers[selectedClusterIndex] = selectedCenter;
  return centers;
}

function buildGraph(raw: OnaRelationsApiResponse, employeeId: number): GraphData {
  const selectedId = String(employeeId);
  const edges = extractEdges(raw);
  const explicitNodeIds = extractNodeIds(raw);
  const degrees = new Map<string, number>();
  const neighbors = new Set<string>();

  for (const edge of edges) {
    degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + edge.weight);
    degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + edge.weight);

    if (edge.source === selectedId) neighbors.add(edge.target);
    if (edge.target === selectedId) neighbors.add(edge.source);
  }

  if (!degrees.has(selectedId)) {
    degrees.set(selectedId, 0);
  }

  for (const nodeId of explicitNodeIds) {
    if (!degrees.has(nodeId)) {
      degrees.set(nodeId, 0);
    }
  }

  const nodeIds = [...degrees.keys()];
  const { adjacency, components } = buildConnectedComponents(nodeIds, edges);
  const orderedComponents = [...components].sort((a, b) => {
    const aHasSelected = a.includes(selectedId);
    const bHasSelected = b.includes(selectedId);
    if (aHasSelected && !bHasSelected) return -1;
    if (!aHasSelected && bHasSelected) return 1;
    return b.length - a.length;
  });
  const selectedClusterIndex = Math.max(
    0,
    orderedComponents.findIndex((component) => component.includes(selectedId)),
  );
  const clusterCenters = getClusterCenters(
    orderedComponents.length,
    selectedClusterIndex,
  );

  const maxDegree = Math.max(...degrees.values(), 1);
  const nodes: GraphNode[] = [];
  const clusters: GraphData["clusters"] = [];

  orderedComponents.forEach((component, clusterIndex) => {
    const clusterCenter = clusterCenters[clusterIndex] ?? {
      x: VIEWBOX_WIDTH / 2,
      y: VIEWBOX_HEIGHT / 2,
    };
    const clusterHasSelected = component.includes(selectedId);
    const componentDegrees = component
      .map((id) => ({ id, degree: degrees.get(id) ?? 0 }))
      .sort((a, b) => b.degree - a.degree);
    const anchorId = clusterHasSelected ? selectedId : componentDegrees[0]?.id ?? component[0];
    const shells = new Map<number, string[]>();
    const seen = new Set<string>([anchorId]);
    const queue: Array<{ id: string; depth: number }> = [{ id: anchorId, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      const bucket = shells.get(current.depth) ?? [];
      bucket.push(current.id);
      shells.set(current.depth, bucket);

      const sortedNeighbors = [...(adjacency.get(current.id) ?? [])].sort(
        (left, right) => (degrees.get(right) ?? 0) - (degrees.get(left) ?? 0),
      );

      for (const neighbor of sortedNeighbors) {
        if (seen.has(neighbor)) continue;
        seen.add(neighbor);
        queue.push({ id: neighbor, depth: current.depth + 1 });
      }
    }

    for (const id of component) {
      if (seen.has(id)) continue;
      const shellIndex = shells.size;
      const bucket = shells.get(shellIndex) ?? [];
      bucket.push(id);
      shells.set(shellIndex, bucket);
    }

    const clusterRadius = Math.max(
      84,
      Math.min(190, 72 + Math.sqrt(component.length) * 34),
    );

    clusters.push({
      id: `cluster-${clusterIndex}`,
      x: clusterCenter.x,
      y: clusterCenter.y,
      radius: clusterRadius,
      isSelectedCluster: clusterHasSelected,
    });

    for (const [shellIndex, shellNodes] of [...shells.entries()].sort(
      ([left], [right]) => left - right,
    )) {
      const ringRadius =
        shellIndex === 0 ? 0 : Math.min(clusterRadius - 18, 28 + shellIndex * 38);
      const angleStep = (Math.PI * 2) / Math.max(shellNodes.length, 1);

      shellNodes.forEach((id, itemIndex) => {
        const degree = degrees.get(id) ?? 0;
        const isSelected = id === selectedId;
        const isNeighbor = neighbors.has(id);
        const seeded = mulberry32(hashId(`${clusterIndex}-${id}`));
        const angle =
          shellIndex === 0
            ? -Math.PI / 2
            : itemIndex * angleStep + seeded() * 0.34 - 0.17;
        const offset = shellIndex === 0 ? 0 : seeded() * 10 - 5;
        const x = clusterCenter.x + Math.cos(angle) * (ringRadius + offset);
        const y = clusterCenter.y + Math.sin(angle) * (ringRadius + offset * 0.8);
        const color = isSelected
          ? NODE_COLORS.selected
          : isNeighbor
            ? NODE_COLORS.neighbor
            : degree / maxDegree > 0.55
              ? NODE_COLORS.otherStrong
              : NODE_COLORS.other;

        nodes.push({
          id,
          degree,
          isSelected,
          isNeighbor,
          clusterIndex,
          color,
          radius: isSelected
            ? 15
            : Math.max(6, Math.min(11, 6 + (degree / maxDegree) * 5)),
          x: Math.max(36, Math.min(VIEWBOX_WIDTH - 36, x)),
          y: Math.max(36, Math.min(VIEWBOX_HEIGHT - 36, y)),
        });
      });
    }
  });

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const simulationEdges = edges.filter(
    (edge) => nodeMap.has(edge.source) && nodeMap.has(edge.target),
  );

  return { nodes, edges: simulationEdges, clusters };
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

  const hasGraph = Boolean(graph && graph.nodes.length > 0);

  return (
    <Card className="overflow-hidden border-slate-700/90 bg-[var(--exec-card)] py-2">
      <CardHeader className="space-y-3 px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base leading-tight text-slate-100">
            {title}
          </CardTitle>
          <div className="inline-flex items-center gap-3 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              Empleado seleccionado
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              Red anonimizada
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Proximidad relacional
            </span>
          </div>
        </div>
        <p className="text-xs leading-5 text-slate-400">
          Vista agregada de relaciones dentro de la sociedad. Los grupos se ordenan
          por proximidad/conectividad para repartir mejor a las personas dentro del
          espacio y facilitar la lectura.
        </p>
      </CardHeader>

      <CardContent className="px-3 pb-3 pt-0">
        {!societyId ? (
          <div className="grid min-h-[260px] place-items-center rounded-xl border border-dashed border-slate-700 bg-slate-950/30 text-sm text-slate-400">
            Este empleado no tiene `society_id` disponible para construir la red.
          </div>
        ) : loading ? (
          <div className="grid min-h-[260px] place-items-center rounded-xl border border-slate-700 bg-slate-950/30 text-sm text-slate-400">
            Cargando red organizacional...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : !hasGraph ? (
          <div className="grid min-h-[260px] place-items-center rounded-xl border border-dashed border-slate-700 bg-slate-950/30 text-sm text-slate-400">
            No hay suficientes relaciones ONA para representar esta sociedad.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-700 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.55),rgba(2,6,23,0.85))]">
            <svg
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
              className="h-[420px] w-full"
              role="img"
              aria-label="Grafo organizacional anonimizado de la sociedad"
            >
              {graph.clusters.map((cluster) => (
                <circle
                  key={cluster.id}
                  cx={cluster.x}
                  cy={cluster.y}
                  r={cluster.radius}
                  fill={
                    cluster.isSelectedCluster
                      ? "rgba(34, 211, 238, 0.05)"
                      : "rgba(148, 163, 184, 0.035)"
                  }
                  stroke={
                    cluster.isSelectedCluster
                      ? "rgba(34, 211, 238, 0.18)"
                      : "rgba(148, 163, 184, 0.08)"
                  }
                  strokeDasharray={cluster.isSelectedCluster ? "0" : "5 7"}
                />
              ))}

              {graph.edges.map((edge, index) => {
                const source = graph.nodes.find((node) => node.id === edge.source);
                const target = graph.nodes.find((node) => node.id === edge.target);
                if (!source || !target) return null;

                const connectedToSelection = source.isSelected || target.isSelected;
                const midX = (source.x + target.x) / 2;
                const midY = (source.y + target.y) / 2;
                const curveY =
                  source.clusterIndex === target.clusterIndex
                    ? midY - 8
                    : midY - 22;

                return (
                  <path
                    key={`${edge.source}-${edge.target}-${index}`}
                    d={`M ${source.x} ${source.y} Q ${midX} ${curveY} ${target.x} ${target.y}`}
                    stroke={
                      connectedToSelection
                        ? "rgba(34, 211, 238, 0.42)"
                        : source.clusterIndex === target.clusterIndex
                          ? "rgba(148, 163, 184, 0.16)"
                          : "rgba(251, 191, 36, 0.12)"
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
        )}
      </CardContent>
    </Card>
  );
}
