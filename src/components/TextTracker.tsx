import React, { useEffect, useRef, useState } from 'react'
import { Sentence } from '../utils/textProcessor'
import { 
  getTextPosition, 
  calculateOptimalScrollPosition, 
  smoothScrollTo,
  TextPosition,
  SmoothScrollConfig 
} from '../utils/textTracking'

interface TextTrackerProps {
  sentences: Sentence[]
  currentSentenceIndex: number
  isPlaying: boolean
  enabled: boolean
  currentPageNumber: number
  onPageChange: (pageNumber: number) => void
  config?: SmoothScrollConfig
}

export const TextTracker: React.FC<TextTrackerProps> = ({
  sentences,
  currentSentenceIndex,
  isPlaying,
  enabled,
  currentPageNumber,
  onPageChange,
  config
}) => {
  const [lastTrackedPosition, setLastTrackedPosition] = useState<TextPosition | null>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSentenceIndexRef = useRef<number>(-1)

  useEffect(() => {
    if (!enabled || !isPlaying || currentSentenceIndex < 0 || currentSentenceIndex >= sentences.length) {
      return
    }

    const currentSentence = sentences[currentSentenceIndex]
    const textPosition = getTextPosition(currentSentence)

    if (!textPosition) {
      console.log('📍 No text position found for sentence:', currentSentence.text)
      return
    }

    // Only track if this is a new sentence
    if (currentSentenceIndex === lastSentenceIndexRef.current) {
      return
    }

    lastSentenceIndexRef.current = currentSentenceIndex

    console.log('🎯 TRACKING TEXT:', {
      sentence: currentSentence.text.substring(0, 50) + '...',
      page: textPosition.pageNumber,
      yPercent: textPosition.yPercent,
      heightPercent: textPosition.heightPercent
    })

    // Clear any existing scroll timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Add a small delay to allow highlighting to render
    scrollTimeoutRef.current = setTimeout(() => {
      trackTextPosition(textPosition)
    }, 100)

  }, [currentSentenceIndex, isPlaying, enabled, sentences])

  const trackTextPosition = async (textPosition: TextPosition) => {
    if (isScrolling) {
      console.log('⏳ Already scrolling, skipping')
      return
    }

    // Check if we need to switch pages first
    if (textPosition.pageNumber !== currentPageNumber) {
      console.log(`📄 SWITCHING PAGE: ${currentPageNumber} → ${textPosition.pageNumber}`)
      onPageChange(textPosition.pageNumber)
      
      // Wait for page to render, then scroll
      setTimeout(() => {
        scrollToTextPosition(textPosition)
      }, 300) // Give time for page to render
      return
    }

    // Same page, scroll directly
    scrollToTextPosition(textPosition)
  }

  const scrollToTextPosition = async (textPosition: TextPosition) => {
    // Find the PDF content container
    const pdfContainer = document.querySelector('.pdf-content') as HTMLElement
    if (!pdfContainer) {
      console.log('❌ PDF container not found')
      return
    }

    const containerRect = pdfContainer.getBoundingClientRect()
    const viewportHeight = containerRect.height
    const pageHeight = pdfContainer.scrollHeight
    const currentScrollY = pdfContainer.scrollTop

    console.log('📊 SCROLL INFO:', {
      containerHeight: viewportHeight,
      pageHeight: pageHeight,
      currentScrollY: currentScrollY,
      textYPercent: textPosition.yPercent,
      pageNumber: textPosition.pageNumber
    })

    // Check if text is already visible
    const scrollTarget = calculateOptimalScrollPosition(
      textPosition,
      currentScrollY,
      viewportHeight,
      pageHeight,
      0.2 // 20% threshold
    )

    if (!scrollTarget) {
      console.log('✅ Text already visible, no scroll needed')
      return
    }

    console.log('📜 SCROLLING TO:', {
      targetY: scrollTarget.scrollY,
      currentY: currentScrollY,
      distance: Math.abs(scrollTarget.scrollY - currentScrollY)
    })

    setIsScrolling(true)
    setLastTrackedPosition(textPosition)

    try {
      await smoothScrollTo(scrollTarget.scrollY, pdfContainer, config)
      console.log('✅ Scroll completed')
    } catch (error) {
      console.error('❌ Scroll error:', error)
    } finally {
      setIsScrolling(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  return null
}
