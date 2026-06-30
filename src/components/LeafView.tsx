import type { IndustryNode } from '../types'

const LAYER_COLOR: Record<string, string> = {
  '上游': '#3b82f6',
  '中游': '#a855f7',
  '下游': '#22c55e',
  '原材料': '#f59e0b',
}

interface LeafViewProps {
  parentNode: IndustryNode
}

export default function LeafView({ parentNode }: LeafViewProps) {
  const nodes = parentNode.children
  const maxMarket = Math.max(...nodes.map(n => n.market_size_b), 1)

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 w-[700px]">
      <div className="text-white font-bold text-base mb-0.5">
        {parentNode.name} — 底层构成
      </div>
      <div className="text-gray-500 text-sm mb-5">
        原材料/叶子节点视图（已切换为列表模式）
      </div>
      <div className="space-y-3">
        {nodes.map(node => {
          const barWidth = Math.max(4, (node.market_size_b / maxMarket) * 100)
          const color = LAYER_COLOR[node.layer] ?? '#6b7280'
          return (
            <div key={node.id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-200 font-medium">{node.name}</span>
                <span className="text-gray-500">
                  ${node.market_size_b}B · 壁垒 {node.tech_difficulty}/10 · 商业化 {node.commercialization}/10
                </span>
              </div>
              <div className="relative h-7 bg-gray-800 rounded-md overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-md transition-all duration-700"
                  style={{ width: `${barWidth}%`, backgroundColor: color, opacity: 0.65 }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-white text-xs truncate">{node.investment_thesis}</span>
                </div>
              </div>
              {node.companies.length > 0 && (
                <div className="text-gray-600 text-xs mt-0.5">
                  {node.companies.slice(0, 3).join(' · ')}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
