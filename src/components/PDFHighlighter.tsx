import React, { useEffect, useRef, useState } from 'react'
import { Sentence } from '../utils/textItemUtils'

interface Highlight {
  id: string
  x: number
  y: number
  width: number
  height: number
  pageNumber: number
  color?: string
}

interface PDFHighlighterProps {
  sentences: Sentence[]
  currentSentenceIndex: number
  scale: number
  pageNumber: number
  pageHeight: number
}

export const PDFHighlighter: React.FC<PDFHighlighterProps> = ({
  sentences,
  currentSentenceIndex,
  scale,
  pageNumber,
  pageHeight
}) => {
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sentences.length || currentSentenceIndex < 0) {
      setHighlights([])
      return
    }

    console.log('=== SINGLE SOURCE OF TRUTH DEBUG ===')
    console.log('Current sentence index:', currentSentenceIndex)
    console.log('Total sentences:', sentences.length)
    
    const sentenceHighlights: Highlight[] = []
    
    if (currentSentenceIndex < sentences.length) {
      const currentSentence = sentences[currentSentenceIndex]
      console.log('Current sentence:', currentSentence.text)
      console.log('Sentence page:', currentSentence.pageNumber)
      console.log('Text items count:', currentSentence.textItems.length)
      
      // Only highlight if the sentence is on the current page
      if (currentSentence.pageNumber === pageNumber) {
        console.log('Highlighting sentence on current page')
        
        // Highlight all text items in this sentence
        currentSentence.textItems.forEach((item, index) => {
          console.log(`Highlighting item ${index}: "${item.text}"`)
          
          const adjustedTopPercent = item.topPercent + (item.heightPercent * 0.2)
          
          sentenceHighlights.push({
            id: `sentence-${currentSentenceIndex}-item-${index}`,
            x: item.leftPercent,
            y: adjustedTopPercent,
            width: item.widthPercent,
            height: item.heightPercent,
            pageNumber: item.pageNumber,
            color: '#ffeb3b'
          })
        })
      } else {
        console.log('Sentence is on different page, no highlighting')
      }
    }
    
    console.log('Created highlights:', sentenceHighlights.length)
    setHighlights(sentenceHighlights)
  }, [sentences, currentSentenceIndex, scale, pageNumber, pageHeight])

  return (
    <div 
      ref={containerRef}
      className="pdf-highlighter"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 10
      }}
    >
      {highlights.map((highlight) => (
        <div
          key={highlight.id}
          className="text-highlight"
          style={{
            position: 'absolute',
            left: `${highlight.x}%`,
            top: `${highlight.y}%`,
            width: `${highlight.width}%`,
            height: `${highlight.height}%`,
            backgroundColor: highlight.color || '#ffeb3b',
            opacity: 0.6,
            borderRadius: '2px',
            transition: 'all 0.3s ease'
          }}
        />
      ))}
    </div>
  )
}
