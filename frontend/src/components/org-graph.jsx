import { useCallback, useMemo } from "react"
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react"
import { cn } from "cn"

const TONE = {
  pink: "border-pink bg-pink-soft text-pink-strong",
  blue: "border-blue bg-blue-soft text-blue-strong",
  green: "border-green bg-green-soft text-green-strong",
  red: "border-red bg-red-soft text-red-strong",
  white: "border-border bg-card text-foreground",
}

function FlowNode({ data }) {
  return (
    <div
      className={cn(
        "min-w-40 rounded-2xl border px-3 py-2 text-left shadow-[0_2px_6px_rgba(24,10,20,0.06)]",
        TONE[data.tone ?? "white"],
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

const INITIAL_NODES = [
  { id: "campus", position: { x: 420, y: 0 }, data: { kind: "Institute", label: "Origin University", meta: "4 departments · 1,412 students", tone: "pink" } },
  { id: "cs", position: { x: 60, y: 130 }, data: { kind: "Department", label: "Computer Science", meta: "2 faculty · 120 students", tone: "blue" } },
  { id: "ec", position: { x: 300, y: 130 }, data: { kind: "Department", label: "Electronics", meta: "2 faculty · 96 students", tone: "blue" } },
  { id: "me", position: { x: 545, y: 130 }, data: { kind: "Department", label: "Mechanical", meta: "1 faculty · 39 students", tone: "blue" } },
  { id: "cm", position: { x: 785, y: 130 }, data: { kind: "Department", label: "Commerce", meta: "1 faculty · 74 students", tone: "blue" } },

  { id: "f118", position: { x: 0, y: 275 }, data: { kind: "Faculty", label: "Dr. Aparna Joshi", meta: "Load 18 h · 96% present", tone: "white" } },
  { id: "f124", position: { x: 190, y: 275 }, data: { kind: "Faculty", label: "Prof. Rajat Sinha", meta: "Load 16 h · 91% present", tone: "white" } },
  { id: "f131", position: { x: 380, y: 275 }, data: { kind: "Faculty", label: "Dr. Leela Menon", meta: "Load 14 h · 88% present", tone: "white" } },
  { id: "f140", position: { x: 570, y: 275 }, data: { kind: "Faculty", label: "Prof. Imran Sheikh", meta: "Load 20 h · 79% present", tone: "red" } },
  { id: "f146", position: { x: 785, y: 275 }, data: { kind: "Faculty", label: "Dr. Sneha Kulkarni", meta: "On medical leave", tone: "red" } },

  { id: "cs501", position: { x: 0, y: 420 }, data: { kind: "Course", label: "CS-501 Distributed Systems", meta: "62 enrolled · Exam 14 Sep", tone: "green" } },
  { id: "cs503", position: { x: 215, y: 420 }, data: { kind: "Course", label: "CS-503 Compiler Design", meta: "58 enrolled · Exam 14 Sep", tone: "green" } },
  { id: "ec301", position: { x: 425, y: 420 }, data: { kind: "Course", label: "EC-301 VLSI Design", meta: "45 enrolled · Exam 15 Sep", tone: "green" } },
  { id: "me701", position: { x: 620, y: 420 }, data: { kind: "Course", label: "ME-701 Thermodynamics II", meta: "39 enrolled · Completed", tone: "green" } },
  { id: "cm101", position: { x: 840, y: 420 }, data: { kind: "Course", label: "CM-101 Corporate Finance", meta: "74 enrolled · Exam 2 Nov", tone: "green" } },
]

const INITIAL_EDGES = [
  ["campus", "cs"], ["campus", "ec"], ["campus", "me"], ["campus", "cm"],
  ["cs", "f118"], ["cs", "f124"], ["ec", "f131"], ["ec", "f124"],
  ["me", "f140"], ["cm", "f146"],
  ["f118", "cs501"], ["f124", "cs503"], ["f131", "ec301"],
  ["f140", "me701"], ["f146", "cm101"],
].map(([source, target]) => ({
  id: `${source}-${target}`,
  source,
  target,
  type: "smoothstep",
}))

/**
 * Flagship view: the whole institute as a live graph. Drag nodes to explore
 * how departments, teachers and courses hang together.
 */
export function OrgGraph({ height = 520 }) {
  const nodes0 = useMemo(
    () => INITIAL_NODES.map((n) => ({ ...n, type: "erp" })),
    [],
  )
  const [nodes, setNodes, onNodesChange] = useNodesState(nodes0)
  const [edges, , onEdgesChange] = useEdgesState(INITIAL_EDGES)

  const reset = useCallback(() => setNodes(nodes0), [nodes0, setNodes])

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-border bg-card"
      style={{ height }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
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
        className="absolute top-3 right-3 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
      >
        Reset layout
      </button>
    </div>
  )
}
