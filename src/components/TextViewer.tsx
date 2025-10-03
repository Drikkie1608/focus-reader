import React, { useEffect, useRef } from 'react'

interface TextViewerProps {
  text: string
  currentSentenceIndex: number
  onSentenceClick: (sentenceIndex: number) => void
}

export const TextViewer: React.FC<TextViewerProps> = ({
  text,
  currentSentenceIndex,
  onSentenceClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Split text into sentences properly
  const sentences = text.split(/([.!?]+)/).reduce((acc: string[], part, index) => {
    if (part.trim()) {
      if (index % 2 === 0) {
        // This is text content
        acc.push(part.trim())
      } else {
        // This is punctuation, append it to the last sentence
        if (acc.length > 0) {
          acc[acc.length - 1] += part
        }
      }
    }
    return acc
  }, []).filter(s => s.trim().length > 0)

  useEffect(() => {
    // Scroll to current sentence when it changes
    if (currentSentenceIndex >= 0 && containerRef.current) {
      const sentenceElement = containerRef.current.querySelector(`[data-sentence-index="${currentSentenceIndex}"]`)
      if (sentenceElement) {
        sentenceElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
      }
    }
  }, [currentSentenceIndex])

  return (
    <div className="text-content" ref={containerRef}>
      {sentences.map((sentence, index) => (
        <span
          key={index}
          data-sentence-index={index}
          className={`sentence ${
            index === currentSentenceIndex 
              ? 'current' 
              : ''
          }`}
          onClick={() => onSentenceClick(index)}
        >
          {sentence}
        </span>
      ))}
    </div>
  )
}
