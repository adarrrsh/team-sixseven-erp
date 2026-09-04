import { useEffect, useMemo, useRef, useState } from "react"
import ForceGraph2D from "react-force-graph-2d"
import { forceCollide } from "d3-force-3d"
import { cn } from "cn"

/**
 * Bright, glow-friendly hues for a near-black canvas — deliberately more
 * saturated than the site's normal palette, which is tuned for white
 * surfaces. `me` gets its own warm accent so the centre of the graph always
 * reads clearly.
 */
const GLOW = {
  me: "#f6c343",
  course: "#5b9dff",
  faculty: "#ff6fae",
  student: "#4ade80",
  colleague: "#ff8a65",
}

const BG = "#0b0b10"
const LINK_COLOR = "rgba(255,255,255,0.16)"
const PARTICLE_COLOR = "rgba(255,255,255,0.85)"

/** Tracks an element's rendered box — the canvas needs real pixel dimensions, not just a CSS width. */
function useContainerSize() {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, size]
}

/**
 * An Obsidian-style "graph view": nodes held apart by charge and pulled
 * together by their links, glowing on a dark canvas, with particles
 * animating along every edge. The physics, drag, zoom and pan all come from
 * `react-force-graph-2d` (force-graph + d3-force under the hood) — only the
 * colours, glow and the recentre control are custom.
 *
 * nodes: [{ id, label, group, val? }]  — group keys into `GLOW`
 * links: [{ source, target }]          — ids matching a node's `id`
 */
export function KnowledgeGraph({ nodes, links, height = 420, className }) {
  const [containerRef, size] = useContainerSize()
  const fgRef = useRef(null)
  const data = useMemo(() => ({ nodes, links }), [nodes, links])

  // Small graphs (a handful of nodes) settle into a cramped clump under
  // force-graph's defaults, which were tuned for much bigger ones — push
  // the charge and link-distance forces out so labels stay legible, then
  // let the simulation settle and frame the whole graph. Re-runs whenever
  // the underlying data changes (a fresh poll, a tab switch).
  useEffect(() => {
    fgRef.current?.d3Force("charge")?.strength(-220)
    fgRef.current?.d3Force("link")?.distance(110)
    // Without this, small graphs can settle with one node's centre sitting
    // exactly on another's — a plain repulsion force pushes nodes apart but
    // never guarantees their glow circles stop overlapping outright.
    fgRef.current?.d3Force("collide", forceCollide((n) => (n.val ?? 3) * 5))
    const timer = setTimeout(() => fgRef.current?.zoomToFit(600, 64), 450)
    return () => clearTimeout(timer)
  }, [data])

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden rounded-2xl border border-border", className)}
      style={{ height, background: BG }}
    >
      {size.width > 0 && size.height > 0 ? (
        <ForceGraph2D
          ref={fgRef}
          width={size.width}
          height={size.height}
          graphData={data}
          backgroundColor={BG}
          nodeRelSize={4}
          nodeVal={(n) => n.val ?? 3}
          nodeLabel={(n) => n.label}
          nodeColor={(n) => GLOW[n.group] ?? "#9ca3af"}
          linkColor={() => LINK_COLOR}
          linkWidth={1}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={1.6}
          linkDirectionalParticleSpeed={0.006}
          linkDirectionalParticleColor={() => PARTICLE_COLOR}
          cooldownTicks={80}
          onNodeClick={(n) => {
            fgRef.current?.centerAt(n.x, n.y, 500)
            fgRef.current?.zoom(3, 500)
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            // Before the simulation's first tick, a node's x/y are still
            // unset — skip that frame rather than hand the canvas API a
            // non-finite coordinate (it throws, which stops the whole
            // animation loop dead).
            if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return

            const color = GLOW[node.group] ?? "#9ca3af"
            const r = (node.val ?? 3) * (node.group === "me" ? 1.7 : 1)

            const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 3.2)
            glow.addColorStop(0, `${color}66`)
            glow.addColorStop(1, `${color}00`)
            ctx.fillStyle = glow
            ctx.beginPath()
            ctx.arc(node.x, node.y, r * 3.2, 0, 2 * Math.PI)
            ctx.fill()

            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
            ctx.fill()

            const fontSize = Math.max(11 / globalScale, 3.6)
            ctx.font = `${node.group === "me" ? 600 : 500} ${fontSize}px "Geist Variable", sans-serif`
            ctx.fillStyle = "rgba(255,255,255,0.88)"
            ctx.textAlign = "center"
            ctx.textBaseline = "top"
            ctx.fillText(node.label, node.x, node.y + r + 2)
          }}
        />
      ) : null}

      <button
        type="button"
        onClick={() => fgRef.current?.zoomToFit(500, 64)}
        className="absolute top-3 right-3 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
      >
        Recentre
      </button>
    </div>
  )
}
