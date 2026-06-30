const LAYER_ITEMS = [
  { label: '上游', color: '#3b82f6' },
  { label: '中游', color: '#a855f7' },
  { label: '下游', color: '#22c55e' },
  { label: '原材料', color: '#f59e0b' },
]

export default function Legend() {
  return (
    <div className="flex items-center gap-5 mb-4 flex-wrap">
      {LAYER_ITEMS.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-gray-400 text-xs">{label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 ml-2">
        <svg width="20" height="10">
          <line x1="0" y1="5" x2="20" y2="5" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4 3" />
        </svg>
        <span className="text-gray-500 text-xs">上月位置</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#fbbf24', backgroundColor: 'transparent' }} />
        <span className="text-gray-500 text-xs">本月显著变化</span>
      </div>
    </div>
  )
}
