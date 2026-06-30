import type { IndustryNode } from '../types'

interface TooltipProps {
  node: IndustryNode | null
  x: number
  y: number
}

export default function Tooltip({ node, x, y }: TooltipProps) {
  if (!node) return null

  const deltaLabel = (v: number) =>
    v === 0 ? null : (
      <span className={v > 0 ? 'text-green-400' : 'text-red-400'}>
        {v > 0 ? '+' : ''}{v.toFixed(1)}
      </span>
    )

  return (
    <div
      className="absolute z-50 pointer-events-none bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl w-64 text-left"
      style={{ left: x + 14, top: Math.max(0, y - 10) }}
    >
      <div className="font-bold text-white text-sm mb-0.5">{node.name}</div>
      <div className="text-gray-500 text-xs mb-2">{node.layer} · ${node.market_size_b}B TAM</div>

      <div className="flex gap-4 text-xs mb-2">
        <span>
          <span className="text-gray-500">技术壁垒 </span>
          <span className="text-blue-400 font-semibold">{node.tech_difficulty}/10</span>
        </span>
        <span>
          <span className="text-gray-500">商业化 </span>
          <span className="text-green-400 font-semibold">{node.commercialization}/10</span>
        </span>
      </div>

      {node.companies.length > 0 && (
        <div className="text-xs mb-2">
          <span className="text-gray-500">代表企业：</span>
          <span className="text-gray-300">{node.companies.slice(0, 4).join(' · ')}</span>
        </div>
      )}

      <div className="text-yellow-300 text-xs italic leading-snug mb-1">
        {node.investment_thesis}
      </div>

      {node.change_vs_prev && (
        <div className="mt-2 pt-2 border-t border-gray-700 text-xs flex gap-3 text-gray-500">
          <span>vs上月: </span>
          <span>商业化 {deltaLabel(node.change_vs_prev.commercialization) ?? '—'}</span>
          <span>壁垒 {deltaLabel(node.change_vs_prev.tech_difficulty) ?? '—'}</span>
        </div>
      )}

      {node.children.length > 0 && (
        <div className="mt-1 text-blue-400 text-xs">
          ↓ 点击展开 {node.children.length} 个子节点
        </div>
      )}
    </div>
  )
}
