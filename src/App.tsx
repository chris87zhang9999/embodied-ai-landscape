import { useState } from 'react'
import { useSnapshots } from './hooks/useSnapshots'
import BubbleChart from './components/BubbleChart'
export default function App() {
  const { snapshots, periods, loading } = useSnapshots()
  const [selectedId, setSelectedId] = useState<string>()

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
      载入数据中…
    </div>
  )

  const latest = periods.length > 0 ? snapshots.get(periods[periods.length - 1]) : undefined
  if (!latest) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
      暂无数据
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <BubbleChart
        nodes={latest.nodes}
        selectedId={selectedId}
        onNodeClick={n => setSelectedId(n.id)}
        onNodeHover={() => {}}
      />
    </div>
  )
}
