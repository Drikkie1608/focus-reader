import React, { useEffect, useState, useRef } from 'react'
import { HoverHighlight, TextItemWithHover, findTextItemsAtPosition, createHoverHighlights } from '../utils/hoverHighlighting'

interface HoverHighlighterProps {
  textItems: TextItemWithHover[]
  pageNumber: number
  scale: number
  pageHeight: number
  onTextItemHover?: (textItem: TextItemWithHover | null) => void
  onTextItemClick?: (textItem: TextItemWithHover) => void
}

export const HoverHighlighter: React.FC<HoverHighlighterProps> = ({
  textItems,
  pageNumber,
  scale,
  pageHeight,
  onTextItemHover,
  onTextItemClick
}) => {
  const [hoverHighlights, setHoverHighlights] = useState<HoverHighlight[]>([])
  const [hoveredTextItem, setHoveredTextItem] = useState<TextItemWithHover | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    // Find text items at mouse position using container dimensions
    const itemsAtPosition = findTextItemsAtPosition(
      mouseX,
      mouseY,
      textItems,
      pageNumber,
      rect.width,
      rect.height
    )

    if (itemsAtPosition.length > 0) {
      // Use the first (topmost) text item
      const topItem = itemsAtPosition[0]
      setHoveredTextItem(topItem)
      
      // Create hover highlights
      const highlights = createHoverHighlights([topItem])
      setHoverHighlights(highlights)
      
      // Notify parent component
      onTextItemHover?.(topItem)
    } else {
      // No text item under mouse
      setHoveredTextItem(null)
      setHoverHighlights([])
      onTextItemHover?.(null)
    }
  }

  const handleMouseLeave = () => {
    setHoveredTextItem(null)
    setHoverHighlights([])
    onTextItemHover?.(null)
  }

  const handleClick = (event: React.MouseEvent) => {
    if (!containerRef.current || !hoveredTextItem) return

    // Prevent default behavior
    event.preventDefault()
    event.stopPropagation()

    // Notify parent component about the click
    onTextItemClick?.(hoveredTextItem)
  }

  return (
    <div
      ref={containerRef}
      className="hover-highlighter"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'auto',
        zIndex: 5,
        cursor: hoveredTextItem ? 'pointer' : 'default'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {hoverHighlights.map((highlight) => (
        <div
          key={highlight.id}
          className="hover-highlight"
          style={{
            position: 'absolute',
            left: `${highlight.x}%`,
            top: `${highlight.y}%`,
            width: `${highlight.width}%`,
            height: `${highlight.height}%`,
            backgroundColor: highlight.color || '#e3f2fd',
            opacity: 0.4,
            borderRadius: '2px',
            transition: 'all 0.2s ease',
            pointerEvents: 'none'
          }}
        />
      ))}
    </div>
  )
}
