import type { IndustryNode, Snapshot } from '../types'

const CHANGE_ICON: Record<string, string> = { up: '↑', down: '↓', stable: '—' }
const CHANGE_COLOR: Record<string, string> = {
  up: 'text-green-400', down: 'text-red-400', stable: 'text-gray-500',
}

interface SidePanelProps {
  snapshot: Snapshot
  selectedNode: IndustryNode | null
  onClose: () => void
}

export default function SidePanel({ snapshot, selectedNode, onClose }: SidePanelProps) {
  return (
    <div className="w-72 shrink-0 bg-gray-900 border border-gray-800 rounded-xl p-5 overflow-y-auto max-h-[540px]">
      {selectedNode ? (
        <>
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">{selectedNode.name}</h2>
              <div className="text-gray-500 text-xs mt-0.5">
                {selectedNode.layer} · ${selectedNode.market_size_b}B
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors text-xl leading-none mt-0.5 ml-2 shrink-0"
            >
              ×
            </button>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-800 rounded-lg p-2">
              <div className="text-gray-500 text-xs mb-1">技术壁垒</div>
              <div className="text-blue-400 text-xl font-bold">{selectedNode.tech_difficulty}
                <span className="text-gray-500 text-xs font-normal">/10</span>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-2">
              <div className="text-gray-500 text-xs mb-1">商业化成熟</div>
              <div className="text-green-400 text-xl font-bold">{selectedNode.commercialization}
                <span className="text-gray-500 text-xs font-normal">/10</span>
              </div>
            </div>
          </div>

          {/* Investment thesis */}
          <div className="bg-yellow-950/40 border border-yellow-900/50 rounded-lg p-3 mb-4">
            <div className="text-yellow-300 text-xs leading-relaxed italic">
              {selectedNode.investment_thesis}
            </div>
          </div>

          {/* Companies */}
          {selectedNode.companies.length > 0 && (
            <div className="mb-4">
              <div className="text-gray-500 text-xs mb-2">代表企业</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.companies.map(c => (
                  <span key={c}
                    className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full border border-gray-700">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Change vs prev */}
          {selectedNode.change_vs_prev && (
            <div className="border-t border-gray-800 pt-3">
              <div className="text-gray-500 text-xs mb-2">vs 上月变化</div>
              {[
                { label: '商业化成熟', v: selectedNode.change_vs_prev.commercialization },
                { label: '技术壁垒', v: selectedNode.change_vs_prev.tech_difficulty },
                { label: '市场规模', v: selectedNode.change_vs_prev.market_size_b },
              ].map(({ label, v }) => (
                <div key={label} className="flex justify-between text-xs py-1 border-b border-gray-800/50">
                  <span className="text-gray-400">{label}</span>
                  <span className={v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-gray-600'}>
                    {v > 0 ? '+' : ''}{v.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Children hint */}
          {selectedNode.children.length > 0 && (
            <div className="mt-3 text-blue-400 text-xs">
              ↓ 点击图中气泡可展开 {selectedNode.children.length} 个子节点
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="text-white font-bold mb-0.5">{snapshot.period} 月度洞察</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">{snapshot.analysis.summary}</p>

          {snapshot.analysis.highlights.length > 0 ? (
            <>
              <div className="text-gray-500 text-xs mb-2">变化亮点</div>
              {snapshot.analysis.highlights.map((h, i) => (
                <div key={i} className="mb-3 bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-sm ${CHANGE_COLOR[h.change]}`}>
                      {CHANGE_ICON[h.change]}
                    </span>
                    <span className="text-white text-xs font-semibold">{h.node}</span>
                    <span className={`text-xs ${CHANGE_COLOR[h.change]}`}>{h.change}</span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">{h.reason}</p>
                </div>
              ))}
            </>
          ) : (
            <div className="text-gray-600 text-xs">本月暂无重要变化亮点</div>
          )}
        </>
      )}
    </div>
  )
}
