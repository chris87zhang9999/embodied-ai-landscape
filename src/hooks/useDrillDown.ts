import { useState, useCallback } from 'react'
import type { IndustryNode, Breadcrumb } from '../types'

interface StackFrame {
  crumb: { id: string; name: string }
  nodes: IndustryNode[]
  parent: IndustryNode
}

export function useDrillDown(rootNodes: IndustryNode[]) {
  const [stack, setStack] = useState<StackFrame[]>([])

  const currentNodes = stack.length === 0 ? rootNodes : stack[stack.length - 1].nodes
  const parentNode: IndustryNode | null = stack.length > 0 ? stack[stack.length - 1].parent : null

  const breadcrumb: Breadcrumb = [
    { id: '__root__', name: '全局' },
    ...stack.map(s => s.crumb),
  ]

  const drillInto = useCallback((node: IndustryNode) => {
    if (!node.children || node.children.length === 0) return
    setStack(prev => [...prev, {
      crumb: { id: node.id, name: node.name },
      nodes: node.children,
      parent: node,
    }])
  }, [])

  const drillTo = useCallback((crumbIndex: number) => {
    if (crumbIndex === 0) {
      setStack([])
    } else {
      setStack(prev => prev.slice(0, crumbIndex))
    }
  }, [])

  const isLeaf = useCallback(
    (node: IndustryNode) => !node.children || node.children.length === 0,
    []
  )

  const allCurrentAreLeaves = currentNodes.length > 0 && currentNodes.every(n => isLeaf(n))

  return { currentNodes, breadcrumb, drillInto, drillTo, isLeaf, depth: stack.length, parentNode, allCurrentAreLeaves }
}
