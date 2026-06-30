import { useState, useEffect } from 'react'
import { useSnapshots, diffNodes } from './hooks/useSnapshots'
import { useDrillDown } from './hooks/useDrillDown'
import BubbleChart from './components/BubbleChart'
import TimelineBar from './components/TimelineBar'
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">具身智能产业链投资图谱</h1>
        <p className="text-gray-500 text-sm mb-6">
          X轴：技术壁垒 · Y轴：商业化成熟度 · 气泡大小：可寻址市场规模 · 点击气泡深入供应链
        </p>

        <TimelineBar periods={periods} selected={period} onChange={handlePeriodChange} />
        <Breadcrumbs crumbs={breadcrumb} onNavigate={drillTo} />

        {!allCurrentAreLeaves ? (
          <BubbleChart
            nodes={currentNodes}
            prevNodes={prevSnap?.nodes}
            selectedId={selectedNode?.id}
            onNodeClick={node => {
              setSelectedNode(node)
              if (!isLeaf(node)) drillInto(node)
            }}
            onNodeHover={() => {}}
          />
        ) : (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="text-white font-bold mb-2">
              {parentNode?.name ?? '底层节点'} — 原材料/底层构成
            </div>
            <div className="space-y-2">
              {currentNodes.map(n => (
                <div key={n.id} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-300 w-32 shrink-0">{n.name}</span>
                  <span className="text-blue-400">${n.market_size_b}B</span>
                  <span className="text-gray-500 truncate">{n.investment_thesis}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
