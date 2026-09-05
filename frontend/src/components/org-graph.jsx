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

const TIER = {
  institute: { y: 0, tone: "pink", label: "Institute" },
  department: { y: 145, tone: "blue", label: "Department" },
  faculty: { y: 290, tone: "dark", label: "Faculty" },
  course: { y: 435, tone: "green", label: "Course" },
}

const EDGE_COLOR = {
  pink: "var(--pink-strong)",
  blue: "var(--blue-strong)",
  green: "var(--green-strong)",
  dark: "var(--foreground)",
  red: "var(--red-strong)",
}

const LEAF_SPACING = 215
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

function layout(nodes, edges) {
  const childrenOf = new Map()
  const hasParent = new Set()
  for (const e of edges) {
    hasParent.add(e.target)
    if (!childrenOf.has(e.source)) childrenOf.set(e.source, [])
    childrenOf.get(e.source).push(e.target)
  }
  const roots = nodes.filter((n) => !hasParent.has(n.id))

  const xOf = new Map()
  let nextLeaf = 0
  const assignX = (id) => {
    if (xOf.has(id)) return xOf.get(id)
    const kids = childrenOf.get(id) ?? []
    let x
    if (kids.length === 0) {
      x = nextLeaf * LEAF_SPACING
      nextLeaf += 1
    } else {
      const childXs = kids.map(assignX)
      x = (Math.min(...childXs) + Math.max(...childXs)) / 2
    }
    xOf.set(id, x)
    return x
  }
  roots.forEach((r) => assignX(r.id))

  return nodes.map((node) => {
    const tier = TIER[node.kind] ?? TIER.course
    return {
      id: node.id,
      type: "erp",
      position: { x: xOf.get(node.id) ?? 0, y: tier.y },
      data: {
        kind: tier.label,
        label: node.label,
        meta: node.meta ?? node.dept,
        tone: tier.tone,
      },
    }
  })
}

export function OrgGraph({ height = 520 }) {
  const { data, error, loading, refresh } = useApi(
    () => getOrgGraph(),
    [],
    { nodes: [], edges: [] },
    { pollMs: POLL_MS },
  )

  const computedNodes = useMemo(() => layout(data.nodes, data.edges), [data.nodes, data.edges])

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
        <button
          type="button"
          onClick={reset}
          className="absolute top-3 right-3 rounded-xl bg-pink-strong px-3 py-1.5 text-xs font-semibold text-white shadow-[0_6px_16px_-6px_rgba(214,51,132,0.6)] transition-colors hover:bg-pink"
        >
          Reset layout
        </button>
      </div>
    </AsyncBoundary>
  )
}
