import { useState, useEffect } from 'react'
import { useSnapshots, diffNodes } from './hooks/useSnapshots'
import { useDrillDown } from './hooks/useDrillDown'
import BubbleChart from './components/BubbleChart'
import TimelineBar from './components/TimelineBar'
import Tooltip from './components/Tooltip'
import SidePanel from './components/SidePanel'
import LeafView from './components/LeafView'
import Header from './components/Header'
import Legend from './components/Legend'
import type { IndustryNode } from './types'

function Breadcrumbs({
  crumbs,
  onNavigate,
}: {
  crumbs: Array<{ id: string; name: string }>
  onNavigate: (i: number) => void
}) {
  return (
    <div className="flex items-center gap-1 text-sm text-gray-400 mb-3 flex-wrap">
      {crumbs.map((c, i) => (
        <span key={c.id} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-600 select-none">›</span>}
          <button
            onClick={() => onNavigate(i)}
            className={
              i === crumbs.length - 1
                ? 'text-white font-semibold'
                : 'hover:text-blue-400 transition-colors'
            }
          >
            {c.name}
          </button>
        </span>
      ))}
    </div>
  )
}

export default function App() {
  const { snapshots, periods, loading } = useSnapshots()
  const [period, setPeriod] = useState<string>('')
  const [selectedNode, setSelectedNode] = useState<IndustryNode | null>(null)
  const [tooltip, setTooltip] = useState<{ node: IndustryNode; x: number; y: number } | null>(null)

  useEffect(() => {
    if (periods.length > 0 && !period) setPeriod(periods[periods.length - 1])
  }, [periods, period])

  const currentSnap = period ? snapshots.get(period) : undefined
  const prevIdx = periods.indexOf(period) - 1
  const prevSnap = prevIdx >= 0 ? snapshots.get(periods[prevIdx]) : undefined

  const rootNodes = currentSnap
    ? prevSnap
      ? diffNodes(prevSnap.nodes, currentSnap.nodes)
      : currentSnap.nodes
    : []

  const {
    currentNodes, breadcrumb, drillInto, drillTo, isLeaf, allCurrentAreLeaves, parentNode,
  } = useDrillDown(rootNodes)

  const handlePeriodChange = (p: string) => {
    setPeriod(p)
    setSelectedNode(null)
    setTooltip(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        载入数据中…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-[1200px] mx-auto">
        <Header />
        <TimelineBar periods={periods} selected={period} onChange={handlePeriodChange} />
        <Breadcrumbs crumbs={breadcrumb} onNavigate={drillTo} />
        <Legend />

        <div className="flex gap-5 items-start">
          <div className="relative shrink-0">
            {allCurrentAreLeaves && parentNode ? (
              <LeafView parentNode={parentNode} />
            ) : (
              <BubbleChart
                nodes={currentNodes}
                prevNodes={prevSnap?.nodes}
                selectedId={selectedNode?.id}
                onNodeClick={node => {
                  setSelectedNode(node)
                  if (!isLeaf(node)) drillInto(node)
                }}
                onNodeHover={(n, x, y) => setTooltip(n ? { node: n, x, y } : null)}
              />
            )}
            <Tooltip
              node={tooltip?.node ?? null}
              x={tooltip?.x ?? 0}
              y={tooltip?.y ?? 0}
            />
          </div>

          {currentSnap && (
            <SidePanel
              snapshot={currentSnap}
              selectedNode={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
