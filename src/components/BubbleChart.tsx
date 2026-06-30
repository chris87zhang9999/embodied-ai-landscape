import { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'
import type { IndustryNode } from '../types'

const LAYER_COLOR: Record<string, string> = {
  '上游': '#3b82f6',    // blue
  '中游': '#a855f7',    // purple
  '下游': '#22c55e',    // green
  '原材料': '#f59e0b',  // amber
}

const QUADRANT_LABELS = [
  { x: 2.5, y: 7.5, label: '现金牛', sub: '低壁垒·高商业化', color: '#22c55e22', textColor: '#4ade80' },
  { x: 7.5, y: 7.5, label: '黄金赛道', sub: '高壁垒·高商业化', color: '#f59e0b22', textColor: '#fbbf24' },
  { x: 2.5, y: 2.5, label: '红海竞争', sub: '低壁垒·低商业化', color: '#ef444422', textColor: '#f87171' },
  { x: 7.5, y: 2.5, label: '深水炸弹', sub: '高壁垒·早期布局', color: '#6366f122', textColor: '#818cf8' },
]

export interface BubbleChartProps {
  nodes: IndustryNode[]
  prevNodes?: IndustryNode[]
  selectedId?: string
  onNodeClick: (node: IndustryNode) => void
  onNodeHover: (node: IndustryNode | null, x: number, y: number) => void
}

export default function BubbleChart({
  nodes, prevNodes, selectedId, onNodeClick, onNodeHover,
}: BubbleChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const WIDTH = 700
  const HEIGHT = 540
  const M = { top: 30, right: 30, bottom: 52, left: 52 }
  const IW = WIDTH - M.left - M.right
  const IH = HEIGHT - M.top - M.bottom

  const xScale = useMemo(
    () => d3.scaleLinear().domain([0, 10]).range([0, IW]),
    [IW]
  )
  const yScale = useMemo(
    () => d3.scaleLinear().domain([0, 10]).range([IH, 0]),
    [IH]
  )
  const rScale = useMemo(
    () => d3.scaleSqrt()
      .domain([0, d3.max(nodes, n => n.market_size_b) ?? 100])
      .range([10, 52]),
    [nodes]
  )

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`)

    // Quadrant background rects
    const midX = xScale(5)
    const midY = yScale(5)
    const quadRects = [
      { x: 0,    y: 0,    w: midX,      h: midY,       fill: QUADRANT_LABELS[0].color },
      { x: midX, y: 0,    w: IW - midX, h: midY,       fill: QUADRANT_LABELS[1].color },
      { x: 0,    y: midY, w: midX,      h: IH - midY,  fill: QUADRANT_LABELS[2].color },
      { x: midX, y: midY, w: IW - midX, h: IH - midY,  fill: QUADRANT_LABELS[3].color },
    ]
    quadRects.forEach(r =>
      g.append('rect').attr('x', r.x).attr('y', r.y).attr('width', r.w).attr('height', r.h)
        .attr('fill', r.fill)
    )

    // Divider lines
    g.append('line').attr('x1', midX).attr('y1', 0).attr('x2', midX).attr('y2', IH)
      .attr('stroke', '#374151').attr('stroke-width', 1).attr('stroke-dasharray', '5 4')
    g.append('line').attr('x1', 0).attr('y1', midY).attr('x2', IW).attr('y2', midY)
      .attr('stroke', '#374151').attr('stroke-width', 1).attr('stroke-dasharray', '5 4')

    // Quadrant labels
    QUADRANT_LABELS.forEach(q => {
      g.append('text').attr('x', xScale(q.x)).attr('y', yScale(q.y) - 8)
        .attr('text-anchor', 'middle').attr('fill', q.textColor)
        .attr('font-size', 13).attr('font-weight', 'bold').text(q.label)
      g.append('text').attr('x', xScale(q.x)).attr('y', yScale(q.y) + 10)
        .attr('text-anchor', 'middle').attr('fill', '#6b7280').attr('font-size', 10)
        .text(q.sub)
    })

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${IH})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .call(ag => ag.selectAll('text').attr('fill', '#9ca3af').attr('font-size', 11))
      .call(ag => ag.select('.domain').attr('stroke', '#374151'))
      .call(ag => ag.selectAll('.tick line').attr('stroke', '#374151'))
    g.append('text').attr('x', IW / 2).attr('y', IH + 44)
      .attr('text-anchor', 'middle').attr('fill', '#9ca3af').attr('font-size', 12)
      .text('技术壁垒 →')

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .call(ag => ag.selectAll('text').attr('fill', '#9ca3af').attr('font-size', 11))
      .call(ag => ag.select('.domain').attr('stroke', '#374151'))
      .call(ag => ag.selectAll('.tick line').attr('stroke', '#374151'))
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -IH / 2).attr('y', -40)
      .attr('text-anchor', 'middle').attr('fill', '#9ca3af').attr('font-size', 12)
      .text('商业化成熟度 →')

    // Ghost bubbles (previous month positions)
    if (prevNodes) {
      const prevMap = new Map(prevNodes.map(n => [n.id, n]))
      nodes.forEach(node => {
        const prev = prevMap.get(node.id)
        if (!prev) return
        const dx = Math.abs(node.tech_difficulty - prev.tech_difficulty)
        const dy = Math.abs(node.commercialization - prev.commercialization)
        if (dx < 0.05 && dy < 0.05) return  // no meaningful movement
        g.append('circle')
          .attr('cx', xScale(prev.tech_difficulty))
          .attr('cy', yScale(prev.commercialization))
          .attr('r', rScale(prev.market_size_b))
          .attr('fill', 'none')
          .attr('stroke', LAYER_COLOR[node.layer] ?? '#888')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4 3')
          .attr('opacity', 0.3)
      })
    }

    // Main bubbles
    nodes.forEach(node => {
      const cx = xScale(node.tech_difficulty)
      const cy = yScale(node.commercialization)
      const r = rScale(node.market_size_b)
      const color = LAYER_COLOR[node.layer] ?? '#6b7280'
      const isSelected = node.id === selectedId
      const hasChanged = node.change_vs_prev != null && (
        Math.abs(node.change_vs_prev.tech_difficulty) > 0.4 ||
        Math.abs(node.change_vs_prev.commercialization) > 0.4
      )

      const group = g.append('g').attr('cursor', 'pointer')
        .on('click', () => onNodeClick(node))
        .on('mousemove', (event: MouseEvent) => {
          const rect = svgRef.current!.getBoundingClientRect()
          onNodeHover(node, event.clientX - rect.left, event.clientY - rect.top)
        })
        .on('mouseleave', () => onNodeHover(null, 0, 0))

      group.append('circle')
        .attr('cx', cx).attr('cy', cy).attr('r', r)
        .attr('fill', color).attr('opacity', isSelected ? 0.9 : 0.65)
        .attr('stroke', isSelected ? '#fff' : hasChanged ? '#fbbf24' : color)
        .attr('stroke-width', isSelected ? 2.5 : hasChanged ? 2 : 1)

      // Label: truncate to fit
      const labelText = node.name.length > 6 ? node.name.slice(0, 5) + '…' : node.name
      group.append('text')
        .attr('x', cx).attr('y', r > 28 ? cy - 4 : cy)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('fill', '#fff').attr('font-size', r > 28 ? 11 : 9)
        .attr('font-weight', '600').attr('pointer-events', 'none')
        .text(labelText)

      // Market size sub-label (only for larger bubbles)
      if (r > 22) {
        group.append('text')
          .attr('x', cx).attr('y', cy + 14)
          .attr('text-anchor', 'middle').attr('fill', '#e5e7eb')
          .attr('font-size', 9).attr('pointer-events', 'none')
          .text(`$${node.market_size_b}B`)
      }

      // Change indicator dot
      if (hasChanged && node.change_vs_prev) {
        const cmDelta = node.change_vs_prev.commercialization
        group.append('circle')
          .attr('cx', cx + r - 4).attr('cy', cy - r + 4).attr('r', 5)
          .attr('fill', cmDelta > 0 ? '#4ade80' : '#f87171')
          .attr('stroke', '#111827').attr('stroke-width', 1.5)
      }
    })
  }, [nodes, prevNodes, selectedId, xScale, yScale, rScale, onNodeClick, onNodeHover])

  return (
    <svg
      ref={svgRef}
      width={WIDTH}
      height={HEIGHT}
      className="bg-gray-900 rounded-xl border border-gray-800"
    />
  )
}
