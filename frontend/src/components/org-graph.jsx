import { useCallback, useEffect, useMemo } from "react"
import {
  BaseEdge,
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  getBezierPath,
  useEdgesState,
  useNodesState,
} from "@xyflow/react"
import { AsyncBoundary, Skeleton } from "@/components/async-boundary"
import { useApi } from "@/lib/use-api"
import { getOrgGraph } from "@/lib/api"
import { cn } from "cn"

const TONE = {
  pink: "border-pink-strong bg-pink-strong text-white",
  blue: "border-blue-strong bg-blue-strong text-white",
  green: "border-green-strong bg-green-strong text-white",
  red: "border-red-strong bg-red-strong text-white",
  dark: "border-foreground bg-foreground text-background",
}

/** Same four hues as the wires — every pill in the tree is solid, no neutrals. */
const TIER = {
  institute: { y: 0, tone: "pink", label: "Institute" },
  department: { y: 145, tone: "blue", label: "Department" },
  faculty: { y: 290, tone: "dark", label: "Faculty" },
  course: { y: 435, tone: "green", label: "Course" },
}

/** Wire colour and its flowing-dot fill, keyed by the *source* node's tier tone. */
const EDGE_COLOR = {
  pink: "var(--pink-strong)",
  blue: "var(--blue-strong)",
  green: "var(--green-strong)",
  dark: "var(--foreground)",
  red: "var(--red-strong)",
}

const COLUMN_WIDTH = 215
const POLL_MS = 15000
const DOT_COUNT = 3
const FLOW_DURATION = 2.6

function FlowNode({ data }) {
  return (
    <div
      className={cn(
        "min-w-40 rounded-2xl border px-3 py-2 text-left shadow-[0_2px_6px_rgba(24,10,20,0.06)]",
        TONE[data.tone ?? "pink"],
      )}
    >
      <Handle type="target" position={Position.Top} />
      <div className="text-[11px] font-semibold tracking-wider uppercase opacity-70">
        {data.kind}
      </div>
      <div className="text-sm font-semibold tracking-[-0.01em]">{data.label}</div>
      {data.meta ? <div className="text-xs opacity-80">{data.meta}</div> : null}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const nodeTypes = { erp: FlowNode }

/**
 * A structured bezier wire — curved, but anchored to the same top/bottom
 * handles as every other edge, so a tree of them still reads as a tidy
 * hierarchy rather than a tangle. A handful of dots travel the exact same
 * path via the CSS motion-path API, each started mid-cycle with a negative
 * `animation-delay` so they appear evenly spaced and already in motion on
 * first paint (no flash-then-jump at edge start).
 */
function FlowEdge({ id, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, data, markerEnd }) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.42,
  })
  const color = EDGE_COLOR[data?.tone] ?? EDGE_COLOR.pink

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ stroke: color, strokeWidth: 1.75, opacity: 0.55 }} />
      {Array.from({ length: DOT_COUNT }, (_, i) => {
        const delay = (i / DOT_COUNT) * FLOW_DURATION
        return (
          <circle
            key={i}
            r="2.75"
            fill={color}
            style={{
              offsetPath: `path("${edgePath}")`,
              animation: `org-graph-flow ${FLOW_DURATION}s linear infinite`,
              animationDelay: `-${delay.toFixed(2)}s`,
            }}
          />
        )
      })}
    </>
  )
}

const edgeTypes = { flow: FlowEdge }

/**
 * Lays the API's nodes out in tiers — institute, departments, faculty, courses —
 * centring each row so the tree reads top-down.
 */
function layout(nodes) {
  const rows = {}
  for (const node of nodes) {
    ;(rows[node.kind] ??= []).push(node)
  }
  const widest = Math.max(...Object.values(rows).map((r) => r.length), 1)

  return Object.entries(rows).flatMap(([kind, group]) => {
    const tier = TIER[kind] ?? TIER.course
    const offset = ((widest - group.length) * COLUMN_WIDTH) / 2
    return group.map((node, i) => ({
      id: node.id,
      type: "erp",
      position: { x: offset + i * COLUMN_WIDTH, y: tier.y },
      data: {
        kind: tier.label,
        label: node.label,
        meta: node.meta ?? node.dept,
        tone: tier.tone,
      },
    }))
  })
}

/**
 * Flagship view: the whole institute as a live graph, read from the backend
 * and re-synced every `POLL_MS` so admissions, new hires or new courses show
 * up without a manual refresh. A poll only ever adds, drops or relabels
 * nodes — any node that's still present keeps wherever it was dragged to,
 * so the graph doesn't jump around under someone mid-explore.
 */
export function OrgGraph({ height = 520 }) {
  const { data, error, loading, refresh } = useApi(
    () => getOrgGraph(),
    [],
    { nodes: [], edges: [] },
    { pollMs: POLL_MS },
  )

  const computedNodes = useMemo(() => layout(data.nodes), [data.nodes])

  // Colour each wire by the tier it leaves from (institute -> department
  // edges are pink, department -> faculty blue, and so on).
  const nodeTone = useMemo(
    () => new Map(computedNodes.map((n) => [n.id, n.data.tone])),
    [computedNodes],
  )
  const computedEdges = useMemo(
    () =>
      data.edges.map((e) => ({
        ...e,
        type: "flow",
        data: { tone: nodeTone.get(e.source) },
      })),
    [data.edges, nodeTone],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges)

  // Merge each fresh graph into the canvas: nodes that already exist keep
  // their current (possibly dragged) position, new ones get the computed
  // layout slot, and anything gone from the response drops off the canvas.
  useEffect(() => {
    setNodes((current) => {
      const prevPosition = new Map(current.map((n) => [n.id, n.position]))
      return computedNodes.map((n) => ({
        ...n,
        position: prevPosition.get(n.id) ?? n.position,
      }))
    })
  }, [computedNodes, setNodes])

  useEffect(() => setEdges(computedEdges), [computedEdges, setEdges])

  const reset = useCallback(() => setNodes(computedNodes), [computedNodes, setNodes])

  return (
    <AsyncBoundary
      loading={loading}
      error={error}
      onRetry={refresh}
      skeleton={<Skeleton className="w-full" style={{ height }} />}
    >
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-card"
        style={{ height }}
      >
        <style>{`
          @keyframes org-graph-flow {
            from { offset-distance: 0%; }
            to { offset-distance: 100%; }
          }
        `}</style>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          proOptions={{ hideAttribution: true }}
          minZoom={0.35}
        >
          <Background gap={22} size={1.4} color="oklch(0.9 0.01 340)" />
          <Controls showInteractive={false} className="rounded-xl border border-border" />
        </ReactFlow>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-green" />
            Live
          </span>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
          >
            Reset layout
          </button>
        </div>
      </div>
    </AsyncBoundary>
  )
}
