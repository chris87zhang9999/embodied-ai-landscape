interface TimelineBarProps {
  periods: string[]
  selected: string
  onChange: (period: string) => void
}

export default function TimelineBar({ periods, selected, onChange }: TimelineBarProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-gray-500 text-xs shrink-0">时间线</span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {periods.map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={[
              'px-3 py-1 rounded-full text-xs font-mono transition-all',
              p === selected
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200',
            ].join(' ')}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
