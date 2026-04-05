import { useState, ReactNode } from 'react'
import './CollapsiblePanel.css'

interface CollapsiblePanelProps {
  title: string
  children: ReactNode
  defaultExpanded?: boolean
  grow?: boolean
}

export function CollapsiblePanel({ title, children, defaultExpanded = true, grow }: CollapsiblePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className={`collapsible-panel ${expanded ? 'expanded' : 'collapsed'} ${grow ? 'grow' : ''}`}>
      <button
        className="cp-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="cp-title serif">{title}</span>
        <span className="cp-toggle mono">{expanded ? '−' : '+'}</span>
      </button>
      <div className="cp-content">
        {children}
      </div>
    </div>
  )
}
