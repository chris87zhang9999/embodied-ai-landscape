export type Layer = '上游' | '中游' | '下游' | '原材料'
export type ChangeDirection = 'up' | 'down' | 'stable'

export interface IndustryNode {
  id: string
  name: string
  layer: Layer
  tech_difficulty: number   // 1-10, X axis
  commercialization: number // 1-10, Y axis
  market_size_b: number     // bubble radius proxy
  companies: string[]
  investment_thesis: string
  children: IndustryNode[]
  change_vs_prev?: {
    tech_difficulty: number
    commercialization: number
    market_size_b: number
  }
}

export interface Highlight {
  node: string          // node id or name
  change: ChangeDirection
  reason: string
}

export interface Snapshot {
  period: string        // "YYYY-MM"
  generated_at: string  // ISO 8601
  analysis: {
    summary: string
    highlights: Highlight[]
  }
  nodes: IndustryNode[] // 13 L1 root nodes
}

// Path from root to current drill-down position
export type Breadcrumb = Array<{ id: string; name: string }>
