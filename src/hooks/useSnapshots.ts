import { useState, useEffect } from 'react'
import type { Snapshot, IndustryNode } from '../types'

// Exported for testing: returns curr nodes with change_vs_prev populated by diffing against prev
export function diffNodes(prev: IndustryNode[], curr: IndustryNode[]): IndustryNode[] {
  const prevMap = new Map(prev.map(n => [n.id, n]))
  return curr.map(node => {
    const p = prevMap.get(node.id)
    if (!p) return node
    return {
      ...node,
      change_vs_prev: {
        tech_difficulty: node.tech_difficulty - p.tech_difficulty,
        commercialization: node.commercialization - p.commercialization,
        market_size_b: node.market_size_b - p.market_size_b,
      },
    }
  })
}

export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<Map<string, Snapshot>>(new Map())
  const [periods, setPeriods] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    fetch(`${base}snapshots-manifest.json`)
      .then(r => r.json())
      .then((manifest: { periods: string[] }) => {
        setPeriods(manifest.periods)
        return Promise.all(
          manifest.periods.map(p =>
            fetch(`${base}data/snapshots/${p}.json`).then(r => r.json() as Promise<Snapshot>)
          )
        )
      })
      .then(snaps => {
        setSnapshots(new Map(snaps.map(s => [s.period, s])))
        setLoading(false)
      })
      .catch(() => {
        // Dev fallback: try loading 2026-06.json directly
        fetch(`${import.meta.env.BASE_URL}data/snapshots/2026-06.json`)
          .then(r => r.json() as Promise<Snapshot>)
          .then(s => {
            setSnapshots(new Map([[s.period, s]]))
            setPeriods([s.period])
            setLoading(false)
          })
          .catch(() => setLoading(false))
      })
  }, [])

  return { snapshots, periods, loading }
}
