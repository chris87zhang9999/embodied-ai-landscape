import { describe, it, expect } from 'vitest'
import { diffNodes } from './useSnapshots'
import type { IndustryNode } from '../types'

function makeNode(id: string, td: number, cm: number, ms: number): IndustryNode {
  return {
    id, name: id, layer: '上游',
    tech_difficulty: td, commercialization: cm, market_size_b: ms,
    companies: [], investment_thesis: '', children: [],
  }
}

describe('diffNodes', () => {
  it('attaches change_vs_prev when prev node exists', () => {
    const prev = [makeNode('chips', 8, 6, 40)]
    const curr = [makeNode('chips', 8, 7, 45)]
    const result = diffNodes(prev, curr)
    expect(result[0].change_vs_prev).toEqual({
      tech_difficulty: 0, commercialization: 1, market_size_b: 5,
    })
  })

  it('leaves change_vs_prev undefined for new nodes with no prior', () => {
    const result = diffNodes([], [makeNode('chips', 8, 6, 40)])
    expect(result[0].change_vs_prev).toBeUndefined()
  })

  it('preserves children array from curr node', () => {
    const child = makeNode('child1', 5, 5, 10)
    const prev = [makeNode('chips', 8, 6, 40)]
    const curr = [{ ...makeNode('chips', 8, 7, 45), children: [child] }]
    const result = diffNodes(prev, curr)
    expect(result[0].children).toHaveLength(1)
    expect(result[0].children[0].id).toBe('child1')
  })

  it('handles empty arrays gracefully', () => {
    expect(diffNodes([], [])).toEqual([])
  })
})
